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
  VolumeX,
  Lock,
  Users,
  Smartphone,
  Sparkles,
  Zap,
  CheckCircle2,
  AlertOctagon,
  Radio,
  UserCheck,
} from 'lucide-react';

type CallState = 'idle' | 'dialing' | 'connected' | 'terminated';

interface CallTurn {
  speaker: 'scammer' | 'citizen';
  text: string;
}

export const ScamCallDemo: React.FC = () => {
  // Call States: idle (ready to call), dialing (ringing), connected (talking), terminated (scam stopped)
  const [callState, setCallState] = useState<CallState>('idle');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isListening, setIsListening] = useState(false);

  // Conversation turns
  const [history, setHistory] = useState<CallTurn[]>([]);
  const [latestCitizenSpeech, setLatestCitizenSpeech] = useState<string>('');
  const [latestScammerSpeech, setLatestScammerSpeech] = useState<string>('');
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);

  // ScamShield Live Telemetry State
  const [riskScore, setRiskScore] = useState<number>(15);
  const [tier, setTier] = useState<number>(0);
  const [detectedTactics, setDetectedTactics] = useState<string[]>([]);
  const [alertTriggered, setAlertTriggered] = useState<boolean>(false);
  const [vibrationActive, setVibrationActive] = useState<boolean>(false);

  // Web Audio Ringtone Generator (Tring... Tring...)
  const playRingtone = () => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 400;
      osc2.frequency.value = 450;
      gain.gain.setValueAtTime(0.08, ctx.currentTime);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();

      // Ring pulse: 1.2s on, then silence
      setTimeout(() => {
        try {
          gain.gain.setValueAtTime(0.001, ctx.currentTime);
          osc1.stop();
          osc2.stop();
        } catch {}
      }, 1200);
    } catch {}
  };

  // Text to Speech for Citizen voice
  const speakCitizenVoice = (text: string) => {
    if (!isSpeakerOn) return;
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      utterance.pitch = 0.92;
      // Try Urdu/Pakistani English voice if present
      const voices = window.speechSynthesis.getVoices();
      const urduVoice = voices.find((v) => v.lang.includes('ur') || v.lang.includes('hi') || v.name.includes('India') || v.name.includes('Pakistan'));
      if (urduVoice) utterance.voice = urduVoice;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Call timer effect
  useEffect(() => {
    let interval: any = null;
    if (callState === 'connected') {
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [callState]);

  // Start outgoing call
  const startCall = () => {
    setCallState('dialing');
    setCallDuration(0);
    setHistory([]);
    setRiskScore(15);
    setTier(0);
    setDetectedTactics([]);
    setAlertTriggered(false);
    setVibrationActive(false);

    // Play ringing sound
    playRingtone();
    setTimeout(() => {
      playRingtone();
    }, 1500);

    // Connect after 2.6 seconds
    setTimeout(() => {
      setCallState('connected');
      const introText = 'Assalam-o-Alaikum, Tariq speaking. Who is this?';
      setLatestCitizenSpeech(introText);
      setHistory([{ speaker: 'citizen', text: introText }]);
      speakCitizenVoice(introText);
    }, 2800);
  };

  // End / Hang up call
  const endCall = () => {
    setCallState('terminated');
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  };

  // Send scammer spoken line
  const handleScammerSpeak = async (phraseToSend?: string) => {
    const text = (phraseToSend || inputText).trim();
    if (!text || loading || callState !== 'connected') return;

    setLatestScammerSpeech(text);
    setInputText('');
    setLoading(true);

    const updatedHistory: CallTurn[] = [
      ...history,
      { speaker: 'scammer', text },
    ];
    setHistory(updatedHistory);

    try {
      // Call backend
      const res = await fetch('/v1/demo/scam-call/interact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: updatedHistory,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setRiskScore(data.risk_score);
        setTier(data.tier);
        setDetectedTactics(data.detected_tactics || []);
        setLatestCitizenSpeech(data.ai_response);
        setHistory((prev) => [...prev, { speaker: 'citizen', text: data.ai_response }]);

        // Speak aloud through smartphone speaker
        speakCitizenVoice(data.ai_response);

        // Check if ScamShield alarm triggers
        if (data.alert_triggered || data.risk_score >= 85) {
          triggerAlarm();
        }
      } else {
        throw new Error('API error');
      }
    } catch {
      // Fallback
      handleFallbackResponse(text, updatedHistory);
    } finally {
      setLoading(false);
    }
  };

  // Fallback response generator if offline
  const handleFallbackResponse = (text: string, currentHistory: CallTurn[]) => {
    const lower = text.toLowerCase();
    let reply = 'Arey beta mera account kyun block hoga? Main ne to subah hi use kiya tha, koi ghalti nahi ki!';
    let score = riskScore;
    const tactics = [...detectedTactics];

    if (lower.includes('block') || lower.includes('freeze') || lower.includes('band')) {
      reply = 'Arey beta mera account kyun block hoga? Main ne to subah hi use kiya tha, koi ghalti nahi ki! Main kya karoon?';
      if (!tactics.includes('Manufactured Urgency')) tactics.push('Manufactured Urgency');
      score = Math.max(score, 65);
    } else if (lower.includes('otp') || lower.includes('code') || lower.includes('pin') || text.includes('او ٹی پی')) {
      reply = 'Lekin beta! SMS me to saaf likha hai ke 6-digit OTP code kisi se share na karein. Main kaisay de doon?';
      if (!tactics.includes('Credential & OTP Demand')) tactics.push('Credential & OTP Demand');
      score = 98;
    } else if (lower.includes('police') || lower.includes('jail') || lower.includes('arrest')) {
      reply = 'Arey bhai police kyun ayegi mere ghar? Khuda ka khauf karein, main shareef buzoorg aadmi hoon!';
      if (!tactics.includes('Authority Threat')) tactics.push('Authority Threat');
      score = Math.max(score, 80);
    } else if (lower.includes('state bank') || lower.includes('manager')) {
      reply = 'Ji State Bank se? Batayein beta mere account ka kya masla bana hai?';
      if (!tactics.includes('Authority Impersonation')) tactics.push('Authority Impersonation');
      score = Math.max(score, 50);
    } else {
      reply = 'Walaikum Assalam beta! Khairiyat? Aap kis silsilay me baat kar rahe hain?';
    }

    setRiskScore(score);
    setTier(score >= 85 ? 3 : score >= 60 ? 2 : score >= 30 ? 1 : 0);
    setDetectedTactics(tactics);
    setLatestCitizenSpeech(reply);
    setHistory([...currentHistory, { speaker: 'citizen', text: reply }]);
    speakCitizenVoice(reply);

    if (score >= 85) {
      triggerAlarm();
    }
  };

  // Trigger 100% Alarm & Physical Vibration
  const triggerAlarm = () => {
    setAlertTriggered(true);
    setVibrationActive(true);

    // Physical device haptic vibration
    if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      navigator.vibrate([300, 150, 300, 150, 600, 200, 800]);
    }

    // Audible alarm warning voice
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      setTimeout(() => {
        const siren = new SpeechSynthesisUtterance('Warning! Cut the call immediately. The person on this call is a scammer.');
        siren.rate = 1.05;
        siren.pitch = 1.1;
        window.speechSynthesis.speak(siren);
      }, 1200);
    }

    setTimeout(() => {
      setVibrationActive(false);
    }, 4500);
  };

  // Web Speech recognition for real microphone conversation
  const toggleListening = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser. You can type or use the quick buttons below.');
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'ur-PK';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputText(transcript);
        handleScammerSpeak(transcript);
      };
      recognition.onerror = () => setIsListening(false);
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // Quick Scammer phrases to test
  const quickPrompts = [
    {
      label: '🏦 Say: Account Block ho raha hai',
      text: 'Assalam-o-Alaikum, main State Bank se bol raha hoon, aap ka account block ho raha hai.',
    },
    {
      label: '🔑 Say: Jaldi 6-digit OTP batao (Triggers Alarm)',
      text: 'Jaldi se apna 6-digit OTP code batayein jo phone pe aya hai warna account band!',
    },
    {
      label: '⏳ Say: 5 minute me police raid hogi',
      text: 'Aap ka case FIA me chala gaya hai, 5 minute me police aap ke ghar pohnchegi!',
    },
    {
      label: '🇵🇰 اردو: اپنا خفیہ پاسورڈ اور کوڈ دیں',
      text: 'فوری طور پر اپنا پاسورڈ اور او ٹی پی بتائیں تاکہ اکاؤنٹ بحال ہو سکے!',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Top Header Card */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400 flex items-center justify-center font-bold shrink-0">
            <PhoneCall className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Interactive Voice Scam Call
              </h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300">
                You Are The Caller (Scammer)
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Call innocent citizen Uncle Tariq. Speak or type scam tricks and watch ScamShield intervene!
            </p>
          </div>
        </div>

        {callState !== 'idle' && (
          <button
            onClick={() => setCallState('idle')}
            className="px-3.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 text-xs font-bold flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>New Call</span>
          </button>
        )}
      </div>

      {/* ==================================================================== */}
      {/* SCENARIO 1: IDLE / DIAL SCREEN (Click to Call Uncle Tariq)            */}
      {/* ==================================================================== */}
      {callState === 'idle' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-slate-100 dark:bg-slate-800 border-4 border-white dark:border-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-300 text-2xl font-black mx-auto shadow-md">
              UT
            </div>
            <span className="absolute bottom-1 right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white text-xs font-bold">
              ✓
            </span>
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Tariq Mahmood (Citizen)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
              +92 301 9845120 • Normal Citizen Phone
            </p>
            <p className="text-xs text-slate-600 dark:text-slate-300 pt-2 max-w-xs mx-auto">
              Uncle Tariq is at home. Tap below to place the call as an unknown caller and test what happens.
            </p>
          </div>

          <button
            onClick={startCall}
            className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-base flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 cursor-pointer transition-all transform hover:-translate-y-0.5"
          >
            <PhoneCall className="w-5 h-5" />
            <span>Call Uncle Tariq</span>
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCENARIO 2: RINGING / DIALING SCREEN                                 */}
      {/* ==================================================================== */}
      {callState === 'dialing' && (
        <div className="p-10 sm:p-14 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-md mx-auto space-y-6">
          <div className="relative inline-block">
            <div className="w-24 h-24 rounded-full bg-blue-50 dark:bg-blue-950 border-4 border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 mx-auto">
              <PhoneCall className="w-10 h-10 animate-bounce" />
            </div>
            <span className="absolute inset-0 rounded-full border-4 border-blue-400 animate-ping opacity-50" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">
              Calling Tariq Mahmood...
            </h3>
            <p className="text-xs text-blue-600 dark:text-blue-400 font-bold animate-pulse">
              Ringing... (Tring... Tring...)
            </p>
          </div>

          <button
            onClick={() => setCallState('idle')}
            className="px-6 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold cursor-pointer"
          >
            Cancel Call
          </button>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCENARIO 3: ACTIVE TWO-PERSON PHONE CALL SCREEN                      */}
      {/* ==================================================================== */}
      {callState === 'connected' && (
        <div className="space-y-6">
          {/* Top Live ScamShield Risk Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-bold text-slate-900 dark:text-white">
                  ScamShield Live Audio Guardian:
                </span>
              </div>
              <span
                className={`px-3 py-0.5 rounded-full text-xs font-mono font-bold ${
                  riskScore >= 85
                    ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300 animate-pulse'
                    : riskScore >= 60
                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                }`}
              >
                {riskScore >= 85
                  ? 'TIER 3 • SCAM VERIFIED'
                  : riskScore >= 60
                  ? 'TIER 2 • SUSPICIOUS'
                  : 'TIER 0 • QUIET'}
              </span>
            </div>

            {/* Risk Gauge Bar */}
            <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  riskScore >= 85
                    ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                    : riskScore >= 60
                    ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                    : 'bg-gradient-to-r from-teal-400 to-emerald-500'
                }`}
                style={{ width: `${riskScore}%` }}
              />
            </div>

            {/* Detected Conditions Tags */}
            {detectedTactics.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[10px] text-slate-400 uppercase font-bold">Detected:</span>
                {detectedTactics.map((t, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800"
                  >
                    ⚠️ {t}
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* MAIN CALL SCREEN (True Phone Call Layout with Screen Shake on Alarm) */}
          <div
            className={`rounded-3xl bg-slate-900 text-white p-6 sm:p-8 shadow-2xl relative overflow-hidden transition-all duration-300 ${
              vibrationActive
                ? 'border-4 border-rose-500 shadow-rose-500/50 animate-[shake_0.5s_infinite]'
                : alertTriggered
                ? 'border-4 border-rose-500'
                : 'border border-slate-800'
            }`}
          >
            {/* Top In-Call Telemetry */}
            <div className="flex items-center justify-between text-xs text-slate-400 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono font-bold text-white">{formatTime(callDuration)}</span>
              </div>
              <span className="text-[11px] font-semibold text-emerald-400">
                Encrypted Voice Call
              </span>
              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                title={isSpeakerOn ? 'Speaker ON' : 'Speaker MUTED'}
              >
                {isSpeakerOn ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
              </button>
            </div>

            {/* Center: In-Call Avatar & Waveforms */}
            <div className="py-8 text-center space-y-4">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center text-white text-2xl font-black mx-auto">
                  UT
                </div>
                {/* Audio pulse wave rings when speaking */}
                {loading && (
                  <span className="absolute inset-0 rounded-full border-4 border-emerald-400 animate-ping opacity-60" />
                )}
              </div>

              <div>
                <h3 className="text-xl font-bold text-white">Uncle Tariq (Citizen)</h3>
                <p className="text-xs text-slate-400">On the line with you</p>
              </div>

              {/* Animated Live Voice Waves */}
              <div className="flex items-center justify-center gap-1.5 h-8">
                <div className={`w-1.5 bg-emerald-400 rounded-full ${loading ? 'wave-bar-1' : 'h-2'}`} />
                <div className={`w-1.5 bg-emerald-500 rounded-full ${loading ? 'wave-bar-2' : 'h-3'}`} />
                <div className={`w-1.5 bg-emerald-400 rounded-full ${loading ? 'wave-bar-3' : 'h-2'}`} />
                <div className={`w-1.5 bg-emerald-500 rounded-full ${loading ? 'wave-bar-4' : 'h-4'}`} />
                <div className={`w-1.5 bg-emerald-400 rounded-full ${loading ? 'wave-bar-5' : 'h-2'}`} />
              </div>
            </div>

            {/* Live Closed Captions on Call (Shows what both people just said) */}
            <div className="space-y-2 p-4 rounded-2xl bg-slate-950/80 border border-slate-800 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400">
                Live Call Closed Captions:
              </div>

              {latestScammerSpeech && (
                <div className="flex items-start gap-2 text-blue-300">
                  <span className="font-bold shrink-0">You (Caller):</span>
                  <span>"{latestScammerSpeech}"</span>
                </div>
              )}

              {latestCitizenSpeech && (
                <div className="flex items-start gap-2 text-emerald-300 pt-1">
                  <span className="font-bold shrink-0">Uncle Tariq:</span>
                  <span>"{latestCitizenSpeech}"</span>
                </div>
              )}
            </div>

            {/* ============================================================== */}
            {/* 100% EMERGENCY ALARM OVERLAY (When scammer asks for OTP)       */}
            {/* ============================================================== */}
            {alertTriggered && (
              <div className="mt-4 p-5 rounded-2xl bg-rose-600 text-white space-y-3 animate-bounce shadow-2xl">
                <div className="flex items-center gap-3">
                  <AlertOctagon className="w-8 h-8 shrink-0 animate-spin" />
                  <div>
                    <h4 className="font-black text-sm uppercase tracking-wider">
                      🚨 CUT THE CALL! THIS IS A SCAMMER!
                    </h4>
                    <p className="text-xs font-serif font-bold text-rose-100 mt-0.5">
                      فوراً کال کاٹ دیں! دوسری طرف بات کرنے والا فراڈیا ہے!
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-rose-700 text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>ShieldPay Bank Hold: Rs. 85,000 kept safe in account</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                    <span>WhatsApp alert delivered to son Ali Tariq</span>
                  </div>
                </div>

                <button
                  onClick={endCall}
                  className="w-full py-3 rounded-xl bg-white text-rose-700 font-black text-xs hover:bg-rose-50 cursor-pointer shadow-md flex items-center justify-center gap-2"
                >
                  <PhoneOff className="w-4 h-4" />
                  <span>Cut Call Now (Hang Up)</span>
                </button>
              </div>
            )}

            {/* In-Call Controls Bar */}
            <div className="pt-6 mt-4 border-t border-slate-800 flex items-center justify-around">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`p-3 rounded-full cursor-pointer ${
                  isMuted ? 'bg-rose-500 text-white' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Mute Call"
              >
                {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </button>

              <button
                onClick={endCall}
                className="p-4 rounded-full bg-rose-600 hover:bg-rose-700 text-white shadow-lg cursor-pointer transform hover:scale-105 transition-all"
                title="End Call"
              >
                <PhoneOff className="w-6 h-6" />
              </button>

              <button
                onClick={toggleListening}
                className={`p-3 rounded-full cursor-pointer ${
                  isListening ? 'bg-blue-500 text-white animate-pulse' : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
                title="Speak using Microphone"
              >
                <Radio className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* ============================================================== */}
          {/* SCAMMER SPEECH CONSOLE: SPEAK OR TYPE TO UNCLE TARIQ           */}
          {/* ============================================================== */}
          <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                Say something to Uncle Tariq on the call:
              </span>
              <span className="text-[11px] text-slate-400">
                Responds in matching language (Urdu or English)
              </span>
            </div>

            {/* Quick 1-Tap Speech Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {quickPrompts.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleScammerSpeak(q.text)}
                  disabled={loading}
                  className="p-2.5 rounded-xl text-left bg-slate-50 dark:bg-slate-800/80 hover:bg-blue-50 dark:hover:bg-blue-950/40 border border-slate-200 dark:border-slate-700 hover:border-blue-300 text-xs transition-all cursor-pointer font-bold text-slate-800 dark:text-slate-200 disabled:opacity-50"
                >
                  {q.label}
                </button>
              ))}
            </div>

            {/* Live Typing / Mic Input Form */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleScammerSpeak();
              }}
              className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800"
            >
              <button
                type="button"
                onClick={toggleListening}
                className={`p-2.5 rounded-xl transition-all cursor-pointer ${
                  isListening ? 'bg-blue-600 text-white animate-pulse' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
                title="Speak with your microphone"
              >
                <Mic className="w-4 h-4" />
              </button>

              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Type what you want to say to Uncle Tariq..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
              />

              <button
                type="submit"
                disabled={loading || !inputText.trim()}
                className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5"
              >
                <span>Say</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ==================================================================== */}
      {/* SCENARIO 4: CALL TERMINATED / POST-CALL SUMMARY                      */}
      {/* ==================================================================== */}
      {callState === 'terminated' && (
        <div className="p-8 sm:p-12 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm text-center max-w-lg mx-auto space-y-6">
          <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950 border-2 border-rose-200 dark:border-rose-800 flex items-center justify-center text-rose-600 mx-auto">
            <PhoneOff className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">
              Call Ended
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Duration: {formatTime(callDuration)}
            </p>
          </div>

          {alertTriggered ? (
            <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-left space-y-2">
              <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 block">
                🛡️ ScamShield Protected The Citizen:
              </span>
              <ul className="text-xs text-emerald-700 dark:text-emerald-400 space-y-1">
                <li>• Detected tactics: {detectedTactics.join(', ')}</li>
                <li>• Reached maximum threat score: {riskScore}%</li>
                <li>• Outgoing money transfer of Rs. 85,000 kept safe in account</li>
                <li>• WhatsApp alert dispatched to family guardian</li>
              </ul>
            </div>
          ) : (
            <p className="text-xs text-slate-600 dark:text-slate-300">
              Call concluded without high-level threat. No bank hold was needed.
            </p>
          )}

          <button
            onClick={startCall}
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs cursor-pointer shadow-md"
          >
            Start Another Call Demo
          </button>
        </div>
      )}
    </div>
  );
};
