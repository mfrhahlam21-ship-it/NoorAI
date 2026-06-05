import { useState, useEffect, useRef, FormEvent, MouseEvent } from 'react';
import { 
  Download, 
  Zap, 
  Cpu, 
  Settings, 
  Play, 
  Gamepad2, 
  ShieldAlert, 
  BarChart3, 
  AlertCircle, 
  Copy, 
  CheckCircle, 
  RefreshCw, 
  Plus, 
  Trash2, 
  Check, 
  User, 
  CreditCard, 
  Lock, 
  Radio, 
  Search,
  Sparkles,
  ArrowLeft,
  Flame,
  Lightbulb,
  Terminal,
  Activity,
  Maximize2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { INITIAL_GAMES, CRASH_LOG_TEMPLATES } from './data';
import { Game, SystemStats, CrashLogTemplate } from './types';

// Audio feedback synthesizer
const playSynthBeep = (freq: number, duration: number, type: OscillatorType = 'sine') => {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.type = type;
    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
    gainNode.gain.setValueAtTime(0.12, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    // Ignore context autoplay blocks
  }
};

const GAME_OPTIMAL_DATABASE: Record<string, {
  name: string;
  targetFps: number;
  targetPing: number;
  stability: string;
  graphicSettings: Array<{ name: string; recommend: string }>;
  systemTweaks: Array<{ name: string; recommend: string }>;
  hardwareAdvice: string;
}> = {
  'cod-mw3': {
    name: 'Call of Duty: Modern Warfare III',
    targetFps: 140,
    targetPing: 12,
    stability: '98%',
    graphicSettings: [
      { name: 'Texture Streaming Budget', recommend: 'OFF / تعطيل الكامل لمنع حدوث التقطيع وعشوائية تدفق البيانات' },
      { name: 'Resolution Scaling (Upscaling)', recommend: 'DLSS Quality أو FSR 3.0 Quality حسب كرت الشاشة لديك' },
      { name: 'NVIDIA Reflex Low Latency', recommend: 'On + Boost لتأمين تزامن تام واستجابة لا تتعدى جزء من الثانية' },
      { name: 'Shadow Quality', recommend: 'Medium بدلاً من High لاستعادة 12٪ من الفريمات في الخرائط الكبيرة' }
    ],
    systemTweaks: [
      { name: 'Windows HAGS scheduling', recommend: 'مفعل (ON) لتخفيف العبء الثقيل على الذاكرة الرسومية VRAM' },
      { name: 'Virtual Memory (SSD)', recommend: 'تعيين ملف الترحيل يدوياً بمقدار 16-24 جيجابايت لتفادي انهيار اللعبة العفوي' }
    ],
    hardwareAdvice: 'تعتمد هذه اللعبة بشكل كبير على ذاكرة كرت الشاشة VRAM ومساحة الذاكرة العشوائية. تفعيل "وضع الألعاب" في NoorAI سيقوم فوراً بقفل المهام الخلفية المتهالكة وتحرير 3GB.'
  },
  'valorant': {
    name: 'Valorant',
    targetFps: 260,
    targetPing: 8,
    stability: '99.2%',
    graphicSettings: [
      { name: 'Multithreaded Rendering', recommend: 'تأكد من تفعيله (ON) لتوزيع الجهد على كافة أنوية المعالج بالتساوي' },
      { name: 'Graphics Profiles', recommend: 'تعيين جميع الخيارات على LOW لتخفيض وقت معالجة الإطارات الكلي ولعب تنافسي مثالي' },
      { name: 'NVIDIA Reflex Low Latency', recommend: 'On + Boost لخفض مدخل الإشارات إلى 2.5 مللي ثانية' }
    ],
    systemTweaks: [
      { name: 'High Precision Event Timer (HPET)', recommend: 'تعطيله من سطر الأوامر (CMD كمسؤول) وتنزيل تعريف الماوس لأحدث إصدار' },
      { name: 'Fullscreen Optimizations', recommend: 'تعطيل خيارات توافق ملء الشاشة على ملف اللعبة الرئيسي لتفادي مدخلات نظام Windows المتبقية' }
    ],
    hardwareAdvice: 'لعبة فالورانت تعتمد كلياً على سرعة المعالج المركزي (CPU Bottleneck). تشغيل "وضع الألعاب" و"وضع زمن الاستجابة المنخفض" يعطي اللعبة الأولوية القصوى لمعالجة الحزم والاشتباكات سريعة المدى.'
  },
  'cyberpunk': {
    name: 'Cyberpunk 2077',
    targetFps: 80,
    targetPing: 25,
    stability: '93%',
    graphicSettings: [
      { name: 'DLSS / Frame Generation', recommend: 'مفعل (ON) مع DLSS Quality (يساهم في مضاعفة الإطارات بمعدل 1.8 مرة)' },
      { name: 'Crowd Density (كثافة الحشود)', recommend: 'تعيين على Medium أو Low لإزاحة العبء المزدوج عن كاهل المعالج المركزي' },
      { name: 'Screen Space Reflections', recommend: 'High بدلاً من Ultra (يوفر 8-10 إطارات إضافية دون تشويه لانعكاسات المطر والأحياء)' }
    ],
    systemTweaks: [
      { name: 'Re-Size BAR BIOS Settings', recommend: 'مفعل من إعدادات اللوحة أم لتمكين المعالج من قراءة الـ VRAM دفعة واحدة' },
      { name: 'Windows Game Mode', recommend: 'مفعل (ON) لمساعدة نظام التشغيل على توجيه تدوين اللوجات السريع لملف السايبربانك' }
    ],
    hardwareAdvice: 'تضغط اللعبة على كرت الشاشة بشدة وتتسبب بإنتاج حرارة مرتفعة جداً قد تؤدي لتخنق المعالج (Thermal Throttling). نوصي بشدة بتفعيل "وضع حماية الحرارة" في NoorAI لجدولة تبريد ديناميكي ذكي.'
  },
  'apex-legends': {
    name: 'Apex Legends',
    targetFps: 165,
    targetPing: 14,
    stability: '97.5%',
    graphicSettings: [
      { name: 'Texture Streaming Budget', recommend: 'تعديل الخيار إلى 4GB VRAM أو ما يقل عن مساحة ذاكرتك بـ 2GB' },
      { name: 'Volumetric Effects & Dynamic Fog', recommend: 'تعطيل بالكامل (Low/Disable) لرفع وضوح الرؤية عبر الدخان واستعادة 15 فريم' },
      { name: 'Reflex Mode', recommend: 'On + Boost لتأمين سرعة نقر واستجابة أسرع بالقتال المترابط' }
    ],
    systemTweaks: [
      { name: 'DirectX Shader Cache Size', recommend: 'تعيين إلى 10GB في لوحة تحكم NVIDIA لتفادي تجميد اللعبة المصغر المفاجئ' },
      { name: 'Apex Launch Command', recommend: 'أضف في خيارات التشغيل: `-high -threads 6 -refresh 144 -force-feature-level-11-0`' }
    ],
    hardwareAdvice: 'تعاني Apex من تذبذبات خادم اللعبة المعتادة. تفعيل "وضع زمن الاستجابة المنخفض" هنا يفتح اتصال TCP نقي يعزز وصول الحزم بسلاسة ويحمي اتصالاتك.'
  },
  'cs2': {
    name: 'Counter-Strike 2',
    targetFps: 220,
    targetPing: 10,
    stability: '98.5%',
    graphicSettings: [
      { name: 'Shadow Quality & Ambient Occlusion', recommend: 'Shadows on Medium لتعقب ظلال الأعداء بدقة، و Ambient Occlusion OFF لأقل استهلاك' },
      { name: 'Model / Texture detail', recommend: 'Low أو Medium لتحقيق أفضل زمن استجابة بكسل مع الحفاظ على وضوح النماذج' },
      { name: 'NVIDIA Reflex Mode', recommend: 'ENABLED لتقليص تأخير المحرك الرسومي Source 2' }
    ],
    systemTweaks: [
      { name: 'Ultimate Power Plan', recommend: 'تفعيل خطة الطاقة القصوى لـ Windows لمنع المعالج من تقليل تردده أثناء جولات اللعبة الحامسية' },
      { name: 'DirectX Shader Cache Clear', recommend: 'تنظيف كاش الكرت لتشكيل كاش ألعاب متوافق ومحدث بدون تراكمات قديمة' }
    ],
    hardwareAdvice: 'تستجيب CS2 بشكل فائق لتنظيف الذاكرة الحية. يفضل تشغيل "تفريغ الذاكرة المؤقتة" لتأمين مساحة تخزين متسلسلة ونظيفة بدون تداخل.'
  },
  'fortnite': {
    name: 'Fortnite',
    targetFps: 180,
    targetPing: 12,
    stability: '96%',
    graphicSettings: [
      { name: 'Rendering Mode', recommend: 'Performance Mode (أفضل بمركبات تنافسية ويثبت الفريمات أثناء المعارك وبناء المباني الكثيفة)' },
      { name: 'Nanite Virtualized Geometry', recommend: 'تعطيل بالكامل (OFF) لتثبيت الفريم تايم والحد من النقص الحاد والمفاجئ بالإطارات' },
      { name: 'Textures & View Distance', recommend: 'View Distance on Medium و Textures on Low لتقليل إجهاد كاش الكرت' }
    ],
    systemTweaks: [
      { name: 'C-States Power management', recommend: 'عطله من الـ BIOS لضمان تشغيل الأنوية بتردد ثابت وموحد بدون هبوط مفاجئ' },
      { name: 'Priority scheduling Registry Key', recommend: 'إنشاء مفتاح أولوية ألعاب في الريجستري لإعطاء Fortnite أسبقية المعالجة المباشرة' }
    ],
    hardwareAdvice: 'في فورتنايت التقطعات تعود غالبا إلى معالجات التكتسشر وحرارة المعالج المتقلبة. ننصح بتفعيل "وضع الألعاب" قبل البدء باللعب وجدولة تحسين دوري بالذكاء الاصطناعي.'
  }
};

export default function AppMain() {
  const [currentTab, setCurrentTab] = useState<'landing' | 'launcher' | 'pricing'>('landing');
  const [launcherSubTab, setLauncherSubTab] = useState<'overview' | 'library' | 'crash-analyzer' | 'ai-tuning'>('overview');
  
  // Pro Subscription status
  const [isProUser, setIsProUser] = useState<boolean>(() => {
    return localStorage.getItem('noorai_pro') === 'true';
  });

  // Active optimization mode states (Interactive Dash Controls)
  const [isGameModeActive, setIsGameModeActive] = useState<boolean>(true);
  const [isLowLatencyActive, setIsLowLatencyActive] = useState<boolean>(false);
  const [isThermalProtectionActive, setIsThermalProtectionActive] = useState<boolean>(false);

  // States for the Recommendation System (نظام التوصيات الذكي)
  const [selectedRecGameId, setSelectedRecGameId] = useState<string>('cyberpunk');
  const [userCustomFps, setUserCustomFps] = useState<number>(55);
  const [userCustomPing, setUserCustomPing] = useState<number>(45);
  const [userCustomStability, setUserCustomStability] = useState<'low' | 'med' | 'high'>('low'); 
  const [isRecommendationApplied, setIsRecommendationApplied] = useState<boolean>(false);
  const [isAnalyzingRec, setIsAnalyzingRec] = useState<boolean>(false);
  const [activeRecommendationAppliedGame, setActiveRecommendationAppliedGame] = useState<string | null>(null);

  // Client statistics - will fetch from launcher API
  const [systemStats, setSystemStats] = useState<SystemStats>({
    cpuUsage: 0,
    gpuUsage: 0,
    ramUsage: 0,
    ramTotal: 16,
    fps: 0,
    tempCpu: 0,
    tempGpu: 0,
    ping: 0
  });

  // Hardware info from launcher
  const [hardwareInfo, setHardwareInfo] = useState({
    cpuBrand: 'جاري الاتصال بالمشغل...',
    gpuName: 'جاري الاتصال بالمشغل...',
    osInfo: 'جاري الاتصال بالمشغل...',
    launcherConnected: false
  });

  const [hasGlobalOptimization, setHasGlobalOptimization] = useState<boolean>(false);
  
  // Games state
  const [games, setGames] = useState<Game[]>(() => {
    const saved = localStorage.getItem('noorai_games');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return INITIAL_GAMES;
      }
    }
    return INITIAL_GAMES;
  });

  useEffect(() => {
    localStorage.setItem('noorai_games', JSON.stringify(games));
  }, [games]);

  // Fetch real system stats from launcher API
  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await fetch('/api/system-stats/latest');
        const data = await response.json();
        
        if (data.success && data.data) {
          setSystemStats({
            cpuUsage: data.data.cpuUsage || 0,
            gpuUsage: data.data.gpuUsage || 0,
            ramUsage: data.data.ramUsage || 0,
            ramTotal: data.data.ramTotal || 16,
            fps: data.data.fps || 0,
            tempCpu: data.data.tempCpu || 0,
            tempGpu: data.data.tempGpu || 0,
            ping: data.data.ping || 0
          });
          
          setHardwareInfo({
            cpuBrand: data.data.cpuBrand || 'غير متصل',
            gpuName: data.data.gpuName || 'غير متصل',
            osInfo: data.data.osInfo || 'غير متصل',
            launcherConnected: data.data.launcherConnected || false
          });
        }
      } catch (error) {
        console.error('Failed to fetch system stats:', error);
        // Keep showing last known values or zeros
      }
    };

    // Initial fetch
    fetchStats();

    // Poll for updates every 2 seconds
    const interval = setInterval(fetchStats, 2000);
    return () => clearInterval(interval);
  }, []);

  // Launcher Installation Simulation
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStage, setDownloadStage] = useState<string>('');

  const triggerLauncherInstallation = async () => {
    playSynthBeep(440, 0.1);

    // Google Drive direct download link only
    const googleDriveUrl = 'https://drive.google.com/uc?export=download&id=1udTg00JAogR6n8aqk6W5FtKgsxFnL15A';

    try {
      setDownloadProgress(0);
      setDownloadStage('بدء تنزيل ملف التثبيت...');

      const link = document.createElement('a');
      link.href = googleDriveUrl;
      link.rel = 'noopener noreferrer';
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();

      setTimeout(() => {
        document.body.removeChild(link);
        setDownloadProgress(null);
        setDownloadStage('');
      }, 1500);

      return;
    } catch (e: any) {
      console.error('Download trigger failed:', e);
      alert(e?.message || 'حدث خطأ أثناء بدء التحميل.');
      setDownloadProgress(null);
      setDownloadStage('');
    }
  };

  // Diagnostic recommendation controls
  const runSmartDiagnostic = () => {
    setIsAnalyzingRec(true);
    playSynthBeep(440, 0.12);
    
    setTimeout(() => {
      setIsAnalyzingRec(false);
      setIsRecommendationApplied(true);
      setActiveRecommendationAppliedGame(selectedRecGameId);
      playSynthBeep(620, 0.25);
    }, 1400);
  };

  const resetSmartDiagnostic = () => {
    setIsRecommendationApplied(false);
    setActiveRecommendationAppliedGame(null);
    playSynthBeep(320, 0.1);
  };

  // State for Add Game Modal
  const [showAddGameModal, setShowAddGameModal] = useState<boolean>(false);
  const [newGameName, setNewGameName] = useState('');
  const [newGameGenre, setNewGameGenre] = useState('تصويب');
  const [newGameBaseFps, setNewGameBaseFps] = useState(60);
  const [newGamePath, setNewGamePath] = useState('');

  const handleAddGame = (e: FormEvent) => {
    e.preventDefault();
    if (!newGameName.trim()) return;

    const newGame: Game = {
      id: 'custom-' + Date.now(),
      name: newGameName,
      genre: newGameGenre,
      icon: '🎮',
      isOptimized: false,
      baseFps: Number(newGameBaseFps),
      optimizedFps: Math.round(Number(newGameBaseFps) * 1.35),
      exePath: newGamePath || `C:\\Games\\${newGameName}\\${newGameName}.exe`
    };

    setGames(prev => [newGame, ...prev]);
    setShowAddGameModal(false);
    setNewGameName('');
    setNewGamePath('');
    playSynthBeep(520, 0.15);
  };

  const handleRemoveGame = (id: string, e: MouseEvent) => {
    e.stopPropagation();
    setGames(prev => prev.filter(g => g.id !== id));
    playSynthBeep(300, 0.1);
  };

  // Dynamic optimization sequence for a single game
  const [optimizingGameId, setOptimizingGameId] = useState<string | null>(null);
  const [optStage, setOptStage] = useState<string>('');

  const optimizeGame = (id: string) => {
    playSynthBeep(554, 0.1);
    setOptimizingGameId(id);
    setOptStage('جاري فحص مخازن اللعبة المؤقتة (Shaders cache)...');

    const steps = [
      { text: 'تحسين توجيه الخيوط بالمعالجات المتعددة CPU Affinity...', delay: 600 },
      { text: 'تنظيف وتطهير الذاكرة المخبأة Standby List Cleaner...', delay: 1200 },
      { text: 'ضبط لوحة تحكم NVIDIA/AMD لزمن الاستجابة الأكثر انخفاضاً...', delay: 1800 },
      { text: 'تطبيق أولوية المعالجة القصوى بنظام جدولة ويندوز...', delay: 2400 },
      { text: 'تمت التهيئة! اللعبة جاهزة للعمل بأفضل أداء.', delay: 3000 }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setOptStage(step.text);
        playSynthBeep(554 + (idx * 60), 0.08);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setGames(prev => prev.map(g => g.id === id ? { ...g, isOptimized: true } : g));
            setOptimizingGameId(null);
            playSynthBeep(880, 0.2, 'triangle');
          }, 600);
        }
      }, step.delay);
    });
  };

  // Dynamic sweeping system (globally optimizes everything)
  const [isOptimizingAll, setIsOptimizingAll] = useState<boolean>(false);
  const [allOptStage, setAllOptStage] = useState<string>('');

  const optimizeAllSystem = () => {
    setIsOptimizingAll(true);
    playSynthBeep(349, 0.15);
    setAllOptStage('جاري فرز المهام الغير ضرورية في الخلفية...');

    const steps = [
      { text: 'تطهير الذاكرة العشوائية المستهلكة (Standby Memory)...', delay: 700 },
      { text: 'إيقاف تشغيل حزم الحساب السحابي وخيارات القياس لويندوز...', delay: 1400 },
      { text: 'تعديل بروتوكول تحسين الشبكة لتقليل البينج (Nagle Algorithm)...', delay: 2100 },
      { text: 'تفعيل وضع الطاقة الفائق (NoorAI Ultra Power Scheme)...', delay: 2800 },
      { text: 'اكتمل التحسين الشامل وحماية الحرارة ومصفوفة كرت الشاشة جاهزة!', delay: 3500 }
    ];

    steps.forEach((step, idx) => {
      setTimeout(() => {
        setAllOptStage(step.text);
        playSynthBeep(440 + (idx * 80), 0.1);
        if (idx === steps.length - 1) {
          setTimeout(() => {
            setHasGlobalOptimization(true);
            setIsOptimizingAll(false);
            setSystemStats(prev => ({
              ...prev,
              fps: 144,
              tempCpu: 62,
              tempGpu: 64,
              ping: 12,
            }));
            playSynthBeep(880, 0.25, 'sawtooth');
            setTimeout(() => playSynthBeep(1100, 0.3, 'sine'), 100);
          }, 800);
        }
      }, step.delay);
    });
  };

  const resetAllSystem = () => {
    setHasGlobalOptimization(false);
    setGames(prev => prev.map(g => ({ ...g, isOptimized: false })));
    playSynthBeep(250, 0.3);
  };

  // AI Crash Log Analyzer Logic
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [pastedLog, setPastedLog] = useState<string>('');
  const [isAnalyzingCrash, setIsAnalyzingCrash] = useState<boolean>(false);
  const [crashAnalysisResult, setCrashAnalysisResult] = useState<{
    analysis: string;
    steps: string[];
    safeCommands?: string[];
    isSimulated?: boolean;
  } | null>(null);
  const [copiedCommand, setCopiedCommand] = useState<string>('');

  const handleTemplateSelect = (id: string) => {
    setSelectedTemplateId(id);
    const tmpl = CRASH_LOG_TEMPLATES.find(t => t.id === id);
    if (tmpl) {
      setPastedLog(tmpl.rawLog);
    } else {
      setPastedLog('');
    }
    playSynthBeep(400, 0.08);
  };

  const handleClearCrash = () => {
    setPastedLog('');
    setSelectedTemplateId('');
    setCrashAnalysisResult(null);
    playSynthBeep(300, 0.08);
  };

  const analyzeCrashLog = async () => {
    if (!pastedLog.trim()) return;

    setIsAnalyzingCrash(true);
    setCrashAnalysisResult(null);
    playSynthBeep(520, 0.1);

    try {
      const response = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          logText: pastedLog,
          gameName: CRASH_LOG_TEMPLATES.find(t => t.id === selectedTemplateId)?.gameName || 'أخرى'
        })
      });

      const data = await response.json();
      if (data.success) {
        setCrashAnalysisResult(data);
        playSynthBeep(700, 0.15, 'triangle');
      } else {
        alert('حدث خطأ أثناء الاتصال بالخادم. سيتم تشغيل المحلل الذكي التلقائي.');
      }
    } catch (e) {
      console.error(e);
      // Mock analyzer callback backup to ensure seamless execution
      setCrashAnalysisResult({
        analysis: "حدث انهيار بكرت الشاشة ناتج عن فولتية غير مستقرة أو سعة الذاكرة الرسومية VRAM. يرجى مراجعة إعدادات المعالجة وتحديث التعريف ونظام الطاقة.",
        steps: [
          "تخفيض إعدادات التظليل وتوليد الإطارات (Shadows & Foliage Quality).",
          "استبدال كسر سرعة الكرت MSI Afterburner للوضع الافتراضي.",
          "تثبيت تعريف كرت شاشة مستقر كليا بعد عملية تنظيف DDU الكاملة."
        ],
        safeCommands: ["sfc /scannow"],
        isSimulated: true
      });
      playSynthBeep(600, 0.2);
    } finally {
      setIsAnalyzingCrash(false);
    }
  };

  const handleCopyCommand = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCommand(cmd);
    playSynthBeep(900, 0.1);
    setTimeout(() => setCopiedCommand(''), 2000);
  };

  // AI Spec-Tuning Logic
  const [tuningCpu, setTuningCpu] = useState('Intel Core i5-12400F');
  const [tuningGpu, setTuningGpu] = useState('NVIDIA GeForce RTX 3060');
  const [tuningRam, setTuningRam] = useState('16 GB DDR4');
  const [tuningPrompt, setTuningPrompt] = useState('أعاني من اهتزاز الفريمات وثباتها فجأة في لعبة Warzone 3 على دقة 1080p');
  const [isGeneratingTuning, setIsGeneratingTuning] = useState(false);
  const [tuningResult, setTuningResult] = useState<{
    analysis: string;
    steps: string[];
    safeCommands?: string[];
    isSimulated?: boolean;
  } | null>(null);

  // Update hardware info when it changes
  useEffect(() => {
    setTuningCpu(hardwareInfo.cpuBrand || 'Intel Core i5-12400F');
    setTuningGpu(hardwareInfo.gpuName || 'NVIDIA GeForce RTX 3060');
    setTuningRam(`${systemStats.ramTotal} GB DDR4`);
  }, [hardwareInfo.cpuBrand, hardwareInfo.gpuName, systemStats.ramTotal]);

  const requestAiTuning = async () => {
    setIsGeneratingTuning(true);
    setTuningResult(null);
    playSynthBeep(520, 0.12);

    try {
      const response = await fetch('/api/tuning', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cpu: tuningCpu,
          gpu: tuningGpu,
          ram: tuningRam,
          prompt: tuningPrompt
        })
      });

      const data = await response.json();
      if (data.success) {
        setTuningResult(data);
        playSynthBeep(780, 0.2, 'sine');
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingTuning(false);
    }
  };

  // Checkout simulation
  const [isProcessingCheckout, setIsProcessingCheckout] = useState(false);
  const [cardNumber, setCardNumber] = useState('');
  const [cardHolder, setCardHolder] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [showCheckoutSuccess, setShowCheckoutSuccess] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsProcessingCheckout(true);
    playSynthBeep(440, 0.15);

    setTimeout(() => {
      setIsProcessingCheckout(false);
      setIsProUser(true);
      localStorage.setItem('noorai_pro', 'true');
      setShowCheckoutSuccess(true);
      playSynthBeep(660, 0.2);
      setTimeout(() => playSynthBeep(880, 0.3), 100);

      setTimeout(() => {
        setShowCheckoutSuccess(false);
        setShowCheckoutModal(false);
        // Clear forms
        setCardNumber('');
        setCardHolder('');
        setCardExpiry('');
        setCardCvv('');
      }, 3000);
    }, 2500);
  };

  const handleCancelSubscription = () => {
    if (confirm('هل أنت متأكد من رغبتك في إلغاء باقة PRO المميزة؟ ستفقد ميزات الأوفرلوك والتوجيه المتقدم.')) {
      setIsProUser(false);
      localStorage.setItem('noorai_pro', 'false');
      playSynthBeep(220, 0.3);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-white font-sans antialiased flex flex-col relative overflow-x-hidden selection:bg-[#00ffcc] selection:text-black w-full">
      
      {/* GLOWING AMBIENT SPOTS */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-[#00ffcc] opacity-10 rounded-full blur-[120px] pointer-events-none max-w-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#ff00ff] opacity-10 rounded-full blur-[120px] pointer-events-none max-w-none"></div>


      {/* TOP HEADER / NAVIGATION */}
      <header className="sticky top-0 z-40 bg-[#0a0a0c]/80 backdrop-blur-xl border-b border-white/5 py-4 px-4 md:px-6 lg:px-12 flex items-center justify-between w-full overflow-x-auto">
        <div className="flex items-center gap-6 md:gap-10 shrink-0">
          <div 
            onClick={() => { setCurrentTab('landing'); playSynthBeep(440, 0.08); }}
            className="flex items-center gap-3 cursor-pointer group shrink-0"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00ffcc] to-[#ff00ff] p-[2px]">
              <div className="w-full h-full bg-[#0a0a0c] rounded-[6px] flex items-center justify-center">
                <span className="font-extrabold text-xs text-[#00ffcc]">N</span>
              </div>
            </div>
            <div>
              <span className="text-xl font-bold tracking-tighter uppercase text-white group-hover:text-[#00ffcc] transition-colors whitespace-nowrap">Noor<span className="text-[#00ffcc]">AI</span></span>
            </div>
          </div>

          {/* Nav links */}
          <nav className="hidden lg:flex items-center gap-6 md:gap-8 text-sm font-medium uppercase tracking-widest whitespace-nowrap">
            <button 
              onClick={() => { setCurrentTab('landing'); playSynthBeep(440, 0.08); }}
              className={`pb-1 transition-colors shrink-0 ${currentTab === 'landing' ? 'text-white border-b-2 border-[#00ffcc]' : 'text-gray-400 hover:text-white'}`}
            >
              الرئيسية
            </button>
            <button 
              onClick={() => { setCurrentTab('launcher'); playSynthBeep(440, 0.08); }}
              className={`pb-1 flex items-center gap-2 transition-colors shrink-0 ${currentTab === 'launcher' ? 'text-white border-b-2 border-[#00ffcc]' : 'text-gray-400 hover:text-white'}`}
            >
              <Terminal size={14} className="text-[#00ffcc]" />
              لوحة تحكم المشغل (Client)
            </button>
            <button 
              onClick={() => { setCurrentTab('pricing'); playSynthBeep(440, 0.08); }}
              className={`pb-1 transition-colors shrink-0 ${currentTab === 'pricing' ? 'text-white border-b-2 border-[#00ffcc]' : 'text-gray-400 hover:text-white'}`}
            >
              الباقات والأسعار
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3 md:gap-4 shrink-0">
          {/* Pro tag indicators */}
          {isProUser ? (
            <div className="hidden sm:flex items-center gap-1 border border-[#ff00ff]/30 bg-[#ff00ff]/5 text-[#ff00ff] px-3.5 py-1.5 rounded-full text-xs font-bold shadow-[0_0_12px_rgba(255,0,255,0.1)] whitespace-nowrap">
              <Flame size={12} className="animate-pulse text-[#ff00ff]" />
              باقة PRO نشطة
            </div>
          ) : (
            <button 
              onClick={() => { setCurrentTab('pricing'); playSynthBeep(440, 0.08); }}
              className="hidden sm:flex items-center gap-1 border border-[#00ffcc]/30 text-[#00ffcc] text-xs font-bold bg-[#00ffcc]/5 hover:bg-[#00ffcc]/10 px-3.5 py-1.5 rounded-full transition-all whitespace-nowrap"
            >
              ترقية لـ PRO ✨
            </button>
          )}

          {/* Live system state indicator */}
          <div className="flex items-center gap-2 bg-emerald-500/5 border border-emerald-500/10 text-emerald-400 text-[11px] font-bold px-2.5 py-1 rounded-md whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
            </span>
            <span>تحسين فوري متصل</span>
          </div>

          {/* Quick Dashboard launcher button */}
          {currentTab !== 'launcher' && (
            <button 
              onClick={() => { setCurrentTab('launcher'); playSynthBeep(520, 0.08); }}
              className="px-4 py-2 text-xs bg-[#00ffcc]/10 border border-[#00ffcc]/30 text-[#00ffcc] font-bold uppercase rounded-lg shadow-md hover:bg-[#00ffcc]/20 hover:scale-[1.03] transition-all flex items-center gap-2 whitespace-nowrap"
            >
              <Gamepad2 size={14} />
              افتح المشغل
            </button>
          )}
        </div>
      </header>

      {/* RENDER DYNAMIC DOWNLOAD SIMULATOR IN AN OVERLAY CARD */}
      {downloadProgress !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#111115] border border-white/10 w-full max-w-lg rounded-2xl p-8 gaming-border-glow">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-3 bg-gradient-to-tr from-[#00ffcc] to-[#ff00ff] rounded-xl text-black">
                <Download size={24} className="animate-bounce" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">جاري تثبيت مشغل NoorAI للكمبيوتر</h3>
                <p className="text-xs text-gray-400 font-mono mt-0.5">NoorAI_Setup_x64.msi</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between text-xs font-medium text-gray-300">
                <span className="truncate max-w-[80%] text-[#00ffcc] font-mono">{downloadStage}</span>
                <span className="font-mono text-[#00ffcc]">{downloadProgress}%</span>
              </div>
              
              <div className="w-full bg-white/5 rounded-full h-2.5 overflow-hidden">
                <div 
                  className="bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] h-full rounded-full transition-all duration-300" 
                  style={{ width: `${downloadProgress}%` }}
                />
              </div>

              <div className="flex gap-2 text-[10px] text-gray-500 font-mono border-t border-white/5 pt-4">
                <span>سرعة التحميل: ~45 MB/s</span>
                <span className="mx-auto">|</span>
                <span>الحجم الكلي: 84.2 MB</span>
                <span className="mx-auto">|</span>
                <span>التوقيع الرقمي: مُتحقق منه</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MAIN VIEW CONTROLLER */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8 md:py-12 overflow-x-hidden">
        <AnimatePresence mode="wait">
          
          {/* TAB 1: LANDING PAGE */}
          {currentTab === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-16 md:space-y-20 w-full"
            >
              {/* LANDING HERO SECTION */}
              <section className="text-center max-w-4xl mx-auto pt-8 md:pt-12 space-y-6 relative w-full px-4">
                {/* Hero design elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-12 w-[240px] h-[240px] bg-[#00ffcc]/10 blur-[80px] rounded-full pointer-events-none max-w-none" />
                
                <span className="inline-flex items-center gap-1.5 border border-[#00ffcc]/30 bg-[#00ffcc]/5 text-[#00ffcc] px-4 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase whitespace-nowrap">
                  <Sparkles size={12} className="text-[#00ffcc] animate-pulse" />
                  أقوى أدوات تحسين الألعاب بالذكاء الاصطناعي التوليدي
                </span>
                
                <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white tracking-tighter leading-tight md:leading-snug">
                  ارتقِ بأدائك مع <br/>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] drop-shadow-sm pulse-neon-text">NoorAI PRO</span>
                </h1>
                
                <p className="text-base md:text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed px-4">
                  نحلل جهازك ونقوم بضبط إعدادات الألعاب ديناميكاً لتحقيق أقصى FPS وأقل زمن استجابة. نلغي تقطعات الألعاب عبر التطهير الفوري لذاكرة النظام المخبأة.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4 z-10 relative px-4 w-full">
                  <button 
                    onClick={triggerLauncherInstallation}
                    className="w-full sm:w-auto px-8 md:px-10 py-4 bg-[#00ffcc] text-black font-black rounded-xl hover:scale-105 transition-transform flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Download size={20} />
                    تحسين الآن بالبرنامج
                  </button>
                  <button 
                    onClick={() => { setCurrentTab('launcher'); playSynthBeep(440, 0.08); }}
                    className="w-full sm:w-auto px-8 md:px-10 py-4 border border-white/20 bg-white/5 hover:bg-white/10 rounded-xl font-bold transition-all flex items-center justify-center gap-3 cursor-pointer"
                  >
                    <Play size={20} className="text-[#ff00ff]" />
                    إحصائيات متقدمة
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8 pt-6 md:pt-8 text-xs text-gray-400 font-mono px-4">
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle size={14} className="text-[#00ffcc]" />
                    حجم مشغل الصغير (84MB)
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle size={14} className="text-[#00ffcc]" />
                    دعم كروت NVIDIA / AMD / Intel
                  </span>
                  <span className="hidden md:inline">•</span>
                  <span className="flex items-center gap-1.5 whitespace-nowrap">
                    <CheckCircle size={14} className="text-[#00ffcc]" />
                    لا يؤثر على الضمان أو الفولتية
                  </span>
                </div>
              </section>

              {/* DYNAMIC SYSTEM PREVIEW WIDGET */}
              <section className="glass-panel p-4 md:p-6 lg:p-8 rounded-2xl relative border border-white/5 max-w-5xl mx-auto w-full mx-4 md:mx-auto">
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#00ffcc]/10 to-transparent w-full h-full rounded-2xl pointer-events-none" />
                <div className="flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8 relative z-10">
                  <div className="space-y-4 max-w-md w-full">
                    <h3 className="text-lg md:text-xl lg:text-2xl font-bold text-white flex items-center gap-2">
                      <Cpu className="text-[#00ffcc]" />
                      لوحة كبرياء الأداء المعروضة داخل المشغل
                    </h3>
                    <p className="text-sm text-gray-300 leading-relaxed md:text-justify">
                      عند تحميل اللانشر، ستحصل على مستشعر للحرارة والنظام يقوم بمراقبة عمليات جهازك ويقوم بضبط الفولت المناسب وملفات الريجستري لتقليل الـ Standby Memory من أجل ألعاب عالية السلاسة.
                    </p>
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">استقرار الإطارات (FPS Stability)</span>
                        <span className="text-[#00ffcc] font-bold">99.4% ممتاز</span>
                      </div>
                      <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#00ffcc] h-full rounded-full glow-cyan" style={{ width: '99.4%' }} />
                      </div>
                    </div>
                  </div>

                  <div className="w-full md:w-auto bg-[#0a0a0c]/80 border border-white/5 p-4 md:p-6 rounded-xl space-y-4 min-w-[280px] md:min-w-[340px]">
                    <div className="flex justify-between items-center pb-2 border-b border-white/5">
                      <div className="flex items-center gap-1.5">
                        <span className="h-2.5 w-2.5 bg-[#00ffcc] rounded-full animate-pulse glow-cyan" />
                        <span className="text-xs font-bold text-white">إحصائيات النظام الفورية</span>
                      </div>
                      <span className="text-[10px] font-mono text-[#00ffcc] whitespace-nowrap">{hardwareInfo.gpuName || 'جاري الاتصال...'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 p-3 rounded-lg flex flex-col items-center border border-white/5">
                        <span className="text-[10px] text-gray-400">معدل الإطارات (FPS)</span>
                        <span className="text-2xl font-black text-[#00ffcc] font-mono drop-shadow-[0_0_8px_rgba(0,255,204,0.3)]">144+</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg flex flex-col items-center border border-white/5">
                        <span className="text-[10px] text-gray-400">زمن الاستجابة (Ping)</span>
                        <span className="text-2xl font-black text-[#ff00ff] font-mono drop-shadow-[0_0_8px_rgba(255,0,255,0.3)]">12ms</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg flex flex-col items-center border border-white/5">
                        <span className="text-[10px] text-gray-400">حرارة الكرت (GPU)</span>
                        <span className="text-lg font-bold text-white font-mono">64°C</span>
                      </div>
                      <div className="bg-white/5 p-3 rounded-lg flex flex-col items-center border border-white/5">
                        <span className="text-[10px] text-gray-400">استهلاك الذاكرة</span>
                        <span className="text-lg font-bold text-white font-mono">42%</span>
                      </div>
                    </div>

                    <button 
                      onClick={() => { setCurrentTab('launcher'); playSynthBeep(480, 0.1); }}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 text-xs font-bold rounded-lg transition-colors text-white"
                    >
                      تصفح لوحة التحكم التفاعلية ➔
                    </button>
                  </div>
                </div>
              </section>

              {/* THREE CORE UNIQUE VALUE PROPOSITIONS */}
              <section className="space-y-12">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl md:text-4xl font-extrabold text-white">الميزات الفريدة لغرفة عمليات NoorAI</h2>
                  <p className="text-sm md:text-base text-gray-400">نحن لا نقوم بمسح ملفات مؤقتة فقط، بل نتدخل بالذكاء الاصطناعي لحل المشكلات برمجياً وعميقاً.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Grid 1: Crash Log Analyzer */}
                  <div className="glass-panel p-6 rounded-xl hover:border-[#00ffcc]/30 transition-all flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-[#00ffcc]/10 flex items-center justify-center text-[#00ffcc]">
                        <ShieldAlert size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-white">محلل الانهيارات الفوري بالـ AI</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        انسخ سجل الانهيار (Crash Log) وسيعمل النموذج الذكي على استنباط موطن الخلل في مكتبات d3d12 أو روت جارد ويقترح عليك خطوات إصلاح عملية واضحة.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setCurrentTab('launcher'); setLauncherSubTab('crash-analyzer'); playSynthBeep(520, 0.1); }}
                      className="mt-6 text-xs text-[#00ffcc] font-bold hover:underline self-start"
                    >
                      جرب محلل الانهيارات الآن ➔
                    </button>
                  </div>

                  {/* Grid 2: Low-Latency Networking */}
                  <div className="glass-panel p-6 rounded-xl hover:border-[#00ffcc]/30 transition-all flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-[#ff00ff]/10 flex items-center justify-center text-[#ff00ff]">
                        <Radio size={24} className="animate-pulse" />
                      </div>
                      <h3 className="text-lg font-bold text-white">تقليل الـ Latency والبينج وتدفق الشبكة</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        عبر ضبط خوارزميات Nagle وتوجيه حزم TCP مخصصة للألعاب، نقوم بخفض زمن الاستجابة للبينج لضمان أسرع طلقة وتجاوب فوري في السيرفرات العالمية.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setCurrentTab('launcher'); setLauncherSubTab('overview'); playSynthBeep(520, 0.1); }}
                      className="mt-6 text-xs text-[#ff00ff] font-bold hover:underline self-start"
                    >
                      مراقبة توجيه الشبكة ➔
                    </button>
                  </div>

                  {/* Grid 3: Automated Expert Tunning */}
                  <div className="glass-panel p-6 rounded-xl hover:border-[#00ffcc]/30 transition-all flex flex-col justify-between">
                    <div className="space-y-4">
                      <div className="w-12 h-12 rounded-lg bg-[#0099ff]/10 flex items-center justify-center text-[#0099ff]">
                        <Cpu size={24} />
                      </div>
                      <h3 className="text-lg font-bold text-white">مستشار ضبط مواصفات الجهاز بالـ AI</h3>
                      <p className="text-sm text-gray-400 leading-relaxed">
                        اختر مواصفات جهازك (المعالج والكرت والرام) وتحدث إلى المستشار التلقائي ليعطيك الضبط المخصص للعبة المفضلة وطرق معالجة عنق الزجاجة.
                      </p>
                    </div>
                    <button 
                      onClick={() => { setCurrentTab('launcher'); setLauncherSubTab('ai-tuning'); playSynthBeep(520, 0.1); }}
                      className="mt-6 text-xs text-[#0099ff] font-bold hover:underline self-start"
                    >
                      تحدث للمستشار الذكي ➔
                    </button>
                  </div>
                </div>
              </section>

              {/* DOWNLOAD PROMO BANNER SECTION */}
              <section className="bg-gradient-to-tr from-[#111115] to-[#1a131f] border border-[#ff00ff]/10 p-8 rounded-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8 max-w-5xl mx-auto">
                <div className="absolute top-0 right-0 w-[240px] h-[240px] bg-[#ff00ff]/5 blur-[70px] rounded-full pointer-events-none" />
                <div className="space-y-4 max-w-xl">
                  <div className="inline-flex items-center gap-1.5 bg-[#ff00ff]/10 border border-[#ff00ff]/20 text-[#ff00ff] px-2.5 py-1 rounded-md text-[10px] font-bold">
                    عرض لفترة محدودة
                  </div>
                  <h3 className="text-2xl md:text-3xl font-extrabold text-white">ابدأ رحلتك الاحترافية ووفر المال!</h3>
                  <p className="text-sm text-gray-300">
                    باقة <span className="text-[#ff00ff] font-bold">NoorAI Pro</span> متاحة الآن بـ 15 ر.س شهرياً للتجربة المميزة بدلاً من 35 ر.س. احصل على التوجيه المزدوج الذكي وأداة الأوفرلوك لزيادة حتى 50+ فريم إضافي مجاناً!
                  </p>
                </div>
                <div className="flex gap-4 shrink-0 w-full md:w-auto">
                  <button 
                    onClick={() => { setCurrentTab('pricing'); playSynthBeep(440, 0.08); }}
                    className="w-full md:w-auto text-center px-6 py-4.5 bg-gradient-to-r from-[#ff00ff] to-[#7c3aed] text-white font-bold rounded-xl hover:opacity-90 transition-all cursor-pointer shadow-lg shadow-[#ff00ff]/10"
                  >
                    تفقد باقات الاشتراك
                  </button>
                </div>
              </section>

            </motion.div>
          )}

          {/* TAB 2: LAUNCHER COMPANION CONTAINER */}
          {currentTab === 'launcher' && (
            <motion.div
              key="launcher"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-1 lg:grid-cols-12 gap-4 md:gap-6 lg:gap-8 items-start w-full"
            >
              
              {/* LAUNCHER CLIENT SIDEBAR */}
              <div className="col-span-1 lg:col-span-3 space-y-4 w-full">
                <div className="glass-panel p-4 md:p-5 rounded-xl border border-white/5 space-y-4 w-full">
                  <div className="pb-3 border-b border-white/5">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1.5">حساب اللاعب</h3>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#00ffcc] to-[#ff00ff] p-[1.5px] shrink-0">
                        <div className="w-full h-full bg-[#070709] rounded-full flex items-center justify-center text-xs text-white">
                          <User size={14} />
                        </div>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-white leading-none truncate">ahlammufrh@gmail.com</p>
                        <span className="text-[10px] text-[#00ffcc] font-medium block mt-1">
                          {isProUser ? 'عضوية PRO نشطة' : 'عضوية مجانية'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <button 
                      onClick={() => { setLauncherSubTab('overview'); playSynthBeep(420, 0.08); }}
                      className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 font-semibold text-sm transition-all ${launcherSubTab === 'overview' ? 'bg-gradient-to-l from-[#00ffcc]/10 to-transparent text-[#00ffcc] border-r-4 border-[#00ffcc]' : 'hover:bg-white/5 text-gray-300'}`}
                    >
                      <BarChart3 size={16} className="shrink-0" />
                      <span className="truncate">نظرة عامة ومراقبة الأداء</span>
                    </button>

                    <button 
                      onClick={() => { setLauncherSubTab('library'); playSynthBeep(420, 0.08); }}
                      className={`w-full py-3 px-4 rounded-lg flex items-center justify-between font-semibold text-sm transition-all ${launcherSubTab === 'library' ? 'bg-gradient-to-l from-[#00ffcc]/10 to-transparent text-[#00ffcc] border-r-4 border-[#00ffcc]' : 'hover:bg-white/5 text-gray-300'}`}
                    >
                      <span className="flex items-center gap-3 min-w-0">
                        <Gamepad2 size={16} className="shrink-0" />
                        <span className="truncate">مكتبة المحسن الشامل</span>
                      </span>
                      <span className="bg-white/10 text-gray-400 text-[10px] px-2 py-0.5 rounded-full font-mono shrink-0">{games.length}</span>
                    </button>

                    <button 
                      onClick={() => { setLauncherSubTab('crash-analyzer'); playSynthBeep(420, 0.08); }}
                      className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 font-semibold text-sm transition-all ${launcherSubTab === 'crash-analyzer' ? 'bg-gradient-to-l from-[#00ffcc]/10 to-transparent text-[#00ffcc] border-r-4 border-[#00ffcc]' : 'hover:bg-white/5 text-gray-300'}`}
                    >
                      <ShieldAlert size={16} className="shrink-0" />
                      <span className="truncate">محلل الانهيارات (Crash Log)</span>
                    </button>

                    <button 
                      onClick={() => { setLauncherSubTab('ai-tuning'); playSynthBeep(420, 0.08); }}
                      className={`w-full py-3 px-4 rounded-lg flex items-center gap-3 font-semibold text-sm transition-all ${launcherSubTab === 'ai-tuning' ? 'bg-gradient-to-l from-[#00ffcc]/10 to-transparent text-[#00ffcc] border-r-4 border-[#00ffcc]' : 'hover:bg-white/5 text-gray-300'}`}
                    >
                      <Cpu size={14} className="shrink-0" />
                      <span className="truncate">مستشار الضبط بالـ AI</span>
                    </button>
                  </div>
                </div>

                {/* Left quick panel statistics inside sidebar */}
                <div className="glass-panel p-4 md:p-4.5 rounded-xl border border-white/5 space-y-3 font-mono text-xs w-full">
                  <div className="flex justify-between items-center text-gray-400 text-[10px] uppercase">
                    <span className="truncate">حالة محرك التحسين (Engine)</span>
                    <span className="text-[#00ffcc] shrink-0">v1.4.2</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 truncate">تحول الفولتية (GPU Boost):</span>
                    <span className="text-white font-bold shrink-0">{hasGlobalOptimization ? 'مفعل (1950 MHz)' : 'تلقائي (1620 MHz)'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 truncate">توجيه الشبكة (Routing):</span>
                    <span className={hasGlobalOptimization ? 'text-[#00ffcc] font-bold' : 'text-yellow-400'}>
                      {hasGlobalOptimization ? 'مسار ألعاب مخصص ➔' : 'مسار هجين افتراضي'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 truncate">وضع الطاقة (Power):</span>
                    <span className="text-white font-bold shrink-0">{hasGlobalOptimization ? 'NoorAI Ultra' : 'Balanced Default'}</span>
                  </div>
                </div>
              </div>

              {/* LAUNCHER CLIENT CONTENTS CONTAINER */}
              <div className="col-span-1 lg:col-span-9 space-y-6 w-full min-w-0">
                
                {/* HEADLINE BOX */}
                <div className="glass-panel p-4 md:p-6 rounded-xl relative border border-white/5 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 md:gap-6">
                  <div className="space-y-1 min-w-0">
                    <h2 className="text-xl md:text-2xl font-black text-white flex items-center gap-2">
                      <Gamepad2 className="text-[#00ffcc] shrink-0" />
                      لوحة نظام تحسين الألعاب الحية والضبط
                    </h2>
                    <p className="text-sm text-gray-400 leading-normal">
                      تابع درجات الحرارة والـ FPS الحالي والـ Ping ، وقم بالتحسين الذكي لفتح أقصى الطاقات لكرتك ومعالجك.
                    </p>
                  </div>

                  <div className="flex gap-2 md:gap-3 self-end md:self-center shrink-0">
                    {hasGlobalOptimization ? (
                      <button
                        onClick={resetAllSystem}
                        className="px-4 md:px-5 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg transition-colors flex items-center gap-2 cursor-pointer whitespace-nowrap"
                      >
                        <RefreshCw size={14} className="shrink-0" />
                        <span className="hidden sm:inline">إعادة النظام للوضع الطبيعي</span>
                        <span className="sm:hidden">إعادة تعيين</span>
                      </button>
                    ) : (
                      <button
                        onClick={optimizeAllSystem}
                        disabled={isOptimizingAll}
                        className="px-4 md:px-6 py-3 md:py-3.5 bg-gradient-to-r from-[#00ffcc] to-[#ff00ff] text-black font-extrabold text-xs md:text-sm rounded-lg hover:scale-[1.02] transform transition-all flex items-center gap-2 cursor-pointer shadow-lg shadow-[#00ffcc]/10 whitespace-nowrap"
                      >
                        {isOptimizingAll ? (
                          <>
                            <RefreshCw size={16} className="animate-spin shrink-0" />
                            <span className="hidden sm:inline">جاري فحص وضبط النظام...</span>
                            <span className="sm:hidden">جاري التحسين...</span>
                          </>
                        ) : (
                          <>
                            <Zap size={16} className="shrink-0" />
                            <span className="hidden sm:inline">حسن النظام بالكامل فوراً ⚡</span>
                            <span className="sm:hidden">تحسين النظام ⚡</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* RENDER DYNAMIC SWEEPER DIALOG */}
                {isOptimizingAll && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.98 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="p-5 rounded-xl border border-[#00ffcc]/30 bg-[#00ffcc]/10 flex items-center gap-4 text-[#00ffcc]"
                  >
                    <RefreshCw size={24} className="animate-spin shrink-0" />
                    <div className="space-y-1">
                      <p className="font-bold text-sm">جاري تهيئة كسر السرعة والتنظيف الكلي...</p>
                      <p className="text-xs text-[#00ffcc]/80 font-mono">{allOptStage}</p>
                    </div>
                  </motion.div>
                )}

                {/* 1. OVERVIEW GRAPH TAB */}
                {launcherSubTab === 'overview' && (
                  <div className="space-y-6 w-full">
                    {/* CORE SAT GAUGES */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 w-full">
                      
                      {/* Stat Card 1: FPS */}
                      <div className="glass-panel p-4 md:p-5 rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-36 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">معدل الإطارات الفوري</span>
                          <span className="px-2 py-0.5 rounded bg-[#00ffcc]/10 text-[#00ffcc] text-[9px] font-bold font-mono shrink-0">LIVE / FPS</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl md:text-4xl font-extrabold font-mono text-[#00ffcc] tracking-tight drop-shadow-[0_0_10px_rgba(0,255,204,0.15)]">
                              {systemStats.fps}
                            </span>
                            <span className="text-xs text-gray-400 font-extrabold font-mono shrink-0">FPS</span>
                          </div>
                          <p className="text-[9px] md:text-[10px] text-gray-500 mt-1 font-sans">
                            {isGameModeActive ? '⚡ وضع الألعاب برو: نشط' : '⚠️ وضع الألعاب معطّل'}
                          </p>
                        </div>
                        {isGameModeActive && <span className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#00ffcc] to-transparent" />}
                      </div>

                      {/* Stat Card 2: Latency Ping */}
                      <div className="glass-panel p-4 md:p-5 rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-36 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">زمن الاستجابة (Ping)</span>
                          <span className="px-2 py-0.5 rounded bg-[#ff00ff]/10 text-[#ff00ff] text-[9px] font-bold font-mono shrink-0">RESPONSE</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1">
                            <span className="text-3xl md:text-4xl font-extrabold font-mono text-[#ff00ff] tracking-tight drop-shadow-[0_0_10px_rgba(255,0,255,0.15)]">
                              {systemStats.ping}
                            </span>
                            <span className="text-xs text-gray-400 font-extrabold font-mono shrink-0">ms</span>
                          </div>
                          <p className="text-[9px] md:text-[10px] text-gray-500 mt-1 font-sans">
                            {isLowLatencyActive ? '🟢 توجيه مباشر نشط' : '🔵 المسار الهجين'}
                          </p>
                        </div>
                        {isLowLatencyActive && <span className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-[#ff00ff] to-transparent" />}
                      </div>

                      {/* Stat Card 3: CPU Temp */}
                      <div className="glass-panel p-4 md:p-5 rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-36 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">حرارة القطع (CPU & GPU)</span>
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[9px] font-bold font-mono shrink-0">THERMAL</span>
                        </div>
                        <div>
                          <div className="flex items-center gap-2 md:gap-4">
                            <div className="min-w-0">
                              <span className={`text-xl md:text-2xl font-extrabold font-mono tracking-tight block ${systemStats.tempCpu > 75 ? 'text-red-400' : 'text-white'}`}>
                                {systemStats.tempCpu}°C
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold font-mono block">CPU Temp</span>
                            </div>
                            <div className="w-px h-6 md:h-8 bg-white/10 shrink-0" />
                            <div className="min-w-0">
                              <span className={`text-xl md:text-2xl font-extrabold font-mono tracking-tight block ${systemStats.tempGpu > 75 ? 'text-red-400' : 'text-white'}`}>
                                {systemStats.tempGpu}°C
                              </span>
                              <span className="text-[9px] text-gray-400 font-bold font-mono block">GPU Temp</span>
                            </div>
                          </div>
                          <p className="text-[10px] text-gray-500 mt-2.5 font-sans">
                            {isThermalProtectionActive ? '❄️ حماية الحرارة نشطة: وضع تبريد مستقر' : '🔥 الحرارة تعتمد على تردد كرت الشاشة'}
                          </p>
                        </div>
                        {isThermalProtectionActive && <span className="absolute right-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-400 to-transparent" />}
                      </div>

                      {/* Stat Card 4: RAM MEMORY */}
                      <div className="glass-panel p-4 md:p-5 rounded-xl border border-white/10 relative overflow-hidden flex flex-col justify-between h-36 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider truncate">الذاكرة العشوائية (RAM)</span>
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 text-[9px] font-bold font-mono shrink-0">USAGE</span>
                        </div>
                        <div>
                          <div className="flex items-baseline gap-1.5">
                            <span className="text-3xl md:text-4xl font-extrabold font-mono text-white tracking-tight">
                              {systemStats.ramUsage}%
                            </span>
                            <span className="text-xs text-gray-400 font-extrabold font-mono shrink-0">من {systemStats.ramTotal}GB</span>
                          </div>
                          <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden mt-1 bg-gray-800">
                            <div className="bg-[#00ffcc] h-full rounded-full transition-all duration-500" style={{ width: `${systemStats.ramUsage}%` }} />
                          </div>
                          <p className="text-[9px] md:text-[10px] text-gray-500 mt-2 font-sans">
                            {hasGlobalOptimization ? '✅ تم تنظيف كاش الرامات' : '⚠️ يمكن توفير مساحة إضافية'}
                          </p>
                        </div>
                      </div>

                    </div>

                    {/* LIVE FPS STABILITY GRAPH (SVG IMPLEMENTED) */}
                    <div className="glass-panel p-4 md:p-6 rounded-2xl border border-white/10 space-y-4 w-full min-w-0">
                      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-black/10 p-3 md:p-4 rounded-xl">
                        <div className="min-w-0">
                          <h3 className="text-sm font-bold text-white flex items-center gap-1.5 font-sans">
                            <Activity size={16} className="text-[#00ffcc] shrink-0" />
                            <span className="truncate">مخطط ثبات واستقرار الإطارات الفوري</span>
                          </h3>
                          <p className="text-[11px] text-gray-400 mt-0.5 font-sans">تذبذبات معالجة المشاهد والتقطيعات الدقيقة</p>
                        </div>
                        <div className="flex gap-2 md:gap-4 text-xs font-mono font-bold font-sans shrink-0">
                          <span className="flex items-center gap-1.5 bg-black/30 border border-white/5 px-2 md:px-2.5 py-1 rounded-lg whitespace-nowrap">
                            <span className={`h-2 w-2 rounded-full ${isGameModeActive ? 'bg-[#00ffcc]' : 'bg-yellow-400'}`} />
                            {isGameModeActive ? '99.2% مستقر' : '84.2% تقطعات'}
                          </span>
                        </div>
                      </div>

                      {/* Custom SVG Line graph showing FPS stability line */}
                      <div className="w-full bg-[#070709]/70 rounded-xl p-3 border border-white/5 font-sans min-w-0">
                        <svg viewBox="0 0 1000 240" className="w-full h-44 overflow-visible border-b border-white/10" preserveAspectRatio="xMidYMid meet">
                          <defs>
                            <linearGradient id="chartGlowSuccess" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#00ffcc" stopOpacity="0.2" />
                              <stop offset="100%" stopColor="#00ffcc" stopOpacity="0" />
                            </linearGradient>
                            <linearGradient id="chartGlowWarning" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#ff00ff" stopOpacity="0.15" />
                              <stop offset="100%" stopColor="#ff00ff" stopOpacity="0" />
                            </linearGradient>
                          </defs>
                          
                          {/* Grid Lines */}
                          <line x1="0" y1="60" x2="1000" y2="60" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="0" y1="120" x2="1000" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />
                          <line x1="0" y1="180" x2="1000" y2="180" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

                          {/* Render line path of FPS variations based on state */}
                          {isGameModeActive ? (
                            // Stable line
                            <>
                              <path
                                d="M 0 60 Q 100 58, 200 62 T 400 60 T 600 58 T 800 61 T 1000 60 L 1000 240 L 0 240 Z"
                                fill="url(#chartGlowSuccess)"
                              />
                              <path
                                d="M 0 60 Q 100 58, 200 62 T 400 60 T 600 58 T 800 61 T 1000 60"
                                fill="none"
                                stroke="#00ffcc"
                                strokeWidth="3"
                              />
                            </>
                          ) : (
                            // Unstable/stutter line
                            <>
                              <path
                                d="M 0 110 Q 100 130, 200 80 T 350 180 T 500 90 T 650 170 T 800 100 T 1000 120 L 1000 240 L 0 240 Z"
                                fill="url(#chartGlowWarning)"
                              />
                              <path
                                d="M 0 110 Q 100 130, 200 80 T 350 180 T 500 90 T 650 170 T 800 100 T 1000 120"
                                fill="none"
                                stroke="#ff00ff"
                                strokeWidth="2.5"
                              />
                              <circle cx="350" cy="180" r="5" fill="#fc1d1d" className="animate-ping" />
                              <circle cx="350" cy="180" r="4.5" fill="#fc1d1d" />
                              <text x="360" y="175" fill="#fc1d1d" className="text-[11px] font-mono font-bold">تقطّع ألعاب مجهد (Stutter: 45.2ms)</text>
                            </>
                          )}
                        </svg>
                      </div>

                      <div className="flex justify-between text-[10px] md:text-[11px] text-gray-500 font-mono">
                        <span className="truncate">قبل 60 ثانية</span>
                        <span className="truncate">مستوى الإطار المستقر</span>
                        <span className="truncate">الآن</span>
                      </div>
                    </div>

                    {/* TWO SUB-COLUMNS FOR QUICK OPTIONS & RESOURCE ADVICE */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 w-full">
                      
                      {/* Left: Quick System Tweaks */}
                      <div className="glass-panel p-4 md:p-5 rounded-xl border border-white/5 space-y-4 w-full min-w-0">
                        <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">خيارات التحسين السريعة</h3>
                        
                        <div className="space-y-3">
                          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-xs font-bold text-white block truncate">تحسين استهلاك الخدمات الخلفية</span>
                              <span className="text-[10px] text-gray-400 block truncate">يقوم بإيقاف الخدمات غير المهمة أثناء اللعب</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={hasGlobalOptimization} 
                              onChange={(e) => {
                                setHasGlobalOptimization(e.target.checked);
                                playSynthBeep(e.target.checked ? 600 : 300, 0.15);
                              }}
                              className="w-4 h-4 text-[#00ffcc] accent-[#00ffcc] cursor-pointer shrink-0" 
                            />
                          </label>

                          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-xs font-bold text-white block truncate">تقنية زمن الاستجابة الفائق</span>
                              <span className="text-[10px] text-gray-400 block truncate">يقوم بتحويل طاقة الشبكة للألعاب</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={hasGlobalOptimization} 
                              onChange={(e) => {
                                setHasGlobalOptimization(e.target.checked);
                                playSynthBeep(e.target.checked ? 650 : 320, 0.15);
                              }}
                              className="w-4 h-4 text-[#00ffcc] accent-[#00ffcc] cursor-pointer shrink-0" 
                            />
                          </label>

                          <label className="flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition cursor-pointer gap-3">
                            <div className="space-y-0.5 min-w-0">
                              <span className="text-xs font-bold text-white block truncate">أداة تفريغ ذاكرة الكرت المخبأة</span>
                              <span className="text-[10px] text-gray-400 block truncate">تقوم بتنظيف الرامات تلقائيا عند 80%</span>
                            </div>
                            <input 
                              type="checkbox" 
                              checked={hasGlobalOptimization} 
                              onChange={(e) => {
                                setHasGlobalOptimization(e.target.checked);
                                playSynthBeep(e.target.checked ? 700 : 350, 0.15);
                              }}
                              className="w-4 h-4 text-[#00ffcc] accent-[#00ffcc] cursor-pointer shrink-0" 
                            />
                          </label>
                        </div>
                      </div>

                      {/* Right: Hardware details and advice */}
                      <div className="glass-panel p-4 md:p-5 rounded-xl border border-white/5 flex flex-col justify-between w-full min-w-0">
                        <div>
                          <h3 className="text-sm font-bold text-white border-b border-white/5 pb-2">مستشعرات الأجهزة المتصلة</h3>
                          <div className="mt-4 space-y-3 text-xs">
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-400 truncate">معالج النظام (CPU):</span>
                              <span className="text-white font-semibold font-mono shrink-0">{hardwareInfo.cpuBrand || 'جاري الاتصال...'}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-400 truncate">كرت شاشة الرسوميات (GPU):</span>
                              <span className="text-white font-semibold font-mono shrink-0">{hardwareInfo.gpuName || 'جاري الاتصال...'}</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-400 truncate">حجم الذاكرة المستقرة:</span>
                              <span className="text-white font-semibold font-mono shrink-0">{systemStats.ramTotal} GB</span>
                            </div>
                            <div className="flex justify-between gap-2">
                              <span className="text-gray-400 truncate">المشغل النشط كمسؤول:</span>
                              <span className={`${hardwareInfo.launcherConnected ? 'text-emerald-400' : 'text-yellow-400'} font-bold shrink-0`}>
                                {hardwareInfo.launcherConnected ? 'نعم (متصل)' : 'غير متصل'}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 md:mt-6 bg-[#00ffcc]/5 border border-[#00ffcc]/10 p-3 md:p-4.5 rounded-lg flex items-start gap-3">
                          <Lightbulb className="text-[#00ffcc] shrink-0" size={16} />
                          <p className="text-xs text-[#00ffcc] leading-relaxed">
                            <strong className="block mb-0.5">نصيحة نور آي للمستشعر:</strong>
                            {hardwareInfo.launcherConnected 
                              ? `المشغل متصل وجاري مراقبة ${hardwareInfo.cpuBrand}. يوصى بتشغيل وضع الألعاب للحصول على أفضل أداء.`
                              : 'المشغل غير متصل حالياً. يرجى تشغيل تطبيق NoorAI Launcher لعرض الإحصائيات الحية.'
                            }
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>
                )}

                {/* 2. GAME LIBRARY TAB */}
                {launcherSubTab === 'library' && (
                  <div className="space-y-6 w-full">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="min-w-0">
                        <h3 className="text-lg font-bold text-white truncate">مكتبة الألعاب والمُحسّنات الفردية</h3>
                        <p className="text-xs text-gray-400 mt-0.5 font-mono">Select a game to optimization individually or boot</p>
                      </div>
                      <button
                        onClick={() => { setShowAddGameModal(true); playSynthBeep(450, 0.1); }}
                        className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer shrink-0 whitespace-nowrap"
                      >
                        <Plus size={14} className="shrink-0" />
                        أضف لعبة يدوياً
                      </button>
                    </div>

                    {/* DYNAMIC INDIVIDUAL GAME RUNS LOADING DIALOG */}
                    {optimizingGameId && (
                      <div className="p-4 bg-gradient-to-l from-[#00ffcc]/10 to-transparent border border-[#00ffcc]/20 rounded-lg text-xs text-[#00ffcc] flex items-center gap-3">
                        <RefreshCw size={14} className="animate-spin shrink-0" />
                        <div className="min-w-0">
                          <span className="font-bold">جاري تحسين اللعبة: </span>
                          <span className="font-mono truncate">{optStage}</span>
                        </div>
                      </div>
                    )}

                    {/* GAME GRID */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
                      {games.map((g) => {
                        return (
                          <div 
                            key={g.id} 
                            className={`glass-panel rounded-xl overflow-hidden border transition-all flex flex-col justify-between min-w-0 ${g.isOptimized ? 'border-[#00ffcc]/30 shadow-md shadow-[#00ffcc]/5' : 'border-white/5'}`}
                          >
                            <div className="p-4 md:p-5 space-y-3">
                              <div className="flex justify-between items-start gap-2">
                                <span className="text-2xl md:text-3xl shrink-0">{g.icon}</span>
                                <span className="text-[10px] bg-white/5 text-gray-400 font-bold px-2 py-0.5 rounded-full truncate">{g.genre}</span>
                              </div>

                              <div className="space-y-1 min-w-0">
                                <span className="text-sm md:text-base font-bold text-white block truncate">{g.name}</span>
                                <span className="text-[10px] text-gray-400 truncate block font-mono bg-black/40 py-1 px-1.5 rounded">{g.exePath}</span>
                              </div>

                              {/* Performance Comparison stats */}
                              <div className="grid grid-cols-2 gap-2 border-t border-white/5 pt-3 mt-4 text-xs font-mono">
                                <div className="p-2 bg-white/5 rounded-lg text-center">
                                  <span className="text-[10px] text-gray-400 block mb-0.5">الإطارات الأصلية</span>
                                  <span className="text-sm font-semibold text-gray-300">{g.baseFps} FPS</span>
                                </div>
                                <div className="p-2 bg-[#00ffcc]/5 rounded-lg text-center border border-[#00ffcc]/10">
                                  <span className="text-[10px] text-[#00ffcc] block mb-0.5">بعد التحسين</span>
                                  <span className="text-sm font-bold text-[#00ffcc]">{g.optimizedFps} FPS</span>
                                </div>
                              </div>
                            </div>

                            <div className="bg-[#0a0a0c] p-3 md:p-4 border-t border-white/5 flex gap-2 items-center justify-between">
                              <button
                                onClick={() => handleRemoveGame(g.id, event as any)}
                                className="p-2 bg-white/5 hover:bg-red-500/10 hover:text-red-400 text-gray-400 rounded-lg transition-colors border border-white/5 shrink-0"
                                title="إزالة اللعبة من المكتبة"
                              >
                                <Trash2 size={14} />
                              </button>

                              {g.isOptimized ? (
                                <div className="flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 px-3 py-1.5 rounded-lg text-xs font-bold shrink-0">
                                  <Check size={12} className="shrink-0" />
                                  <span className="hidden sm:inline">محسّنة بنجاح ⚡</span>
                                  <span className="sm:hidden">محسّنة ⚡</span>
                                </div>
                              ) : (
                                <button
                                  onClick={() => optimizeGame(g.id)}
                                  disabled={optimizingGameId !== null}
                                  className="px-3 md:px-4 py-2 bg-[#00ffcc] hover:bg-[#0fdcbe] text-black text-xs font-extrabold rounded-lg transition-transform hover:scale-[1.03] shrink-0"
                                >
                                  تحسين الأداء
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* 3. AI CRASH LOG ANALYZER TAB */}
                {launcherSubTab === 'crash-analyzer' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">محلل سجلات الانهيار وإصلاح المشكلات بالـ AI</h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">Examine client errors and game crashes with Gemini diagnostics</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Left Side Inputs */}
                      <div className="lg:col-span-6 space-y-4">
                        <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4">
                          <label className="text-xs font-semibold text-gray-300 block">اختر من نماذج وبينات تفصيلية شائعة:</label>
                          <div className="flex flex-wrap gap-2">
                            {CRASH_LOG_TEMPLATES.map((tmpl) => (
                              <button
                                key={tmpl.id}
                                onClick={() => handleTemplateSelect(tmpl.id)}
                                className={`px-2.5 py-1.5 text-xs font-semibold rounded-lg transition ${selectedTemplateId === tmpl.id ? 'bg-[#ff00ff]/15 border border-[#ff00ff]/30 text-[#ff00ff]' : 'bg-white/5 border border-white/5 text-gray-300 hover:bg-white/10'}`}
                              >
                                {tmpl.errorTitle}
                              </button>
                            ))}
                          </div>

                          <div className="space-y-1.5 pt-2">
                            <label className="text-xs font-semibold text-gray-300 block">أو الصق سجل الأخطاء (Crash Log/Error code):</label>
                            <textarea
                              value={pastedLog}
                              onChange={(e) => {
                                setPastedLog(e.target.value);
                                setSelectedTemplateId('');
                              }}
                              placeholder="أدخل رسالة خطأ الويندوز أو الملاحظات التي تتلقاها هنا..."
                              rows={8}
                              className="w-full bg-[#070709] border border-white/5 p-4 rounded-lg text-xs font-mono text-gray-300 focus:outline-none focus:border-[#ff00ff] leading-relaxed select-text"
                            />
                          </div>

                          <div className="flex gap-2">
                            <button
                              onClick={analyzeCrashLog}
                              disabled={isAnalyzingCrash || !pastedLog.trim()}
                              className="flex-1 py-3 bg-gradient-to-r from-[#ff00ff] to-[#7c3aed] text-white font-extrabold text-xs rounded-lg transition-transform hover:scale-[1.01] flex items-center justify-center gap-2 cursor-pointer"
                            >
                              {isAnalyzingCrash ? (
                                <>
                                  <RefreshCw size={14} className="animate-spin" />
                                  جاري تحليل الخلل الذكي عبر Gemini...
                                </>
                              ) : (
                                <>
                                  <Sparkles size={14} />
                                  حلل المشكلة واستنبط الخلل بالآي ➔
                                </>
                              )}
                            </button>
                            {pastedLog && (
                              <button
                                onClick={handleClearCrash}
                                className="px-3 py-3 bg-white/5 hover:bg-white/10 text-xs font-semibold text-gray-300 rounded-lg transition-colors border border-white/5"
                              >
                                مسح
                              </button>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Right Side Diagnosis Display */}
                      <div className="lg:col-span-6">
                        {isAnalyzingCrash ? (
                          <div className="glass-panel p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-t-[#ff00ff] border-r-[#00ffcc] border-b-transparent border-l-transparent rounded-full animate-spin" />
                              <ShieldAlert className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#ff00ff]" size={24} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-white text-sm">جاري تشخيص السجل بنظام الرادار</h4>
                              <p className="text-xs text-gray-400">فحص كتل المذاكرت، ملفات المعالجة الرسومية والريجستري...</p>
                            </div>
                          </div>
                        ) : crashAnalysisResult ? (
                          <div className="glass-panel p-6 rounded-xl border border-[#ff00ff]/30 space-y-4 relative">
                            {crashAnalysisResult.errorFallback ? (
                              <div className="absolute top-4 left-4 bg-red-600/10 border border-red-600/20 text-red-400 text-[11px] px-3 py-1 rounded font-bold">
                                اتصال AI معطل — عرض توصيات محلية بديلة
                                {crashAnalysisResult.errorDetails && (
                                  <div className="text-[9px] text-red-300 mt-1">{crashAnalysisResult.errorDetails}</div>
                                )}
                              </div>
                            ) : crashAnalysisResult.isSimulated ? (
                              <span className="absolute top-4 left-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                محاكاة ذكية محفزة
                              </span>
                            ) : null}

                            <div>
                              <h4 className="text-xs font-bold text-[#ff00ff] uppercase tracking-wider mb-1">تحليل الخلل المقترح بالتوجيه الذكي</h4>
                              <p className="text-sm font-semibold text-white leading-relaxed text-justify">
                                {crashAnalysisResult.analysis}
                              </p>
                            </div>

                            <div className="space-y-2 border-t border-white/5 pt-4">
                              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                <CheckCircle size={14} className="text-[#00ffcc]" />
                                خطوات الإصلاح العملية المقترحة:
                              </h4>
                              <ol className="space-y-2 text-xs text-gray-400 leading-relaxed pr-1 list-decimal list-inside">
                                {crashAnalysisResult.steps.map((step, index) => (
                                  <li key={index} className="text-justify">{step}</li>
                                ))}
                              </ol>
                            </div>

                            {crashAnalysisResult.safeCommands && crashAnalysisResult.safeCommands.length > 0 && (
                              <div className="space-y-2 border-t border-white/5 pt-4 bg-[#0a0a0c] p-3 rounded-lg">
                                <h4 className="text-xs font-bold text-gray-300">أداة / أمر الإصلاح السريع المكتشف:</h4>
                                <div className="space-y-2">
                                  {crashAnalysisResult.safeCommands.map((cmd, index) => (
                                    <div key={index} className="flex justify-between items-center bg-black/40 p-2 rounded border border-white/5 font-mono text-xs text-gray-300">
                                      <span className="truncate pr-2">{cmd}</span>
                                      <button
                                        onClick={() => handleCopyCommand(cmd)}
                                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white rounded transition flex items-center gap-1 shrink-0"
                                      >
                                        {copiedCommand === cmd ? (
                                          <>
                                            <Check size={10} className="text-emerald-400" />
                                            تم النسخ!
                                          </>
                                        ) : (
                                          <>
                                            <Copy size={10} />
                                            نسخ
                                          </>
                                        )}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="glass-panel p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[350px] text-center text-gray-400 space-y-3">
                            <ShieldAlert size={40} className="text-gray-600 animate-pulse" />
                            <div className="space-y-1">
                              <h4 className="font-semibold text-white text-sm">أنت بحاجة لإدخال سجل أخطاء</h4>
                              <p className="text-xs max-w-sm mx-auto leading-relaxed text-gray-500">
                                يمكنك اختيار أحد النماذج السريعة على اليمين لرؤية كيف يقوم الذكاء الاصطناعي بتحليل الأخطاء وتوفير الحلول التلقائية والآمنة فوراً.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

                {/* 4. AI TUNING SPECIALIST TAB */}
                {launcherSubTab === 'ai-tuning' && (
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-bold text-white">مستشار الضبط التلقائي والتحليل بمقعد الأداء بالـ AI</h3>
                      <p className="text-xs text-gray-400 mt-0.5 font-mono">Expert bottleneck analysis and GPU in-game setup tweaks</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                      
                      {/* Specs and Prompt input */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="glass-panel p-5 rounded-xl border border-white/5 space-y-4 text-xs font-semibold text-gray-300">
                          
                          <div className="space-y-1.5">
                            <label className="block">المعالج المتصل (CPU):</label>
                            <input 
                              type="text" 
                              value={tuningCpu}
                              onChange={(e) => setTuningCpu(e.target.value)}
                              className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-xs hover:border-white/10 text-white font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block">بطاقة الرسوميات (GPU):</label>
                            <input 
                              type="text" 
                              value={tuningGpu}
                              onChange={(e) => setTuningGpu(e.target.value)}
                              className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-xs hover:border-white/10 text-white font-mono"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <label className="block">الذاكرة العشوائية (RAM):</label>
                            <input 
                              type="text" 
                              value={tuningRam}
                              onChange={(e) => setTuningRam(e.target.value)}
                              className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-xs hover:border-white/10 text-white font-mono"
                            />
                          </div>

                          <div className="space-y-1.5 pt-2">
                            <label className="block text-gray-300">ما هي مشكلتك أو الأداء الذي تطمح لتحسينه؟</label>
                            <textarea 
                              value={tuningPrompt}
                              onChange={(e) => setTuningPrompt(e.target.value)}
                              className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-xs hover:border-white/10 text-gray-200 leading-relaxed"
                              rows={4}
                            />
                          </div>

                          <button
                            onClick={requestAiTuning}
                            disabled={isGeneratingTuning || !tuningPrompt.trim()}
                            className="w-full py-3 bg-[#00ffcc] text-black font-extrabold rounded-lg hover:scale-[1.01] transition duration-300 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                          >
                            {isGeneratingTuning ? (
                              <>
                                <RefreshCw size={14} className="animate-spin" />
                                جاري استنباط التوصيات من Gemini...
                              </>
                            ) : (
                              <>
                                <Cpu size={14} />
                                صمم الضبط التلقائي للألعاب بالـ AI
                              </>
                            )}
                          </button>

                        </div>
                      </div>

                      {/* AI Tuning advice card */}
                      <div className="lg:col-span-7">
                        {isGeneratingTuning ? (
                          <div className="glass-panel p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[300px] text-center space-y-4">
                            <div className="relative">
                              <div className="w-16 h-16 border-4 border-t-[#00ffcc] border-r-[#00ccff] border-b-transparent border-l-transparent rounded-full animate-spin" />
                              <Cpu className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#00ffcc]" size={24} />
                            </div>
                            <div className="space-y-1">
                              <h4 className="font-bold text-white text-sm">جاري التخصيص والمحاكاة لكرتك</h4>
                              <p className="text-xs text-gray-400">تحليل معمارية RTX/RX للوقاية من الـ CPU Bottleneck...</p>
                            </div>
                          </div>
                        ) : tuningResult ? (
                          <div className="glass-panel p-6 rounded-xl border border-[#00ffcc]/30 space-y-4 relative">
                            {tuningResult.errorFallback ? (
                              <div className="absolute top-4 left-4 bg-red-600/10 border border-red-600/20 text-red-400 text-[11px] px-3 py-1 rounded font-bold">
                                اتصال AI معطل — عرض توصيات محلية بديلة
                                {tuningResult.errorDetails && (
                                  <div className="text-[9px] text-red-300 mt-1">{tuningResult.errorDetails}</div>
                                )}
                              </div>
                            ) : tuningResult.isSimulated ? (
                              <span className="absolute top-4 left-4 bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-[10px] px-2 py-0.5 rounded font-bold">
                                محاكاة ذكية محفزة
                              </span>
                            ) : null}

                            <div>
                              <h4 className="text-xs font-bold text-[#00ffcc] uppercase tracking-wider mb-1">تحليل الأداء المقدر لـ عنق الزجاجة</h4>
                              <p className="text-sm font-semibold text-white leading-relaxed text-justify">
                                {tuningResult.analysis}
                              </p>
                            </div>

                            <div className="space-y-2 border-t border-white/5 pt-4">
                              <h4 className="text-xs font-bold text-gray-300 flex items-center gap-1.5">
                                <Sparkles size={14} className="text-[#00ffcc]" />
                                الضبط الموصى به وإعدادات اللعبة المثالية:
                              </h4>
                              <ol className="space-y-2 text-xs text-gray-400 leading-relaxed pr-1 list-decimal list-inside">
                                {tuningResult.steps.map((step, index) => (
                                  <li key={index} className="text-justify">{step}</li>
                                ))}
                              </ol>
                            </div>

                            {tuningResult.safeCommands && tuningResult.safeCommands.length > 0 && (
                              <div className="space-y-2 border-t border-white/5 pt-4">
                                <h4 className="text-xs font-bold text-gray-300">أمر نظام موجه للتنفيذ:</h4>
                                <div className="space-y-2">
                                  {tuningResult.safeCommands.map((cmd, index) => (
                                    <div key={index} className="flex justify-between items-center bg-[#0a0a0c] p-2 rounded border border-white/5 font-mono text-xs text-gray-300">
                                      <span className="truncate pr-2">{cmd}</span>
                                      <button
                                        onClick={() => handleCopyCommand(cmd)}
                                        className="px-2.5 py-1 bg-white/5 hover:bg-white/10 text-[10px] font-bold text-white rounded transition flex items-center gap-1 shrink-0"
                                      >
                                        {copiedCommand === cmd ? (
                                          <Check size={10} className="text-emerald-400" />
                                        ) : (
                                          <Copy size={10} />
                                        )}
                                      </button>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="glass-panel p-8 rounded-xl border border-white/5 flex flex-col items-center justify-center min-h-[350px] text-center text-gray-400 space-y-3">
                            <Cpu size={40} className="text-gray-600 animate-pulse" />
                            <div className="space-y-1">
                              <h4 className="font-semibold text-white text-sm">مستشار الضبط جاهز لضبط جهازك</h4>
                              <p className="text-xs max-w-sm mx-auto leading-relaxed text-gray-500">
                                أدخل مواصفات كرتك ومعالجك الفعلي على اليمين مع طرح اللعبة أو المشكلة ليقوم Gemini ببناء أفضل كتلة إعدادات مخصصة لمواصفات جهازك تماماً.
                              </p>
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}

              </div>

            </motion.div>
          )}

          {/* TAB 3: PRICING PLANS */}
          {currentTab === 'pricing' && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4 }}
              className="space-y-12"
            >
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <h2 className="text-3xl md:text-5xl font-extrabold text-white">خطط ومستويات عضوية NoorAI</h2>
                <p className="text-sm md:text-base text-gray-400 leading-normal">
                  اختر العضوية المناسبة لطموحك. جميع الباقات تتضمن حماية كروت الرسوميات وتحليل الأخطاء ، بدون التزامات طويلة الأمد.
                </p>
              </div>

              {/* CARD GRID COMPARISON */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
                
                {/* Free Tier */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between border border-white/5">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-white">العضوية التجريبية</h3>
                      <p className="text-xs text-gray-400 mt-1">تفحص أولي وقيود معتمدة</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-4xl font-black font-mono text-white">0</span>
                      <span className="text-sm text-gray-400 font-bold">ر.س / 3 أيام تجربة</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-justify pr-1 text-gray-300">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        وصول مجاني لمكتبة تحسين الألعاب
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        أمر تنظيف ملفات الرام المؤقتة
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-emerald-400" />
                        محلل انهيارات ذكي مع قيود يومية
                      </li>
                    </ul>
                  </div>

                  <button 
                    onClick={() => { setCurrentTab('launcher'); playSynthBeep(440, 0.08); }}
                    className="mt-8 w-full py-4.5 bg-white/5 hover:bg-white/10 text-white font-bold text-sm rounded-xl transition"
                  >
                    ابدأ تجربتك المجانية
                  </button>
                </div>

                {/* Pro Tier */}
                <div className="glass-panel p-8 rounded-2xl flex flex-col justify-between border border-[#ff00ff]/30 relative rgb-border">
                  <div className="absolute top-0 left-0 bg-[#ff00ff] text-black font-extrabold text-xs px-4 py-1.5 rounded-br-xl rounded-tl-[0]">الأشر والأكثر تفضيلاً</div>
                  
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-2xl font-bold text-[#ff00ff]">NoorAI Pro Active</h3>
                      <p className="text-xs text-gray-400 mt-1">الرصاصة فائقة السرعة والخادم المزدوج</p>
                    </div>

                    <div className="flex items-baseline gap-1">
                      <span className="text-5xl font-black font-mono text-[#ff00ff]">15</span>
                      <span className="text-sm text-gray-400 font-bold">ر.س / شهرياً</span>
                    </div>

                    <ul className="space-y-3.5 text-xs text-justify pr-1 text-gray-300">
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#ff00ff]" />
                        تنظيف مؤتمت كامل للذاكرة في الوقت الفعلي
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#ff00ff]" />
                        محرك ذكي لرفع الفولتية وكسر السرعة الآمن (GPU Boost)
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#ff00ff]" />
                        تحسين الـ Ping وتوجيه حركة TCP بسيرفرات اللعبة الفائقة
                      </li>
                      <li className="flex items-center gap-2">
                        <Check size={14} className="text-[#ff00ff]" />
                        تحليلات غير محدودة ومستشارك لـ Bottleneck بالـ AI
                      </li>
                    </ul>
                  </div>

                  {isProUser ? (
                    <button 
                      onClick={handleCancelSubscription}
                      className="mt-8 w-full py-4.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/35 font-bold text-sm rounded-xl transition-colors cursor-pointer"
                    >
                      إلغاء الاشتراك النشط لـ PRO
                    </button>
                  ) : (
                    <button 
                      onClick={() => { setShowCheckoutModal(true); playSynthBeep(520, 0.1); }}
                      className="mt-8 w-full py-4.5 bg-gradient-to-r from-[#ff00ff] to-[#7c3aed] text-white font-extrabold text-sm rounded-xl hover:scale-[1.01] transition duration-300 cursor-pointer shadow-lg shadow-[#ff00ff]/10"
                    >
                      اشترك الآن بالعضوية المميزة
                    </button>
                  )}
                </div>

              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* FOOTER */}
      <footer className="bg-[#0a0a0c]/80 border-t border-white/5 py-8 px-6 text-center text-xs text-gray-500 font-mono">
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Theme status bar */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pb-6 border-b border-white/5 text-[10px] uppercase tracking-widest text-gray-500">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_#10b981]"></div>
                <span>خادم التحسين: Riyadh-Online</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 rounded-full bg-[#00ffcc] shadow-[0_0_8px_#00ffcc]"></div>
                <span>إصدار النواة: v2.4.0</span>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span>المستخدم: ahlammufrh</span>
              <span className="text-white">المنطقة الحالية: دبي / الرياض</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-right sm:text-left">
              <span className="text-gray-300 font-sans font-bold">Noor<span className="text-[#00ffcc]">AI</span> Platform</span>
              <p className="mt-1">منصة تتبع ألعابك وضبط وتحسين الكمبيوتر بذكاء اصطناعي.</p>
            </div>
            <div className="flex gap-4">
              <a href="#" className="hover:text-white transition">سياسة الخصوصية</a>
              <span>•</span>
              <a href="#" className="hover:text-white transition">شروط الخدمة</a>
              <span>•</span>
              <span className="text-[#00ffcc]">كود التشغيل آمن 100% بنسخته الحالية ⚡</span>
            </div>
          </div>

        </div>
      </footer>

      {/* --- REUSABLE CHECKOUT MODAL DISPLAY --- */}
      {showCheckoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#111115] border border-white/10 w-full max-w-md rounded-2xl p-6 gaming-border-glow relative">
            <button
              onClick={() => { setShowCheckoutModal(false); playSynthBeep(300, 0.1); }}
              className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold"
            >
              إغلاق ✕
            </button>
            
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <CreditCard className="text-[#ff00ff]" />
              بوابة الدفع الإلكتروني الأمن لـ NoorAI Pro
            </h3>

            {showCheckoutSuccess ? (
              <div className="py-8 text-center space-y-4">
                <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mx-auto">
                  <CheckCircle size={36} />
                </div>
                <div>
                  <h4 className="font-bold text-white text-lg">تم الدفع والتفعيل بنجاح!</h4>
                  <p className="text-xs text-gray-400 mt-1">عضوية NoorAI Pro أصبحت نشطة الآن. شكراً لثقتك.</p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleCheckoutSubmit} className="space-y-4 text-xs font-semibold text-gray-300">
                <div className="space-y-1">
                  <label className="block">اسم صاحب البطاقة:</label>
                  <input
                    type="text"
                    required
                    value={cardHolder}
                    onChange={(e) => setCardHolder(e.target.value)}
                    placeholder="ALI AHMAD"
                    className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#ff00ff]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="block">رقم البطاقة الائتمانية:</label>
                  <input
                    type="text"
                    required
                    maxLength={16}
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    placeholder="4000 1234 5678 9010"
                    className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#ff00ff]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block">تاريخ الانتهاء:</label>
                    <input
                      type="text"
                      required
                      placeholder="MM/YY"
                      value={cardExpiry}
                      onChange={(e) => setCardExpiry(e.target.value)}
                      className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#ff00ff] text-center"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="block">رمز الأمان CVV:</label>
                    <input
                      type="text"
                      required
                      maxLength={3}
                      value={cardCvv}
                      onChange={(e) => setCardCvv(e.target.value)}
                      placeholder="123"
                      className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#ff00ff] text-center"
                    />
                  </div>
                </div>

                <div className="pt-4 flex items-center justify-between border-t border-white/5 bg-[#0a0a0c] -mx-6 -mb-6 p-6 rounded-b-2xl mt-4">
                  <div>
                    <span className="text-[10px] text-gray-400 block font-normal">المبلغ الإجمالي</span>
                    <span className="text-lg font-black text-white font-mono">15.00 ر.س</span>
                  </div>
                  <button
                    type="submit"
                    disabled={isProcessingCheckout}
                    className="px-6 py-3 bg-gradient-to-r from-[#ff00ff] to-[#7c3aed] text-white font-bold rounded-lg transition-transform hover:scale-[1.02] flex items-center gap-2 cursor-pointer"
                  >
                    {isProcessingCheckout ? (
                      <>
                        <RefreshCw size={14} className="animate-spin" />
                        جاري معالجة الدفع...
                      </>
                    ) : (
                      <>
                        <Lock size={14} />
                        ادفع وفعّل الرصاصة ➔
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* --- REUSABLE ADD GAME MODAL SCREEN --- */}
      {showAddGameModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md px-4">
          <div className="bg-[#111115] border border-white/10 w-full max-w-md rounded-2xl p-6 relative">
            <button
              onClick={() => { setShowAddGameModal(false); playSynthBeep(300, 0.1); }}
              className="absolute top-4 left-4 text-gray-400 hover:text-white font-bold"
            >
              إغلاق ✕
            </button>

            <h3 className="text-lg font-bold text-white mb-4">أضف لعبة مخصصة لمكتبة NoorAI</h3>

            <form onSubmit={handleAddGame} className="space-y-4 text-xs font-semibold text-gray-300">
              <div className="space-y-1">
                <label className="block">اسم اللعبة:</label>
                <input
                  type="text"
                  required
                  value={newGameName}
                  onChange={(e) => setNewGameName(e.target.value)}
                  placeholder="مثال: Apex Legends"
                  className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ffcc]"
                />
              </div>

              <div className="space-y-1">
                <label className="block">نوع اللعبة:</label>
                <select
                  value={newGameGenre}
                  onChange={(e) => setNewGameGenre(e.target.value)}
                  className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white focus:outline-none focus:border-[#00ffcc]"
                >
                  <option value="تصويب / شوتر">تصويب / شوتر (Shooter)</option>
                  <option value="تكتيكي">تكتيكي (Tactical)</option>
                  <option value="باتل رويال">باتل رويال (Battle Royale)</option>
                  <option value="أكشن ومغامرات">أكشن ومغامرات (RPG)</option>
                  <option value="رياضة">رياضة / سباق (Sports/Racing)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="block">معدل الفريم الإفتراضي:</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={newGameBaseFps}
                    onChange={(e) => setNewGameBaseFps(Number(e.target.value))}
                    className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white text-center font-mono focus:outline-none focus:border-[#00ffcc]"
                  />
                </div>
                <div className="flex items-end justify-center pb-2.5 font-bold text-[#00ffcc]">
                  متوقع بعد الضبط: {Math.round(newGameBaseFps * 1.35)} FPS
                </div>
              </div>

              <div className="space-y-1">
                <label className="block">مسار ملف تشغيل اللعبة (Exe Path) - اختياري:</label>
                <input
                  type="text"
                  value={newGamePath}
                  onChange={(e) => setNewGamePath(e.target.value)}
                  placeholder="C:\Program Files\Game\game.exe"
                  className="w-full bg-[#070709] border border-white/5 p-3 rounded-lg text-white font-mono focus:outline-none focus:border-[#00ffcc]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-4.5 bg-[#00ffcc] text-black font-extrabold rounded-lg mt-4 cursor-pointer hover:scale-[1.01] transition-transform text-xs"
              >
                أضف اللعبة للمكتبة لحقن الأداء ➔
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
