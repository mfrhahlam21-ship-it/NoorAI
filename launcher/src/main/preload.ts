import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('noorai', {
  // System Information
  getSystemInfo: () => ipcRenderer.invoke('get-system-info'),
  getAdvancedMetrics: () => ipcRenderer.invoke('get-advanced-metrics'),
  getBatteryStatus: () => ipcRenderer.invoke('get-battery-status'),

  // Game Detection
  scanGames: () => ipcRenderer.invoke('scan-games'),
  scanGamesDetailed: () => ipcRenderer.invoke('scan-games-detailed'),
  getRunningGames: () => ipcRenderer.invoke('get-running-games'),
  checkGameRunning: (gameName: string) => ipcRenderer.invoke('check-game-running', gameName),

  // Drivers
  checkDrivers: () => ipcRenderer.invoke('check-drivers'),
  getDriverDetails: (type: string) => ipcRenderer.invoke('get-driver-details', type),
  getAllDrivers: () => ipcRenderer.invoke('get-all-drivers'),
  checkDriverUpdates: () => ipcRenderer.invoke('check-driver-updates'),
  getDriverHealth: () => ipcRenderer.invoke('get-driver-health'),
  getDriverCompatibility: (gameName: string) => ipcRenderer.invoke('get-driver-compatibility', gameName),
  generateDriverReport: () => ipcRenderer.invoke('generate-driver-report'),

  // FPS Monitoring
  startFpsMonitoring: (gameId: string, gameName: string) => 
    ipcRenderer.invoke('start-fps-monitoring', gameId, gameName),
  stopFpsMonitoring: () => ipcRenderer.invoke('stop-fps-monitoring'),
  getFPS: () => ipcRenderer.invoke('get-fps'),
  getFPSHistory: () => ipcRenderer.invoke('get-fps-history'),
  getGamePerformanceStats: (gameId: string) => 
    ipcRenderer.invoke('get-game-performance-stats', gameId),

  // Smart Profiles
  applyProfile: (profileName: string) => ipcRenderer.invoke('apply-profile', profileName),
  resetProfiles: () => ipcRenderer.invoke('reset-profiles'),
  getCurrentPowerPlan: () => ipcRenderer.invoke('get-current-power-plan'),

  // Profile Management
  getAllProfiles: () => ipcRenderer.invoke('get-all-profiles'),
  getProfile: (id: string) => ipcRenderer.invoke('get-profile', id),
  getGameProfiles: (gameId: string) => ipcRenderer.invoke('get-game-profiles', gameId),
  createProfile: (data: any) => ipcRenderer.invoke('create-profile', data),
  updateProfile: (id: string, updates: any) => ipcRenderer.invoke('update-profile', id, updates),
  deleteProfile: (id: string) => ipcRenderer.invoke('delete-profile', id),
  applyCustomProfile: (id: string) => ipcRenderer.invoke('apply-profile', id),
  exportProfile: (id: string) => ipcRenderer.invoke('export-profile', id),
  importProfile: (json: string) => ipcRenderer.invoke('import-profile', json),
  getDefaultProfiles: () => ipcRenderer.invoke('get-default-profiles'),
  getProfileStatistics: () => ipcRenderer.invoke('get-profile-statistics'),

  // Shader Cache
  getShaderCacheLocations: () => ipcRenderer.invoke('get-shader-cache-locations'),
  cleanShaderCache: (paths: string[]) => ipcRenderer.invoke('clean-shader-cache', paths),

  // Crash Analysis
  analyzeCrash: (text: string) => ipcRenderer.invoke('analyze-crash', text),
  getEventLogCrashes: (count?: number) => ipcRenderer.invoke('get-event-log-crashes', count),

  // Data Export
  exportFpsData: () => ipcRenderer.invoke('export-fps-data'),

  // Utility
  checkAdminStatus: () => ipcRenderer.invoke('check-admin-status')
});

declare global {
  interface Window { noorai: any }
}
