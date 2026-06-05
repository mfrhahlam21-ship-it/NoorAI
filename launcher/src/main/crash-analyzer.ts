/**
 * Advanced Crash Analysis Module
 * Provides intelligent crash log analysis and diagnostic recommendations
 */

export interface CrashAnalysisResult {
  errorCode: string;
  errorName: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  likelyCause: string;
  immediateAction: string;
  diagnosticSteps: string[];
  systemCommands: string[];
  preventiveMeasures: string[];
  relatedIssues: string[];
  knowledgeBase: string;
}

export const ERROR_DATABASE: Record<string, Omit<CrashAnalysisResult, 'errorCode' | 'errorName'>> = {
  // DirectX/Graphics Errors
  'DXGI_ERROR_DEVICE_REMOVED': {
    severity: 'critical',
    likelyCause: 'GPU has been physically removed or driver has crashed due to unstable overclock, insufficient power, or thermal issues.',
    immediateAction: 'Disable GPU overclock immediately. Reset all GPU settings to stock values.',
    diagnosticSteps: [
      'Open MSI Afterburner and reset Core Clock and Memory Clock to 0 offset',
      'Check Event Viewer (eventvwr.msc) for GPU-related errors',
      'Run GPU memory test using MemTest86+ or similar tool',
      'Monitor GPU temperature with HWiNFO64',
      'Check PCIe power connections (6-pin/8-pin) are fully seated',
      'Update GPU BIOS if available from manufacturer'
    ],
    systemCommands: [
      'nvidia-smi -lgc 1900,1900 # Reset NVIDIA GPU clocks',
      'powercfg /change allow-thermo-throttling 1 # Enable thermal throttling',
      'Disable-Item -Path "HKLM:\\SYSTEM\\CurrentControlSet\\Services\\nvlddmkm" -Force # Unload NVIDIA driver',
      'Update-Module -Name WindowsUpdateForBusiness -Force'
    ],
    preventiveMeasures: [
      'Keep GPU power limit at 95-100% in driver control panel',
      'Ensure adequate PSU power (30% headroom for your system)',
      'Maintain GPU temperatures below 80°C during gaming',
      'Use stable, well-tested NVIDIA/AMD driver versions',
      'Disable NVIDIA/AMD Performance Overlay features',
      'Use VRM heatsinks if the GPU has exposed phases'
    ],
    relatedIssues: [
      'GPU memory corruption (bad VRAM)',
      'Unstable GPU power delivery',
      'Thermal throttling failure'
    ],
    knowledgeBase: 'https://nvidia.com/object/driver-crash-recovery'
  },

  'DXGI_ERROR_DEVICE_HUNG': {
    severity: 'high',
    likelyCause: 'GPU driver timed out responding to commands. Usually caused by an infinite rendering loop, shader compilation error, or driver bug.',
    immediateAction: 'Force-close the application. Update GPU driver to latest version.',
    diagnosticSteps: [
      'Check GPU driver version: nvidia-smi or AMD Radeon Settings',
      'Review shader compilation logs in game console',
      'Test with latest GPU driver update',
      'Reduce GPU texture detail or resolution',
      'Monitor GPU utilization with NVIDIA FrameView',
      'Check for conflicting overlay software (OBS, Discord, NVIDIA FrameView)'
    ],
    systemCommands: [
      'Update-Module -Name NVIDIA.GPU -Force',
      'Get-Service -Name nvagpu | Restart-Service # Restart NVIDIA GPU service'
    ],
    preventiveMeasures: [
      'Disable in-game overlays (Discord, Xbox Game Bar, NVIDIA FrameView)',
      'Use recommended graphics settings for your GPU',
      'Keep GPU driver up-to-date with NVIDIA GFXBench or AMD OverDrive',
      'Ensure adequate cooling for sustained performance'
    ],
    relatedIssues: [
      'Shader compilation timeout',
      'Infinite rendering loop',
      'GPU memory leak in game engine'
    ],
    knowledgeBase: 'https://docs.microsoft.com/en-us/windows/win32/direct3d12/using-directx-12-2'
  },

  'E_OUTOFMEMORY': {
    severity: 'high',
    likelyCause: 'System ran out of available memory (RAM or VRAM). Game assets exceed available GPU/system memory.',
    immediateAction: 'Close all background applications. Lower graphics texture settings.',
    diagnosticSteps: [
      'Check system RAM: wmic os get totalvisiblememorysizeSize',
      'Check available VRAM in GPU: nvidia-smi --query-gpu=memory.total,memory.used --format=csv',
      'Monitor PageFile usage during gameplay',
      'Increase virtual memory PageFile size to 1.5x RAM',
      'Disable background services and system tray applications',
      'Check for memory leaks in Event Viewer'
    ],
    systemCommands: [
      'Get-Process | Sort-Object WorkingSet -Descending | Select-Object -First 10 # Find memory hogs',
      'Set Virtual Memory PageFile to 20GB minimum',
      'tasklist /V /SortByMemory # Sort processes by memory usage'
    ],
    preventiveMeasures: [
      'Install additional system RAM (recommend 32GB minimum for modern games)',
      'Use SSD with adequate free space for virtual memory',
      'Enable hardware-accelerated GPU scheduling in Windows 11',
      'Close memory-intensive applications (Chrome, Visual Studio)',
      'Set minimum PageFile to 12288MB, maximum to 20480MB'
    ],
    relatedIssues: [
      'VRAM exhaustion (texture streaming failure)',
      'PageFile thrashing (disk thrashing)',
      'Memory leak in game engine'
    ],
    knowledgeBase: 'https://docs.microsoft.com/en-us/troubleshoot/windows-client/deployment/install-features-on-demand-side-by-side'
  },

  'VAN9001': {
    severity: 'critical',
    likelyCause: 'Riot Vanguard anti-cheat requires TPM 2.0 and UEFI Secure Boot, which are disabled or not available on your system.',
    immediateAction: 'Enter BIOS/UEFI settings and enable Secure Boot and TPM 2.0 (fTPM/PTT).',
    diagnosticSteps: [
      'Restart computer and press DEL, F2, or F12 to enter BIOS (timing varies by manufacturer)',
      'Navigate to Security settings in BIOS menu',
      'Enable Secure Boot (UEFI only, not BIOS/Legacy mode)',
      'Enable TPM 2.0: Intel PTT (Platform Trust Technology) or AMD fTPM (firmware TPM)',
      'Save and exit BIOS (usually F10)',
      'Verify TPM status: tpm.msc or powershell Get-SecureBootUEFI'
    ],
    systemCommands: [
      'powershell Get-SecureBootUEFI # Check Secure Boot status',
      'powershell Get-Tpm # Check TPM 2.0 status',
      'wmic os get lastbootuptime # Verify UEFI boot mode'
    ],
    preventiveMeasures: [
      'Ensure UEFI firmware is up-to-date from motherboard manufacturer',
      'Use Windows 11 (Windows 10 can bypass some checks)',
      'Keep TPM firmware up-to-date',
      'Do not disable security features in BIOS'
    ],
    relatedIssues: [
      'Legacy BIOS mode (requires UEFI firmware)',
      'Older motherboard without TPM 2.0 support',
      'Secure Boot disabled in BIOS'
    ],
    knowledgeBase: 'https://support.riotgames.com/hc/en-us/articles/360068112213'
  },

  // Memory Errors
  'SEGMENTATION_FAULT': {
    severity: 'critical',
    likelyCause: 'Memory access violation. Game tried to access memory address that is not allocated or is protected.',
    immediateAction: 'Update game and driver to latest versions. Verify game files via Steam.',
    diagnosticSteps: [
      'Right-click game in Steam > Properties > Local Files > Verify Integrity of Game Files',
      'Update GPU driver to absolute latest version',
      'Clear DirectX shader cache: %LocalAppData%\\NVIDIA\\GLCache',
      'Disable in-game overlays and mods',
      'Run game in compatibility mode (Windows 10, reduced colors, disabled fullscreen optimizations)',
      'Check system RAM stability with MemTest86+'
    ],
    systemCommands: [
      'Remove-Item -Path $env:LOCALAPPDATA\\NVIDIA\\* -Recurse -Force # Clear cache',
      'sfc /scannow # System File Checker scan'
    ],
    preventiveMeasures: [
      'Keep game updated to latest patch',
      'Use stable game versions (avoid beta branches)',
      'Disable community mods until issue resolved',
      'Maintain system RAM at < 80% capacity'
    ],
    relatedIssues: [
      'Corrupted game installation',
      'Faulty system RAM (run MemTest)',
      'Incompatible mod or shader'
    ],
    knowledgeBase: 'https://en.wikipedia.org/wiki/Segmentation_fault'
  },

  // Network Errors
  'CONNECTION_TIMEOUT': {
    severity: 'medium',
    likelyCause: 'Network packet loss or high latency to game servers. Router issue, ISP congestion, or firewall blocking.',
    immediateAction: 'Restart router and relaunch game. Check internet connection stability.',
    diagnosticSteps: [
      'Test ping to game servers: ping valorant.dexerto.com',
      'Run tracert to trace network path: tracert valorant.dexerto.com',
      'Check for packet loss: ping -n 100 8.8.8.8',
      'Disable VPN and proxy services',
      'Test connection on wired ethernet vs WiFi',
      'Check router log for dropped connections',
      'Verify firewall rules allow game ports'
    ],
    systemCommands: [
      'ipconfig /all # Show network configuration',
      'netstat -ano # Show active connections',
      'netsh int tcp show global # TCP optimization settings'
    ],
    preventiveMeasures: [
      'Use wired Ethernet instead of WiFi',
      'Position router closer to gaming PC',
      'Disable background downloads (Windows Update, cloud sync)',
      'Whitelist game ports in firewall',
      'Use DNS server 8.8.8.8 or 1.1.1.1'
    ],
    relatedIssues: [
      'ISP throttling or congestion',
      'Faulty router or modem',
      'VPN/proxy interference',
      'DNS resolution slowness'
    ],
    knowledgeBase: 'https://en.wikipedia.org/wiki/Computer_network#Network_applications'
  },

  // Generic fallback
  'UNKNOWN_ERROR': {
    severity: 'medium',
    likelyCause: 'Unknown error condition. Could be application crash, driver issue, or resource exhaustion.',
    immediateAction: 'Restart the game and your computer. Check for updates.',
    diagnosticSteps: [
      'Check Windows Event Viewer for error details: eventvwr.msc',
      'Review game crash logs and error reports',
      'Update all drivers: GPU, CPU chipset, audio',
      'Verify game files integrity',
      'Try launching in Safe Mode',
      'Reinstall DirectX runtime: https://support.microsoft.com/en-us/help/179113'
    ],
    systemCommands: [
      'wer querycmd # Query error reports',
      'Update-Module -Name Microsoft.PowerShell.Diagnostics'
    ],
    preventiveMeasures: [
      'Keep Windows and drivers up-to-date',
      'Maintain adequate storage space (20% free)',
      'Regular system maintenance and cleanup',
      'Disable unnecessary startup programs'
    ],
    relatedIssues: [
      'Corrupted game installation',
      'Outdated or conflicting drivers',
      'Insufficient system resources',
      'Hard drive errors'
    ],
    knowledgeBase: 'https://support.microsoft.com/en-us/windows/windows-error-codes-a'
  }
};

export class CrashAnalyzer {
  /**
   * Analyze crash log and provide diagnosis
   */
  static analyzeCrashLog(logText: string): CrashAnalysisResult {
    const lowerLog = logText.toLowerCase();

    // Check for known error codes
    for (const [errorCode, analysis] of Object.entries(ERROR_DATABASE)) {
      if (lowerLog.includes(errorCode.toLowerCase()) ||
          lowerLog.includes(errorCode.replace(/_/g, ' ').toLowerCase())) {
        return {
          errorCode,
          errorName: this.getErrorName(errorCode),
          ...analysis
        };
      }
    }

    // Pattern-based detection
    if (lowerLog.includes('out of memory') || lowerLog.includes('memory allocation')) {
      return {
        errorCode: 'E_OUTOFMEMORY',
        errorName: 'Out of Memory',
        ...ERROR_DATABASE['E_OUTOFMEMORY']
      };
    }

    if (lowerLog.includes('gpu') && (lowerLog.includes('device removed') || lowerLog.includes('device hung'))) {
      return {
        errorCode: 'DXGI_ERROR_DEVICE_REMOVED',
        errorName: 'GPU Device Removed',
        ...ERROR_DATABASE['DXGI_ERROR_DEVICE_REMOVED']
      };
    }

    if (lowerLog.includes('timeout') || lowerLog.includes('connection refused')) {
      return {
        errorCode: 'CONNECTION_TIMEOUT',
        errorName: 'Connection Timeout',
        ...ERROR_DATABASE['CONNECTION_TIMEOUT']
      };
    }

    // Default to unknown
    return {
      errorCode: 'UNKNOWN_ERROR',
      errorName: 'Unknown Error',
      ...ERROR_DATABASE['UNKNOWN_ERROR']
    };
  }

  /**
   * Get human-readable error name
   */
  private static getErrorName(errorCode: string): string {
    const names: Record<string, string> = {
      'DXGI_ERROR_DEVICE_REMOVED': 'GPU Device Removed',
      'DXGI_ERROR_DEVICE_HUNG': 'GPU Device Hung',
      'E_OUTOFMEMORY': 'Out of Memory',
      'VAN9001': 'Vanguard Security Error',
      'SEGMENTATION_FAULT': 'Segmentation Fault',
      'CONNECTION_TIMEOUT': 'Connection Timeout'
    };
    return names[errorCode] || 'Unknown Error';
  }

  /**
   * Get recommendations based on error type
   */
  static getRecommendations(errorCode: string): string[] {
    const analysis = ERROR_DATABASE[errorCode];
    if (!analysis) {
      return ERROR_DATABASE['UNKNOWN_ERROR'].diagnosticSteps;
    }
    return analysis.diagnosticSteps;
  }

  /**
   * Check system health and return potential issues
   */
  static async checkSystemHealth(): Promise<string[]> {
    const issues: string[] = [];

    // This would integrate with system monitoring
    // For now, return potential common issues
    return issues;
  }

  /**
   * Generate detailed crash report
   */
  static generateReport(analysis: CrashAnalysisResult): string {
    let report = `
╔════════════════════════════════════════════════════════════╗
║           NOORAI CRASH ANALYSIS REPORT
╚════════════════════════════════════════════════════════════╝

ERROR CODE: ${analysis.errorCode}
ERROR NAME: ${analysis.errorName}
SEVERITY: ${analysis.severity.toUpperCase()}

LIKELY CAUSE:
${analysis.likelyCause}

IMMEDIATE ACTION:
${analysis.immediateAction}

DIAGNOSTIC STEPS:
${analysis.diagnosticSteps.map((step, i) => `  ${i + 1}. ${step}`).join('\n')}

SYSTEM COMMANDS TO RUN:
${analysis.systemCommands.map(cmd => `  • ${cmd}`).join('\n')}

PREVENTIVE MEASURES:
${analysis.preventiveMeasures.map(measure => `  • ${measure}`).join('\n')}

RELATED ISSUES:
${analysis.relatedIssues.map(issue => `  • ${issue}`).join('\n')}

KNOWLEDGE BASE: ${analysis.knowledgeBase}

Generated by NoorAI Launcher - ${new Date().toISOString()}
`;
    return report;
  }
}

export default CrashAnalyzer;
