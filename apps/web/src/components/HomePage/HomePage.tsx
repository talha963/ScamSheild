import React, { useState } from 'react';
import {
  Shield,
  ShieldCheck,
  ShieldAlert,
  Radio,
  Smartphone,
  Eye,
  Users,
  Swords,
  Play,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Lock,
  Heart,
  PhoneCall,
  Volume2,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Download,
} from 'lucide-react';
import { ActiveTab } from '../Header';

interface HomePageProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateTab }) => {
  // Animated Interactive Phone State
  const [activeCallStep, setActiveCallStep] = useState<number>(2);

  // FAQ Expandable State
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  const phoneSteps = [
    {
      title: 'Call Starts',
      speaker: 'Unknown Caller',
      dialogue: '"Assalam-o-Alaikum, I am calling from State Bank security."',
      statusText: 'Listening quietly • Safe',
      statusColor: 'emerald',
      moneyStatus: 'Normal Account Access',
      badge: 'Step 1: Normal',
    },
    {
      title: 'Pressure Detected',
      speaker: 'Unknown Caller',
      dialogue: '"Your account will be blocked in 10 minutes unless you verify now!"',
      statusText: 'Warning: Fake urgency detected',
      statusColor: 'amber',
      moneyStatus: 'Caution banner shown',
      badge: 'Step 2: Warning',
    },
    {
      title: 'Money Theft Blocked!',
      speaker: 'Unknown Caller',
      dialogue: '"Read me the 6-digit SMS code on your screen immediately!"',
      statusText: 'CRITICAL: Secret code request blocked',
      statusColor: 'rose',
      moneyStatus: 'Rs. 85,000 Frozen & Safe',
      badge: 'Step 3: Money Saved',
    },
  ];

  const currentStep = phoneSteps[activeCallStep];

  const commonScams = [
    {
      title: 'The Fake Bank Officer',
      urdu: '"آپ کا اکاؤنٹ بلاک ہو رہا ہے"',
      desc: 'They claim your ATM or account is being suspended and demand your secret 6-digit SMS code.',
      howWeProtect: 'ScamShield detects the pressure words and warns you immediately not to share any codes.',
      icon: <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />,
      color: 'blue',
    },
    {
      title: 'The Child in Trouble',
      urdu: '"امی، میرا ایکسیڈنٹ ہو گیا ہے"',
      desc: 'Criminals use fake voices or pretend to be your child or relative needing emergency bail money.',
      howWeProtect: 'Asks a private family secret code word that only your real family knows.',
      icon: <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />,
      color: 'emerald',
    },
    {
      title: 'The Fake Police / Customs Call',
      urdu: '"پارسل میں غیر قانونی سامان ہے"',
      desc: 'Threatens you with immediate arrest unless you transfer "clearance money" to a private account.',
      howWeProtect: 'Reminds you that government agencies and police never ask for money transfers by phone.',
      icon: <ShieldAlert className="w-6 h-6 text-rose-600 dark:text-rose-400" />,
      color: 'rose',
    },
    {
      title: 'The Wrong Transfer Trick',
      urdu: '"غلطی سے آپ کے اکاؤنٹ میں پیسے آ گئے"',
      desc: 'Sends a forged JazzCash or Easypaisa SMS and begs you to return "their money" immediately.',
      howWeProtect: 'Scan the screenshot with Scam Lens to see if the message or slip is fake.',
      icon: <Eye className="w-6 h-6 text-amber-600 dark:text-amber-400" />,
      color: 'amber',
    },
  ];

  const simpleFaqs = [
    {
      q: 'Does ScamShield record or store my private phone calls?',
      a: 'No. Never. ScamShield only analyzes words in real time while you talk and forgets them immediately. Nothing is ever recorded or saved on any server.',
    },
    {
      q: 'How does it stop my money from being stolen?',
      a: 'When an unknown caller pushes you to send money or share an OTP code, ScamShield puts a temporary safety lock on your bank app so the money cannot leave your account.',
    },
    {
      q: 'What if I am genuinely sending money to my friend or family?',
      a: 'Normal conversations with friends do not trigger safety locks. You can easily approve any legitimate transfer in 1 tap with your fingerprint or PIN.',
    },
    {
      q: 'Does it speak in Urdu or Punjabi?',
      a: 'Yes! ScamShield understands everyday Urdu, Punjabi, Roman Urdu, and English, and speaks clear, polite audio warnings so anyone can understand.',
    },
    {
      q: 'Can my children or family help me if I am confused?',
      a: 'Yes. With Guardian Circle, your son, daughter, or trusted relative gets a quick WhatsApp message with 1-tap Approve or Block buttons to keep you safe.',
    },
  ];

  return (
    <div className="w-full bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 space-y-20 py-4 transition-colors duration-300" id="overview">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION: CLEAN, FRIENDLY, ANIMATED PHONE SHIELD             */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-b from-blue-50/70 via-slate-50/50 to-white dark:from-slate-900/90 dark:via-slate-900/60 dark:to-slate-950 border border-slate-200 dark:border-slate-800 p-8 sm:p-12 lg:p-16 shadow-xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-slate-800 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-bold shadow-xs">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Your Phone & Money Safety Companion</span>
              </div>

              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
                Stop Phone Scams{' '}
                <span className="text-blue-600 dark:text-blue-400">
                  Before Your Money Leaves.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed">
                When scammers call pretending to be from your bank, police, or a child in trouble, they panic you into sending money. 
                <strong> ScamShield Live</strong> quietly listens in the background, warns you in simple <strong>Urdu and English</strong>, and temporarily locks your bank account before any money can be stolen.
              </p>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => onNavigateTab('call-guard')}
                  className="px-6 py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all transform hover:-translate-y-0.5"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Try Phone Call Simulation</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => onNavigateTab('mock-bank')}
                  className="px-5 py-3.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700 font-bold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-xs"
                >
                  <Smartphone className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>See How Money Stays Safe</span>
                </button>

                <a
                  href="/scamshield.apk"
                  download="scamshield.apk"
                  className="px-5 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm flex items-center gap-2 cursor-pointer transition-all shadow-md shadow-emerald-600/20 transform hover:-translate-y-0.5"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Android App</span>
                </a>
              </div>

              {/* Friendly Reassurance Badges */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>100% Private (No Recording)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Speaks in Clear Urdu</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>Family WhatsApp Alerts</span>
                </div>
              </div>
            </div>

            {/* Right: ANIMATED LIVE PHONE CALL VISUAL */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="w-full max-w-sm rounded-3xl bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-700 p-5 shadow-xl relative overflow-hidden transition-all">
                {/* Phone Top Notch */}
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 text-[11px] text-slate-400 font-medium">
                  <span>9:41 AM</span>
                  <div className="w-16 h-3 rounded-full bg-slate-200 dark:bg-slate-700" />
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">● Protected</span>
                </div>

                {/* Active Call Card */}
                <div className="py-5 text-center space-y-3">
                  <div className="relative inline-block">
                    <div className="w-16 h-16 rounded-full bg-blue-50 dark:bg-blue-950/60 border-2 border-blue-200 dark:border-blue-700 flex items-center justify-center text-blue-600 dark:text-blue-400 mx-auto">
                      <PhoneCall className="w-8 h-8 animate-bounce" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-rose-500 border-2 border-white dark:border-slate-900 flex items-center justify-center text-white text-[9px] font-bold">
                      !
                    </span>
                  </div>

                  <div>
                    <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                      {currentStep.speaker}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                      +92 300 0000000 • Unsaved Number
                    </p>
                  </div>

                  {/* Animated Live Voice Sound Wave */}
                  <div className="flex items-center justify-center gap-1 h-8 py-1">
                    <div className="w-1 bg-blue-500 rounded-full wave-bar-1" />
                    <div className="w-1 bg-blue-600 rounded-full wave-bar-2" />
                    <div className="w-1 bg-blue-400 rounded-full wave-bar-3" />
                    <div className="w-1 bg-blue-600 rounded-full wave-bar-4" />
                    <div className="w-1 bg-blue-500 rounded-full wave-bar-5" />
                  </div>

                  {/* Spoken Dialogue Bubble */}
                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-200 italic">
                    {currentStep.dialogue}
                  </div>
                </div>

                {/* Live ScamShield Intervention Banner */}
                <div
                  className={`p-3.5 rounded-2xl border transition-all ${
                    currentStep.statusColor === 'rose'
                      ? 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                      : currentStep.statusColor === 'amber'
                      ? 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                      : 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs font-bold mb-1">
                    <div className="flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      <span>ScamShield Guardian</span>
                    </div>
                    <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-white/80 dark:bg-slate-800 font-bold">
                      {currentStep.badge}
                    </span>
                  </div>
                  <p className="text-xs font-medium">
                    {currentStep.statusText}
                  </p>
                  <div className="mt-2 pt-2 border-t border-black/5 dark:border-white/10 flex items-center justify-between text-[11px] font-bold">
                    <span>Your Money Status:</span>
                    <span className="text-emerald-700 dark:text-emerald-400 font-bold">{currentStep.moneyStatus}</span>
                  </div>
                </div>

                {/* Interactive Simulator Steps Selector */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-1 text-[11px]">
                  <span className="text-slate-400 dark:text-slate-500 font-medium">Click step to test:</span>
                  <div className="flex items-center gap-1">
                    {phoneSteps.map((s, idx) => (
                      <button
                        key={idx}
                        onClick={() => setActiveCallStep(idx)}
                        className={`px-2 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                          activeCallStep === idx
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                        }`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. THREE SIMPLE STEPS: HOW IT WORKS IN PLAIN WORDS                   */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id="how-it-works">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
            Simple 3-Step Safety
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            How ScamShield Protects You in 3 Simple Steps
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            You don't need any technical skills. It works automatically when your phone rings.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-blue-300 dark:hover:border-blue-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 flex items-center justify-center text-blue-600 dark:text-blue-400 font-black text-lg">
              1
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">An Unknown Person Calls</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              When an unfamiliar number calls, ScamShield quietly listens. It never records your voice. It only detects panic phrases like <em>"Aap ka account block ho raha hai"</em>.
            </p>
          </div>

          {/* Step 2 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-amber-300 dark:hover:border-amber-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 flex items-center justify-center text-amber-600 dark:text-amber-400 font-black text-lg">
              2
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Calm Urdu Voice Warning</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              If the caller starts pressuring you, ScamShield speaks a polite warning on your phone:
              <strong className="block text-blue-700 dark:text-blue-400 font-semibold mt-1">
                "بینک کبھی فون پر پاسورڈ یا کوڈ نہیں مانگتا۔ کال کاٹ دیں"
              </strong>
            </p>
          </div>

          {/* Step 3 */}
          <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs hover:border-emerald-300 dark:hover:border-emerald-700 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-black text-lg">
              3
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">Your Money is Locked Safe</h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Even if you accidentally typed the transfer in panic, ScamShield locks the payment before it leaves. Your son or daughter gets a WhatsApp ping to confirm.
            </p>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. COMMON SCAMS: SIMPLE REAL-LIFE EXAMPLES                           */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id="the-problem">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
            Real-Life Traps
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            4 Phone Scams We Stop Every Day
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Fraudsters use these exact tricks on innocent people every day across Pakistan.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {commonScams.map((scam, idx) => (
            <div
              key={idx}
              className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3 hover:border-blue-300 dark:hover:border-blue-700 transition-all"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                    {scam.icon}
                  </div>
                  <h3 className="font-bold text-slate-900 dark:text-white text-base">
                    {scam.title}
                  </h3>
                </div>
                <span className="text-xs font-bold font-serif text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                  {scam.urdu}
                </span>
              </div>

              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                {scam.desc}
              </p>

              <div className="p-3 rounded-xl bg-blue-50/60 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200 font-medium">
                🛡️ <strong>How ScamShield Protects You:</strong> {scam.howWeProtect}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. REAL 8K PHOTOS SHOWCASE: CLEAR & UNCLUTTERED                      */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id="features">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
            Photo Gallery
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Built for Family Peace of Mind
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Designed to protect parents, grandparents, and everyday bank accounts from fraud.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1: Family Protection */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="h-56 overflow-hidden">
              <img
                src="./family-safety-portrait.jpg"
                alt="Elderly Family Member Protected"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Protects Elderly Parents
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Elderly parents are targeted most often. If an elder is confused on a call, their trusted son or daughter receives a WhatsApp alert to approve or block the transfer.
              </p>
              <button
                onClick={() => onNavigateTab('guardians')}
                className="pt-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>View Family WhatsApp Hub</span> &rarr;
              </button>
            </div>
          </div>

          {/* Card 2: Bank Lock */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="h-56 overflow-hidden">
              <img
                src="./banking-circuit-breaker.jpg"
                alt="Bank Safety Lock"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Locks The Bank Account
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Connects directly to mobile bank apps (JazzCash, Easypaisa, Raast, and banks). Freezes outgoing payments before money leaves your account.
              </p>
              <button
                onClick={() => onNavigateTab('mock-bank')}
                className="pt-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Try Bank Simulator</span> &rarr;
              </button>
            </div>
          </div>

          {/* Card 3: Fake Slip Scanner */}
          <div className="rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
            <div className="h-56 overflow-hidden">
              <img
                src="./scam-lens-scan.jpg"
                alt="Scan Fake Slip"
                className="w-full h-full object-cover object-center"
              />
            </div>
            <div className="p-5 space-y-2">
              <h3 className="font-bold text-slate-900 dark:text-white text-base">
                Checks Fake Slips & Screenshots
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Someone sent you a photo claiming they sent money? Just scan the screenshot to verify whether it has been doctored or forged.
              </p>
              <button
                onClick={() => onNavigateTab('scam-lens')}
                className="pt-2 text-xs font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Check a Receipt Now</span> &rarr;
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. SIMPLE FAQ SECTION                                                */}
      {/* ==================================================================== */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6" id="faq">
        <div className="text-center space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400">
            Got Questions?
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white">
            Frequently Asked Questions
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-400">
            Quick, plain answers for everyday users and families.
          </p>
        </div>

        <div className="space-y-3">
          {simpleFaqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full p-4 sm:p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                    {faq.q}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-4 sm:px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800">
                    {faq.a}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. CALL TO ACTION: SIMPLE & FRIENDLY                                 */}
      {/* ==================================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-blue-600 dark:bg-blue-600 text-white text-center space-y-6 shadow-xl">
          <div className="space-y-2 max-w-xl mx-auto">
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight">
              Test It Yourself In 60 Seconds
            </h3>
            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Click below to try our live interactive call simulator. See how ScamShield speaks an Urdu warning and stops money from leaving.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => onNavigateTab('call-guard')}
              className="px-7 py-3.5 rounded-xl bg-white text-blue-700 hover:bg-blue-50 font-black text-sm inline-flex items-center gap-2 shadow-md cursor-pointer transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Phone Call Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('mock-bank')}
              className="px-6 py-3.5 rounded-xl bg-blue-700/80 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer transition-all border border-blue-500"
            >
              <span>See Safe Bank App</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
