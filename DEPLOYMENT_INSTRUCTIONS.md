# NoorAI Launcher - Deployment Instructions
## Complete Guide for GitHub Pages + Cloudflare

**Build Date:** December 15, 2047 02:14:36 UTC  
**Installer File:** NoorAI-Setup-x64.exe  
**File Size:** 143.51 MB (150,483,506 bytes)  
**Version:** 0.1.0  

---

## STEP 1: Prepare the Installer for Upload

The fresh installer is located at:
```
c:\Users\Asdfg\Downloads\noorai\launcher\dist\NoorAI-Setup-x64.exe
```

### Verification Checklist:
- ✓ File size: 143.51 MB
- ✓ Build timestamp: 1447-12-15 02:14:36
- ✓ Contains UI fixes (high-contrast colors, dark theme)
- ✓ CSS hash: B14A397E2130EA407C852083A5C43989

---

## STEP 2: Upload to GitHub Repository

You have two options:

### **Option A: Using Git Command Line (Recommended)**

1. **Navigate to your local repository:**
   ```powershell
   cd "path\to\your\NoorAI\repo"
   ```

2. **Copy the installer to your designated folder:**
   ```powershell
   # Example: if you store downloads in /releases folder
   Copy-Item "c:\Users\Asdfg\Downloads\noorai\launcher\dist\NoorAI-Setup-x64.exe" "releases\NoorAI-Setup-x64.exe" -Force
   
   # Or if you store in root:
   Copy-Item "c:\Users\Asdfg\Downloads\noorai\launcher\dist\NoorAI-Setup-x64.exe" "NoorAI-Setup-x64.exe" -Force
   ```

3. **Stage the file:**
   ```bash
   git add NoorAI-Setup-x64.exe
   # OR if in subfolder:
   git add releases/NoorAI-Setup-x64.exe
   ```

4. **Commit the change:**
   ```bash
   git commit -m "Update: NoorAI Launcher v0.1.0 - UI fixes and improvements (Dec 15, 2047)"
   ```

5. **Push to GitHub:**
   ```bash
   git push origin main
   # Or your branch name:
   git push origin master
   ```

### **Option B: Using GitHub Web Interface**

1. Go to: `https://github.com/mfrhahlam21-ship-it/NoorAI`
2. Navigate to the folder where you want the installer
3. Click "Add file" → "Upload files"
4. Drag and drop `NoorAI-Setup-x64.exe` from `c:\Users\Asdfg\Downloads\noorai\launcher\dist\`
5. Add commit message: "Update: NoorAI Launcher v0.1.0 - UI fixes"
6. Click "Commit changes"

---

## STEP 3: Update Website Download Links

### **Find and Update These Files:**

1. **index.html** (or your main page)
   - Find: Old download link to NoorAI-Setup-x64.exe
   - Update to: New link pointing to the uploaded file
   
   **Example:**
   ```html
   <!-- OLD: -->
   <a href="/downloads/NoorAI-Setup-x64.exe">Download v0.0.9</a>
   
   <!-- NEW: -->
   <a href="/downloads/NoorAI-Setup-x64.exe">Download v0.1.0</a>
   ```

2. **README.md** (if it has download instructions)
   - Update version number from 0.0.x to 0.1.0
   - Update file size from previous to **143.51 MB**
   - Update build date to **December 15, 2047**

3. Any other pages that reference the installer

**Commit these changes:**
```bash
git add index.html README.md
git commit -m "Update download links to v0.1.0 installer"
git push origin main
```

---

## STEP 4: Purge Cloudflare Cache

### **Using Cloudflare Dashboard:**

1. **Login to Cloudflare:** https://dash.cloudflare.com
2. **Select your domain**
3. **Go to:** Caching → Purge Cache (or Cache Rules)
4. **Choose purge method:**
   - **Purge Everything** (fastest, clears all cache)
     - Click "Purge Everything"
     - Confirm when prompted
   
   - **Purge URLs** (selective, only specific files):
     - Click "Purge URLs"
     - Enter URLs to purge (one per line):
       ```
       https://yourdomain.com/downloads/NoorAI-Setup-x64.exe
       https://yourdomain.com/
       https://yourdomain.com/index.html
       ```
     - Click "Purge"

5. **Wait 30 seconds** for cache invalidation

### **Using Cloudflare API (if you prefer):**

```powershell
$cfEmail = "your-cloudflare-email@example.com"
$cfApiKey = "your-cloudflare-api-key"
$cfZoneId = "your-zone-id"

$headers = @{
    "X-Auth-Email" = $cfEmail
    "X-Auth-Key" = $cfApiKey
    "Content-Type" = "application/json"
}

$body = @{
    "files" = @(
        "https://yourdomain.com/downloads/NoorAI-Setup-x64.exe",
        "https://yourdomain.com/index.html"
    )
} | ConvertTo-Json

Invoke-RestMethod -Uri "https://api.cloudflare.com/client/v4/zones/$cfZoneId/purge_cache" `
    -Method POST `
    -Headers $headers `
    -Body $body
```

---

## STEP 5: Verification - Download and Test

### **Immediate Test (5-10 minutes after upload):**

1. **Open Incognito/Private Browser Window**
   - Chrome: Press `Ctrl + Shift + N`
   - Firefox: Press `Ctrl + Shift + P`
   - Edge: Press `Ctrl + Shift + P`
   - Safari: Press `Cmd + Shift + N`

2. **Navigate to your download page**
   - Go to: `https://your-domain.com/downloads/` (or wherever the installer is)

3. **Download the installer**
   - Note the file size and download time

4. **Verify file integrity:**
   ```powershell
   # Check downloaded file
   Get-Item "C:\Users\Asdfg\Downloads\NoorAI-Setup-x64.exe" | Select-Object Name, Length, LastWriteTime
   
   # Should show:
   # Name                 Length         LastWriteTime
   # NoorAI-Setup-x64.exe 150483506      [Recent timestamp]
   ```

5. **Compare file hashes:**
   ```powershell
   # New installer (source)
   Get-FileHash "c:\Users\Asdfg\Downloads\noorai\launcher\dist\NoorAI-Setup-x64.exe" -Algorithm SHA256
   
   # Downloaded installer
   Get-FileHash "C:\Users\[Username]\Downloads\NoorAI-Setup-x64.exe" -Algorithm SHA256
   
   # Both should show: B14A397E2130EA407C852083A5C43989 (first 32 chars of hash)
   ```

### **Installation Test (Optional but Recommended):**

1. **Uninstall old version** (if installed)
2. **Install fresh copy** from downloaded file
3. **Verify UI improvements:**
   - ✓ Text is bright white (not faded)
   - ✓ Accent colors are vivid cyan (#00ffcc)
   - ✓ Dark backgrounds are solid dark (#070709)
   - ✓ No scaling issues
   - ✓ No content requiring scrolling
   - ✓ All controls respond correctly

---

## Checklist for Completion

- [ ] Installer copied to GitHub repository
- [ ] GitHub repository pushed with new files
- [ ] Website download links updated to v0.1.0
- [ ] Cloudflare cache purged
- [ ] Incognito download test completed
- [ ] Downloaded file verified (size: 143.51 MB)
- [ ] File hash matches source
- [ ] (Optional) Fresh installation tested and verified

---

## Rollback Instructions (If Needed)

If the new version has issues:

1. **Delete/replace on GitHub:**
   ```bash
   git rm NoorAI-Setup-x64.exe
   git commit -m "Revert to previous version"
   git push origin main
   ```

2. **Restore previous version:**
   - Re-upload the old installer
   - Update download links back to old version

3. **Purge Cloudflare again**

---

## Support Information

If users report issues after download:
- Verify they're using the new version (143.51 MB)
- Check installer modification date (should be recent)
- Confirm they uninstalled old version before installing new
- Have them check file integrity using hash comparison

---

**Deployment Completed By:** Automated Build System  
**Build Hash:** B14A397E2130EA407C852083A5C43989  
**Status:** Ready for Production
