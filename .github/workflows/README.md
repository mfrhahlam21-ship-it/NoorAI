# GitHub Actions Build Workflow

This directory contains the automated build and release workflow for the NoorAI Launcher.

## Workflow: `build.yml`

### Triggers
- **On Push**: Automatically builds when code is pushed to `main` or `develop` branches
- **On Pull Request**: Validates builds for pull requests to `main`
- **Manual Trigger**: Can be triggered manually via `workflow_dispatch`

### What it does

1. **Setup**
   - Checks out the repository
   - Sets up Node.js 18.x
   - Caches npm dependencies for faster builds

2. **Build Process**
   - Installs root and launcher dependencies
   - Builds the React renderer (Vite)
   - Bundles the main process (esbuild)
   - Bundles the preload script (esbuild)

3. **Packaging**
   - Runs `electron-builder` to create Windows NSIS installer
   - Generates `NoorAI-Setup-x64.exe` (or similar)

4. **Artifacts**
   - Uploads `.exe` files as GitHub Actions artifacts
   - Keeps artifacts for 30 days

5. **Release (optional)**
   - Creates a GitHub Release with installers when a git tag is pushed (e.g., `v0.1.0`)
   - Release is automatically published

### Environment

**Runner**: `windows-latest` (Windows Server 2022)

This ensures:
- ✅ Full Windows SDK and build tools available
- ✅ No symlink permission issues (Windows has proper NSIS support)
- ✅ Code signing support (if needed)
- ✅ Proper Electron Builder configuration

### Configuration Notes

- **GH_TOKEN**: Automatically provided by GitHub Actions
- **NODE_ENV**: Set to `production` for optimized builds
- **electron-builder**: Configured via `launcher/package.json` build section

### Creating a Release

To create an automated release with the installer:

```bash
git tag -a v0.1.0 -m "Initial Release"
git push origin v0.1.0
```

The workflow will:
1. Build the launcher
2. Create a GitHub Release with the tag name
3. Attach the `.exe` installer as a downloadable artifact

Users can then download the installer from: `https://github.com/yourusername/noorai/releases`

### Troubleshooting

If the build fails:
1. Check the **Actions** tab on GitHub
2. Click the failed workflow run
3. Expand the step logs to see detailed error messages
4. Common issues:
   - Missing dependencies: Ensure `npm install` completes
   - Build errors: Check TypeScript/esbuild compilation
   - Electron Builder errors: Verify Windows SDK is present (usually auto-handled on windows-latest)

### Customization

To customize the workflow, edit `.github/workflows/build.yml`:
- Change branch triggers
- Modify artifact retention
- Add code signing
- Set up notifications

### Local Testing

Before pushing, you can test locally:

```bash
cd launcher
npm install
npm run dist
```

This will generate the Windows installer in `launcher/dist/`.
