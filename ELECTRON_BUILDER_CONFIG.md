# Electron Builder Configuration for NoorAI Launcher

This file documents the electron-builder configuration in `launcher/package.json`.

## Build Configuration

### Basic Info
```json
{
  "appId": "com.noorai.launcher",
  "productName": "NoorAI Launcher"
}
```

- **appId**: Unique identifier for Windows registry (reverse domain notation)
- **productName**: Display name in installer and shortcuts

### Directories
```json
{
  "directories": {
    "output": "dist",
    "buildResources": "assets"
  }
}
```

- **output**: Where the final `.exe` is saved
- **buildResources**: Folder for app icon and assets

### Files Included
```json
{
  "files": [
    "dist/**/*",
    "assets/**/*",
    "package.json"
  ]
}
```

Packaged files in the installer:
- All built files from `dist/` (renderer, main, preload)
- Assets (icons, resources)
- package.json metadata

### Windows Target Configuration
```json
{
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64"]
      }
    ],
    "publisherName": "NoorAI Team",
    "certificateFile": null,
    "certificatePassword": null,
    "signingHashAlgorithms": ["sha256"],
    "sign": null
  }
}
```

- **target**: `nsis` = NSIS installer (standard Windows .exe)
- **arch**: `x64` only (64-bit, modern standard)
- **publisherName**: Company name in installer
- **certificateFile**: Set to path for code signing (optional)
- **sign**: Custom signing function (optional)

### NSIS Installer Configuration
```json
{
  "nsis": {
    "oneClick": false,
    "perMachine": false,
    "allowElevation": true,
    "allowToChangeInstallationDirectory": true,
    "createDesktopShortcut": true,
    "createStartMenuShortcut": true,
    "shortcutName": "NoorAI Launcher"
  }
}
```

- **oneClick**: `false` = Show installation wizard (recommended)
- **perMachine**: `false` = Per-user install (doesn't require admin)
- **allowElevation**: `true` = Allow user to run as admin if needed
- **allowToChangeInstallationDirectory**: `true` = Let user choose install location
- **createDesktopShortcut**: `true` = Add to desktop
- **createStartMenuShortcut**: `true` = Add to Start menu
- **shortcutName**: Label for shortcuts

### Publish Configuration (GitHub Releases)
```json
{
  "publish": {
    "provider": "github",
    "owner": "yourusername",
    "repo": "noorai",
    "private": false
  }
}
```

Update `yourusername` to your GitHub username.

## Output Files

### Installer Naming
Default output: `NoorAI Launcher-{version}-x64-Setup.exe`

Example for version 0.1.0:
```
NoorAI Launcher-0.1.0-x64-Setup.exe
```

### Location
All output files are in: `launcher/dist/`

## Build Process in CI/CD

When GitHub Actions runs, it:

1. Builds renderer (Vite)
2. Bundles main (esbuild)
3. Bundles preload (esbuild)
4. Runs electron-builder with config above
5. Creates `NoorAI-Setup-x64.exe` in `launcher/dist/`
6. Uploads to GitHub Artifacts (temporary)
7. On tagged releases, creates GitHub Release with the `.exe`

## Customization Options

### Change Installer Name
```json
{
  "productName": "My Custom Launcher Name"
}
```

### Change App ID
```json
{
  "appId": "com.mycompany.launcher"
}
```

### Change Installation Behavior
```json
{
  "nsis": {
    "oneClick": true  // Skip wizard, install to default location
  }
}
```

### Add Code Signing
```json
{
  "win": {
    "certificateFile": "/path/to/certificate.pfx",
    "certificatePassword": "your-password"
  }
}
```

### Change Target Architecture
```json
{
  "win": {
    "target": [
      {
        "target": "nsis",
        "arch": ["x64", "ia32"]  // Include 32-bit
      }
    ]
  }
}
```

Note: 32-bit support requires additional considerations.

## Environment Variables

The GitHub Actions workflow sets:
- `NODE_ENV=production` - Optimizes build
- `GH_TOKEN` - For publishing to releases

## Troubleshooting

### Issue: "Build resources are missing"
**Solution**: Ensure `launcher/assets/` folder exists (can be empty or contain app icon)

### Issue: "version not found"
**Solution**: Ensure version in `launcher/package.json` is valid (e.g., "0.1.0")

### Issue: "nsis not found"
**Solution**: electron-builder downloads NSIS automatically; this is normal first-time behavior

### Issue: Installer is too large
**Solution**: Check `files` array isn't including unwanted files like `node_modules`

## References

- Electron Builder docs: https://www.electron.build/
- NSIS configuration: https://www.electron.build/configuration/nsis
- Code signing guide: https://www.electron.build/code-signing
