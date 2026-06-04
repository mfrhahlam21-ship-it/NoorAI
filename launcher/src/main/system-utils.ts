/**
 * Windows System Integration Utilities
 * Provides OS-level functions for power management, process control, and monitoring
 */

import { execSync } from 'child_process';
import { exec } from 'child_process';
import { promisify } from 'util';
import si from 'systeminformation';
import os from 'os';

const execAsync = promisify(exec);

export class WindowsSystemUtils {
  /**
   * Get battery status for laptop detection
   */
  static async getBatteryStatus() {
    try {
      const battery = await si.battery();
      return {
        hasBattery: battery.hasBattery,
        isCharging: battery.isCharging,
        percent: battery.percent,
        timeLeft: battery.timeRemaining,
        type: battery.type || 'Unknown'
      };
    } catch (e) {
      return { hasBattery: false, error: String(e) };
    }
  }

  /**
   * Get list of running processes
   */
  static async getRunningProcesses() {
    try {
      const processes = await si.processes();
      return processes.list.map((p: any) => ({
        pid: p.pid,
        name: p.name,
        command: p.command,
        cpuUsage: p.cpu || 0,
        memUsage: p.memory || 0
      }));
    } catch (e) {
      console.error('Error getting processes:', e);
      return [];
    }
  }

  /**
   * Check if specific game is running
   */
  static async isGameRunning(gameName: string) {
    try {
      const processes = await this.getRunningProcesses();
      const gameProcess = processes.find(p => 
        p.name.toLowerCase().includes(gameName.toLowerCase()) ||
        p.command.toLowerCase().includes(gameName.toLowerCase())
      );
      return gameProcess ? { running: true, pid: gameProcess.pid, name: gameProcess.name } : { running: false };
    } catch (e) {
      return { running: false, error: String(e) };
    }
  }

  /**
   * Get all running games from common game process names
   */
  static async getRunningGames() {
    const commonGameProcesses = [
      'valorant.exe', 'r5apex.exe', 'cod.exe', 'cs2.exe', 
      'FortniteClient-Win64-Shipping.exe', 'Cyberpunk2077.exe',
      'Overwatch.exe', 'diablo4.exe', 'wow.exe', 'gta5.exe',
      'elden ring.exe', 'starfield.exe', 'baldurs_gate_3.exe'
    ];

    try {
      const processes = await this.getRunningProcesses();
      const runningGames = [];

      for (const gameName of commonGameProcesses) {
        const gameProcess = processes.find(p => 
          p.name.toLowerCase() === gameName.toLowerCase()
        );
        if (gameProcess) {
          runningGames.push({
            name: gameName,
            pid: gameProcess.pid,
            cpuUsage: gameProcess.cpuUsage,
            memUsage: gameProcess.memUsage
          });
        }
      }

      return runningGames;
    } catch (e) {
      console.error('Error getting running games:', e);
      return [];
    }
  }

  /**
   * Get comprehensive CPU metrics
   */
  static async getCPUMetrics() {
    try {
      const cpuUsage = await si.currentLoad();
      const cpuTemp = await si.cpuTemperature();
      const cpu = await si.cpu();

      return {
        usage: cpuUsage.currentLoad,
        loadUser: cpuUsage.currentLoadUser,
        loadSystem: cpuUsage.currentLoadSystem,
        coreUsages: cpuUsage.cpus.map(c => c.load),
        temperature: cpuTemp.main || 0,
        model: cpu.brand || 'Unknown',
        cores: cpu.cores,
        speed: cpu.speed
      };
    } catch (e) {
      console.error('Error getting CPU metrics:', e);
      return { usage: 0, error: String(e) };
    }
  }

  /**
   * Get comprehensive GPU metrics
   */
  static async getGPUMetrics() {
    try {
      const graphics = await si.graphics();

      if (graphics.controllers && graphics.controllers.length > 0) {
        const gpu = graphics.controllers[0];
        return {
          name: gpu.name,
          vendor: gpu.vendor,
          vram: gpu.vram,
          driverVersion: gpu.driverVersion,
          model: gpu.model,
          memory: gpu.memoryUsed || 0,
          temperature: 0 // Temperature not available in systeminformation
        };
      }
      return { error: 'No GPU found' };
    } catch (e) {
      console.error('Error getting GPU metrics:', e);
      return { error: String(e) };
    }
  }

  /**
   * Get memory metrics
   */
  static async getMemoryMetrics() {
    try {
      const mem = await si.mem();
      return {
        total: mem.total,
        used: mem.used,
        free: mem.free,
        available: mem.available,
        usagePercent: (mem.used / mem.total) * 100,
        swapTotal: mem.swaptotal,
        swapUsed: mem.swapused,
        swapPercent: mem.swaptotal > 0 ? (mem.swapused / mem.swaptotal) * 100 : 0
      };
    } catch (e) {
      console.error('Error getting memory metrics:', e);
      return { error: String(e) };
    }
  }

  /**
   * Apply Smart Profile - Game Mode (maximum performance)
   */
  static async applyGameModeProfile() {
    try {
      const results = [];

      // Set power plan to High Performance
      try {
        execSync('powercfg /setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c', { stdio: 'pipe' });
        results.push({ action: 'Power Plan', status: 'success', detail: 'Set to High Performance' });
      } catch (e) {
        results.push({ action: 'Power Plan', status: 'error', detail: String(e) });
      }

      // Enable GPU performance mode via registry
      try {
        execSync('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm" /v EnableUltraPowerSaving /t REG_DWORD /d 0 /f', { stdio: 'pipe' });
        results.push({ action: 'GPU Power Saving', status: 'success', detail: 'Disabled ultra power saving' });
      } catch (e) {
        results.push({ action: 'GPU Power Saving', status: 'error', detail: String(e) });
      }

      // Set process priority boost
      try {
        execSync('powercfg /change allow-thermo-throttling 0', { stdio: 'pipe' });
        results.push({ action: 'Thermal Throttling', status: 'success', detail: 'Disabled' });
      } catch (e) {
        results.push({ action: 'Thermal Throttling', status: 'note', detail: 'Command may require additional permissions' });
      }

      return { success: true, profile: 'GameMode', results };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  /**
   * Apply Smart Profile - Low Latency
   */
  static async applyLowLatencyProfile() {
    try {
      const results = [];

      // Disable network throttling
      try {
        execSync('netsh int tcp set global autotuninglevel=normal', { stdio: 'pipe' });
        results.push({ action: 'Network Tuning', status: 'success', detail: 'Auto-tuning set to normal' });
      } catch (e) {
        results.push({ action: 'Network Tuning', status: 'error', detail: String(e) });
      }

      // Enable TCP Nagle optimization
      try {
        execSync('netsh int tcp set global nagleenable=disabled', { stdio: 'pipe' });
        results.push({ action: 'TCP Nagle', status: 'success', detail: 'Disabled for low latency' });
      } catch (e) {
        results.push({ action: 'TCP Nagle', status: 'error', detail: String(e) });
      }

      // Set high priority for processes
      try {
        execSync('wmic process where name="explorer.exe" call setpriority 16384', { stdio: 'pipe' });
        results.push({ action: 'Explorer Priority', status: 'success', detail: 'Set to low' });
      } catch (e) {
        results.push({ action: 'Explorer Priority', status: 'note', detail: String(e) });
      }

      return { success: true, profile: 'LowLatency', results };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  /**
   * Apply Smart Profile - Thermal Safe
   */
  static async applyThermalSafeProfile() {
    try {
      const results = [];

      // Set power plan to Balanced
      try {
        execSync('powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e', { stdio: 'pipe' });
        results.push({ action: 'Power Plan', status: 'success', detail: 'Set to Balanced' });
      } catch (e) {
        results.push({ action: 'Power Plan', status: 'error', detail: String(e) });
      }

      // Reduce CPU frequency
      try {
        execSync('powercfg /change processor-throttle-percent 75', { stdio: 'pipe' });
        results.push({ action: 'CPU Throttle', status: 'success', detail: 'Set to 75%' });
      } catch (e) {
        results.push({ action: 'CPU Throttle', status: 'note', detail: String(e) });
      }

      // Enable GPU undervolting via registry
      try {
        execSync('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm" /v EnableUltraPowerSaving /t REG_DWORD /d 1 /f', { stdio: 'pipe' });
        results.push({ action: 'GPU Power Saving', status: 'success', detail: 'Enabled' });
      } catch (e) {
        results.push({ action: 'GPU Power Saving', status: 'error', detail: String(e) });
      }

      return { success: true, profile: 'ThermalSafe', results };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  /**
   * Apply Smart Profile - Laptop Mode
   */
  static async applyLaptopModeProfile() {
    try {
      const results = [];

      // Set power plan to Power Saver
      try {
        execSync('powercfg /setactive a1841308-3541-4fab-bc81-f71556f20b4a', { stdio: 'pipe' });
        results.push({ action: 'Power Plan', status: 'success', detail: 'Set to Power Saver' });
      } catch (e) {
        results.push({ action: 'Power Plan', status: 'error', detail: String(e) });
      }

      // Reduce screen brightness
      try {
        execSync('powercfg /change monitor-timeout-ac 5', { stdio: 'pipe' });
        results.push({ action: 'Monitor Timeout', status: 'success', detail: 'Set to 5 minutes' });
      } catch (e) {
        results.push({ action: 'Monitor Timeout', status: 'note', detail: String(e) });
      }

      // Reduce GPU frequency
      try {
        execSync('reg add "HKLM\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm" /v EnableUltraPowerSaving /t REG_DWORD /d 2 /f', { stdio: 'pipe' });
        results.push({ action: 'GPU Power Mode', status: 'success', detail: 'Set to battery optimized' });
      } catch (e) {
        results.push({ action: 'GPU Power Mode', status: 'error', detail: String(e) });
      }

      return { success: true, profile: 'LaptopMode', results };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  /**
   * Reset all profiles to defaults
   */
  static async resetAllProfiles() {
    try {
      // Set power plan to Balanced (default)
      execSync('powercfg /setactive 381b4222-f694-41f0-9685-ff5bb260df2e', { stdio: 'pipe' });
      return { success: true, message: 'All profiles reset to defaults' };
    } catch (e) {
      return { success: false, error: String(e) };
    }
  }

  /**
   * Get current power plan
   */
  static async getCurrentPowerPlan() {
    try {
      const result = execSync('powercfg /getactivescheme', { encoding: 'utf-8' });
      return result.includes('High Performance') ? 'High Performance' : 
             result.includes('Power Saver') ? 'Power Saver' : 'Balanced';
    } catch (e) {
      return 'Unknown';
    }
  }

  /**
   * Detect and return shader cache locations
   */
  static async getShaderCacheLocations() {
    const username = os.userInfo().username;
    const cacheLocations = [
      `C:\\Users\\${username}\\AppData\\Local\\NVIDIA\\DXCache`,
      `C:\\Users\\${username}\\AppData\\Local\\AMD\\DxCache`,
      `C:\\Users\\${username}\\AppData\\Local\\Intel\\DxCache`,
      `C:\\Users\\${username}\\AppData\\Local\\NVIDIA\\GLCache`,
      `C:\\Users\\${username}\\AppData\\Roaming\\NVIDIA\\DXCache`
    ];

    return cacheLocations;
  }

  /**
   * Get detailed driver information
   */
  static async getDetailedDriverInfo() {
    try {
      const graphics = await si.graphics();
      const osInfo = await si.osInfo();

      const drivers = {
        gpu: graphics.controllers?.map(c => ({
          name: c.name,
          vendor: c.vendor,
          vram: c.vram,
          driverVersion: c.driverVersion,
          model: c.model
        })) || [],
        os: osInfo.distro,
        build: osInfo.build
      };

      return drivers;
    } catch (e) {
      console.error('Error getting driver info:', e);
      return { error: String(e) };
    }
  }

  /**
   * Check if running as administrator
   */
  static isRunningAsAdmin(): boolean {
    try {
      execSync('net session', { stdio: 'pipe' });
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get Windows Event Log entries
   */
  static async getEventLogCrashes(count: number = 10) {
    try {
      const result = execSync(
        `wevtutil qe Application /c:${count} /rd:true /f:xml /q:"*[System[EventID=1000 or EventID=1001]]"`,
        { encoding: 'utf-8', stdio: 'pipe' }
      );
      return result;
    } catch (e) {
      return { error: String(e) };
    }
  }
}

export default WindowsSystemUtils;
