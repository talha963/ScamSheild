import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Shield,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Send,
  AlertTriangle,
  RotateCcw,
  Volume2,
  Lock,
  Users,
  Smartphone,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertOctagon,
} from 'lucide-react';

interface Message {
  speaker: 'scammer' | 'citizen';
  text: string;
  timestamp: string;
}

export const ScamCallDemo: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      speaker: 'citizen',
      text: 'Assalam-o-Alaikum, Tariq speaking. Who is this?',
      timestamp: '00:02',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [callDuration, setCallDuration] = useState(2);
  const [isMuted, setIsMuted] = useState(false);
  const [isListening, setIsListening] = useState(false);

  // ScamShield Live Telemetry State
  const [riskScore, setRiskScore] = useState<number>(15);
  const [tier, setTier] = useState<number>(0);
  const [detectedTactics, setDetectedTactics] = useState<string[]>([]);
  const [evidencePhrases, setEvidencePhrases] = useState<string[]>([]);
  const [alertTriggered, setAlertTriggered] = useState<boolean>(false);
  const [vibrationActive, setVibrationActive] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Call timer simulation
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Voice synthesis helper
  const speakText = (text: string) => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 0.9;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Trigger vibration and voice alert when near 100%
  const triggerAlarm = () => {
    setAlertTriggered(true);
    setVibrationActive(true);

    // Physical device vibration if supported
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 600, 200, 800]);
    }

    // Audible alarm warning
    speakText('Warning! Cut the call immediately. The person on this call is a scammer.');

    // Stop intense vibration shake after 4 seconds
    setTimeout(() => {
      setVibrationActive(false);
    }, 4500);
  };

  // Send message to AI citizen
  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputText).trim();
    if (!text || loading) return;

    const userMessage: Message = {
      speaker: 'scammer',
      text,
      timestamp: formatTime(callDuration),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);

    try {
      // Call backend API
      const res = await fetch('/v1/demo/scam-call/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: newMessages.map((m) => ({
            speaker: m.speaker,
            text: m.text,
          })),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRiskScore(data.risk_score);
        setTier(data.tier);
        setDetectedTactics(data.detected_tactics || []);
        setEvidencePhrases(data.evidence_phrases || []);

        const citizenReply: Message = {
          speaker: 'citizen',
          text: data.ai_response,
          timestamp: formatTime(callDuration + 1),
        };
        setMessages((prev) => [...prev, citizenReply]);

        // Speak citizen response
        speakText(data.ai_response);

        // Check if alert should trigger
        if (data.alert_triggered || data.risk_score >= 85) {
          triggerAlarm();
        }
      } else {
        throw new Error('API Error');
      }
    } catch {
      // Offline fallback evaluation
      handleOfflineFallback(text, newMessages);
    } finally {
      setLoading(false);
    }
  };

  // Offline fallback if server is unreachable
  const handleOfflineFallback = (text: string, currentHistory: Message[]) => {
    const lower = text.toLowerCase();
    let reply = 'Arey beta, mera account kyun block hoga? Main ne to kuch nahi kiya.';
    let score = riskScore;
    const tactics = [...detectedTactics];

    // Language detection
    const isUrdu = /[\u0600-\u06FF]/.test(text);

    if (lower.includes('state bank') || lower.includes('fia') || lower.includes('police') || text.includes('اسٹیٹ بینک')) {
      if (!tactics.includes('Authority Impersonation')) tactics.push('Authority Impersonation');
      score = Math.max(score, 60);
      reply = isUrdu
        ? 'وعلیکم السلام، آپ کون سے ڈپارٹمنٹ سے بول رہے ہیں؟ میرا اکاؤنٹ کیوں بند ہوگا؟'
        : 'Walaikum Assalam, aap waqai State Bank se bol rahe hain? Mera account kyun band hoga?';
    }

    if (lower.includes('otp') || lower.includes('code') || lower.includes('pin') || text.includes('او ٹی پی')) {
      if (!tactics.includes('Credential & OTP Demand')) tactics.push('Credential & OTP Demand');
      score = 98;
      reply = isUrdu
        ? 'لیکن بھائی جان! میسج میں تو صاف لکھا ہے کہ او ٹی پی کسی کو نہ بتائیں۔ میں کیسے دے دوں؟'
        : 'Lekin beta! SMS me to saaf likha hai ke 6-digit OTP kisi ko share na karein. Main kaisay de doon?';
    } else if (lower.includes('block') || lower.includes('jail') || lower.includes('arrest') || lower.includes('foran')) {
      if (!tactics.includes('Manufactured Urgency')) tactics.push('Manufactured Urgency');
      score = Math.max(score, 80);
      reply = isUrdu
        ? 'خدا کا خوف کریں بھائی! پولیس کو مت بھیجیں، میں بزرگ آدمی ہوں۔ مجھے بتائیں کیا کروں؟'
        : 'Arey bhai police kyun ayegi? Khuda ka khauf karein, meri tabiat kharab ho rahi hai!';
    }

    setRiskScore(score);
    setDetectedTactics(tactics);
    setTier(score >= 85 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0);

    const citizenReply: Message = {
      speaker: 'citizen',
      text: reply,
      timestamp: formatTime(callDuration + 1),
    };
    setMessages([...currentHistory, citizenReply]);
    speakText(reply);

    if (score >= 85) {
      triggerAlarm();
    }
  };

  // Speech Recognition (Mic voice typing)
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. Please type your message.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ur-PK'; // Urdu / English mix

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleSendMessage(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const handleReset = () => {
    setMessages([
      {
        speaker: 'citizen',
        text: 'Assalam-o-Alaikum, Tariq speaking. Who is this?',
        timestamp: '00:02',
      },
    ]);
    setRiskScore(15);
    setTier(0);
    setDetectedTactics([]);
    setEvidencePhrases([]);
    setAlertTriggered(false);
    setVibrationActive(false);
    setCallDuration(2);
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pre-configured scam phrases for quick 1-tap testing
  const quickScamTests = [
    {
      label: '1. State Bank Impersonation',
      text: 'Assalam-o-Alaikum, main State Bank security se bol raha hoon. Aap ka account block ho raha hai.',
    },
    {
      label: '2. Urgency & Panic',
      text: 'Aap ka ATM card aglay 5 minute me freeze ho jayega aur police case banega!',
    },
    {
      label: '3. OTP Theft (Triggers Alarm)',
      text: 'Jaldi se apna 6-digit OTP code batayein jo abhi phone pe aya hai warna account band!',
    },
    {
      label: '4. اردو میں کوڈ مانگیں',
      text: 'فوری طور پر اپنے موبائل پر آیا ہوا 6 ہندسوں کا کوڈ بتائیں تاکہ اکاؤنٹ بحال ہو سکے!',
    },
    {
      label: '5. English Customs Police Raid',
      text: 'This is Federal Investigation Agency. Wire Rs. 50,000 fine immediately to avoid arrest.',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Banner explaining the Role-Play */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50 via-indigo-50 to-emerald-50 dark:from-slate-900 dark:via-blue-950/40 dark:to-slate-900 border border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-md shadow-blue-600/30">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Scam Call Simulator • Role-Play Arena
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                You Act As Scammer
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5">
              Talk or type what a scammer says in <strong>Urdu, Roman Urdu, or English</strong>. Watch how ScamShield detects the scam and stops the theft!
            </p>
          </div>
        </div>

        <button
          onClick={handleReset}
          className="px-3.5 py-2 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shrink-0 shadow-xs"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Restart Call</span>
        </button>
      </div>

      {/* Main Split Grid: Guardian HUD + Active Call Phone Screen */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ================================================================ */}
        {/* LEFT: SCAMSHIELD LIVE GUARDIAN DETECTION HUD (7 Cols)            */}
        {/* ================================================================ */}
        <div className="lg:col-span-7 space-y-4">
          {/* Real-time Risk Telemetry Box */}
          <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                  ScamShield Live Detection Gauge
                </h3>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold ${
                  riskScore >= 85
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                    : riskScore >= 60
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {riskScore >= 85
                  ? 'TIER 3 • HARD FRAUD'
                  : riskScore >= 60
                  ? 'TIER 2 • WARNING'
                  : riskScore >= 30
                  ? 'TIER 1 • CAUTION'
                  : 'TIER 0 • NORMAL'}
              </span>
            </div>

            {/* Visual Risk Meter */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Scam Likelihood:</span>
                <span
                  className={`text-base font-black font-mono ${
                    riskScore >= 85
                      ? 'text-rose-600 dark:text-rose-400'
                      : riskScore >= 60
                      ? 'text-amber-600 dark:text-amber-400'
                      : 'text-emerald-600 dark:text-emerald-400'
                  }`}
                >
                  {riskScore}%
                </span>
              </div>
              <div className="w-full h-3.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    riskScore >= 85
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600 shadow-md shadow-rose-500/50'
                      : riskScore >= 60
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>
            </div>

            {/* Detected Scam Conditions from Documentation */}
            <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <span className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider block">
                Detected Scam Conditions:
              </span>
              {detectedTactics.length === 0 ? (
                <p className="text-xs text-slate-400 dark:text-slate-500 italic">
                  No scam tactics detected yet. Speak or type like a scammer to test conditions.
                </p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {detectedTactics.map((tactic, idx) => (
                    <span
                      key={idx}
                      className="px-2.5 py-1 rounded-lg text-xs font-bold bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300 flex items-center gap-1 shadow-xs"
                    >
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
                      <span>{tactic}</span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Simulated Circuit-Breaker Status */}
            <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Bank Account Rail:
                </span>
                <span className="font-bold flex items-center gap-1 mt-0.5">
                  {riskScore >= 85 ? (
                    <span className="text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      <Lock className="w-3.5 h-3.5" /> Frozen (Rs. 85,000 Safe)
                    </span>
                  ) : (
                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Active & Monitored
                    </span>
                  )}
                </span>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 block font-medium">
                  Family WhatsApp Circle:
                </span>
                <span className="font-bold flex items-center gap-1 mt-0.5">
                  {riskScore >= 85 ? (
                    <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" /> Priority Alert Dispatched
                    </span>
                  ) : (
                    <span className="text-slate-500 dark:text-slate-400">Standby</span>
                  )}
                </span>
              </div>
            </div>
          </div>

          {/* Quick-Tap Scammer Suggestions */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              <Zap className="w-4 h-4 text-amber-500" />
              <span>Quick Scammer Test Prompts (1-Tap Test):</span>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {quickScamTests.map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(item.text)}
                  disabled={loading}
                  className="p-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 text-xs transition-all cursor-pointer group disabled:opacity-50"
                >
                  <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 block">
                    {item.label}
                  </span>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                    "{item.text}"
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ================================================================ */}
        {/* RIGHT: THE SMARTPHONE CALL SCREEN WITH SCREEN SHAKE (5 Cols)     */}
        {/* ================================================================ */}
        <div className="lg:col-span-5 relative">
          <div
            className={`w-full rounded-3xl bg-white dark:bg-slate-900 border-2 shadow-2xl p-4 sm:p-5 flex flex-col justify-between min-h-[580px] transition-all duration-300 ${
              vibrationActive
                ? 'border-rose-500 shadow-rose-500/30 animate-[shake_0.5s_infinite]'
                : alertTriggered
                ? 'border-rose-500 dark:border-rose-500'
                : 'border-slate-200 dark:border-slate-800'
            }`}
          >
            {/* Phone Top Speaker & Call Time */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-[11px] font-medium text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="font-mono text-slate-700 dark:text-slate-300 font-bold">
                  {formatTime(callDuration)}
                </span>
              </div>
              <div className="w-16 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
              <span className="text-blue-600 dark:text-blue-400 font-bold">● Active Call</span>
            </div>

            {/* Caller Profile Header */}
            <div className="py-4 text-center border-b border-slate-100 dark:border-slate-800 space-y-2">
              <div className="relative inline-block">
                <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-blue-100 to-indigo-100 dark:from-slate-800 dark:to-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 mx-auto font-black text-xl border-2 border-slate-200 dark:border-slate-700">
                  UT
                </div>
                {loading && (
                  <span className="absolute inset-0 rounded-full border-2 border-blue-500 animate-ping opacity-75" />
                )}
              </div>
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">
                  Uncle Tariq (Citizen)
                </h4>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Normal Citizen • Speaking via Phone
                </p>
              </div>

              {/* Animated Speaking Waveform */}
              {loading && (
                <div className="flex items-center justify-center gap-1 h-5 pt-1">
                  <div className="w-1 bg-blue-500 rounded-full wave-bar-1" />
                  <div className="w-1 bg-blue-600 rounded-full wave-bar-2" />
                  <div className="w-1 bg-blue-400 rounded-full wave-bar-3" />
                  <div className="w-1 bg-blue-600 rounded-full wave-bar-4" />
                  <div className="w-1 bg-blue-500 rounded-full wave-bar-5" />
                </div>
              )}
            </div>

            {/* Conversation Messages Stream */}
            <div className="flex-1 overflow-y-auto py-3 space-y-3 max-h-72 pr-1 no-scrollbar text-xs">
              {messages.map((m, idx) => {
                const isScammer = m.speaker === 'scammer';
                return (
                  <div
                    key={idx}
                    className={`flex flex-col ${isScammer ? 'items-end' : 'items-start'}`}
                  >
                    <span className="text-[10px] text-slate-400 mb-0.5 px-1">
                      {isScammer ? 'You (Scammer)' : 'Uncle Tariq'} • {m.timestamp}
                    </span>
                    <div
                      className={`p-3 rounded-2xl max-w-[85%] leading-relaxed ${
                        isScammer
                          ? 'bg-blue-600 text-white rounded-tr-xs shadow-xs'
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 rounded-tl-xs border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      {m.text}
                    </div>
                  </div>
                );
              })}
              {loading && (
                <div className="flex flex-col items-start">
                  <span className="text-[10px] text-slate-400 mb-0.5">Uncle Tariq is speaking...</span>
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-500 text-xs italic">
                    Listening and responding...
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* 100% FRAUD VIBRATION & ALARM MODAL OVERLAY */}
            {alertTriggered && (
              <div className="p-4 rounded-2xl bg-rose-600 text-white space-y-3 my-2 animate-bounce shadow-xl">
                <div className="flex items-center gap-2">
                  <AlertOctagon className="w-6 h-6 shrink-0 animate-spin" />
                  <div>
                    <h5 className="font-black text-sm uppercase tracking-wide">
                      🚨 CUT THE CALL! THIS IS A SCAMMER!
                    </h5>
                    <p className="text-xs font-serif font-bold text-rose-100 mt-0.5">
                      فوری طور پر کال کاٹ دیں! دوسری طرف بات کرنے والا فراڈیا ہے!
                    </p>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-rose-700/80 text-[11px] space-y-1">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>ShieldPay Lock Engaged: Rs. 85,000 kept safe</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span>WhatsApp alert sent to family</span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleReset}
                    className="flex-1 py-2 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 cursor-pointer shadow-sm text-center"
                  >
                    Hang Up & Restart Test
                  </button>
                  <button
                    onClick={() => speakText('Warning! Cut the call immediately. This person is a scammer.')}
                    className="p-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white cursor-pointer"
                    title="Replay Voice Siren Warning"
                  >
                    <Volume2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Input Bar: Microphone + Text + Send */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <button
                  type="button"
                  onClick={toggleListening}
                  className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                    isListening
                      ? 'bg-rose-500 text-white animate-pulse'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                  }`}
                  title={isListening ? 'Listening... click to stop' : 'Click to speak using your microphone'}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </button>

                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Type as scammer (Urdu or English)..."
                  disabled={loading}
                  className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                />

                <button
                  type="submit"
                  disabled={loading || !inputText.trim()}
                  className="p-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white cursor-pointer transition-all shadow-xs"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
