# Electron Desktop App Setup

Build and deploy GameAI Automation as a native desktop application for Windows, macOS, and Linux.

## Quick Start

### 1. Install Electron Dependencies

```bash
npm install --save-dev electron electron-builder
```

### 2. Create Main Process File

Create `electron/main.ts`:

```typescript
import { app, BrowserWindow, Menu, ipcMain } from "electron";
import path from "path";
import { fileURLToPath } from "url";
import { spawn } from "child_process";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let mainWindow: BrowserWindow | null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1600,
    height: 1000,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      preload: path.join(__dirname, "preload.ts"),
      nodeIntegration: false,
      contextIsolation: true,
    },
    icon: path.join(__dirname, "../public/icon.png"),
  });

  const isDev = process.env.NODE_ENV === "development";

  if (isDev) {
    // Development: Load from Vite dev server
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    // Production: Load from built files
    mainWindow.loadFile(path.join(__dirname, "../dist/spa/index.html"));
  }

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.on("ready", () => {
  createWindow();
  createMenu();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on("activate", () => {
  if (mainWindow === null) {
    createWindow();
  }
});

// IPC Handlers for system integration
ipcMain.handle("get-app-version", () => app.getVersion());
ipcMain.handle("get-app-path", () => app.getAppPath());

function createMenu() {
  const template: any[] = [
    {
      label: "File",
      submenu: [
        {
          label: "Exit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: "Edit",
      submenu: [
        { label: "Undo", accelerator: "CmdOrCtrl+Z", role: "undo" },
        { label: "Redo", accelerator: "CmdOrCtrl+Y", role: "redo" },
        { type: "separator" },
        { label: "Cut", accelerator: "CmdOrCtrl+X", role: "cut" },
        { label: "Copy", accelerator: "CmdOrCtrl+C", role: "copy" },
        { label: "Paste", accelerator: "CmdOrCtrl+V", role: "paste" },
      ],
    },
    {
      label: "Help",
      submenu: [
        {
          label: "About",
          click: () => {
            // Show about dialog
          },
        },
      ],
    },
  ];

  Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
```

### 3. Create Preload Script

Create `electron/preload.ts`:

```typescript
import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("electron", {
  getVersion: () => ipcRenderer.invoke("get-app-version"),
  getAppPath: () => ipcRenderer.invoke("get-app-path"),
});
```

### 4. Update package.json

Add these scripts and configuration:

```json
{
  "scripts": {
    "electron": "electron .",
    "electron-dev": "NODE_ENV=development electron .",
    "electron-build": "pnpm build && electron-builder",
    "electron-make": "electron-builder --publish never"
  },
  "build": {
    "appId": "com.gameai.automation",
    "productName": "GameAI Automation",
    "files": [
      "dist/**/*",
      "node_modules/**/*",
      "package.json"
    ],
    "directories": {
      "buildResources": "public"
    },
    "win": {
      "target": ["nsis", "portable"]
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true,
      "createDesktopShortcut": true,
      "createStartMenuShortcut": true
    },
    "mac": {
      "target": ["dmg", "zip"],
      "category": "public.app-category.utilities"
    },
    "linux": {
      "target": ["AppImage", "deb"],
      "category": "Utility"
    }
  }
}
```

### 5. Add Electron Entry Point

Update `package.json` main field:

```json
{
  "main": "dist/electron/main.js"
}
```

## Building for Distribution

### Windows

```bash
pnpm electron-build
# Creates installer in dist/ folder
```

### macOS

```bash
pnpm electron-build
# Creates .dmg and .app files
```

### Linux

```bash
pnpm electron-build
# Creates AppImage and .deb packages
```

## Development Workflow

### Hot Reload Development

1. Start Vite dev server:
```bash
pnpm dev
```

2. In another terminal, start Electron:
```bash
pnpm electron-dev
```

Changes to React code automatically reload in the Electron window.

### Python Service Integration

For Electron, the Python service can be:

1. **Bundled with app** - Package python-service alongside executable
2. **Run separately** - User runs `python-service/capture.py` in background
3. **Native module** - Port critical code to Node.js using node-gyp

To bundle Python:

```bash
# Install PyInstaller
pip install pyinstaller

# Create standalone executable
pyinstaller --onefile python-service/capture.py

# Include in Electron distribution
cp dist/capture dist/python-service/
```

Update electron-builder config:

```json
{
  "extraFiles": [
    {
      "from": "python-service/dist/capture",
      "to": "python-service/"
    }
  ]
}
```

## Code Signing

### macOS Code Signing

```bash
# Set environment variables
export CSC_LINK=/path/to/certificate.p12
export CSC_KEY_PASSWORD=password

pnpm electron-build
```

### Windows Code Signing

```bash
# Set environment variable
set WIN_CSC_LINK=path\to\certificate.pfx
set WIN_CSC_KEY_PASSWORD=password

pnpm electron-build
```

## Auto-Update

Add electron-updater for automatic updates:

```bash
npm install electron-updater
```

Update `electron/main.ts`:

```typescript
import { autoUpdater } from "electron-updater";

app.on("ready", () => {
  createWindow();
  autoUpdater.checkForUpdatesAndNotify();
});
```

## Troubleshooting

### App Won't Start

1. Check that Vite build is successful: `pnpm build`
2. Verify Electron main file path is correct
3. Check console output for errors

### Python Service Not Found

1. Verify python-service files are included in build
2. Check file paths in electron-builder config
3. Ensure Python is installed on target system

### Permission Errors

1. Run as administrator on Windows
2. Grant app permissions on macOS (System Preferences → Security)
3. Install as user on Linux (not system-wide)

## Distribution

### GitHub Releases

```bash
# Build and create release
pnpm electron-build

# Upload to GitHub Releases
# (manually or use electron-builder with GitHub token)
```

### Web Update Server

Setup auto-updates with custom server:

```typescript
autoUpdater.setFeedURL({
  provider: "generic",
  url: "https://example.com/updates/",
});
```

## Platform-Specific Notes

### Windows

- Requires .NET Framework for NSIS installer
- Optional: Use Visual Studio Build Tools
- File associations: Configure in electron-builder

### macOS

- Requires macOS 10.12+
- Code signing is recommended for distribution
- DMG installer provides drag-and-drop install

### Linux

- Requires `libgtk-3-0` for GUI
- AppImage is portable, no installation needed
- .deb package for Ubuntu/Debian systems

## Conclusion

The Electron wrapper transforms the web app into a native desktop application with system-level capabilities for screen capture and automation. For full system integration, ensure proper permissions and platform-specific testing.
