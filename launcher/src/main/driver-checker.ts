/**
 * Driver Checker Module
 * Manages driver detection, version tracking, and compatibility checking
 */

import si from 'systeminformation';
import { execSync } from 'child_process';

export interface DriverInfo {
  type: 'GPU' | 'CPU' | 'Audio' | 'Network' | 'Chipset';
  name: string;
  currentVersion: string;
  latestVersion?: string;
  status: 'up-to-date' | 'outdated' | 'unknown';
  manufacturer?: string;
  releaseDate?: Date;
  lastChecked: Date;
}

// Known driver versions database
const DRIVER_VERSION_DB: Record<string, { latest: string; recommended: string; issues: string[] }> = {
  'NVIDIA RTX': {
    latest: '551.86',
    recommended: '551.23',
    issues: [
      '546.xx - High temperature issues',
      '548.xx - Shader compilation crashes'
    ]
  },
  'AMD Radeon': {
    latest: '24.4.1',
    recommended: '24.1.1',
    issues: [
      '23.12.x - VRAM stability issues',
      '24.2.x - Power delivery problems'
    ]
  },
  'Intel Arc': {
    latest: '101.4612',
    recommended: '101.4100',
    issues: [
      '101.3xxx - DPC Latency spikes'
    ]
  }
};

export class DriverChecker {
  /**
   * Get all driver information
   */
  static async getAllDrivers(): Promise<DriverInfo[]> {
    const drivers: DriverInfo[] = [];

    try {
      // GPU drivers
      const gpuDrivers = await this.getGPUDrivers();
      drivers.push(...gpuDrivers);
    } catch (e) {
      console.error('Error getting GPU drivers:', e);
    }

    try {
      // Audio drivers
      const audioDrivers = await this.getAudioDrivers();
      drivers.push(...audioDrivers);
    } catch (e) {
      console.error('Error getting audio drivers:', e);
    }

    try {
      // Network drivers
      const networkDrivers = await this.getNetworkDrivers();
      drivers.push(...networkDrivers);
    } catch (e) {
      console.error('Error getting network drivers:', e);
    }

    return drivers;
  }

  /**
   * Get GPU drivers
   */
  private static async getGPUDrivers(): Promise<DriverInfo[]> {
    const graphics = await si.graphics();
    const drivers: DriverInfo[] = [];

    if (graphics.controllers && graphics.controllers.length > 0) {
      for (const gpu of graphics.controllers) {
        const vendor = gpu.vendor || '';
        const name = gpu.name || 'Unknown GPU';
        const version = gpu.driverVersion || 'Unknown';

        let status: 'up-to-date' | 'outdated' | 'unknown' = 'unknown';
        let latestVersion: string | undefined;

        // Check against known versions
        for (const [dbKey, dbInfo] of Object.entries(DRIVER_VERSION_DB)) {
          if (name.includes(dbKey)) {
            latestVersion = dbInfo.latest;
            // Simple version comparison (in production, use semantic versioning)
            status = version < dbInfo.recommended ? 'outdated' : 'up-to-date';
            break;
          }
        }

        drivers.push({
          type: 'GPU',
          name,
          currentVersion: version,
          latestVersion,
          status,
          manufacturer: vendor,
          lastChecked: new Date()
        });
      }
    }

    return drivers;
  }

  /**
   * Get audio drivers
   */
  private static async getAudioDrivers(): Promise<DriverInfo[]> {
    try {
      const audio = await si.audio();
      return audio.map(device => ({
        type: 'Audio',
        name: device.name || 'Unknown Audio Device',
        currentVersion: device.driver || 'Unknown',
        status: 'unknown' as const,
        lastChecked: new Date()
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Get network drivers
   */
  private static async getNetworkDrivers(): Promise<DriverInfo[]> {
    try {
      const net = await si.networkInterfaces();
      return net.map(nic => ({
        type: 'Network',
        name: nic.ifaceName,
        currentVersion: nic.type || 'Unknown',
        status: 'unknown' as const,
        lastChecked: new Date()
      }));
    } catch (e) {
      return [];
    }
  }

  /**
   * Check for driver updates via web
   */
  static async checkForUpdates(): Promise<DriverInfo[]> {
    // In production, would check manufacturer websites
    // For now, return simulated updates
    const drivers = await this.getAllDrivers();
    return drivers.map(driver => ({
      ...driver,
      lastChecked: new Date()
    }));
  }

  /**
   * Get driver health status
   */
  static async getDriverHealth(): Promise<{ overall: 'healthy' | 'warning' | 'critical'; issues: string[] }> {
    const issues: string[] = [];
    const drivers = await this.getAllDrivers();

    for (const driver of drivers) {
      if (driver.status === 'outdated') {
        issues.push(`${driver.name}: Outdated driver version ${driver.currentVersion}, recommend updating to ${driver.latestVersion}`);
      }

      // Check for known problematic versions
      for (const [gpuName, versionInfo] of Object.entries(DRIVER_VERSION_DB)) {
        if (driver.name.includes(gpuName)) {
          for (const badVersion of versionInfo.issues) {
            if (driver.currentVersion.includes(badVersion.split(' ')[0])) {
              issues.push(`${driver.name}: Known issue with version ${badVersion}`);
            }
          }
        }
      }
    }

    let overall: 'healthy' | 'warning' | 'critical' = 'healthy';
    if (issues.length > 0) overall = 'warning';
    if (issues.length > 3) overall = 'critical';

    return { overall, issues };
  }

  /**
   * Get driver compatibility info
   */
  static async getCompatibilityInfo(gameName: string): Promise<{ compatible: boolean; recommendations: string[] }> {
    const drivers = await this.getAllDrivers();
    const recommendations: string[] = [];
    let compatible = true;

    // Check GPU driver for known game compatibility
    const gpuDriver = drivers.find(d => d.type === 'GPU');
    if (gpuDriver) {
      if (gpuDriver.status === 'outdated') {
        compatible = false;
        recommendations.push(`Update ${gpuDriver.name} driver to ${gpuDriver.latestVersion}`);
      }

      // Game-specific recommendations
      if (gameName.toLowerCase().includes('baldur') || gameName.toLowerCase().includes('starfield')) {
        if (gpuDriver.name.includes('RTX 30')) {
          recommendations.push('Enable DLSS 3.5 Frame Generation for maximum FPS');
        }
        if (gpuDriver.name.includes('AMD')) {
          recommendations.push('Enable FSR 3 for improved performance');
        }
      }
    }

    return { compatible, recommendations };
  }

  /**
   * Export driver report
   */
  static async generateReport(): Promise<string> {
    const health = await this.getDriverHealth();
    const drivers = await this.getAllDrivers();

    let report = `
╔════════════════════════════════════════════════════════════╗
║              NOORAI DRIVER HEALTH REPORT
╚════════════════════════════════════════════════════════════╝

OVERALL STATUS: ${health.overall.toUpperCase()}
Last Checked: ${new Date().toISOString()}

DRIVER INVENTORY:
`;

    for (const driver of drivers) {
      report += `
  ${driver.type}
    Name: ${driver.name}
    Current: v${driver.currentVersion}
    Latest: v${driver.latestVersion || 'Unknown'}
    Status: ${driver.status}
`;
    }

    if (health.issues.length > 0) {
      report += `
ISSUES DETECTED:
${health.issues.map(issue => `  ⚠️  ${issue}`).join('\n')}
`;
    } else {
      report += `
✅ All drivers are in good health!
`;
    }

    return report;
  }

  /**
   * Get Windows system info relevant to drivers
   */
  static async getWindowsInfo() {
    try {
      const osInfo = await si.osInfo();
      return {
        platform: osInfo.platform,
        distro: osInfo.distro,
        release: osInfo.release,
        build: osInfo.build,
        arch: osInfo.arch
      };
    } catch (e) {
      return { error: String(e) };
    }
  }
}

export default DriverChecker;
