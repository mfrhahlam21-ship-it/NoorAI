import { Game, CrashLogTemplate } from './types';

export const INITIAL_GAMES: Game[] = [
  {
    id: 'cod-mw3',
    name: 'Call of Duty: Modern Warfare III',
    genre: 'تصويب / شوتر',
    icon: '🎯',
    isOptimized: false,
    baseFps: 85,
    optimizedFps: 118,
    exePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Call of Duty\\cod.exe'
  },
  {
    id: 'valorant',
    name: 'Valorant',
    genre: 'تكتيكي / شوتر',
    icon: '🔥',
    isOptimized: false,
    baseFps: 160,
    optimizedFps: 240,
    exePath: 'C:\\Riot Games\\VALORANT\\live\\ShooterGame\\Binaries\\Win64\\VALORANT-Win64-Shipping.exe'
  },
  {
    id: 'cyberpunk',
    name: 'Cyberpunk 2077',
    genre: 'أكشن / تقمص أدوار',
    icon: '🌃',
    isOptimized: false,
    baseFps: 48,
    optimizedFps: 72,
    exePath: 'D:\\Games\\Cyberpunk 2077\\bin\\x64\\Cyberpunk2077.exe'
  },
  {
    id: 'apex-legends',
    name: 'Apex Legends',
    genre: 'باتل رويال',
    icon: '⚡',
    isOptimized: false,
    baseFps: 110,
    optimizedFps: 144,
    exePath: 'C:\\Program Files\\EA Games\\Apex\\r5apex.exe'
  },
  {
    id: 'cs2',
    name: 'Counter-Strike 2',
    genre: 'تصويب',
    icon: '💣',
    isOptimized: false,
    baseFps: 140,
    optimizedFps: 195,
    exePath: 'C:\\Program Files (x86)\\Steam\\steamapps\\common\\Counter-Strike 2\\game\\bin\\win64\\cs2.exe'
  },
  {
    id: 'fortnite',
    name: 'Fortnite',
    genre: 'باتل رويال',
    icon: '🏰',
    isOptimized: false,
    baseFps: 90,
    optimizedFps: 130,
    exePath: 'C:\\Epic Games\\Fortnite\\FortniteGame\\Binaries\\Win64\\FortniteClient-Win64-Shipping.exe'
  }
];

export const CRASH_LOG_TEMPLATES: CrashLogTemplate[] = [
  {
    id: 'apex-dxgi',
    gameName: 'Apex Legends',
    errorTitle: 'انهيار DXGI_ERROR_DEVICE_REMOVED',
    rawLog: `[Apex Crash Log]
Date: 2026-05-24 18:22:10
Exception: 0x887A0006 - DXGI_ERROR_DEVICE_REMOVED
The video card has been physically removed, or a driver upgrade has occurred.
GPU: NVIDIA GeForce RTX 3070 (Driver: 551.23)
Module: r5apex.exe+0x0000000000df1240
Notes: Occurred mid-fight in Fragment East. Screen froze for 3 seconds before crashing to desktop.`
  },
  {
    id: 'val-tpmsb',
    gameName: 'Valorant',
    errorTitle: 'خطأ روت فارد VAN9001 - Secure Boot & TPM',
    rawLog: `[Riot Vanguard Boot-Up Diagnostic]
Critical Error: Code VAN9001
Message: This build of Vanguard requires TPM version 2.0 and secure boot to be enabled in order to play.
OS: Windows 11 Build 22621
TPM Detect: Capable (Processor trust) | State: DISABLED (BIOS)
Secure Boot: State: DISABLED (BIOS / Setup Mode)
Vanguard process terminated with code 1`
  },
  {
    id: 'cod-memory',
    gameName: 'DirectX / Call of Duty',
    errorTitle: 'انفجار الذاكرة الرسومية VRAM Out of Memory',
    rawLog: `[D3D12 GPU Allocation Failure]
Application: cod.exe (Modern Warfare III)
API: DirectX 12 (Feature Level 12_1)
Error: Out of video memory trying to allocate a rendering resource.
VRAM Requested: 1845 MB (Total Available: 8192 MB, Committed: 8110 MB)
OS PageFile thrashing detected. Render Thread stalled.`
  },
  {
    id: 'generic-stutter',
    gameName: 'سجل عام لتقطيع اللعبة',
    errorTitle: 'فريم تايم غير مستقر وتقطعات (Lag & Stutter)',
    rawLog: `[System Latency Monitor Log]
CPU Frametime: spikes up to 45.2ms
GPU Frametime: average 6.1ms (GPU bottleneck: NO)
CPU bottleneck detected. Core #0 at 100% capacity.
DPC Latency: dxgkrnl.sys (1320us limit exceeded), ndis.sys (820us)
Background tasks stealing resources: SearchIndexer.exe (7.2%), Chrome.exe (12%)`
  }
];
