# **App Name**: Local Video Manager

## Core Features:

- Automatic Video Scan: Automatically scan all available drives for video files (.mp4, .mov, .avi, .mkv, .webm) excluding system and specified folders (Windows, Program Files, Program Files (x86), AppData, node_modules, .git).
- Asynchronous Scanning with Progress: Perform file system scanning asynchronously in the background and display a progress indicator during the scan.
- Video Grid Display: Display video files in a grid layout with 3 videos per row, including video preview and filename.
- Rename Buttons: Provide buttons on each video card for renaming the file based on preset options ('Стрельников', 'Отправка груза', 'Выдача груза').
- Safe Rename: Implement file renaming logic that safely renames the video file and appends a suffix (_1, _2, _3, etc.) if a file with the new name already exists.
- Exclude Folder: Add a context menu item to exclude the folder containing the selected video from future scans.
- Persistent Excluded Folders: Store excluded folders in a JSON file locally and load them on application startup to persist exclusions across sessions.

## Style Guidelines:

- Primary color: Deep blue (#3F51B5) to convey stability and professionalism.
- Background color: Light gray (#F5F5F5) for a clean, modern look.
- Accent color: Soft orange (#FFAB40) for interactive elements and highlights.
- Body and headline font: 'Inter', a grotesque-style sans-serif with a modern, machined, objective, neutral look; suitable for headlines or body text
- Use simple, clear icons for actions and navigation, following Material Design principles.
- Maintain a clean and structured layout using CSS Grid for the video grid, ensuring responsiveness.
- Use subtle transitions and animations to enhance user experience during scanning and renaming.