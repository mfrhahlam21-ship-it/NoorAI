# NoorAI Launcher - Electron Building Setup Guide

This guide explains the GitHub Actions workflow for automated building and releasing of the NoorAI Launcher.

## Quick Start

### Prerequisites
- Git repository hosted on GitHub
- Node.js 18+ (for local development)
- Windows 10/11 (for local Windows builds, or use GitHub Actions)

### Initial Setup

1. **Update Repository URLs**
   - Edit `.github/workflows/build.yml`
   - Edit `launcher/package.json`
   - Replace `yourusername` with your actual GitHub username

2. **Push to GitHub**
   ```bash
   git add .
   git commit -m "Add GitHub Actions workflow for Electron launcher"
   git push origin main
   ```

3. **Monitor the Build**
   - Go to GitHub repository → **Actions** tab
   - Watch the workflow run automatically

### Automatic Builds

Every push to `main` or `develop` will trigger a build:

```
📦 Push code
   ↓
🔨 GitHub Actions runs `npm install`
   ↓
🔨 Runs `npm run build`
   ↓
🔨 Runs `npm run dist` (electron-builder)
   ↓
📦 Uploads NoorAI-Setup-x64.exe as artifact
   ↓
✅ Build complete!
```

### Creating a Release

To create a downloadable release:

```bash
# Create a tag
git tag -a v0.1.0 -m "Version 0.1.0 - Initial Release"

# Push the tag
git push origin v0.1.0
```

This will:
1. Trigger a build on the `windows-latest` runner
2. Create a GitHub Release page
3. Attach the `.exe` installer for download
4. Users can download from: `https://github.com/yourusername/noorai/releases/tag/v0.1.0`

### Build Output

After each successful build:

**GitHub Actions Artifacts** (temp storage, 30 days)
- `launcher/dist/**/*.exe`
- Available in the Actions run details

**GitHub Releases** (permanent, if tagged)
- Installer `.exe` file
- Release notes
- Download link for public distribution

## Workflow Details

### File: `.github/workflows/build.yml`

**Triggers:**
- `push` to `main` or `develop`
- `pull_request` to `main`
- Manual `workflow_dispatch`

**Runner:**
- `windows-latest` (Windows Server 2022)
- Includes all required Windows build tools
- Avoids symlink/permission issues

**Steps:**
1. Checkout repository
2. Setup Node.js 18.x with npm cache
3. Install dependencies
4. Build React renderer (Vite)
5. Build Electron main process (esbuild)
6. Build preload script (esbuild)
7. Package with electron-builder (NSIS installer)
8. Upload artifacts
9. Create GitHub Release (if tagged)

## Configuration

### package.json (launcher)

Key fields for building:

```json
{
  "name": "noorai-launcher",
  "version": "0.1.0",
  "description": "NoorAI Gaming Launcher - Windows Desktop Application",
  "scripts": {
    "build": "npm run build:renderer && npm run build:main && npm run build:preload",
    "dist": "npm run build && electron-builder --publish=never"
  },
  "build": {
    "appId": "com.noorai.launcher",
    "productName": "NoorAI Launcher",
    "win": {
      "target": ["nsis"],
      "publisherName": "NoorAI Team"
    },
    "nsis": {
      "oneClick": false,
      "perMachine": false,
      "allowElevation": true,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

### Output File

Default output filename: `NoorAI Launcher-0.1.0-x64-Setup.exe`

To customize, modify in `launcher/package.json`:
- `productName`: Changes the installer name
- `version`: Updates version in installer

## Local Building

### For Testing

```bash
cd launcher
npm install
npm run build
npm run dist
```

This creates the same `.exe` locally that the GitHub Actions workflow produces.

### Output Location

```
launcher/
  └── dist/
      └── NoorAI Launcher-0.1.0-x64-Setup.exe  ← Ready to distribute
```

## Code Signing (Optional)

If you want to sign the installer:

1. Obtain a Windows code-signing certificate
2. Add to GitHub Secrets:
   - `WINDOWS_CERTIFICATE_PATH`
   - `WINDOWS_CERTIFICATE_PASSWORD`
3. Update `launcher/package.json`:
   ```json
   "win": {
     "certificateFile": "${{ secrets.WINDOWS_CERTIFICATE_PATH }}",
     "certificatePassword": "${{ secrets.WINDOWS_CERTIFICATE_PASSWORD }}"
   }
   ```

## Troubleshooting

### Build fails with "symlink" error
- This is a Windows symlink permission issue (now fixed by using windows-latest runner)
- The workflow runs on `windows-latest` which has proper Windows SDK and permissions

### Build fails with missing files
- Ensure `launcher/package.json` has correct `files` array
- Ensure all TypeScript files are in correct locations:
  - `launcher/src/main/main.ts`
  - `launcher/src/main/preload.ts`
  - `launcher/src/renderer/App.tsx`

### Build is slow
- Builds can take 10-15 minutes on first run
- Subsequent builds use npm cache and are faster

### Installer doesn't appear in releases
- Verify the git tag was pushed: `git push origin v0.1.0`
- Check Actions tab for build completion status
- Ensure build step succeeded (green checkmarks)

## Next Steps

1. **Update Repository Info**
   - Update `.github/workflows/build.yml` with your GitHub username
   - Update `launcher/package.json` repository URL

2. **Commit and Push**
   ```bash
   git add .
   git commit -m "Setup GitHub Actions for Electron launcher"
   git push
   ```

3. **Create First Release**
   ```bash
   git tag -a v0.1.0 -m "Initial Release"
   git push origin v0.1.0
   ```

4. **Distribute**
   - Share the release link: `https://github.com/yourusername/noorai/releases`
   - Users can download the `.exe` directly

## Support

For issues:
1. Check GitHub Actions logs
2. Review electron-builder documentation: https://www.electron.build/
3. Check Electron documentation: https://www.electronjs.org/docs
