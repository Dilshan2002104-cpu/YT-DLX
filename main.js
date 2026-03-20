const { app, BrowserWindow, ipcMain, shell } = require('electron');
const path = require('path');
const { spawn } = require('child_process');
const os = require('os');

let currentDownloadProcess = null;
let lastDownloadedFilePath = null;

function createWindow() {
    const mainWindow = new BrowserWindow({
        width: 1000,
        height: 850,
        minWidth: 550,
        minHeight: 800,
        autoHideMenuBar: true,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            contextIsolation: true,
            nodeIntegration: false
        }
    });

    // Native Right-Click Context Menu Support
    mainWindow.webContents.on('context-menu', (event, params) => {
        const { Menu } = require('electron');
        const template = [];

        if (params.isEditable) {
            template.push(
                { role: 'undo' },
                { role: 'redo' },
                { type: 'separator' },
                { role: 'cut' },
                { role: 'copy' },
                { role: 'paste' },
                { type: 'separator' },
                { role: 'selectAll' }
            );
        } else if (params.selectionText && params.selectionText.trim() !== '') {
            template.push({ role: 'copy' });
        }

        if (template.length > 0) {
            const menu = Menu.buildFromTemplate(template);
            menu.popup({ window: mainWindow });
        }
    });

    mainWindow.loadFile('index.html');
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

// Helper to get Download directory
function getDownloadsDirectory() {
    // Use os.homedir and Downloads folder, format with yt-dlp string templating
    return path.join(os.homedir(), 'Downloads', '%(title)s.%(ext)s');
}

// Check if yt-dlp is installed
function checkYtDlpInstalled(callback) {
    const ytDlp = spawn('yt-dlp', ['--version']);

    ytDlp.on('error', () => {
        callback(false);
    });

    ytDlp.on('close', (code) => {
        callback(code === 0);
    });
}

// IPC Listener for downloading videos
ipcMain.on('download-video', (event, url, quality = 'best') => {
    lastDownloadedFilePath = null; // Clear previous path on new request
    if (!url) {
        event.reply('download-status', { status: 'error', message: 'Please enter a valid URL.' });
        return;
    }

    // Pre-check for yt-dlp 
    checkYtDlpInstalled((isInstalled) => {
        if (!isInstalled) {
            event.reply('download-status', { status: 'error', message: 'Error: yt-dlp is not installed or not available in your PATH.' });
            return;
        }

        event.reply('download-status', { status: 'downloading', message: 'Downloading...' });

        const outputPath = getDownloadsDirectory();

        let formatArgs = ['-f', 'best'];
        if (quality === '1080') {
            formatArgs = ['-f', 'bestvideo[height<=1080]+bestaudio/best[height<=1080]/best'];
        } else if (quality === '720') {
            formatArgs = ['-f', 'bestvideo[height<=720]+bestaudio/best[height<=720]/best'];
        } else if (quality === '480') {
            formatArgs = ['-f', 'bestvideo[height<=480]+bestaudio/best[height<=480]/best'];
        } else if (quality === 'audio') {
            // Need ffmpeg installed for -x to extract cleanly, gracefully fallback to bestaudio
            formatArgs = ['-x', '--audio-format', 'mp3', '-f', 'bestaudio/best'];
        }

        currentDownloadProcess = spawn('yt-dlp', [
            ...formatArgs,
            '-o', outputPath,
            url
        ]);

        const ytDlpProcess = currentDownloadProcess;

        let errorMessage = '';

        ytDlpProcess.stdout.on('data', (data) => {
            const output = data.toString();
            const percentMatch = output.match(/([\d.]+)%\s+of/);
            const speedMatch = output.match(/at\s+([~]?[\d.\w\/]+)/);
            if (percentMatch) {
                const percentage = percentMatch[1] + '%';
                const speed = speedMatch ? speedMatch[1] : '';
                event.reply('download-progress', { percentage, speed });
            }

            // Capture filename from standard yt-dlp outputs
            const destMatch = output.match(/Destination:\s*(.+)/);
            if (destMatch) {
                lastDownloadedFilePath = destMatch[1].trim();
            }

            const alreadyMatch = output.match(/\[download\]\s+(.+)\s+has already been downloaded/);
            if (alreadyMatch) {
                lastDownloadedFilePath = alreadyMatch[1].trim();
            }

            const mergeMatch = output.match(/Merging formats into\s*"([^"]+)"/);
            if (mergeMatch) {
                lastDownloadedFilePath = mergeMatch[1].trim();
            }
        });

        ytDlpProcess.stderr.on('data', (data) => {
            // yt-dlp outputs progress on stdout and errors/warnings on stderr
            errorMessage += data.toString();
        });

        ytDlpProcess.on('error', (err) => {
            event.reply('download-status', { status: 'error', message: `Process Error: ${err.message}` });
        });

        ytDlpProcess.on('close', (code, signal) => {
            currentDownloadProcess = null;
            if (signal === 'SIGTERM' || signal === 'SIGKILL' || signal === 'SIGINT') {
                event.reply('download-status', { status: 'error', message: 'Download cancelled by user.' });
                return;
            }
            if (code === 0) {
                event.reply('download-status', { status: 'success', message: 'Success! Video downloaded to your Downloads folder.' });
            } else {
                // Find non-zero exit codes to print context
                event.reply('download-status', { status: 'error', message: `Error downloading video. (Code ${code})\n${errorMessage.trim()}` });
            }
        });

    });
});

ipcMain.on('cancel-download', (event) => {
    if (currentDownloadProcess) {
        currentDownloadProcess.kill('SIGTERM');
        currentDownloadProcess = null;
    }
});

// Fetch Video Title dynamically
ipcMain.on('get-video-info', (event, url) => {
    if (!url) return;

    const infoProcess = spawn('yt-dlp', ['--print', 'title', '--no-warnings', url]);

    let title = '';
    infoProcess.stdout.on('data', (data) => {
        title += data.toString();
    });

    infoProcess.on('close', (code) => {
        if (code === 0 && title.trim()) {
            event.reply('video-info-result', { title: title.trim() });
        }
    });
});

// Open Downloads Folder & Select File
ipcMain.on('open-folder', () => {
    if (lastDownloadedFilePath) {
        shell.showItemInFolder(lastDownloadedFilePath);
    } else {
        // Fallback if parsing failed for any reason
        shell.openPath(path.join(os.homedir(), 'Downloads'));
    }
});
