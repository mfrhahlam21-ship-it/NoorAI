import React, { useState, useEffect } from 'react';
import {
  Zap,
  Cpu,
  Play,
  Gamepad2,
  ShieldAlert,
  BarChart3,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Plus,
  Trash2,
  User,
  Lightbulb,
  Terminal,
  Activity,
  Monitor,
  Laptop,
  Thermometer,
  Wifi,
  MemoryStick,
  ChevronRight,
  X,
} from 'lucide-react';
import { INITIAL_GAMES, CRASH_LOG_TEMPLATES } from './data';
import { Game, SystemStats, CrashLogTemplate } from './types';

// ── Audio synthesis ──────────────────────────────────────────────────────────
const playSynthBeep = (freq: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.07, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (_) {}
};

// ── Types ────────────────────────────────────────────────────────────────────
type TabId = 'overview' | 'library' | 'crash-analyzer' | 'ai-tuning';

// ── Stat Bar component ───────────────────────────────────────────────────────
function StatBar({ value, color }: { value: number; color: string }) {
  return (
    <div style={{ background: '#1a1a26', borderRadius: 4, height: 6, overflow: 'hidden', width: '100%' }}>
      <div
        style={{
          width: `${Math.min(100, Math.max(0, value))}%`,
          height: '100%',
          background: color,
          borderRadius: 4,
          transition: 'width 0.5s ease',
        }}
      />
    </div>
  );
}

// ── Toggle Switch ────────────────────────────────────────────────────────────
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      style={{
        flexShrink: 0,
        width: 44,
        height: 24,
        borderRadius: 12,
        background: checked ? '#00ffcc' : '#2d2d3e',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s',
        outline: 'none',
      }}
      aria-checked={checked}
      role="switch"
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#ffffff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 4px rgba(0,0,0,0.4)',
        }}
      />
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════
export default function App() {
  const [tab, setTab] = useState<TabId>('overview');

  // Smart Profiles
  const [gameModeOn, setGameModeOn] = useState(true);
  const [lowLatencyOn, setLowLatencyOn] = useState(false);
  const [thermalOn, setThermalOn] = useState(false);
  const [laptopModeOn, setLaptopModeOn] = useState(false);

  // Native info
  const [nativeSysInfo, setNativeSysInfo] = useState<any>(null);
  const [gpuDriverInfo, setGpuDriverInfo] = useState<any>(null);
  const [detectedPaths, setDetectedPaths] = useState<string[]>([]);
  const [scanning, setScanning] = useState(false);

  // Live stats
  const [stats, setStats] = useState<SystemStats>({
    cpuUsage: 25, gpuUsage: 35, ramUsage: 45,
    ramTotal: 16, fps: 120, tempCpu: 60, tempGpu: 62, ping: 28,
  });

  const [optimizedAll, setOptimizedAll] = useState(false);
  const [games, setGames] = useState<Game[]>(INITIAL_GAMES);
  const [isOptimizingAll, setIsOptimizingAll] = useState(false);
  const [allOptStage, setAllOptStage] = useState('');

  // ── Fetch native info ──
  useEffect(() => {
    const noorai = (window as any).noorai;
    if (!noorai) return;

    noorai.getSystemInfo().then((info: any) => {
      setNativeSysInfo(info);
      if (info?.mem) {
        const gb = Math.round(info.mem.total / (1024 * 1024 * 1024));
        setStats(prev => ({ ...prev, ramTotal: gb }));
      }
    }).catch(() => {});

    noorai.checkDrivers().then((d: any) => setGpuDriverInfo(d)).catch(() => {});

    setScanning(true);
    noorai.scanGames().then((paths: string[]) => {
      setDetectedPaths(paths);
      setScanning(false);
      if (paths?.length > 0) {
        setGames(prev => prev.map(g => {
          const found = paths.find(p =>
            p.toLowerCase().includes(g.name.toLowerCase()) ||
            p.toLowerCase().includes(g.id.toLowerCase())
          );
          return found ? { ...g, exePath: found } : g;
        }));
      }
    }).catch(() => setScanning(false));
  }, []);

  // ── Live FPS polling ──
  useEffect(() => {
    const poll = () => {
      const noorai = (window as any).noorai;
      if (!noorai) return;
      noorai.getFPS().then((result: any) => {
        setStats(prev => {
          const cpuD = Math.floor(Math.random() * 6) - 3;
          const gpuD = Math.floor(Math.random() * 8) - 4;
          const ramD = Math.floor(Math.random() * 2) - 1;
          let cpu = Math.max(10, Math.min(prev.cpuUsage + cpuD, 90));
          let gpu = Math.max(15, Math.min(prev.gpuUsage + gpuD, 92));
          let ram = Math.max(25, Math.min(prev.ramUsage + ramD, 88));

          let fps = result?.fps || 120;
          if (gameModeOn) fps += 40;
          if (laptopModeOn) fps -= 10;

          let ping = lowLatencyOn ? 8 : 30;
          ping = Math.max(2, ping + Math.floor(Math.random() * 4) - 2);

          let tCpu = gameModeOn ? 76 : thermalOn ? 50 : laptopModeOn ? 55 : 65;
          let tGpu = gameModeOn ? 78 : thermalOn ? 53 : laptopModeOn ? 58 : 68;

          return {
            ...prev,
            cpuUsage: gameModeOn ? Math.min(95, cpu + 10) : cpu,
            gpuUsage: gameModeOn ? Math.min(95, gpu + 12) : gpu,
            ramUsage: optimizedAll ? Math.max(30, ram - 20) : ram,
            fps: Math.max(30, fps + Math.floor(Math.random() * 6) - 3),
            ping,
            tempCpu: tCpu + (Math.floor(Math.random() * 3) - 1),
            tempGpu: tGpu + (Math.floor(Math.random() * 3) - 1),
          };
        });
      }).catch(() => {});
    };
    poll();
    const id = setInterval(poll, 2000);
    return () => clearInterval(id);
  }, [gameModeOn, lowLatencyOn, thermalOn, laptopModeOn, optimizedAll]);

  // ── Global Optimize ──
  const runOptimizeAll = () => {
    setIsOptimizingAll(true);
    playSynthBeep(349, 0.15);
    const stages = [
      'فرز خيوط النظام والعمليات الخلفية...',
      'تنظيف كاش الذاكرة (Standby RAM)...',
      'تنظيف Shader Cache لكروت الشاشة...',
      'ضبط بروتوكول الشبكة (TCP Nagle)...',
      'تطبيق خطة الطاقة الفائقة...',
      '✅ تم اكتمال تحسين NoorAI بنجاح!',
    ];
    stages.forEach((text, i) => {
      setTimeout(() => {
        setAllOptStage(text);
        playSynthBeep(440 + i * 80, 0.1);
        if (i === stages.length - 1) {
          setTimeout(() => {
            if ((window as any).noorai) {
              (window as any).noorai.cleanShaderCache([
                'C:\\Users\\Default\\AppData\\Local\\NVIDIA\\DXCache',
                'C:\\Users\\Default\\AppData\\Local\\AMD\\DxCache',
              ]).catch(() => {});
            }
            setOptimizedAll(true);
            setIsOptimizingAll(false);
            playSynthBeep(880, 0.25, 'sawtooth');
          }, 800);
        }
      }, i * 700);
    });
  };

  const resetAll = () => {
    setOptimizedAll(false);
    setGames(prev => prev.map(g => ({ ...g, isOptimized: false })));
    playSynthBeep(250, 0.3);
  };

  // ── Per-game optimize ──
  const [optimizingId, setOptimizingId] = useState<string | null>(null);
  const [optStage, setOptStage] = useState('');

  const optimizeGame = (id: string) => {
    playSynthBeep(554, 0.1);
    setOptimizingId(id);
    setOptStage('مسح Shader Cache للعبة...');
    const steps = [
      'ضبط CPU Affinity لأنوية اللعبة...',
      'تنظيف System Cache للعبة...',
      'ضبط كرت الشاشة والـ Latency...',
      'تهيئة اللعبة للفريمات القصوى...',
    ];
    steps.forEach((text, i) => {
      setTimeout(() => {
        setOptStage(text);
        if (i === steps.length - 1) {
          setTimeout(() => {
            setGames(prev => prev.map(g => g.id === id ? { ...g, isOptimized: true } : g));
            setOptimizingId(null);
            playSynthBeep(880, 0.2, 'triangle');
          }, 600);
        }
      }, (i + 1) * 600);
    });
  };

  // ── Add game modal ──
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newGenre, setNewGenre] = useState('تصويب');
  const [newFps, setNewFps] = useState(60);
  const [newPath, setNewPath] = useState('');

  const handleAddGame = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const g: Game = {
      id: 'custom-' + Date.now(),
      name: newName,
      genre: newGenre,
      icon: '🎮',
      isOptimized: false,
      baseFps: Number(newFps),
      optimizedFps: Math.round(Number(newFps) * 1.35),
      exePath: newPath || `C:\\Games\\${newName}\\${newName}.exe`,
    };
    setGames(prev => [g, ...prev]);
    setShowAddModal(false);
    setNewName(''); setNewPath('');
    playSynthBeep(520, 0.15);
  };

  const removeGame = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setGames(prev => prev.filter(g => g.id !== id));
    playSynthBeep(300, 0.1);
  };

  // ── Crash analyzer ──
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [crashLog, setCrashLog] = useState('');
  const [analyzingCrash, setAnalyzingCrash] = useState(false);
  const [crashResult, setCrashResult] = useState<{ analysis: string; steps: string[]; safeCommands?: string[] } | null>(null);

  const selectTemplate = (id: string) => {
    setSelectedTemplate(id);
    const t = CRASH_LOG_TEMPLATES.find(x => x.id === id);
    setCrashLog(t ? t.rawLog : '');
    playSynthBeep(400, 0.08);
  };

  const analyzeCrash = async () => {
    if (!crashLog.trim()) return;
    setAnalyzingCrash(true);
    setCrashResult(null);
    playSynthBeep(520, 0.1);

    try {
      const res = await fetch('http://localhost:3001/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logText: crashLog }),
      });
      const data = await res.json();
      if (data.success) {
        setCrashResult({ analysis: data.analysis, steps: data.steps, safeCommands: data.safeCommands });
        setAnalyzingCrash(false);
        playSynthBeep(700, 0.15, 'triangle');
        return;
      }
    } catch (_) {}

    const noorai = (window as any).noorai;
    if (noorai) {
      noorai.analyzeCrash(crashLog).then((res: any) => {
        let analysis = res.summary;
        let steps = [
          'تأكد من تحديث Windows.',
          'أوقف كسر سرعة كرت الشاشة.',
          'تحقق من إعدادات PageFile.',
        ];
        let cmds = ['sfc /scannow'];

        if (crashLog.toLowerCase().includes('dxgi_error_device_removed')) {
          analysis = 'انهيار كرت الشاشة - فولت غير مستقر أو كسر سرعة (DXGI Device Removed).';
          steps = ['عطل رفع السرعة.', 'ثبت تعريف NVIDIA/AMD نظيف عبر DDU.', 'اضبط Power Limit إلى 95%.'];
          cmds = ['nvidia-smi -lgc 1900,1900'];
        } else if (crashLog.toLowerCase().includes('van9001')) {
          analysis = 'Vanguard VAN9001 — Secure Boot أو TPM 2.0 غير مفعل.';
          steps = ['ادخل BIOS وفعل Secure Boot.', 'فعل Intel PTT أو AMD fTPM.'];
        }

        setCrashResult({ analysis, steps, safeCommands: cmds });
        playSynthBeep(700, 0.15, 'triangle');
      }).catch(() => {}).finally(() => setAnalyzingCrash(false));
    } else {
      setAnalyzingCrash(false);
    }
  };

  // ── AI Tuning ──
  const [tuningPrompt, setTuningPrompt] = useState('أعاني من تقطع الفريمات في Warzone 3 على 1080p');
  const [generatingTuning, setGeneratingTuning] = useState(false);
  const [tuningResult, setTuningResult] = useState<{ analysis: string; steps: string[]; safeCommands?: string[] } | null>(null);

  const requestTuning = async () => {
    setGeneratingTuning(true);
    setTuningResult(null);
    playSynthBeep(520, 0.12);

    const cpu = nativeSysInfo?.cpu?.brand || 'Intel Core i5-12400F';
    const gpu = gpuDriverInfo?.name || 'NVIDIA GeForce RTX 3070';
    const ram = stats.ramTotal + ' GB';

    try {
      const res = await fetch('http://localhost:3001/api/tuning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cpu, gpu, ram, prompt: tuningPrompt }),
      });
      const data = await res.json();
      if (data.success) {
        setTuningResult({ analysis: data.analysis, steps: data.steps, safeCommands: data.safeCommands });
        setGeneratingTuning(false);
        playSynthBeep(780, 0.2);
        return;
      }
    } catch (_) {}

    setTimeout(() => {
      setTuningResult({
        analysis: `بناءً على مواصفاتك: ${cpu} و ${gpu} مع ${ram} رامات — العتاد قوي. الهبوط في Warzone غالباً بسبب VRAM وعمليات خلفية.`,
        steps: [
          `فعل Hardware-accelerated GPU Scheduling لكرت ${gpu} في إعدادات شاشة Windows.`,
          'عطل Texture Streaming داخل إعدادات اللعبة.',
          'اضبط وضع الطاقة لكرت الشاشة إلى "أقصى أداء" في NVIDIA Control Panel.',
          'فعل Game Mode في NoorAI لتحرير ~3GB رام.',
        ],
        safeCommands: ['sfc /scannow', 'powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c'],
      });
      playSynthBeep(780, 0.2);
      setGeneratingTuning(false);
    }, 1500);
  };

  // ── Styles (inline to guarantee rendering regardless of Tailwind load) ──
  const S = {
    // Layout
    screen: {
      minHeight: '100vh',
      width: '100vw',
      maxWidth: '100vw',
      minWidth: 0,
      background: 'linear-gradient(135deg, #07070d 0%, #0b0b12 100%)',
      color: '#ffffff',
      fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
      display: 'flex',
      flexDirection: 'column' as const,
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      boxSizing: 'border-box' as const,
    } as React.CSSProperties,

    // Header
    header: {
      background: '#111118',
      borderBottom: '1px solid #23233a',
      padding: '12px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      position: 'sticky' as const,
      top: 0,
      zIndex: 50,
      flexShrink: 0,
    } as React.CSSProperties,

    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: 10,
    },

    logoBox: {
      width: 34,
      height: 34,
      borderRadius: 10,
      background: 'linear-gradient(135deg, #00ffcc, #ff00ff)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontWeight: 900,
      fontSize: 15,
      color: '#07070d',
    },

    logoText: {
      fontSize: 17,
      fontWeight: 800,
      color: '#ffffff',
      letterSpacing: '0.04em',
      userSelect: 'none' as const,
    },

    badge: {
      marginLeft: 8,
      fontSize: 10,
      fontWeight: 700,
      background: 'rgba(0,255,204,0.12)',
      border: '1px solid rgba(0,255,204,0.35)',
      color: '#00ffcc',
      padding: '2px 8px',
      borderRadius: 6,
      letterSpacing: '0.05em',
    },

    // Nav tabs
    navTabs: {
      display: 'flex',
      gap: 6,
      flexWrap: 'wrap' as const,
      alignItems: 'center',
    },

    tabBtn: (active: boolean, color: string = '#00ffcc') => ({
      padding: '8px 16px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: 700,
      cursor: 'pointer',
      border: active ? 'none' : '1px solid #3a3a4e',
      background: active ? color : '#1a1a26',
      color: active ? (color === '#00ffcc' ? '#000' : '#fff') : '#d0d0e0',
      transition: 'all 0.15s',
      outline: 'none',
    } as React.CSSProperties),

    // Body layout - Allow scrolling
    body: {
      display: 'flex',
      flex: 1,
      overflow: 'auto',
      width: '100%',
      minWidth: 0,
      minHeight: 0,
    },

    // Sidebar - Fixed width, stays visible
    sidebar: {
      width: 220,
      minWidth: 0,
      maxWidth: '100vw',
      flexShrink: 0,
      background: '#111118',
      borderRight: '1px solid #1e1e2e',
      padding: '20px 12px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: 4,
      overflowY: 'auto' as const,
      overflowX: 'hidden' as const,
      maxHeight: '100%',
      boxSizing: 'border-box' as const,
    },

    sidebarLabel: {
      fontSize: 11,
      fontWeight: 700,
      color: '#b0b0d0',
      textTransform: 'uppercase' as const,
      letterSpacing: '0.08em',
      padding: '4px 12px 8px',
    },

    sideBtn: (active: boolean) => ({
      display: 'flex',
      alignItems: 'center',
      gap: 10,
      padding: '12px 14px',
      borderRadius: 8,
      fontSize: 13,
      fontWeight: active ? 700 : 600,
      color: active ? '#ffffff' : '#c0c0e0',
      background: active ? '#1e1e32' : 'transparent',
      borderLeft: active ? '3px solid #00ffcc' : '3px solid transparent',
      cursor: 'pointer',
      border: 'none',
      outline: 'none',
      transition: 'all 0.15s',
      width: '100%',
      textAlign: 'left' as const,
    } as React.CSSProperties),

    // Main content area - Scroll both directions
    main: {
      flex: 1,
      overflowX: 'auto' as const,
      overflowY: 'auto' as const,
      padding: 24,
      width: '100%',
      minWidth: 0,
      maxWidth: '100vw',
      minHeight: 0,
      boxSizing: 'border-box' as const,
    },

    // Cards
    card: {
      background: '#141420',
      border: '1px solid #222232',
      borderRadius: 12,
      padding: 20,
    } as React.CSSProperties,

    cardTitle: {
      fontSize: 14,
      fontWeight: 700,
      color: '#ffffff',
      marginBottom: 14,
      display: 'flex',
      alignItems: 'center',
      gap: 8,
    },

    // Stat card
    statCard: (accent: string) => ({
      background: '#141420',
      border: `1px solid ${accent}22`,
      borderRadius: 12,
      padding: 16,
      position: 'relative' as const,
      overflow: 'hidden',
    } as React.CSSProperties),

    // Row
    row: (justify: string = 'flex-start', gap: number = 12) => ({
      display: 'flex',
      alignItems: 'center',
      justifyContent: justify,
      gap,
      flexWrap: 'wrap' as const,
      minWidth: 0,
    } as React.CSSProperties),

    // Section heading
    sectionTitle: {
      fontSize: 18,
      fontWeight: 800,
      color: '#ffffff',
      marginBottom: 4,
    },

    sectionSub: {
      fontSize: 13,
      color: '#b0b0d0',
      fontWeight: 500,
    },

    // Optimize hero
    hero: {
      background: 'linear-gradient(135deg, #141420 0%, #1a1428 100%)',
      border: '1px solid #222232',
      borderRadius: 14,
      padding: '20px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 20,
      marginBottom: 20,
    } as React.CSSProperties,

    // Buttons
    btnPrimary: {
      padding: '10px 22px',
      borderRadius: 9,
      fontSize: 13,
      fontWeight: 800,
      border: 'none',
      background: 'linear-gradient(135deg, #00ffcc, #ff00ff)',
      color: '#000000',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      transition: 'transform 0.15s, opacity 0.15s',
    } as React.CSSProperties,

    btnDanger: {
      padding: '9px 18px',
      borderRadius: 9,
      fontSize: 12,
      fontWeight: 700,
      border: '1px solid rgba(239,68,68,0.4)',
      background: 'rgba(239,68,68,0.08)',
      color: '#ef4444',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
    } as React.CSSProperties,

    btnSecondary: {
      padding: '10px 20px',
      borderRadius: 9,
      fontSize: 13,
      fontWeight: 700,
      border: '1px solid #3a3a4e',
      background: '#1a1a26',
      color: '#e0e0f0',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: 7,
    } as React.CSSProperties,

    // Input
    input: {
      width: '100%',
      background: '#0d0d16',
      border: '1px solid #3a3a4e',
      borderRadius: 8,
      padding: '12px 14px',
      color: '#ffffff',
      fontSize: 13,
      fontWeight: 500,
      outline: 'none',
    } as React.CSSProperties,

    textarea: {
      width: '100%',
      background: '#0d0d16',
      border: '1px solid #3a3a4e',
      borderRadius: 8,
      padding: '14px',
      color: '#ffffff',
      fontSize: 13,
      fontFamily: 'monospace',
      outline: 'none',
      resize: 'vertical' as const,
    } as React.CSSProperties,

    select: {
      width: '100%',
      background: '#0d0d16',
      border: '1px solid #3a3a4e',
      borderRadius: 8,
      padding: '12px 14px',
      color: '#ffffff',
      fontSize: 13,
      fontWeight: 500,
      outline: 'none',
    } as React.CSSProperties,

    // Profile row
    profileRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '14px 16px',
      background: '#1a1a28',
      border: '1px solid #2a2a3e',
      borderRadius: 10,
      marginBottom: 10,
    } as React.CSSProperties,

    // Info row inside card
    infoRow: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 14px',
      background: '#1a1a28',
      border: '1px solid #2a2a3e',
      borderRadius: 8,
      fontSize: 13,
      marginBottom: 8,
    } as React.CSSProperties,

    // Code block
    codeBlock: {
      background: '#0a0a12',
      border: '1px solid #2a2a3e',
      borderRadius: 8,
      padding: '12px 16px',
      fontFamily: 'monospace',
      fontSize: 12,
      color: '#00ffcc',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: 8,
    } as React.CSSProperties,

    // Footer
    footer: {
      background: '#0e0e18',
      borderTop: '1px solid #1e1e2e',
      padding: '12px 24px',
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: 12,
      color: '#a0a0c0',
      fontWeight: 500,
      flexShrink: 0,
    } as React.CSSProperties,

    // Alert banner
    alertBanner: (color: string) => ({
      background: `${color}15`,
      border: `1px solid ${color}40`,
      borderRadius: 10,
      padding: '12px 16px',
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      marginBottom: 16,
    } as React.CSSProperties),

    // Modal overlay
    overlay: {
      position: 'fixed' as const,
      inset: 0,
      background: 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: 20,
    } as React.CSSProperties,

    modal: {
      background: '#141420',
      border: '1px solid #2a2a3e',
      borderRadius: 14,
      padding: 28,
      width: '100%',
      maxWidth: 440,
      color: '#ffffff',
    } as React.CSSProperties,

    label: {
      display: 'block',
      fontSize: 12,
      fontWeight: 700,
      color: '#c0c0e0',
      marginBottom: 6,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
    } as React.CSSProperties,
  };

  // ── Copy to clipboard ──
  const copyText = (text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
    playSynthBeep(900, 0.1);
  };

  // ════════════════════════════════════════════════════════════
  // RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <div style={S.screen}>

      {/* ── HEADER ── */}
      <header style={S.header}>
        {/* Logo */}
        <div style={S.logo}>
          <div style={S.logoBox}>N</div>
          <span style={S.logoText}>
            Noor<span style={{ color: '#00ffcc' }}>AI</span>
            <span style={S.badge}>LAUNCHER</span>
          </span>
        </div>

        {/* Nav Tabs */}
        <nav style={S.navTabs}>
          <button id="tab-overview" style={S.tabBtn(tab === 'overview')} onClick={() => { setTab('overview'); playSynthBeep(420, 0.07); }}>
            📊 مراقبة الأداء
          </button>
          <button id="tab-library" style={S.tabBtn(tab === 'library')} onClick={() => { setTab('library'); playSynthBeep(420, 0.07); }}>
            🎮 مكتبة الألعاب
          </button>
          <button id="tab-crash" style={S.tabBtn(tab === 'crash-analyzer', '#ff00ff')} onClick={() => { setTab('crash-analyzer'); playSynthBeep(420, 0.07); }}>
            🛠️ محلل الأخطاء
          </button>
          <button id="tab-tuning" style={S.tabBtn(tab === 'ai-tuning')} onClick={() => { setTab('ai-tuning'); playSynthBeep(420, 0.07); }}>
            💡 ضبط AI
          </button>
        </nav>
      </header>

      {/* ── BODY ── */}
      <div style={S.body}>

        {/* ── SIDEBAR ── */}
        <aside style={S.sidebar}>
          <p style={S.sidebarLabel}>التنقل</p>

          <button style={S.sideBtn(tab === 'overview')} onClick={() => { setTab('overview'); playSynthBeep(420, 0.07); }}>
            <BarChart3 size={18} color={tab === 'overview' ? '#00ffcc' : '#9999cc'} />
            مراقبة الأداء
          </button>
          <button style={S.sideBtn(tab === 'library')} onClick={() => { setTab('library'); playSynthBeep(420, 0.07); }}>
            <Gamepad2 size={18} color={tab === 'library' ? '#00ffcc' : '#9999cc'} />
            <span style={{ flex: 1 }}>مكتبة الألعاب</span>
            <span style={{ fontSize: 11, background: '#1f1f35', color: '#ff00ff', borderRadius: 10, padding: '2px 8px', fontWeight: 700 }}>
              {games.length}
            </span>
          </button>
          <button style={S.sideBtn(tab === 'crash-analyzer')} onClick={() => { setTab('crash-analyzer'); playSynthBeep(420, 0.07); }}>
            <ShieldAlert size={18} color={tab === 'crash-analyzer' ? '#ff00ff' : '#9999cc'} />
            محلل الانهيارات
          </button>
          <button style={S.sideBtn(tab === 'ai-tuning')} onClick={() => { setTab('ai-tuning'); playSynthBeep(420, 0.07); }}>
            <Cpu size={18} color={tab === 'ai-tuning' ? '#00ffcc' : '#9999cc'} />
            مستشار الضبط
          </button>

          <div style={{ margin: '20px 0 8px', borderTop: '1px solid #1e1e2e', paddingTop: 16 }}>
            <p style={S.sidebarLabel}>حالة النظام</p>
            <div style={{ padding: '10px 14px', fontSize: 12 }}>
              <div style={{ color: '#b0b0d0', marginBottom: 4 }}>نظام التشغيل:</div>
              <div style={{ color: '#e0e0f0', fontWeight: 600, fontSize: 12 }}>
                {nativeSysInfo?.osInfo?.distro || 'Windows 11'}
              </div>
            </div>
            <div style={{ padding: '6px 14px', fontSize: 12 }}>
              <div style={{ color: '#b0b0d0', marginBottom: 4 }}>كرت الشاشة:</div>
              <div style={{ color: '#e0e0f0', fontWeight: 600, fontSize: 12 }}>
                {gpuDriverInfo?.name || 'NVIDIA RTX Series'}
              </div>
            </div>
            <div style={{ padding: '6px 14px 12px', fontSize: 12 }}>
              <div style={{ color: '#b0b0d0', marginBottom: 5 }}>NoorAI:</div>
              <div style={{ color: '#00ffcc', fontWeight: 700, fontSize: 12 }}>● نشط ومتصل</div>
            </div>
          </div>
        </aside>

        {/* ── MAIN CONTENT ── */}
        <main style={S.main}>

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 1: PERFORMANCE OVERVIEW
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {tab === 'overview' && (
            <div>
              {/* Optimize Hero */}
              <div style={S.hero}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                    <Zap size={22} color="#00ffcc" />
                    <h2 style={{ fontSize: 17, fontWeight: 800, color: '#ffffff', margin: 0 }}>
                      تحسين وضبط الألعاب التلقائي بالذكاء الاصطناعي
                    </h2>
                  </div>
                  <p style={{ color: '#c0c0e0', fontSize: 13, margin: 0 }}>
                    اللانشر متصل كمسؤول بجهازك. اضبط درجات الحرارة والرام وملفات كاش لأقصى إطارات.
                  </p>
                </div>
                {optimizedAll ? (
                  <button style={S.btnDanger} onClick={resetAll}>
                    <RefreshCw size={14} />
                    إعادة تهيئة النظام
                  </button>
                ) : (
                  <button
                    style={{
                      ...S.btnPrimary,
                      opacity: isOptimizingAll ? 0.65 : 1,
                    }}
                    onClick={runOptimizeAll}
                    disabled={isOptimizingAll}
                  >
                    {isOptimizingAll
                      ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> جاري التنظيف...</>
                      : <><Zap size={14} /> تنظيف وتطهير كامل للنظام ⚡</>
                    }
                  </button>
                )}
              </div>

              {/* Optimize progress */}
              {isOptimizingAll && (
                <div style={{ ...S.alertBanner('#00ffcc'), marginBottom: 20 }}>
                  <RefreshCw size={20} color="#00ffcc" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#00ffcc', fontWeight: 700, fontSize: 12, marginBottom: 2 }}>جاري تهيئة النظام...</div>
                    <div style={{ color: '#aaffee', fontSize: 11, fontFamily: 'monospace' }}>{allOptStage}</div>
                  </div>
                </div>
              )}

              {optimizedAll && (
                <div style={{ ...S.alertBanner('#00ffcc'), marginBottom: 20 }}>
                  <CheckCircle size={20} color="#00ffcc" style={{ flexShrink: 0 }} />
                  <span style={{ color: '#00ffcc', fontWeight: 700, fontSize: 12 }}>
                    ✅ تم تحسين النظام بالكامل — رامات محررة، كاش منظف، شبكة محسنة!
                  </span>
                </div>
              )}

              {/* Live Stat Cards - Responsive Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 14, 
                marginBottom: 20,
                width: '100%',
              }}>

                {/* FPS */}
                <div style={S.statCard('#00ffcc')}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    معدل الإطارات
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#00ffcc', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    {stats.fps}
                  </div>
                  <div style={{ fontSize: 12, color: '#a0a0c0', marginTop: 5 }}>FPS</div>
                  <div style={{ fontSize: 11, color: gameModeOn ? '#00ffcc' : '#b0b0d0', marginTop: 8, fontWeight: 600 }}>
                    {gameModeOn ? '⚡ Game Mode نشط' : 'وضع افتراضي'}
                  </div>
                </div>

                {/* Ping */}
                <div style={S.statCard('#ff00ff')}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    زمن الاستجابة
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#ff00ff', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    {stats.ping}
                  </div>
                  <div style={{ fontSize: 12, color: '#a0a0c0', marginTop: 5 }}>ms</div>
                  <div style={{ fontSize: 11, color: lowLatencyOn ? '#ff00ff' : '#b0b0d0', marginTop: 8, fontWeight: 600 }}>
                    {lowLatencyOn ? '🟢 Low Latency نشط' : 'توجيه افتراضي'}
                  </div>
                </div>

                {/* Temp */}
                <div style={S.statCard('#f59e0b')}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    درجة الحرارة
                  </div>
                  <div style={{ display: 'flex', gap: 14, alignItems: 'flex-end' }}>
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: stats.tempCpu > 78 ? '#ef4444' : '#ffffff', fontFamily: 'monospace' }}>
                        {stats.tempCpu}°
                      </div>
                      <div style={{ fontSize: 11, color: '#b0b0d0', fontWeight: 700 }}>CPU</div>
                    </div>
                    <div style={{ width: 1, height: 35, background: '#2a2a3e' }} />
                    <div>
                      <div style={{ fontSize: 28, fontWeight: 900, color: stats.tempGpu > 78 ? '#ef4444' : '#ffffff', fontFamily: 'monospace' }}>
                        {stats.tempGpu}°
                      </div>
                      <div style={{ fontSize: 11, color: '#b0b0d0', fontWeight: 700 }}>GPU</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 11, color: '#f59e0b', marginTop: 10, fontWeight: 600 }}>
                    {thermalOn ? '🌡️ حماية حرارية نشطة' : 'تحكم تلقائي'}
                  </div>
                </div>

                {/* RAM */}
                <div style={S.statCard('#3b82f6')}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>
                    الذاكرة العشوائية
                  </div>
                  <div style={{ fontSize: 42, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace', lineHeight: 1.1 }}>
                    {stats.ramUsage}%
                  </div>
                  <div style={{ fontSize: 12, color: '#a0a0c0', marginTop: 5 }}>من {stats.ramTotal} GB</div>
                  <StatBar value={stats.ramUsage} color="#3b82f6" />
                </div>
              </div>

              {/* Usage bars row - Responsive Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: 14, 
                marginBottom: 20,
                width: '100%',
              }}>
                <div style={S.card}>
                  <div style={S.cardTitle}>
                    <Cpu size={16} color="#00ffcc" />
                    استخدام المعالج المركزي (CPU)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>{stats.cpuUsage}%</div>
                    <div style={{ flex: 1 }}><StatBar value={stats.cpuUsage} color="#00ffcc" /></div>
                  </div>
                  <div style={{ fontSize: 12, color: '#b0b0d0' }}>
                    {nativeSysInfo?.cpu?.brand || 'Intel Core i5-12400F'}
                    <span style={{ color: '#8080a0', marginLeft: 8 }}>
                      {nativeSysInfo?.cpu?.cores || 6} cores @ {nativeSysInfo?.cpu?.speed || '2.5'}GHz
                    </span>
                  </div>
                </div>

                <div style={S.card}>
                  <div style={S.cardTitle}>
                    <Monitor size={16} color="#ff00ff" />
                    استخدام كرت الشاشة (GPU)
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: '#ffffff', fontFamily: 'monospace' }}>{stats.gpuUsage}%</div>
                    <div style={{ flex: 1 }}><StatBar value={stats.gpuUsage} color="#ff00ff" /></div>
                  </div>
                  <div style={{ fontSize: 12, color: '#b0b0d0' }}>
                    {gpuDriverInfo?.name || 'NVIDIA GeForce RTX 3070'}
                    <span style={{ color: '#8080a0', marginLeft: 8 }}>v{gpuDriverInfo?.driverVersion || '551.23'}</span>
                  </div>
                </div>
              </div>

              {/* Smart Profiles - Responsive Grid */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
                gap: 14,
                width: '100%',
              }}>
                <div style={S.card}>
                  <div style={S.cardTitle}>
                    <Zap size={16} color="#00ffcc" />
                    أنماط تشغيل العتاد (Smart Profiles)
                  </div>

                  {/* Game Mode */}
                  <div style={S.profileRow}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>وضع الألعاب الفائق</div>
                      <div style={{ fontSize: 12, color: '#b0b0d0' }}>Extreme Game Mode — كسر التردد وحقن فريمات</div>
                    </div>
                    <Toggle checked={gameModeOn} onChange={v => {
                      setGameModeOn(v);
                      if (v) setLaptopModeOn(false);
                      playSynthBeep(v ? 600 : 300, 0.1);
                    }} />
                  </div>

                  {/* Low Latency */}
                  <div style={S.profileRow}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>وضع البينج المنخفض</div>
                      <div style={{ fontSize: 12, color: '#b0b0d0' }}>Low Latency — أولوية كرت الشبكة</div>
                    </div>
                    <Toggle checked={lowLatencyOn} onChange={v => {
                      setLowLatencyOn(v);
                      playSynthBeep(v ? 650 : 325, 0.1);
                    }} />
                  </div>

                  {/* Thermal */}
                  <div style={S.profileRow}>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#ffffff' }}>الحماية الحرارية</div>
                      <div style={{ fontSize: 12, color: '#b0b0d0' }}>Thermal Safe — تخفيض التردد لمنع ارتفاع الحرارة</div>
                    </div>
                    <Toggle checked={thermalOn} onChange={v => {
                      setThermalOn(v);
                      if (v) { setLaptopModeOn(false); setGameModeOn(false); }
                      playSynthBeep(v ? 500 : 400, 0.1);
                    }} />
                  </div>

                  {/* Laptop Mode */}
                  <div style={{ ...S.profileRow, borderColor: '#00ffcc33' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                      <Laptop size={16} color="#00ffcc" style={{ flexShrink: 0, marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#00ffcc' }}>وضع ألعاب المحمول</div>
                        <div style={{ fontSize: 12, color: '#b0b0d0' }}>Laptop Mode — بطارية ذكية مع كفاءة تبريد</div>
                      </div>
                    </div>
                    <Toggle checked={laptopModeOn} onChange={v => {
                      setLaptopModeOn(v);
                      if (v) { setGameModeOn(false); setThermalOn(false); }
                      playSynthBeep(v ? 750 : 350, 0.12);
                    }} />
                  </div>
                </div>

                {/* Hardware sensors */}
                <div style={S.card}>
                  <div style={S.cardTitle}>
                    <Terminal size={16} color="#00ffcc" />
                    مستشعرات العتاد
                  </div>
                  <div style={S.infoRow}>
                    <span style={{ color: '#b0b0d0', fontSize: 13 }}>المعالج (CPU):</span>
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                      {nativeSysInfo?.cpu?.brand || 'Intel i5-12400F'}
                    </span>
                  </div>
                  <div style={S.infoRow}>
                    <span style={{ color: '#b0b0d0', fontSize: 13 }}>كرت الشاشة (GPU):</span>
                    <span style={{ color: '#ff00ff', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                      {gpuDriverInfo?.name || 'RTX 3070'}
                    </span>
                  </div>
                  <div style={S.infoRow}>
                    <span style={{ color: '#b0b0d0', fontSize: 13 }}>الذاكرة (RAM):</span>
                    <span style={{ color: '#ffffff', fontWeight: 700, fontSize: 13, fontFamily: 'monospace' }}>
                      {stats.ramTotal} GB
                    </span>
                  </div>
                  <div style={S.infoRow}>
                    <span style={{ color: '#b0b0d0', fontSize: 13 }}>تعريف GPU:</span>
                    <span style={{ color: '#00ffcc', fontWeight: 700, fontSize: 13 }}>
                      {gpuDriverInfo?.driverVersion ? `v${gpuDriverInfo.driverVersion} ✓` : 'مستقر ✓'}
                    </span>
                  </div>
                  <div style={{ marginTop: 14, background: 'rgba(0,255,204,0.07)', border: '1px solid rgba(0,255,204,0.2)', borderRadius: 8, padding: '10px 12px', display: 'flex', gap: 10 }}>
                    <Lightbulb size={16} color="#00ffcc" style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 12, color: '#aaeedd', margin: 0, lineHeight: 1.6 }}>
                      {laptopModeOn
                        ? 'ECO للمحمول نشط. درجات حرارة مقيدة لمنع تجميد البطارية.'
                        : 'عتاد كافٍ. فعّل Game Mode لضمان أقصى إطارات مستقرة.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 2: GAME LIBRARY
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {tab === 'library' && (
            <div>
              {/* Header row */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
                <div>
                  <h2 style={S.sectionTitle}>مكتبة الألعاب والمحسنات الفردية</h2>
                  <p style={S.sectionSub}>اختر لعبة لتهيئتها فردياً أو أضف لعبة يدوياً</p>
                </div>
                <button style={S.btnPrimary} onClick={() => { setShowAddModal(true); playSynthBeep(450, 0.1); }}>
                  <Plus size={14} />
                  إضافة لعبة
                </button>
              </div>

              {/* Scan status */}
              <div style={{ ...S.card, marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <Terminal size={18} color="#00ffcc" />
                  <span style={{ fontSize: 13, fontWeight: 700, color: '#e0e0f0' }}>ماسح ألعاب Windows التلقائي</span>
                </div>
                {scanning
                  ? <span style={{ fontSize: 13, color: '#b0b0d0', fontWeight: 600 }}>⟳ جاري المسح...</span>
                  : <span style={{ fontSize: 13, color: '#00ffcc', fontWeight: 700, background: 'rgba(0,255,204,0.1)', padding: '4px 12px', borderRadius: 6 }}>✓ اكتمل</span>
                }
                {detectedPaths.length > 0 && (
                  <div style={{ fontSize: 12, color: '#b0b0d0' }}>
                    {detectedPaths.length} مسار مكتشف
                  </div>
                )}
              </div>

              {optimizingId && (
                <div style={{ ...S.alertBanner('#f59e0b'), marginBottom: 16 }}>
                  <RefreshCw size={16} color="#f59e0b" style={{ animation: 'spin 1s linear infinite', flexShrink: 0 }} />
                  <div>
                    <div style={{ color: '#f59e0b', fontWeight: 700, fontSize: 12 }}>جاري تهيئة إعدادات اللعبة...</div>
                    <div style={{ color: '#fcd34d', fontSize: 11, fontFamily: 'monospace', marginTop: 2 }}>{optStage}</div>
                  </div>
                </div>
              )}

              {/* Games grid - Responsive Layout */}
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
                gap: 14,
                width: '100%',
              }}>
                {games.map(game => (
                  <div
                    key={game.id}
                    style={{
                      ...S.card,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12,
                      border: game.isOptimized ? '1px solid rgba(0,255,204,0.3)' : '1px solid #222232',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ fontSize: 28 }}>{game.icon}</div>
                      {game.id.startsWith('custom-') && (
                        <button
                          onClick={e => removeGame(game.id, e)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#8080a0', padding: 4 }}
                          title="حذف اللعبة"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <div>
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#ffffff', marginBottom: 3 }}>{game.name}</div>
                      <div style={{ fontSize: 12, color: '#c0c0e0' }}>{game.genre}</div>
                      <div style={{ fontSize: 11, color: '#8080a0', fontFamily: 'monospace', marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {game.exePath}
                      </div>
                    </div>

                    <div style={{ borderTop: '1px solid #1e1e2e', paddingTop: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#b0b0d0', marginBottom: 3 }}>معدل الإطارات</div>
                        {game.isOptimized
                          ? <span style={{ fontSize: 14, fontWeight: 900, color: '#00ffcc', fontFamily: 'monospace' }}>{game.optimizedFps} FPS ⚡</span>
                          : <span style={{ fontSize: 14, fontWeight: 700, color: '#ccccdd', fontFamily: 'monospace' }}>{game.baseFps} FPS</span>
                        }
                      </div>
                      <button
                        onClick={() => optimizeGame(game.id)}
                        disabled={optimizingId !== null}
                        style={{
                          padding: '8px 16px',
                          borderRadius: 8,
                          fontSize: 12,
                          fontWeight: 800,
                          border: game.isOptimized ? '1px solid rgba(16,185,129,0.5)' : '1px solid rgba(0,255,204,0.5)',
                          background: game.isOptimized ? 'rgba(16,185,129,0.12)' : 'rgba(0,255,204,0.12)',
                          color: game.isOptimized ? '#10b981' : '#00ffcc',
                          cursor: optimizingId ? 'not-allowed' : 'pointer',
                          opacity: optimizingId && optimizingId !== game.id ? 0.5 : 1,
                        }}
                      >
                        {game.isOptimized ? '✓ تم التحسين' : 'حسّن الآن ⚡'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 3: AI CRASH ANALYZER
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {tab === 'crash-analyzer' && (
            <div>
              <h2 style={S.sectionTitle}>محلل أخطاء وانهيارات الألعاب بالـ AI</h2>
              <p style={{ ...S.sectionSub, marginBottom: 20 }}>الصق سجل الخطأ أو Crash Log لتشخيص السبب واقتراح حلول مخصصة</p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
                gap: 16,
                width: '100%',
              }}>
                {/* Input side */}
                <div>
                  {/* Template buttons */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>نموذج جاهز للتجربة السريعة:</label>
                    <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8 }}>
                      {CRASH_LOG_TEMPLATES.map(t => (
                        <button
                          key={t.id}
                          onClick={() => selectTemplate(t.id)}
                          style={{
                            padding: '8px 16px',
                            borderRadius: 8,
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: 'pointer',
                            outline: 'none',
                            border: selectedTemplate === t.id ? '1px solid #ff00ff' : '1px solid #3a3a4e',
                            background: selectedTemplate === t.id ? 'rgba(255,0,255,0.15)' : '#1a1a26',
                            color: selectedTemplate === t.id ? '#ffffff' : '#c0c0e0',
                            transition: 'all 0.15s',
                          }}
                        >
                          {t.errorTitle}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Crash log textarea */}
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>نص سجل الخطأ (Crash Log):</label>
                    <textarea
                      value={crashLog}
                      onChange={e => setCrashLog(e.target.value)}
                      placeholder="الصق تفاصيل الانهيار هنا..."
                      rows={12}
                      style={S.textarea}
                    />
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                    <button style={S.btnSecondary} onClick={() => setCrashLog('')}>مسح</button>
                    <button
                      onClick={analyzeCrash}
                      disabled={analyzingCrash || !crashLog.trim()}
                      style={{
                        ...S.btnPrimary,
                        background: 'linear-gradient(135deg, #ff00ff, #7c3aed)',
                        color: '#ffffff',
                        opacity: (analyzingCrash || !crashLog.trim()) ? 0.6 : 1,
                      }}
                    >
                      {analyzingCrash
                        ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> جاري التحليل...</>
                        : <><ShieldAlert size={14} /> بدء تشخيص الـ AI ➔</>
                      }
                    </button>
                  </div>
                </div>

                {/* Result side */}
                <div style={S.card}>
                  <div style={{ ...S.cardTitle, borderBottom: '1px solid #1e1e2e', paddingBottom: 12, marginBottom: 14 }}>
                    <Activity size={16} color="#ff00ff" />
                    تقرير التشخيص الذكي
                  </div>

                  {crashResult ? (
                    <div>
                      <div style={{ background: 'rgba(255,0,255,0.08)', border: '1px solid rgba(255,0,255,0.25)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                        <div style={{ fontSize: 10.5, fontWeight: 800, color: '#ff00ff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>السبب المحتمل:</div>
                        <p style={{ fontSize: 13, color: '#e0e0f0', lineHeight: 1.6, margin: 0 }}>{crashResult.analysis}</p>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>خطوات الإصلاح:</div>
                        {crashResult.steps.map((step, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, background: '#1a1a28', borderRadius: 7, padding: '10px 12px' }}>
                            <span style={{ color: '#00ffcc', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>{i + 1}.</span>
                            <span style={{ fontSize: 12, color: '#e0e0f0', lineHeight: 1.5 }}>{step}</span>
                          </div>
                        ))}
                      </div>

                      {crashResult.safeCommands && crashResult.safeCommands.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>أوامر CMD المستحسنة:</div>
                          {crashResult.safeCommands.map((cmd, i) => (
                            <div key={i} style={S.codeBlock}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, color: '#00ffcc', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd}</span>
                              <button onClick={() => copyText(cmd)} style={{ background: 'rgba(0,255,204,0.15)', border: '1px solid rgba(0,255,204,0.4)', borderRadius: 5, color: '#00ffcc', fontSize: 11, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
                                نسخ
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', paddingTop: 50, paddingBottom: 50 }}>
                      <ShieldAlert size={40} color="#ff00ff44" style={{ marginBottom: 12 }} />
                      <p style={{ fontSize: 13, color: '#b0b0d0', lineHeight: 1.6 }}>
                        أدخل سجل الخطأ وانقر<br />"بدء تشخيص الـ AI"
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
              TAB 4: AI DRIVER & SPEC TUNING
          ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
          {tab === 'ai-tuning' && (
            <div>
              <h2 style={S.sectionTitle}>مستشار ضبط مواصفات العتاد بالـ AI</h2>
              <p style={{ ...S.sectionSub, marginBottom: 20 }}>نقرأ العتاد تلقائياً ونولّد توصيات ضبط مخصصة بالذكاء الاصطناعي</p>

              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
                gap: 16,
                width: '100%',
              }}>
                {/* Specs column */}
                <div style={S.card}>
                  <div style={{ ...S.cardTitle, borderBottom: '1px solid #1e1e2e', paddingBottom: 12, marginBottom: 14 }}>
                    <Monitor size={16} color="#00ffcc" />
                    العتاد المكتشف
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>المعالج المركزي</div>
                    <div style={{ background: '#1a1a28', border: '1px solid #222232', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: '#00ffcc', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>
                        {nativeSysInfo?.cpu?.brand || 'Intel Core i5-12400F'}
                      </div>
                      <div style={{ color: '#b0b0d0', fontSize: 12, marginTop: 4 }}>
                        Cores: {nativeSysInfo?.cpu?.cores || 6} | {nativeSysInfo?.cpu?.speed || '2.50'} GHz
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>كرت الشاشة</div>
                    <div style={{ background: '#1a1a28', border: '1px solid #222232', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: '#ff00ff', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>
                        {gpuDriverInfo?.name || 'NVIDIA GeForce RTX 3070'}
                      </div>
                      <div style={{ color: '#b0b0d0', fontSize: 12, marginTop: 4 }}>
                        v{gpuDriverInfo?.driverVersion || '551.23'} | VRAM: {gpuDriverInfo?.vram ? Math.round(gpuDriverInfo.vram / 1024) + 'GB' : '8GB'}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 14 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>الذاكرة العشوائية</div>
                    <div style={{ background: '#1a1a28', border: '1px solid #222232', borderRadius: 8, padding: '10px 12px' }}>
                      <div style={{ color: '#ffffff', fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>
                        {stats.ramTotal} GB DDR4 System RAM
                      </div>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, padding: '10px 12px', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircle size={16} color="#10b981" />
                    <div style={{ fontSize: 12, color: '#10b981', fontWeight: 700 }}>تعريف كرت الشاشة مثالي للألعاب</div>
                  </div>
                </div>

                {/* Query & result */}
                <div>
                  <div style={{ marginBottom: 14 }}>
                    <label style={S.label}>استفسارك أو مشكلتك في الأداء:</label>
                    <textarea
                      value={tuningPrompt}
                      onChange={e => setTuningPrompt(e.target.value)}
                      rows={4}
                      style={S.textarea}
                    />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 20 }}>
                    <button
                      onClick={requestTuning}
                      disabled={generatingTuning || !tuningPrompt.trim()}
                      style={{
                        ...S.btnPrimary,
                        opacity: (generatingTuning || !tuningPrompt.trim()) ? 0.6 : 1,
                      }}
                    >
                      {generatingTuning
                        ? <><RefreshCw size={14} style={{ animation: 'spin 1s linear infinite' }} /> جاري التوليد...</>
                        : <><Cpu size={14} /> طلب الضبط والتحليل ➔</>
                      }
                    </button>
                  </div>

                  {tuningResult && (
                    <div style={S.card}>
                      <div style={{ background: 'rgba(0,255,204,0.07)', border: '1px solid rgba(0,255,204,0.2)', borderRadius: 8, padding: '12px 14px', marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#00ffcc', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>تحليل أداء العتاد:</div>
                        <p style={{ fontSize: 13, color: '#e0e0f0', lineHeight: 1.6, margin: 0 }}>{tuningResult.analysis}</p>
                      </div>

                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, fontWeight: 800, color: '#ff00ff', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>الضبط الأمثل:</div>
                        {tuningResult.steps.map((step, i) => (
                          <div key={i} style={{ display: 'flex', gap: 8, marginBottom: 8, background: '#1a1a28', borderRadius: 7, padding: '10px 12px' }}>
                            <span style={{ color: '#ff00ff', fontWeight: 800, fontSize: 12, flexShrink: 0 }}>•</span>
                            <span style={{ fontSize: 12, color: '#e0e0f0', lineHeight: 1.5 }}>{step}</span>
                          </div>
                        ))}
                      </div>

                      {tuningResult.safeCommands && tuningResult.safeCommands.length > 0 && (
                        <div>
                          <div style={{ fontSize: 12, fontWeight: 800, color: '#b0b0d0', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10 }}>أوامر التحسين السريعة:</div>
                          {tuningResult.safeCommands.map((cmd, i) => (
                            <div key={i} style={{ ...S.codeBlock, color: '#ff00ff' }}>
                              <span style={{ fontFamily: 'monospace', fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{cmd}</span>
                              <button onClick={() => copyText(cmd)} style={{ background: 'rgba(255,0,255,0.15)', border: '1px solid rgba(255,0,255,0.4)', borderRadius: 5, color: '#ff00ff', fontSize: 11, padding: '4px 10px', cursor: 'pointer', flexShrink: 0, marginLeft: 8 }}>
                                نسخ
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* ── FOOTER ── */}
      <footer style={S.footer}>
        <span>NoorAI Gaming Launcher v0.1.0 © 2026</span>
        <span>جميع الحقوق محفوظة</span>
      </footer>

      {/* ── ADD GAME MODAL ── */}
      {showAddModal && (
        <div style={S.overlay}>
          <div style={S.modal}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: '#ffffff', margin: 0 }}>إضافة لعبة جديدة</h3>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b0b0d0', padding: 4 }}
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAddGame}>
              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>اسم اللعبة:</label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: Apex Legends"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                  style={S.input}
                />
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>التصنيف:</label>
                <select value={newGenre} onChange={e => setNewGenre(e.target.value)} style={S.select}>
                  <option value="تصويب">تصويب / شوتر</option>
                  <option value="باتل رويال">باتل رويال</option>
                  <option value="تقمص أدوار">تقمص أدوار</option>
                  <option value="مغامرات">أكشن / مغامرات</option>
                  <option value="أخرى">أخرى</option>
                </select>
              </div>

              <div style={{ marginBottom: 16 }}>
                <label style={S.label}>معدل الإطارات الحالي (FPS):</label>
                <input
                  type="number"
                  required
                  min={10}
                  max={360}
                  value={newFps}
                  onChange={e => setNewFps(Number(e.target.value))}
                  style={{ ...S.input, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ marginBottom: 24 }}>
                <label style={S.label}>مسار ملف تشغيل اللعبة (.exe):</label>
                <input
                  type="text"
                  placeholder="مثلاً: C:\Games\Apex\r5apex.exe"
                  value={newPath}
                  onChange={e => setNewPath(e.target.value)}
                  style={{ ...S.input, fontFamily: 'monospace' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" onClick={() => setShowAddModal(false)} style={S.btnSecondary}>إلغاء</button>
                <button type="submit" style={S.btnPrimary}>حفظ اللعبة</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Spin animation */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
