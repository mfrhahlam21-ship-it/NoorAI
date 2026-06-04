# NoorAI Launcher GitHub Actions Workflow

Complete, production-ready CI/CD setup for building and releasing the Electron launcher.

## What's Included

### Files
✅ `.github/workflows/build.yml` - GitHub Actions workflow configuration
✅ `launcher/package.json` - Updated with build config and metadata
✅ `LAUNCHER_BUILD_GUIDE.md` - Complete building and releasing guide
✅ `ELECTRON_BUILDER_CONFIG.md` - Configuration reference
✅ `CI_CD_SETUP_CHECKLIST.md` - Pre-deployment checklist

### Features

- ✅ Automatic builds on push to main/develop
- ✅ Automatic builds on pull requests to main
- ✅ Manual trigger via workflow_dispatch
- ✅ Windows builds using windows-latest runner
- ✅ Electron Builder NSIS installer generation
- ✅ Artifact upload (30-day retention)
- ✅ GitHub Release creation on git tag
- ✅ Build status reporting
- ✅ npm cache for faster builds

## Quick Start

### 1. Update Repository URLs

**File**: `.github/workflows/build.yml` and `launcher/package.json`

Replace `yourusername` with your actual GitHub username:

```bash
# In .github/workflows/build.yml (no changes needed if using GitHub token)

# In launcher/package.json
{
  "repository": {
    "url": "https://github.com/YOUR_USERNAME/noorai.git"
  },
  "build": {
    "publish": {
      "owner": "YOUR_USERNAME",
      "repo": "noorai"
    }
  }
}
```

### 2. Commit and Push

```bash
cd /path/to/noorai
git add .
git commit -m "Add GitHub Actions CI/CD for Electron launcher"
git push origin main
```

### 3. Watch Build

Go to GitHub → **Actions** tab and watch the workflow run.

### 4. Create Release (Optional)

```bash
git tag -a v0.1.0 -m "Version 0.1.0 - Initial Release"
git push origin v0.1.0
```

## Workflow Details

### Triggers

| Event | Trigger | Action |
|-------|---------|--------|
| Push to main/develop | Automatic | Build + Artifact Upload |
| Pull request to main | Automatic | Build validation |
| Manual | workflow_dispatch | On-demand build |
| Tag push (v*.*.*)  | Automatic | Build + GitHub Release |

### Runner

- **OS**: Windows Server 2022 (`windows-latest`)
- **Node**: 18.x
- **Timeout**: 45 minutes

### Output

- **Artifacts**: `NoorAI-Setup-x64.exe` (stored 30 days in Actions)
- **Release**: `.exe` installer published to GitHub Releases (permanent)
- **Download URL**: `https://github.com/yourusername/noorai/releases`

## Build Steps Executed

1. **Checkout** - Clone repository
2. **Setup Node.js** - Install 18.x with npm cache
3. **Install Dependencies**
   - Root project: `npm install`
   - Launcher: `npm install`
4. **Build React Renderer** - Vite build
5. **Build Main Process** - esbuild bundling
6. **Build Preload** - esbuild bundling
7. **Package Installer** - electron-builder NSIS
8. **Upload Artifacts** - Save to GitHub Actions
9. **List Artifacts** - Debug output
10. **Create Release** - (if git tag detected)

## Key Configuration

### electron-builder in package.json

```json
{
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

### Build Scripts in package.json

```json
{
  "scripts": {
    "build": "npm run build:renderer && npm run build:main && npm run build:preload",
    "dist": "npm run build && electron-builder --publish=never",
    "dist:publish": "npm run build && electron-builder"
  }
}
```

## Windows NSIS Installer

The workflow produces a standard Windows NSIS installer with:

- ✅ Installation wizard (user can choose directory)
- ✅ Per-user installation (no admin required)
- ✅ Desktop shortcut creation
- ✅ Start menu entry
- ✅ Uninstall support
- ✅ System integration

Installer filename: `NoorAI Launcher-0.1.0-x64-Setup.exe`

## GitHub Release Publishing

When a git tag is pushed:

```bash
git tag -a v0.1.0 -m "Version 0.1.0"
git push origin v0.1.0
```

The workflow automatically:

1. Builds the installer
2. Creates a GitHub Release page
3. Attaches the `.exe` file
4. Makes it downloadable for users

Users can download from:
```
https://github.com/yourusername/noorai/releases/tag/v0.1.0
```

## Environment Variables

Set by GitHub Actions:

| Variable | Value | Purpose |
|----------|-------|---------|
| `GH_TOKEN` | (auto) | GitHub API access |
| `NODE_ENV` | `production` | Optimized build |

## Artifact Retention

- **Temporary artifacts** (from builds): 30 days
- **Release artifacts** (tagged builds): Permanent

To change: Edit `retention-days` in `build.yml`

## Error Handling

### If build fails:

1. Check **Actions** tab on GitHub
2. Click the failed workflow
3. Expand "Build installer with Electron Builder"
4. Read the error output

### Common issues:

- **Node version mismatch**: Ensure 18.x is available
- **Missing dependencies**: Check `npm install` output
- **Build errors**: Check TypeScript compilation
- **Electron Builder errors**: Rare on windows-latest (proper SDK included)

## Local Testing

Before pushing, test locally:

```bash
cd launcher
npm install
npm run build    # Test build
npm run dist     # Test packaging
```

This ensures local builds work before pushing to CI/CD.

## Customization Options

### Change installer name
```json
{
  "productName": "My Custom App Name"
}
```

### Include additional files
```json
{
  "files": [
    "dist/**/*",
    "assets/**/*",
    "path/to/extra/**/*"
  ]
}
```

### Update version
```json
{
  "version": "0.2.0"
}
```

### Add code signing (optional)
See `ELECTRON_BUILDER_CONFIG.md` for details.

## Status Badge

Add to README.md:

```markdown
[![Build Status](https://github.com/yourusername/noorai/actions/workflows/build.yml/badge.svg)](https://github.com/yourusername/noorai/actions/workflows/build.yml)
```

## Monitoring & Notifications

GitHub Actions provides:

- ✅ Build status on commits
- ✅ PR checks (blocks merge if build fails)
- ✅ Email notifications
- ✅ Webhook notifications (for Slack, Discord, etc.)

## Next Steps

1. ✅ Review `.github/workflows/build.yml`
2. ✅ Update repository URLs
3. ✅ Commit and push
4. ✅ Monitor first build in Actions tab
5. ✅ Test the downloaded installer
6. ✅ Create release with git tag
7. ✅ Share with users

## References

- **Workflow syntax**: https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions
- **electron-builder**: https://www.electron.build/
- **GitHub Actions**: https://docs.github.com/en/actions

---

**Setup Date**: 2026-05-25  
**Status**: ✅ Ready for Production  
**Tested**: Yes (local build validated)
