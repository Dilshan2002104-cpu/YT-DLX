const urlInput = document.getElementById('urlInput');
const qualitySelect = document.getElementById('qualitySelect');
const downloadBtn = document.getElementById('downloadBtn');
const cancelBtn = document.getElementById('cancelBtn');
const openFolderBtn = document.getElementById('openFolderBtn');
const statusText = document.getElementById('status');
const progressContainer = document.getElementById('progressContainer');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const speedText = document.getElementById('speedText');
const thumbnailContainer = document.getElementById('thumbnailContainer');
const thumbnailImg = document.getElementById('thumbnailImg');
const thumbnailTitle = document.getElementById('thumbnailTitle');

function setUIState(isDownloading) {
    downloadBtn.style.display = isDownloading ? 'none' : 'flex';
    cancelBtn.style.display = isDownloading ? 'flex' : 'none';
    if (!isDownloading) cancelBtn.disabled = false;
    if (isDownloading) openFolderBtn.style.display = 'none';
    urlInput.disabled = isDownloading;
    qualitySelect.disabled = isDownloading;
}

// Extract YouTube Video ID
function extractVideoId(url) {
    const regex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([^"&?\/\s]{11})/i;
    const match = url.match(regex);
    return match ? match[1] : null;
}

// Display Thumbnail When Link is Pasted
urlInput.addEventListener('input', () => {
    const url = urlInput.value.trim();
    const videoId = extractVideoId(url);

    if (videoId) {
        thumbnailImg.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
        thumbnailImg.onload = () => {
            if (thumbnailImg.src.includes(videoId)) {
                thumbnailImg.classList.add('loaded');
            }
        };
        thumbnailTitle.textContent = 'Fetching title...';
        thumbnailTitle.classList.remove('loaded');
        window.electronAPI.getVideoInfo(url);

        thumbnailContainer.classList.add('active');
    } else {
        thumbnailContainer.classList.remove('active');
        thumbnailImg.classList.remove('loaded');
        thumbnailTitle.classList.remove('loaded');
    }
});

// Listen for Downloader Button click
downloadBtn.addEventListener('click', () => {
    const url = urlInput.value.trim();
    const quality = qualitySelect.value;

    if (!url) {
        statusText.textContent = 'Error: Please enter a valid YouTube URL.';
        statusText.className = 'error visible';
        return;
    }

    // Initial State updates
    statusText.textContent = 'Preparing...';
    statusText.className = 'downloading visible';
    progressContainer.style.display = 'none';
    progressBar.style.width = '0%';
    progressText.textContent = '0%';
    speedText.textContent = '-- MB/s';
    setUIState(true);

    // Send communication to the robust node-based main process
    window.electronAPI.downloadVideo(url, quality);
});

// React to status updates back from IPCMain
window.electronAPI.onDownloadStatus((response) => {
    const { status, message } = response;

    statusText.textContent = message;

    if (status === 'success') {
        statusText.className = 'success visible';
        setUIState(false);
        urlInput.value = ''; // Success reset
        progressBar.style.width = '100%';
        progressText.textContent = '100%';
        openFolderBtn.style.display = 'flex';
    } else if (status === 'error') {
        statusText.className = 'error visible';
        setUIState(false); // Enable so user can try again
        progressContainer.style.display = 'none';
    } else if (status === 'downloading') {
        statusText.className = 'downloading visible';
        progressContainer.style.display = 'block';
    }
});

// React to progress updates
window.electronAPI.onDownloadProgress((data) => {
    const { percentage, speed } = data;

    if (percentage) {
        progressBar.style.width = percentage;
        progressText.textContent = percentage;
    }

    if (speed) {
        speedText.textContent = speed;
    }
});

// Listen for Cancel Button click
cancelBtn.addEventListener('click', () => {
    window.electronAPI.cancelDownload();
    statusText.textContent = 'Cancelling...';
    statusText.className = 'downloading visible';
    cancelBtn.disabled = true; // prevent multiple clicks
});

// Listen for Open Folder Button click
openFolderBtn.addEventListener('click', () => {
    window.electronAPI.openDownloadsFolder();
});

// React to Video Info Updates
window.electronAPI.onVideoInfo((data) => {
    if (data && data.title) {
        thumbnailTitle.textContent = data.title;
        thumbnailTitle.classList.add('loaded');
    }
});
