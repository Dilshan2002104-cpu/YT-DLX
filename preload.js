const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    downloadVideo: (url, quality) => ipcRenderer.send('download-video', url, quality),
    getVideoInfo: (url) => ipcRenderer.send('get-video-info', url),
    cancelDownload: () => ipcRenderer.send('cancel-download'),
    openDownloadsFolder: () => ipcRenderer.send('open-folder'),
    onDownloadStatus: (callback) => ipcRenderer.on('download-status', (_event, value) => callback(value)),
    onDownloadProgress: (callback) => ipcRenderer.on('download-progress', (_event, value) => callback(value)),
    onVideoInfo: (callback) => ipcRenderer.on('video-info-result', (_event, value) => callback(value))
});
