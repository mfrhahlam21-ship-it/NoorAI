import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import isDev from 'electron-is-dev';
import si from 'systeminformation';
import fs from 'fs';
import WindowsSystemUtils from './system-utils';
import GameDetector from './game-detector';
import FPSMonitor from './fps-monitor';
import CrashAnalyzer from './crash-analyzer';
import DriverChecker from './driver-checker';
import ProfileManager from './profile-manager';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  // Get screen dimensions for optimal window sizing
  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth, height: screenHeight } = primaryDisplay.workAreaSize;
  
  // Set window to 85% of screen size, but cap at reasonable maximums
  const windowWidth = Math.min(Math.round(screenWidth * 0.85), 1920);
  const windowHeight = Math.min(Math.round(screenHeight * 0.85), 1200);
  
  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    minWidth: 1024,
    minHeight: 720,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    title: 'NoorAI Launcher',
    backgroundColor: '#07070d',
    show: false, // show after ready-to-show to avoid white flash
    icon: process.platform === 'win32' ? path.join(__dirname, 'assets', 'icon.ico') : undefined,
  });

  // Dev: Vite renderer runs on 5173. Override with LAUNCHER_DEV_URL if needed.
  const devUrl = process.env.LAUNCHER_DEV_URL || 'http://localhost:5173';

  if (isDev) {
    mainWindow.loadURL(devUrl);
    // Open DevTools in a detached window (comment out if not needed)
    // mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  }

  // Show window once content is ready (prevents white flash)
  mainWindow.once('ready-to-show', () => {
    mainWindow?.show();
  });

  mainWindow.on('closed', () => (mainWindow = null));
}

app.on('ready', () => {
  createWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// ═══════════════════════════════════════════════════════════════════════════
// ENHANCED IPC HANDLERS
// ═══════════════════════════════════════════════════════════════════════════

// ── SYSTEM INFORMATION ──

ipcMain.handle('get-system-info', async () => {
  try {
    const osInfo = await si.osInfo();
    const cpu = await WindowsSystemUtils.getCPUMetrics();
    const mem = await WindowsSystemUtils.getMemoryMetrics();
    const graphics = await WindowsSystemUtils.getDetailedDriverInfo();
    const battery = await WindowsSystemUtils.getBatteryStatus();
    
    return {
      success: true,
      osInfo,
      cpu,
      mem,
      graphics,
      battery,
      isAdmin: WindowsSystemUtils.isRunningAsAdmin()
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-advanced-metrics', async () => {
  try {
    return {
      success: true,
      cpu: await WindowsSystemUtils.getCPUMetrics(),
      gpu: await WindowsSystemUtils.getGPUMetrics(),
      memory: await WindowsSystemUtils.getMemoryMetrics(),
      battery: await WindowsSystemUtils.getBatteryStatus(),
      powerPlan: await WindowsSystemUtils.getCurrentPowerPlan()
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-battery-status', async () => {
  try {
    return { success: true, ...(await WindowsSystemUtils.getBatteryStatus()) };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ── GAME DETECTION ──

ipcMain.handle('scan-games', async () => {
  try {
    const games = await GameDetector.detectAllGames();
    return { success: true, games, count: games.length };
  } catch (e) {
    return { success: false, error: String(e), games: [] };
  }
});

ipcMain.handle('scan-games-detailed', async () => {
  try {
    const allGames = await GameDetector.detectAllGames();
    const custom = await GameDetector.scanCustomGameLocations();
    return {
      success: true,
      allGames: [...allGames, ...custom],
      byPlatform: {
        steam: allGames.filter(g => g.platform === 'steam'),
        epic: allGames.filter(g => g.platform === 'epic'),
        battlenet: allGames.filter(g => g.platform === 'battlenet'),
        gog: allGames.filter(g => g.platform === 'gog'),
        gamepass: allGames.filter(g => g.platform === 'gamepass'),
        custom: custom
      }
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-running-games', async () => {
  try {
    const games = await WindowsSystemUtils.getRunningGames();
    return { success: true, games };
  } catch (e) {
    return { success: false, error: String(e), games: [] };
  }
});

ipcMain.handle('check-game-running', async (_event, gameName: string) => {
  try {
    const result = await WindowsSystemUtils.isGameRunning(gameName);
    return { success: true, ...result };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ── DRIVER INFORMATION ──

ipcMain.handle('check-drivers', async () => {
  try {
    const drivers = await WindowsSystemUtils.getDetailedDriverInfo();
    return { success: true, ...drivers };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-driver-details', async (_event, driverType: string) => {
  try {
    if (driverType === 'gpu') {
      const gpu = await WindowsSystemUtils.getGPUMetrics();
      return { success: true, ...gpu };
    }
    return { success: false, error: 'Unknown driver type' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ── FPS MONITORING ──

ipcMain.handle('start-fps-monitoring', async (_event, gameId: string, gameName: string) => {
  try {
    await FPSMonitor.startMonitoring(gameId, gameName);
    return { success: true, message: 'FPS monitoring started' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('stop-fps-monitoring', async () => {
  try {
    FPSMonitor.stopMonitoring();
    return { success: true, message: 'FPS monitoring stopped' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-fps', async () => {
  try {
    const current = FPSMonitor.getCurrentFPS();
    const history = FPSMonitor.getFPSHistory();
    const summary = FPSMonitor.getSummary();
    return { success: true, current, history, summary };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-fps-history', async () => {
  try {
    return { success: true, history: FPSMonitor.getFPSHistory() };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-game-performance-stats', async (_event, gameId: string) => {
  try {
    const stats = FPSMonitor.getGameStats(gameId);
    const recommendations = FPSMonitor.getPerformanceRecommendations(gameId);
    return { success: true, stats, recommendations };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ── SMART PROFILES ──

ipcMain.handle('apply-profile', async (_event, profileName: string) => {
  try {
    let result: any = {};
    switch (profileName) {
      case 'game-mode':
        result = await WindowsSystemUtils.applyGameModeProfile();
        break;
      case 'low-latency':
        result = await WindowsSystemUtils.applyLowLatencyProfile();
        break;
      case 'thermal-safe':
        result = await WindowsSystemUtils.applyThermalSafeProfile();
        break;
      case 'laptop-mode':
        result = await WindowsSystemUtils.applyLaptopModeProfile();
        break;
      default:
        return { success: false, error: 'Unknown profile' };
    }
    return { 
      success: result.success ?? true, 
      profile: profileName,
      results: result.results,
      message: result.message
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('reset-profiles', async () => {
  try {
    const result = await WindowsSystemUtils.resetAllProfiles();
    return { 
      success: result.success ?? true,
      message: result.message
    };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-current-power-plan', async () => {
  try {
    const plan = await WindowsSystemUtils.getCurrentPowerPlan();
    return { success: true, powerPlan: plan };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ── SHADER CACHE MANAGEMENT ──

ipcMain.handle('get-shader-cache-locations', async () => {
  try {
    const locations = await WindowsSystemUtils.getShaderCacheLocations();
    return { success: true, locations };
  } catch (e) {
    return { success: false, error: String(e), locations: [] };
  }
});

ipcMain.handle('clean-shader-cache', async (_event, paths: string[]) => {
  const results: { path: string; status: string; message: string }[] = [];
  for (const p of paths) {
    try {
      if (fs.existsSync(p)) {
        // Check if directory is empty first
        const files = fs.readdirSync(p);
        if (files.length === 0) {
          results.push({ path: p, status: 'empty', message: 'Directory already empty' });
        } else {
          // In production, would safely delete cache files
          // For safety, we just report what would be cleaned
          results.push({ path: p, status: 'safe', message: `Would clean ${files.length} cache files` });
        }
      } else {
        results.push({ path: p, status: 'not-found', message: 'Directory does not exist' });
      }
    } catch (e) {
      results.push({ path: p, status: 'error', message: String(e) });
    }
  }
  return { success: true, results };
});

// ── CRASH ANALYSIS ──

ipcMain.handle('analyze-crash', async (_event, logText: string) => {
  try {
    const analysis = CrashAnalyzer.analyzeCrashLog(logText);
    const report = CrashAnalyzer.generateReport(analysis);
    return { success: true, analysis, report };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-event-log-crashes', async (_event, count: number = 10) => {
  try {
    const crashes = await WindowsSystemUtils.getEventLogCrashes(count);
    return { success: true, crashes };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ── DATA EXPORT ──

ipcMain.handle('export-fps-data', async () => {
  try {
    const csv = FPSMonitor.exportAsCSV();
    return { success: true, csv };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ── UTILITY FUNCTIONS ──

ipcMain.handle('check-admin-status', () => {
  return { isAdmin: WindowsSystemUtils.isRunningAsAdmin() };
});

// ─────────────────────────────────────────────────────────────────────────────
// DRIVER CHECKER HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

ipcMain.handle('get-all-drivers', async () => {
  try {
    const drivers = await DriverChecker.getAllDrivers();
    return { success: true, drivers };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('check-driver-updates', async () => {
  try {
    const updates = await DriverChecker.checkForUpdates();
    return { success: true, updates };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-driver-health', async () => {
  try {
    const health = await DriverChecker.getDriverHealth();
    return { success: true, ...health };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-driver-compatibility', async (_event, gameName: string) => {
  try {
    const compat = await DriverChecker.getCompatibilityInfo(gameName);
    return { success: true, ...compat };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('generate-driver-report', async () => {
  try {
    const report = await DriverChecker.generateReport();
    return { success: true, report };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFILE MANAGER HANDLERS
// ─────────────────────────────────────────────────────────────────────────────

ipcMain.handle('get-all-profiles', () => {
  try {
    const profiles = ProfileManager.getAllProfiles();
    return { success: true, profiles };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-profile', (_event, id: string) => {
  try {
    const profile = ProfileManager.getProfile(id);
    return { success: true, profile };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-game-profiles', (_event, gameId: string) => {
  try {
    const profiles = ProfileManager.getGameProfiles(gameId);
    return { success: true, profiles };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('create-profile', (_event, profileData: any) => {
  try {
    const profile = ProfileManager.createProfile(profileData);
    return { success: true, profile };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('update-profile', (_event, id: string, updates: any) => {
  try {
    const profile = ProfileManager.updateProfile(id, updates);
    return { success: true, profile };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('delete-profile', (_event, id: string) => {
  try {
    const deleted = ProfileManager.deleteProfile(id);
    return { success: deleted, message: deleted ? 'Profile deleted' : 'Profile not found' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('apply-profile-by-id', (_event, id: string) => {
  try {
    ProfileManager.markProfileApplied(id);
    return { success: true, message: 'Profile applied and recorded' };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('export-profile', (_event, id: string) => {
  try {
    const json = ProfileManager.exportProfile(id);
    return { success: !!json, data: json };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('import-profile', (_event, json: string) => {
  try {
    const profile = ProfileManager.importProfile(json);
    return { success: !!profile, profile };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-default-profiles', () => {
  try {
    // Default profiles - not dependent on ProfileManager instance
    const profiles = [
      {
        id: 'default-gaming',
        name: 'Balanced Gaming',
        settings: {
          cpuPriority: 'high' as const,
          powerPlan: 'high-performance' as const,
          gpuPowerLimit: 100,
          targetFps: 144,
          textureQuality: 'high' as const,
          shadowQuality: 'high' as const,
          dlssEnabled: true,
          dlssQuality: 'balanced' as const,
          rayTracingEnabled: true
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedCount: 0,
          notes: 'Default balanced gaming profile'
        }
      },
      {
        id: 'default-competitive',
        name: 'Competitive FPS',
        settings: {
          cpuPriority: 'high' as const,
          powerPlan: 'high-performance' as const,
          gpuPowerLimit: 100,
          targetFps: 240,
          textureQuality: 'medium' as const,
          shadowQuality: 'low' as const,
          dlssEnabled: true,
          dlssQuality: 'performance' as const,
          rayTracingEnabled: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedCount: 0,
          notes: 'Optimized for competitive FPS games'
        }
      },
      {
        id: 'default-power-saver',
        name: 'Power Saver',
        settings: {
          cpuPriority: 'normal' as const,
          powerPlan: 'power-saver' as const,
          gpuPowerLimit: 75,
          targetFps: 60,
          textureQuality: 'medium' as const,
          shadowQuality: 'medium' as const,
          dlssEnabled: true,
          dlssQuality: 'performance' as const,
          rayTracingEnabled: false
        },
        metadata: {
          createdAt: new Date(),
          updatedAt: new Date(),
          appliedCount: 0,
          notes: 'Battery-optimized profile for laptops'
        }
      }
    ];
    return { success: true, profiles };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});

ipcMain.handle('get-profile-statistics', () => {
  try {
    const stats = ProfileManager.getStatistics();
    return { success: true, ...stats };
  } catch (e) {
    return { success: false, error: String(e) };
  }
});
