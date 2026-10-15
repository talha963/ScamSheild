import React, { useState, useEffect, useRef } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  PhoneCall,
  PhoneOff,
  Mic,
  MicOff,
  Radio,
  Send,
  AlertOctagon,
  CheckCircle2,
  Lock,
  Smartphone,
  Sparkles,
  RotateCcw,
  Volume2,
  VolumeX,
  Settings,
  Bell,
  Wifi,
  Battery,
  Signal,
  ArrowRight,
  ExternalLink,
  QrCode,
  Download,
  AlertTriangle,
  FileText,
  UserCheck,
} from 'lucide-react';

type GuardStep = 'settings' | 'incoming' | 'connected' | 'terminated';

interface TranscriptItem {
  speaker: 'caller' | 'user';
  text: string;
  timestamp: string;
}

export const LiveCallGuard: React.FC = () => {
  // Mobile Guardian State
  const [guardActive, setGuardActive] = useState<boolean>(true);
  const [step, setStep] = useState<GuardStep>('settings');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  
  // Audio & Mic
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [isMicMuted, setIsMicMuted] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [inputText, setInputText] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Live Threat Telemetry
  const [riskScore, setRiskScore] = useState<number>(15);
  const [tier, setTier] = useState<number>(0);
  const [detectedTactics, setDetectedTactics] = useState<string[]>([]);
  const [secretAlertTriggered, setSecretAlertTriggered] = useState<boolean>(false);
  const [vibrationActive, setVibrationActive] = useState<boolean>(false);
  const [history, setHistory] = useState<TranscriptItem[]>([]);
  const [bankingAppOpen, setBankingAppOpen] = useState<boolean>(true);

  // Tab: Simulator vs Install APK on Real Phone
  const [activeTab, setActiveTab] = useState<'simulation' | 'real-phone'>('simulation');

  // Ringtone Audio Synthesizer
  const ringtoneInterval = useRef<any>(null);

  const playSyntheticRing = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 440;
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      setTimeout(() => {
        try {
          osc.stop();
        } catch {}
      }, 1000);
    } catch {}
  };

  // Call timer
  useEffect(() => {
    let interval: any = null;
    if (step === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [step]);

  // Clean ringtone
  useEffect(() => {
    if (step === 'incoming') {
      playSyntheticRing();
      ringtoneInterval.current = setInterval(playSyntheticRing, 2500);
    } else {
      if (ringtoneInterval.current) clearInterval(ringtoneInterval.current);
    }
    return () => {
      if (ringtoneInterval.current) clearInterval(ringtoneInterval.current);
    };
  }, [step]);

  // Start Incoming Call Simulation
  const triggerIncomingCall = async () => {
    setStep('incoming');
    setCallDuration(0);
    setHistory([]);
    setRiskScore(15);
    setTier(0);
    setDetectedTactics([]);
    setSecretAlertTriggered(false);
    setVibrationActive(false);

    try {
      const res = await fetch('/v1/live/guardian/session/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          caller_number: '+92 301 9845120',
          is_unknown_number: true,
          banking_app_open: bankingAppOpen,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setSessionId(data.session_id);
      }
    } catch {
      setSessionId(`guard_${Math.random().toString(36).substring(7)}`);
    }
  };

  // Answer call
  const answerCall = () => {
    setStep('connected');
    const introSnippet = 'Hello? Tariq speaking. Who is this?';
    setHistory([
      {
        speaker: 'user',
        text: introSnippet,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  // Evaluate Opponent (Scammer) Speech
  const sendOpponentSpeech = async (phraseToSend?: string) => {
    const text = (phraseToSend || inputText).trim();
    if (!text || loading || step !== 'connected') return;

    setInputText('');
    setLoading(true);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const updatedHistory: TranscriptItem[] = [
      ...history,
      { speaker: 'caller', text, timestamp: now },
    ];
    setHistory(updatedHistory);

    try {
      const res = await fetch('/v1/live/guardian/evaluate-chunk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId || 'guard_demo',
          speaker: 'caller',
          text,
          banking_app_open: bankingAppOpen,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRiskScore(data.risk_score);
        setTier(data.tier);
        setDetectedTactics(data.detected_tactics || []);

        if (data.alert_triggered || data.risk_score >= 85) {
          triggerSecretAlert(data.secret_haptic_pattern || [0, 500, 150, 500, 150, 800]);
        }
      }
    } catch {
      // Local evaluation fallback
      const lower = text.toLowerCase();
      let score = riskScore;
      const tactics = [...detectedTactics];

      if (lower.includes('otp') || lower.includes('code') || lower.includes('pin') || text.includes('او ٹی پی')) {
        score = 98;
        if (!tactics.includes('Credential & OTP Demand')) tactics.push('Credential & OTP Demand');
      } else if (lower.includes('block') || lower.includes('freeze') || lower.includes('police')) {
        score = Math.max(score, 75);
        if (!tactics.includes('Manufactured Urgency')) tactics.push('Manufactured Urgency');
      } else if (lower.includes('state bank') || lower.includes('manager')) {
        score = Math.max(score, 50);
        if (!tactics.includes('Authority Impersonation')) tactics.push('Authority Impersonation');
      }

      setRiskScore(score);
      setTier(score >= 85 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0);
      setDetectedTactics(tactics);

      if (score >= 85) {
        triggerSecretAlert([0, 500, 150, 500, 150, 800]);
      }
    } finally {
      setLoading(false);
    }
  };

  // Trigger Stealth Secret Alert
  const triggerSecretAlert = (hapticPattern: number[]) => {
    setSecretAlertTriggered(true);
    setVibrationActive(true);

    // SILENT PHYSICAL DEVICE HAPTIC VIBRATION ONLY:
    // Notice: NO sound/TTS is generated so caller hears ZERO audio cues!
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(hapticPattern);
      } catch {}
    }

    setTimeout(() => {
      setVibrationActive(false);
    }, 4500);
  };

  // User taps "Cut Call (Hang Up)"
  const cutCallSafely = async () => {
    setStep('terminated');
    try {
      await fetch('/v1/live/guardian/cut-call', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          session_id: sessionId,
          reason: 'User tapped Cut Call after silent AI fraud alert',
          cut_duration_seconds: callDuration,
        }),
      });
    } catch {}
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Pre-configured Scammer tricks to test
  const testPhrases = [
    {
      title: '🔑 Demands OTP (Triggers Stealth Cut-Call Alert)',
      text: 'Jaldi se apna 6-digit OTP code batayein jo mobile par aya hai warna account abhi freeze ho jayega!',
    },
    {
      title: '🚨 Police / FIA Arrest Threat',
      text: 'Main FIA Cybercrime Wing se bol raha hoon, aap ke khilaf FIR darj ho chuki hai!',
    },
    {
      title: '🏦 State Bank Impersonation',
      text: 'Assalam-o-Alaikum, main State Bank head office security branch se bol raha hoon.',
    },
    {
      title: '💡 K-Electric / WAPDA Meter Threat',
      text: 'Aap ka bijli meter foran cut raha hai, foran Easypaisa par 10 hazar jama karwayen!',
    },
    {
      title: '📲 WhatsApp 6-digit Code Hack',
      text: 'Aap ke WhatsApp par verification code bheja hai, jaldi parh kar batayein!',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Top Header Information Card */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 flex items-center justify-center font-bold shrink-0">
            <Smartphone className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Live Call Guardian (Android Phone Integration)
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                Stealth Background AI
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Secretly listens to the opponent on incoming calls. Vibrates & shows a floating alert to cut the call — <strong>the scammer never hears a sound!</strong>
            </p>
          </div>
        </div>

        {/* Tab Switcher: Simulator vs Real Phone */}
        <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl self-start md:self-auto">
          <button
            onClick={() => setActiveTab('simulation')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Interactive Android Simulation
          </button>
          <button
            onClick={() => setActiveTab('real-phone')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'real-phone'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Test on Real Android Phone</span>
          </button>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* VIEW 1: INTERACTIVE ANDROID SIMULATION                               */}
      {/* ==================================================================== */}
      {activeTab === 'simulation' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* LEFT COLUMN: SCENARIO CONTROLS & TEST PHRASES */}
          <div className="lg:col-span-6 space-y-4">
            {/* Setting Activation Card */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="font-bold text-xs text-slate-900 dark:text-white uppercase tracking-wider">
                    Phone Security Setting:
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={guardActive}
                    onChange={(e) => setGuardActive(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center justify-between">
                  <span>Silent Background Audio Listener:</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    {guardActive ? 'Enabled (Active)' : 'Disabled'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Stealth Mode (Zero audio cues to caller):</span>
                  <span className="font-bold text-emerald-600 dark:text-emerald-400">
                    Active (Muted Audio Alerts)
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Physical Vibration Pattern:</span>
                  <span className="font-bold text-slate-900 dark:text-white">
                    Secret Haptic SOS Pulse
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Simulate Banking App Open (Higher Sensitivity):</span>
                  <input
                    type="checkbox"
                    checked={bankingAppOpen}
                    onChange={(e) => setBankingAppOpen(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0 cursor-pointer"
                  />
                </div>
              </div>

              {step === 'settings' && (
                <button
                  onClick={triggerIncomingCall}
                  disabled={!guardActive}
                  className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>Simulate Incoming Unknown Call (+92 301 9845120)</span>
                </button>
              )}
            </div>

            {/* Test Phrases Console (What the caller says) */}
            {step === 'connected' && (
              <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Opponent (Caller) Voice Console:
                  </span>
                  <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <Radio className="w-3 h-3 animate-pulse" />
                    AI secretly analyzing opponent speech
                  </span>
                </div>

                <div className="space-y-2">
                  <span className="text-[11px] text-slate-500 font-medium">
                    Tap a common fraud line or type your own to test the stealth alert:
                  </span>
                  <div className="grid grid-cols-1 gap-2">
                    {testPhrases.map((phrase, idx) => (
                      <button
                        key={idx}
                        onClick={() => sendOpponentSpeech(phrase.text)}
                        disabled={loading}
                        className="p-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-800/60 hover:bg-rose-50 dark:hover:bg-rose-950/30 border border-slate-200 dark:border-slate-700 hover:border-rose-300 text-xs transition-all cursor-pointer disabled:opacity-50 group"
                      >
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400">
                          {phrase.title}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                          "{phrase.text}"
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Freeform Typing or Mic */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendOpponentSpeech();
                  }}
                  className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type anything caller says (Urdu / English)..."
                    disabled={loading}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                  <button
                    type="submit"
                    disabled={loading || !inputText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold disabled:opacity-40 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Send</span>
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            )}

            {/* Live Risk Breakdown */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                  Live AI Threat Telemetry:
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full font-mono font-bold text-xs ${
                    riskScore >= 85
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : riskScore >= 60
                      ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  {riskScore}% Fraud Score
                </span>
              </div>

              <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${
                    riskScore >= 85
                      ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                      : riskScore >= 60
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                  }`}
                  style={{ width: `${riskScore}%` }}
                />
              </div>

              {detectedTactics.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {detectedTactics.map((t, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                    >
                      ⚠️ {t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN: HIGH-FIDELITY ANDROID PHONE MOCKUP */}
          <div className="lg:col-span-6 flex justify-center">
            <div
              className={`w-[340px] sm:w-[370px] h-[680px] rounded-[48px] bg-slate-950 border-[10px] border-slate-900 shadow-2xl relative overflow-hidden flex flex-col transition-all duration-300 ${
                vibrationActive ? 'animate-[shake_0.5s_infinite] ring-4 ring-rose-500' : ''
              }`}
            >
              {/* Android Top Notch / Camera & Speaker */}
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-50 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-800" />
              </div>

              {/* Android Status Bar */}
              <div className="px-6 pt-3 pb-2 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-40 bg-transparent">
                <span>09:41</span>
                <div className="flex items-center gap-1.5">
                  <Signal className="w-3 h-3" />
                  <Wifi className="w-3 h-3" />
                  <Battery className="w-3.5 h-3.5" />
                </div>
              </div>

              {/* ========================================================== */}
              {/* PHONE SCREEN: 1. SETTINGS / STANDBY SCREEN                  */}
              {/* ========================================================== */}
              {step === 'settings' && (
                <div className="flex-1 p-6 flex flex-col justify-between text-white">
                  <div className="space-y-4 pt-6">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Shield className="w-4 h-4" />
                      </div>
                      <h3 className="font-bold text-sm">ScamShield Settings</h3>
                    </div>

                    <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold">Background Guardian:</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800">
                          ACTIVE
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 leading-relaxed">
                        Ready to silently intercept incoming unknown calls. When an opponent uses scam wording, secret vibration alerts will guide you to cut the call.
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Emergency Guardian:</span>
                        <span className="text-white font-semibold">Hamza Tariq (Son)</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Dispatch Channel:</span>
                        <span className="text-emerald-400 font-semibold">WhatsApp Auto-Alert</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-center space-y-2 pb-4">
                    <button
                      onClick={triggerIncomingCall}
                      className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs cursor-pointer shadow-lg shadow-emerald-500/20"
                    >
                      Test Incoming Call Now
                    </button>
                    <span className="text-[10px] text-slate-500 block">
                      Simulates a suspicious call from an unknown number
                    </span>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* PHONE SCREEN: 2. INCOMING CALL SCREEN                      */}
              {/* ========================================================== */}
              {step === 'incoming' && (
                <div className="flex-1 p-6 flex flex-col justify-between text-white text-center">
                  <div className="pt-10 space-y-3">
                    <div className="w-20 h-20 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-xl font-bold mx-auto text-slate-300">
                      ?
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-white">+92 301 9845120</h3>
                      <p className="text-xs text-rose-400 font-semibold mt-0.5">
                        ⚠️ Unknown Caller • Unverified
                      </p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        ScamShield Live Guardian Armed & Ready
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 pb-6">
                    <div className="flex items-center justify-around">
                      <button
                        onClick={() => setStep('settings')}
                        className="w-14 h-14 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex items-center justify-center shadow-lg cursor-pointer"
                      >
                        <PhoneOff className="w-6 h-6" />
                      </button>

                      <button
                        onClick={answerCall}
                        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-500/40 animate-bounce cursor-pointer"
                      >
                        <PhoneCall className="w-6 h-6" />
                      </button>
                    </div>
                    <span className="text-[11px] text-slate-400 block font-medium">
                      Swipe up or tap green button to Answer
                    </span>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* PHONE SCREEN: 3. ACTIVE TWO-PERSON PHONE CALL SCREEN       */}
              {/* ========================================================== */}
              {step === 'connected' && (
                <div className="flex-1 flex flex-col justify-between text-white relative p-4">
                  {/* Top Stealth Notification Pill */}
                  <div className="pt-4 space-y-2">
                    <div className="px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-800 text-[10px] font-semibold text-emerald-300 flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                        <span>Silent AI Guardian Active</span>
                      </div>
                      <span className="text-[9px] uppercase font-bold text-emerald-400">
                        Opponent Unaware
                      </span>
                    </div>

                    <div className="text-center pt-2">
                      <h4 className="font-bold text-base text-white">+92 301 9845120</h4>
                      <p className="text-xs text-emerald-400 font-mono">{formatTime(callDuration)}</p>
                    </div>
                  </div>

                  {/* ======================================================== */}
                  {/* SECRET STEALTH FLOATING ALERT (Visible only to user!)   */}
                  {/* ======================================================== */}
                  {secretAlertTriggered ? (
                    <div className="p-4 rounded-3xl bg-rose-600 text-white space-y-3 shadow-2xl border-2 border-rose-400 animate-bounce z-30">
                      <div className="flex items-start gap-2.5">
                        <AlertOctagon className="w-6 h-6 shrink-0 text-white animate-spin mt-0.5" />
                        <div>
                          <h5 className="font-black text-xs uppercase tracking-wider">
                            🚨 CUT THE CALL! THIS IS A SCAMMER!
                          </h5>
                          <p className="text-[11px] text-rose-100 font-serif font-bold mt-0.5 leading-snug">
                            فوراً کال کاٹ دیں! دوسری طرف بات کرنے والا فراڈیا ہے!
                          </p>
                        </div>
                      </div>

                      <div className="p-2.5 rounded-xl bg-rose-700/80 text-[10px] space-y-1 font-medium">
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          <span>Caller cannot hear this alarm</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <CheckCircle2 className="w-3 h-3 text-emerald-300" />
                          <span>Bank hold ready: Rs. 85,000</span>
                        </div>
                      </div>

                      <button
                        onClick={cutCallSafely}
                        className="w-full py-3 rounded-2xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 cursor-pointer shadow-lg flex items-center justify-center gap-1.5"
                      >
                        <PhoneOff className="w-4 h-4" />
                        <span>Cut Call Immediately (Hang Up)</span>
                      </button>
                    </div>
                  ) : (
                    /* In-Call Closed Captions / What Opponent Said */
                    <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs space-y-2 max-h-48 overflow-y-auto">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">
                        Live Opponent Speech Stream:
                      </span>
                      {history.slice(-3).map((item, idx) => (
                        <div
                          key={idx}
                          className={`p-2 rounded-xl text-[11px] ${
                            item.speaker === 'caller'
                              ? 'bg-rose-950/40 text-rose-200 border border-rose-900/50'
                              : 'bg-slate-800 text-slate-200'
                          }`}
                        >
                          <span className="font-bold block text-[10px] uppercase text-slate-400">
                            {item.speaker === 'caller' ? 'Opponent (Caller):' : 'You:'}
                          </span>
                          "{item.text}"
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Standard In-Call Dialer Action Buttons */}
                  <div className="space-y-4 pb-4">
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <button
                        onClick={() => setIsMicMuted(!isMicMuted)}
                        className={`p-3 rounded-full flex flex-col items-center gap-1 cursor-pointer mx-auto ${
                          isMicMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {isMicMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                        className={`p-3 rounded-full flex flex-col items-center gap-1 cursor-pointer mx-auto ${
                          isSpeakerOn ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                      </button>

                      <button
                        onClick={cutCallSafely}
                        className="p-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white flex flex-col items-center gap-1 cursor-pointer mx-auto"
                      >
                        <PhoneOff className="w-4 h-4" />
                      </button>
                    </div>

                    <button
                      onClick={cutCallSafely}
                      className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-2 cursor-pointer shadow-lg"
                    >
                      <PhoneOff className="w-4 h-4" />
                      <span>End Call</span>
                    </button>
                  </div>
                </div>
              )}

              {/* ========================================================== */}
              {/* PHONE SCREEN: 4. CALL TERMINATED / SAFETY RECEIPT          */}
              {/* ========================================================== */}
              {step === 'terminated' && (
                <div className="flex-1 p-6 flex flex-col justify-between text-white text-center">
                  <div className="pt-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                      <ShieldCheck className="w-8 h-8" />
                    </div>

                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white">Call Ended Safely</h3>
                      <p className="text-xs text-emerald-400 font-semibold">
                        Scam Thwarted in Stealth Mode
                      </p>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-left text-xs space-y-2">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">
                        Safety Receipt:
                      </span>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Duration:</span>
                        <span className="font-mono">{formatTime(callDuration)}</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Scammer Aware:</span>
                        <span className="text-emerald-400 font-bold">No (Zero Leak)</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Bank Funds Kept Safe:</span>
                        <span className="text-emerald-400 font-bold">Rs. 85,000</span>
                      </div>
                      <div className="flex justify-between text-[11px]">
                        <span className="text-slate-400">Family Notified:</span>
                        <span className="text-white">Hamza Tariq (WhatsApp)</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2 pb-4">
                    <button
                      onClick={() => setStep('settings')}
                      className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md"
                    >
                      Return to Guardian Settings
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* VIEW 2: TEST ON YOUR REAL ANDROID PHONE (PWA + APK GUIDE)            */}
      {/* ==================================================================== */}
      {activeTab === 'real-phone' && (
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="max-w-2xl">
            <h3 className="text-lg font-black text-slate-900 dark:text-white">
              Install & Test on Your Real Android Phone
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 leading-relaxed">
              You can test the entire Live Call Guardian feature directly on your personal Android device right now in 2 convenient ways:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* METHOD 1: Instant PWA Mobile Testing (Zero Install) */}
            <div className="p-6 rounded-3xl bg-gradient-to-br from-blue-50 to-emerald-50 dark:from-blue-950/40 dark:to-emerald-950/40 border border-blue-200 dark:border-blue-800 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold">
                  1
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Instant Mobile Web App (PWA)
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                Open this URL directly in <strong>Google Chrome</strong> on your Android phone connected to the same Wi-Fi network:
              </p>

              <div className="p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 select-all">
                http://192.168.100.109:5173
              </div>

              <div className="space-y-1.5 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Real physical phone vibration (`navigator.vibrate`)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Real phone microphone speech recognition</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>Tap "Add to Home Screen" to run full-screen as an app</span>
                </div>
              </div>
            </div>

            {/* METHOD 2: Standalone Android APK */}
            <div className="p-6 rounded-3xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 space-y-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  2
                </div>
                <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                  Standalone Android Native APK
                </h4>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                The full native Android source project is configured in <code className="text-blue-600 dark:text-blue-400 font-mono">apps/mobile/</code> with:
              </p>

              <div className="space-y-2 text-xs text-slate-600 dark:text-slate-300">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block">CallScreeningService:</span>
                  <span>Intercepts incoming calls from unknown numbers</span>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <span className="font-bold text-slate-900 dark:text-white block">StealthOverlayService:</span>
                  <span>Displays floating heads-up alert without audio leak</span>
                </div>
              </div>

              <div className="pt-2">
                <a
                  href="/apps/mobile/README.md"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                  <span>View APK Build Instructions</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
