import express from "express";
import path from "path";
import fs from "fs";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // JSON Body Parser
  app.use(express.json());

  // Initialize Gemini if key exists
  let aiClient: GoogleGenAI | null = null;
  const apiKey = process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      aiClient = new GoogleGenAI({
        apiKey: apiKey,
        httpOptions: {
          headers: {
            "User-Agent": "aistudio-build",
          },
        },
      });
      console.log("NoorAI Server: GoogleGenAI client initialized successfully.");
    } catch (e) {
      console.error("NoorAI Server: Failed to initialize GoogleGenAI:", e);
    }
  } else {
    console.warn("NoorAI Server: GEMINI_API_KEY is not defined. Using smart local simulator.");
  }

  // --- API ENDPOINTS ---

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mode: aiClient ? "live" : "simulation", time: new Date().toISOString() });
  });

  // Crash Log Analyzer API
  app.post("/api/optimize", async (req, res) => {
    const { logText, gameName } = req.body;

    if (!logText) {
      return res.status(400).json({ success: false, error: "يجب تقديم نص السجل للتحليل" });
    }

    // fallback simulation system if Gemini API Key not found
    if (!aiClient) {
      // Intelligent mock responses depending on the log keywords
      let analysis = "لم يتم الكشف عن نمط محدد، ولكن يوصى بتحسين عمليات النظام وتحديث برامج التشغيل.";
      let steps = [
        "قم بتحديث برامج التشغيل للرسوميات (Nvidia GFE / AMD Adrenalin) إلى أحدث إصدار مستقر.",
        "تأكد من تفعيل وضع الألعاب (Game Mode) في إعدادات نظام Windows 10/11.",
        "قم بتشغيل اللعبة كمسؤول (Run as Administrator) لضمان الصلاحيات الكاملة."
      ];
      let safeCommands = ["sfc /scannow", "ipconfig /flushdns"];

      const textLower = logText.toLowerCase();
      if (textLower.includes("dxgi_error_device_removed") || textLower.includes("apex")) {
        analysis = "تم رصد انهيار كرت الشاشة (DXGI Device Removed). يحدث هذا عادة بسبب رفع كسر سرعة الكرت (Overclock) غير المستقر، أو بسبب سحب طاقة غير كافٍ، أو حرارة مفرطة عند الرندر.";
        steps = [
          "إلغاء أي كسر سرعة لكرت الشاشة (GPU Core/Memory Overclock) عبر MSI Afterburner.",
          "تخفيض سقف استهلاك الطاقة (Power Limit) إلى 95% لضمان استقرار الفولتية.",
          "تشغيل أداة Display Driver Uninstaller (DDU) في الوضع الآمن وتثبيت تعريف Nvidia رقم 551.23 النظيف.",
          "تحويل وضع ترشيد الطاقة في لوحة NVIDIA إلى (Prefer Maximum Performance)."
        ];
        safeCommands = ["nvidia-smi -lgc 1900,1900"];
      } else if (textLower.includes("vanguard") || textLower.includes("van9001") || textLower.includes("secure boot") || textLower.includes("valorant")) {
        analysis = "خطأ روت فارد (VAN9001) لمنع الغش. يشير هذا إلى عدم مطابقة شروط حماية Windows 11؛ حيث يتطلب تشغيل مكافحة الغش تفعيل تقنية الآمان UEFI Secure Boot وحزمة TPM 2.0 في إعدادات اللوحة الأم BIOS.";
        steps = [
          "قم بإعادة تشغيل الكمبيوتر والدخول إلى الـ BIOS بالضغط المتكرر على Del أو F2.",
          "توجه إلى خيار Security أو Boot وابحث عن (Secure Boot) وقم بتفعيله وتحويله إلى Enabled.",
          "تأكد من تفعيل شريحة الأمن (Platform Trust Technology - PTT) لمعالجات Intel، أو (AMD fTPM) لمعالجات AMD.",
          "احفظ الإعدادات بالضغط على F10 وأعد تشغيل النظام لتشغيل اللعبة."
        ];
        safeCommands = ["powershell.exe Get-SecureBootUID"];
      } else if (textLower.includes("vram") || textLower.includes("memory") || textLower.includes("out of video memory") || textLower.includes("d3d12")) {
        analysis = "فشل في تخصيص الذاكرة الرسومية (VRAM Out of Memory). يحدث هذا عند تشغيل اللعبة بأنسجة رسومية (Textures) أعلى من استيعاب الذاكرة الفيزيائية للكرت، مع عدم كفاية ملف الترحيل (PageFile) في الويندوز.";
        steps = [
          "قم بخفض دقة تفاصيل الأنسجة (Texture Quality) في إعدادات اللعبة من Ultra إلى High أو Medium.",
          "تفعيل تقنيات توليد الإطارات لخفض التخصيص الرسومي مثل (DLSS / FSR Performance Mode).",
          "زيادة حجم ملف الترحيل في ويندوز (Virtual Memory PageFile) على قرص SSD ليصبح بحجم يدوي مبدئي 12288MB كحد أدنى.",
          "إغلاق أي متصفحات أو برامج ثقيلة في الخلفية (مثل Discord مع تسريع رسومي، أو Chrome) أثناء اللعب."
        ];
        safeCommands = ["SystemPropertiesAdvanced.exe"];
      } else if (textLower.includes("stutter") || textLower.includes("frametime") || textLower.includes("lag")) {
        analysis = "عدم استقرار الفريمات وتقطعات مفاجِئة (Micro-stuttering) ناتج عن ارتفاع مؤقت في زمن استجابة نظام جدولة ويندوز (DPC Latency) أو استقرار المعالج نتيجة لمهام في الخلفية سرقت المعالجة.";
        steps = [
          "تشغيل أداة NoorAI المدمجة لتفريغ الذاكرة المؤقتة للرام دورياً (Standby List Cleaner).",
          "إيقاف تشغيل ميزة تحديد المواقع والخرائط وتأثيرات الشفافية في ويندوز لتوفير كفاءة المعالج.",
          "تحديث برنامج تعريف كرت شبكتك وإيقاف خيارات الموفر للطاقة في الـ Driver لتقليل الـ Latency.",
          "استخدام بروتوكول تحسين المعالج وتعيين أولوية اللعبة إلى 'عالي' (High Priority)."
        ];
        safeCommands = ["powercfg -duplicatescheme e9a42b02-d5df-448d-aa00-03f14749eb61"];
      }

      return res.json({
        success: true,
        isSimulated: true,
        analysis,
        steps,
        safeCommands
      });
    }

    try {
      // Live Gemini analysis
      const systemInstruction = `أنت الخبير التقني ومحلل الأنظمة الذكي "نور آي" (NoorAI).
مهمتك هي تحليل سجلات أخطاء الألعاب (Crash Logs) أو تشخيص مشاكل الأداء وتقطيع الإطارات (Stuttering/FPS) بدقة احترافية بالغة ومقنعة جداً.
يجب أن تركز النصائح على حلول عملية حقيقية لنظام Windows والإعدادات الرسومية، والتعامل مع برامج التشغيل والـ Registry وإعدادات BIOS (مثل Secure Boot و TPM).

قم بصياغة النتيجة بتسلسل أنيق مستخدماً لغة عربية سليمة ومحفزة وصديقة للاعبين، وبصيغة JSON تطابق الهيكل التالي تماماً وبدون أي أحرف زائدة خارجية أو علامات Markdown:
{
  "analysis": "تحليل مختصر وملخص جدا لسبب المشكلة بلغة عربية مبسطة وموضوعية ومفهومة للاعب",
  "steps": [
    "الخطوة الأولى العملية (مثال: تحديث برنامج تشغيل كرت الشاشة إلى النسخة المستقرة)",
    "الخطوة الثانية العملية...",
    "الخطوة الثالثة العملية..."
  ],
  "safeCommands": [
    "أمر CMD أو PowerShell آمن ومفيد للمساعدة في حل المشكلة (مثلاً: sfc /scannow)"
  ]
}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `قم بتحليل السجل التالي للعبة ${gameName || "غير محددة"}:\n\n${logText}`,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.2,
        },
      });

      const responseText = response.text || "{}";
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return res.json({
        success: true,
        isSimulated: false,
        analysis: parsed.analysis || "تم تحليل السجل بنجاح.",
        steps: parsed.steps || ["تحقق من إعدادات كرت الشاشة وسجل الأخطاء"],
        safeCommands: parsed.safeCommands || []
      });
    } catch (e: any) {
      console.error("Gemini optimization error:", e);
      return res.status(500).json({
        success: false,
        error: "حدث خطأ أثناء الاتصال بالذكاء الاصطناعي لوصايا التحسين",
        details: e.message
      });
    }
  });

  // System Specification & Expert Tuning API
  app.post("/api/tuning", async (req, res) => {
    const { cpu, gpu, ram, prompt } = req.body;

    if (!cpu || !gpu || !ram) {
      return res.status(400).json({ success: false, error: "يجب إدخال المعالج والكرت وحجم الرام" });
    }

    if (!aiClient) {
      // Smart simulation response for spec-tuning
      const response = {
        success: true,
        isSimulated: true,
        analysis: `بناءً على المعالج (${cpu}) وكرت الشاشة (${gpu}) مع (${ram} رامات)، فإن جهازك يتميز بقدرات جيدة جداً. عنق الزجاجة المتوقع منعدم في دقة 1080p ولكن يمكن للمشغلات والخدمات الجانبية أن تسبب تقطعات أثناء اللعب المكثف.`,
        steps: [
          `تفعيل ميزة جدولة المعالج الرسومي المسرعة للأجهزة (Hardware-Accelerated GPU Scheduling) في إعدادات شاشة ويندوز لكرت ${gpu}.`,
          "في لوحة NVIDIA Control Panel، اضبط تفضيل تصفية الأنسجة على (Quality) ومعدل الاستجابة المنخفض على (Ultra).",
          "تعيين الحد الأقصى لمعدل الإطارات عند 3 فريمات أقل من معدل تحديث شاشتك (Refresh Rate) لتجنب الارتجاج وتأخر الإدخال.",
          "تعديل ملف تخفيض الذاكرة لكي يتم تنظيف العمليات عند بلوغ سقف الـ 80%."
        ],
        safeCommands: [
          "sfc /scannow", 
          "powercfg -setactive 8c5e7fda-e8bf-4a96-9a85-a6e23a8c635c"
        ]
      };
      return res.json(response);
    }

    try {
      const systemInstruction = `أنت مهندس الأداء المتقدم ومحلل عنق الزجاجة لجمهور اللاعبين "نور آي" (NoorAI). مهمتك هي تقديم نصائح مخصصة بالكامل وضبط متطور للألعاب (Game Optimization & Bottleneck analysis) بناءً على مواصلات جهاز اللاعب والسؤال الذي طرحه.
يجب أن تقدم قيماً دقيقة وموثوقة لتهيئة إعدادات اللعبة (In-game settings) وإعدادات لوحة التحكم للكرت (Nvidia/AMD Control Panel) وضبط نظام التشغيل.

قم بالاستجابة باللغة العربية بأسلوب احترافي ومقنع جداً للجيمر وصيغة JSON تطابق الهيكل التالي تماماً وبدون أي أحرف خارجية أو علامات Markdown:
{
  "analysis": "تحليل الأداء المتوقع لجهاز اللاعب بناءً على الكرت والمعالج وشرح عن عنق الزجاجة (Bottleneck) بطريقة مبسطة، وتحديد إذا كانت المشكلة برمجية أو فيزياوية",
  "steps": [
    "إعدادات اللعبة أو لوحة التحكم المثالية (مثال: تفعيل NVIDIA Reflex Low Latency وضبطه على On+Boost)",
    "نصيحة نظام تشغيل مخصصة لمواصفات المعالج والرام للتطوير والتسريع",
    "توصيات حل مشكلة اللاعب المعروضة في سؤاله بدقة"
  ],
  "safeCommands": [
    "أوامر CMD أو PowerShell آمنة لتحسين الأداء أو فحص وتطهير التخزين"
  ]
}`;

      const userPrompt = `مواصفات جهازي:
المعالج: ${cpu}
كرت الشاشة: ${gpu}
حجم الرامات: ${ram}
شكوكي / سؤالي: ${prompt || "كيف أحصل على أفضل أداء للـ FPS والـ Ping؟"}`;

      const response = await aiClient.models.generateContent({
        model: "gemini-3.5-flash",
        contents: userPrompt,
        config: {
          systemInstruction,
          responseMimeType: "application/json",
          temperature: 0.3,
        },
      });

      const responseText = response.text || "{}";
      const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
      const parsed = JSON.parse(cleanJson);

      return res.json({
        success: true,
        isSimulated: false,
        analysis: parsed.analysis || "تم تحليل مواصفات جهازك بنجاح.",
        steps: parsed.steps || ["تحقق من برامج تشغيل كرت الشاشة والحرارة"],
        safeCommands: parsed.safeCommands || []
      });
    } catch (e: any) {
      console.error("Gemini spec-tuning error:", e);
      return res.status(500).json({
        success: false,
        error: "حدث خطأ أثناء إجراء الضبط والتحليل مع الذكاء الاصطناعي",
        details: e.message
      });
    }
  });

  // Serve static assets or use development server
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("NoorAI Server: Mounted Vite development middleware.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log(`NoorAI Server: Serving production static assets from ${distPath}`);
  }

  // Serve launcher installers (keeps website unchanged; exposes /downloads/<file>)
  const downloadsPath = path.join(process.cwd(), 'launcher', 'dist');
  if (fs.existsSync(downloadsPath)) {
    app.use('/downloads', express.static(downloadsPath));
    console.log(`NoorAI Server: Serving launcher installers from ${downloadsPath}`);
  } else {
    app.get('/downloads/:file', (req, res) => {
      res.status(404).send('Installer not available yet');
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`NoorAI Live Platform running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error("NoorAI Server startup failure:", err);
});
