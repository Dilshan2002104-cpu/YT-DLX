# YouTube Video Downloader 🎥

A modern, high-performance desktop application for downloading YouTube videos, built with **Electron** and powered by **yt-dlp**.

## ✨ Features

- **Premium UI**: Sleek dark mode design with vibrant aesthetics and smooth transitions.
- **Smart Link Processing**: Automatically extracts video metadata (title and thumbnail) upon pasting a link.
- **Multiple Quality Options**: Choose from best available, 1080p, 720p, 480p, or Audio Only (MP3).
- **Progress Tracking**: Real-time download percentage and speed indicators.
- **In-App Controls**: Cancel active downloads and open the destination folder directly from the app.
- **Native Experience**: Native right-click context menu for easy URL entry.

## 🛠️ Tech Stack

- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Backend (Electron)**: Node.js Main Process
- **Engine**: [yt-dlp](https://github.com/yt-dlp/yt-dlp)
- **Packager**: [electron-builder](https://www.electron.build/)

## 📋 Prerequisites

To run this application, you must have the following installed on your system:

- **Node.js**: [Download here](https://nodejs.org/)
- **yt-dlp**: Must be available in your system's `PATH`. You can install it via:
  ```bash
  # Linux (using curl)
  sudo curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp
  sudo chmod a+rx /usr/local/bin/yt-dlp
  ```
- **ffmpeg** (Optional, but recommended for high-quality video merging and audio extraction):
  ```bash
  sudo apt update && sudo apt install ffmpeg
  ```

## 🚀 Getting Started

1. **Clone the repository**:
   ```bash
   git clone https://github.com/dilshan/downloader.git
   cd downloader
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run the app**:
   ```bash
   npm start
   ```

4. **Build the application**:
   ```bash
   npm run build
   ```

## 📂 Project Structure

- `main.js`: Core logic for managing downloads and IPC.
- `renderer.js`: UI logic and event handling.
- `index.html`: The main interface structure and styling.
- `preload.js`: Secure IPC bridging.

## 📄 License

This project is licensed under the **ISC License**.

---
*Created by [Dilshan](https://github.com/dilshan)*
