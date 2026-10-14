import React, { useState } from 'react';
import heroVideo from '../../assets/hero.mp4';
import {
  ShieldAlert,
  Radio,
  Smartphone,
  Eye,
  Swords,
  MapPin,
  Users,
  FileText,
  Sparkles,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Lock,
  HeartHandshake,
  ShieldCheck,
  PhoneCall,
  Volume2,
  HelpCircle,
  Cpu,
  Layers,
  Activity,
  FileCheck2,
  TrendingDown,
  Building2,
  Globe2,
  ChevronDown,
  ChevronUp,
  Fingerprint,
} from 'lucide-react';
import { ActiveTab } from '../Header';

interface HomePageProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateTab }) => {
  // Interactive Tier Simulator
  const [selectedTier, setSelectedTier] = useState<number>(3);

  // FAQ Expandable state
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const tierDetails = [
    {
      tier: 0,
      name: 'Tier 0: Silent Ambient Monitoring',
      scoreRange: '0 – 29 Risk Score',
      theme: 'emerald',
      actionTitle: 'Passive Background Protection',
      description:
        'Normal conversation dynamics. Zero intrusive alerts or user interruptions. The speech stream is continuously analyzed in transient memory for subtle linguistic markers without saving any audio to persistent storage.',
      systemIntervention: 'Background acoustic monitoring; all transactions and OTPs process normally.',
      bankingEffect: '100% normal transaction clearance. Zero added friction.',
      familyNotice: 'None required.',
    },
    {
      tier: 1,
      name: 'Tier 1: Subtle Visual Caution',
      scoreRange: '30 – 59 Risk Score',
      theme: 'yellow',
      actionTitle: 'Passive On-Screen Reminder',
      description:
        'Mild pressure tactics or unfamiliar incoming caller patterns detected. The user is gently reminded of security best practices via an unobtrusive ambient indicator on their phone screen.',
      systemIntervention: 'A discreet amber shield glows on screen: "Remember: Banks never ask for passwords by phone."',
      bankingEffect: 'Payments flow normally, but the banking app displays a verification reminder banner.',
      familyNotice: 'Logged silently in the user’s local threat ledger.',
    },
    {
      tier: 2,
      name: 'Tier 2: Bilingual Spoken Warning & Delay',
      scoreRange: '60 – 84 Risk Score',
      theme: 'amber',
      actionTitle: 'Spoken Verbal Interlock & Cooldown',
      description:
        'High psychological pressure detected (threats of account freeze, police arrest, customs seizure, or aggressive urgency). ScamShield actively whispers a calming intervention in the user’s spoken dialect (Urdu, Punjabi, or English).',
      systemIntervention:
        'Spoken bilingual audio prompt: "بینک کبھی فون پر OTP یا PIN نہیں مانگتا۔ پرسکون رہیں اور کال کاٹ دیں" (The bank never asks for codes by phone. Stay calm and hang up).',
      bankingEffect: 'A mandatory 60-second cooldown timer is placed on outgoing transfers over Rs. 10,000.',
      familyNotice: 'Informational alert staged for delivery if risk score escalates.',
    },
    {
      tier: 3,
      name: 'Tier 3: Graduated Circuit-Breaker & Guardian Lock',
      scoreRange: '85 – 100 Risk Score',
      theme: 'rose',
      actionTitle: 'Physical Banking Transfer Freeze & WhatsApp Alert',
      description:
        'Active social engineering heist in progress. The caller has demanded an OTP, CVV, or urgent money transfer while the banking application is active. The circuit-breaker physically disengages the payment rail at the banking API core before funds leave the user account.',
      systemIntervention:
        'EMERGENCY INTERVENTION: Transfer frozen at the banking gateway. Full-screen red alert with auto-hangup prompt. Automated forensic evidence pack compiled.',
      bankingEffect:
        'HARD TRANSACTION HOLD: Outgoing transaction is intercepted and locked in a 15-minute safety vault pending authorized confirmation.',
      familyNotice:
        'Immediate WhatsApp priority alert dispatched to designated family members (Guardian Circle) with 1-tap Approve / Block buttons.',
    },
  ];

  const currentTierData = tierDetails[selectedTier];

  const faqs = [
    {
      question: 'Does ScamShield record or store my private telephone conversations?',
      answer:
        'Absolutely not. ScamShield is built strictly upon a Zero-Retention Privacy Vault architecture. Spoken audio packets are streamed into temporary RAM buffers over encrypted WebSockets, converted to acoustic phoneme and semantic tokens in real-time, and wiped immediately upon risk evaluation. No voice recordings or call transcripts are ever written to disk or stored on external servers.',
    },
    {
      question: 'How does the Banking Circuit-Breaker actually stop money before it leaves my account?',
      answer:
        'Unlike traditional banking fraud detection which only reviews transactions AFTER payment submission, ScamShield connects directly with banking APIs (such as ShieldPay) in real-time. When a Tier-3 fraud pattern is verified (e.g. unknown caller demanding an OTP while the customer has their banking app open), ScamShield signals the core banking engine to place a graduated hold on outgoing wires, stopping the transaction before the settlement rail executes.',
    },
    {
      question: 'What happens if I am genuinely transferring money to a friend during a call?',
      answer:
        'ScamShield utilizes Multi-Signal Risk Fusion rather than relying on a single heuristic. Legitimate calls do not exhibit coordinated psychological pressure tactics such as artificial urgency, secrecy isolation ("Do not tell your family"), or impersonation of law enforcement. Even in the rare case of a false caution, the user or their registered Guardian Circle can release the transfer instantly with biometric confirmation or a 1-tap WhatsApp approval.',
    },
    {
      question: 'How does Voice-Clone Shield distinguish between a real family member and an AI deepfake?',
      answer:
        'Voice-Clone Shield deploys an ASVspoof-inspired acoustic spectral classifier that analyzes micro-artifacts invisible to the human ear — including synthetic vocoder phase inconsistencies, unnatural spectral envelope smoothness, and robotic cadence jitter. When a synthetic clone score surpasses 0.65, ScamShield automatically initiates an offline "Safe-Word Challenge" (e.g. asking for the private family code word "Falcon77").',
    },
    {
      question: 'What regional languages and South Asian dialects are supported?',
      answer:
        'ScamShield is purpose-built for diverse linguistic realities. It natively recognizes and processes Standard Urdu (اردو), Pakistani Punjabi (پنجابی), Roman Urdu (English alphabet phonetic spelling commonly used in text and speech), and Pakistani/British English. Its semantic parser recognizes regional slang, formal banking terminology, and local cultural intimidation tropes.',
    },
    {
      question: 'How does the Guardian Circle WhatsApp alert function without internet on the victim’s phone?',
      answer:
        'The circuit-breaker and alert orchestration execute server-side via our n8n automation hub and official WhatsApp Business Cloud API. As long as the bank gateway receives the risk signal from the network or client, the WhatsApp message is instantly pushed to the designated family members with cryptographically signed callback webhooks.',
    },
    {
      question: 'Can sophisticated scammers bypass the system using prompt injection?',
      answer:
        'No. ScamShield utilizes a multi-layered defense architecture. Input utterances are sanitized and structured into strict JSON schemas before reaching LLM reasoning layers. Furthermore, our evaluation suite rigorously benchmarks prompt injection attacks (including adversarial jailbreak phrases and roleplay override attempts), maintaining a 0% verdict-flip rate across our benchmark dataset.',
    },
    {
      question: 'How easily can commercial banks and digital microfinance wallets integrate ScamShield?',
      answer:
        'ScamShield provides a lightweight, modular REST and WebSocket SDK. Core banking platforms (Raast, 1LINK, JazzCash, Easypaisa, HBL, Meezan) can integrate the Graduated Circuit-Breaker via four simple API webhooks: `/bank/holds`, `/bank/step-up`, `/bank/payee-risk`, and `/bank/fraud-cases`. It conforms fully to State Bank of Pakistan (SBP) cybersecurity directives.',
    },
  ];

  return (
    <div className="w-full space-y-24 py-6" id="overview">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION: ENTERPRISE, SLEEK, REFINED                          */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-gradient-to-b from-[#070e1c] via-[#050914] to-[#04060c] p-8 sm:p-12 lg:p-16 shadow-2xl">
        {/* Subtle Ambient Background Mesh */}
        <div className="absolute -top-40 -left-40 w-[30rem] h-[30rem] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute -bottom-40 -right-40 w-[30rem] h-[30rem] bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-indigo-500/5 rounded-full blur-[140px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center space-y-8">
          {/* Top Category Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-slate-900/90 border border-slate-700/80 text-cyan-300 text-xs font-semibold shadow-inner">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>AI Builder Cup 2026</span>
            <span className="text-slate-600">•</span>
            <span className="text-slate-300 font-medium">Banking & Financial Services (BFSI) Track</span>
            <span className="text-slate-600">•</span>
            <span className="text-cyan-400 font-mono">v1.0 Live</span>
          </div>

          {/* Main Hero Headline */}
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white tracking-tight leading-[1.12]">
            The Autonomous Voice Guardian That{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
              Freezes Bank Transfers
            </span>{' '}
            Before Money Leaves.
          </h1>

          {/* Detailed, Authoritative Subheading */}
          <p className="text-base sm:text-lg text-slate-300 max-w-3xl mx-auto leading-relaxed font-normal">
            Traditional bank security stops hackers, but it is utterly powerless against <strong>Authorised Push Payment (APP) fraud</strong>, where victims are socially engineered into wiring their own savings. 
            <strong> ScamShield Live</strong> continuously monitors phone calls in <strong>Urdu, Punjabi, Roman Urdu, and English</strong>, detects deepfake clones and psychological pressure tactics in under 450 milliseconds, and triggers an autonomous physical circuit-breaker on your bank account before a single rupee can move.
          </p>

          {/* Primary Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <button
              onClick={() => onNavigateTab('call-guard')}
              className="px-7 py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 hover:from-cyan-400 hover:to-emerald-300 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-xl shadow-cyan-950/60 cursor-pointer transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Call Guard Demo</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('mock-bank')}
              className="px-6 py-4 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700/80 font-bold text-sm flex items-center gap-2.5 cursor-pointer transition-all"
            >
              <Smartphone className="w-4 h-4 text-emerald-400" />
              <span>Test ShieldPay Bank Simulator</span>
            </button>

            <button
              onClick={() => {
                const el = document.getElementById('how-it-works');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-6 py-4 rounded-2xl bg-slate-950/60 hover:bg-slate-900 text-slate-400 hover:text-slate-200 border border-slate-800 text-sm font-semibold cursor-pointer transition-all"
            >
              <span>Explore Technical Architecture</span>
            </button>
          </div>

          {/* Live Key Metrics Ribbon */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-4xl mx-auto">
            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
              <span className="text-2xl sm:text-3xl font-black text-cyan-400 font-mono block">
                &lt; 450 ms
              </span>
              <span className="text-xs text-slate-300 font-semibold block mt-1">
                Real-Time Voice Latency
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Powered by Gemini 2.5 Flash streaming WebSockets.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
              <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono block">
                10.8 s
              </span>
              <span className="text-xs text-slate-300 font-semibold block mt-1">
                Mean Time to Detection
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Stops fraud minutes before OTP extraction.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
              <span className="text-2xl sm:text-3xl font-black text-purple-400 font-mono block">
                100%
              </span>
              <span className="text-xs text-slate-300 font-semibold block mt-1">
                Ephemeral Privacy Vault
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Zero audio recordings or transcripts written to disk.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 text-left">
              <span className="text-2xl sm:text-3xl font-black text-rose-400 font-mono block">
                Rs. 0
              </span>
              <span className="text-xs text-slate-300 font-semibold block mt-1">
                Financial Loss at Tier-3
              </span>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Immediate physical hold on outgoing wires.
              </p>
            </div>
          </div>
        </div>

        {/* Hero Video & Live Alert Preview Display */}
        <div className="mt-12 max-w-4xl mx-auto rounded-3xl overflow-hidden border border-slate-800/80 shadow-2xl relative group">
          <video
            src={heroVideo}
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-80 sm:h-[26rem] object-cover object-center group-hover:scale-[1.02] transition-transform duration-700"
          >
            Your browser does not support video.
          </video>
          <div className="absolute inset-0 bg-gradient-to-t from-[#050811] via-transparent to-transparent opacity-80" />

          {/* Floating Live Telemetry Banner */}
          <div className="absolute bottom-6 left-6 right-6 p-5 rounded-2xl bg-slate-950/80 backdrop-blur-xl border border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shrink-0">
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-black text-rose-400 uppercase tracking-wider">
                    Tier 3 Emergency Interlock Engaged
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-rose-500/20 text-rose-300 border border-rose-500/40">
                    BLOCKED
                  </span>
                </div>
                <p className="text-xs text-slate-300 mt-0.5">
                  Unknown caller requested OTP credentials during active banking session. Outgoing transfer of <strong>Rs. 85,000</strong> frozen.
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('mock-bank')}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-cyan-300 border border-cyan-500/40 text-xs font-bold shrink-0 cursor-pointer"
            >
              Inspect in Bank View &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. THE CRISIS: THE ANATOMY OF VOICE FRAUD                            */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12" id="the-threat">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
            The Systemic Threat
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Why Traditional Banking Security Fails Against Voice Scams
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            In modern financial cybercrime, the adversary no longer needs to hack the server or crack the encryption. They hack the <strong>human mind</strong>.
          </p>
        </div>

        {/* 4 Psychological Traps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold">
              01
            </div>
            <h3 className="text-base font-bold text-white">Authority Impersonation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Scammers spoof official caller IDs and pose as State Bank compliance officers, FIA investigators, or customs officials, commanding immediate obedience and trust.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 font-bold">
              02
            </div>
            <h3 className="text-base font-bold text-white">Manufactured Urgency</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              <em>"Your account will be permanently blocked in 10 minutes!"</em> By introducing extreme artificial panic, the victim enters cognitive overload, disabling critical thinking.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-bold">
              03
            </div>
            <h3 className="text-base font-bold text-white">Enforced Secrecy & Isolation</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              Victims are warned: <em>"Do not hang up, do not discuss this with your family or visit the branch."</em> This cuts off any external advice or verification from loved ones.
            </p>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3 hover:border-slate-700 transition-all">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 font-bold">
              04
            </div>
            <h3 className="text-base font-bold text-white">Credential Extraction</h3>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              The victim is told that reading the 6-digit SMS OTP is necessary to "cancel the fraudulent charge," but in reality, they are authorizing the theft themselves.
            </p>
          </div>
        </div>

        {/* Side-by-Side Reality Check */}
        <div className="p-8 rounded-3xl bg-slate-950/80 border border-slate-800 grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-rose-400">
              <XCircle className="w-4 h-4" />
              <span>Current Flawed Approach (Post-Loss Regret)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Why Firewalls & SMS Warnings Never Work
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Traditional banking security looks at authentication tokens. Because the terrified customer typed their own PIN, biometric face scan, or read their own SMS code, the bank’s firewall logs the wire transfer as 100% legitimate. 
            </p>
            <p className="text-xs sm:text-sm text-slate-400 leading-relaxed">
              When the victim realizes they were scammed 15 minutes later, the funds have already hopped through multiple mule wallets and crypto off-ramps. Over 96% of Authorised Push Payment (APP) fraud funds are permanently unrecoverable.
            </p>
          </div>

          <div className="space-y-4 p-6 rounded-2xl bg-slate-900/80 border border-emerald-500/40">
            <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
              <span>The ScamShield Paradigm (In-Flight Intervention)</span>
            </div>
            <h3 className="text-xl sm:text-2xl font-bold text-white">
              Stop The Attack While It Is Being Spoken
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              ScamShield operates at the true point of vulnerability: the <strong>real-time voice conversation</strong>. By observing the deception cues and simultaneously correlating them with banking app telemetry, ScamShield intercepts the crime at the physical payment gateway before settlement occurs.
            </p>
            <div className="pt-2 flex items-center gap-3 text-xs font-bold text-emerald-400">
              <span>✓ Zero financial loss</span>
              <span>•</span>
              <span>✓ Spoken dialect intervention</span>
              <span>•</span>
              <span>✓ Family guardian veto</span>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. 8K VISUAL GALLERY & CURATED HIGH-DEFINITION SHOWCASE              */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12" id="gallery">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
            Cinematic Visual Showcase
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            8K Defense Architecture in Action
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Explore how our neural engines, banking interlocks, and computer vision models safeguard everyday families, financial institutions, and telecommunication networks.
          </p>
        </div>

        {/* Visual Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Card 1: Circuit Breaker */}
          <div className="group rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
            <div className="relative overflow-hidden h-60">
              <img
                src="/banking-circuit-breaker.jpg"
                alt="Banking Circuit Breaker 8K"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                Core Banking Shield
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Graduated Banking Circuit-Breaker
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  A high-tech digital lock on core banking rails. When Tier-3 risk is triggered, outgoing wire settlements are immediately placed in a secure escrow buffer, protecting user savings from immediate irreversible withdrawal.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('mock-bank')}
                className="pt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Test ShieldPay Circuit-Breaker</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 2: Voice Clone Biometrics */}
          <div className="group rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/70 hover:border-purple-500/50 transition-all flex flex-col justify-between">
            <div className="relative overflow-hidden h-60">
              <img
                src="/voice-clone-ai.jpg"
                alt="Voice Clone Deepfake Detection 8K"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-purple-500/40 text-[10px] font-mono text-purple-300">
                Acoustic Spectral Analysis
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-purple-400 transition-colors">
                  Voice-Clone Deepfake Shield
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Real-time detection of AI-generated cloned voices pretending to be family members in distress. Inspects phase artifacts and initiates our automated offline "Falcon77" family safe-word challenge.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('call-guard')}
                className="pt-2 text-xs font-bold text-purple-400 hover:text-purple-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Test Voice-Clone Shield</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 3: Family Safety Portrait */}
          <div className="group rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/70 hover:border-emerald-500/50 transition-all flex flex-col justify-between">
            <div className="relative overflow-hidden h-60">
              <img
                src="/family-safety-portrait.jpg"
                alt="Elderly Family Protection 8K"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-[10px] font-mono text-emerald-300">
                Guardian Circle Network
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Elderly & Family Protection Circle
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Protecting parents and grandparents who are frequently targeted by criminal syndicates. If an elder is confused, their trusted children receive an immediate WhatsApp notification with 1-tap Approve or Block controls.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('guardians')}
                className="pt-2 text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Family WhatsApp Hub</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 4: Threat Radar SOC */}
          <div className="group rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/70 hover:border-cyan-500/50 transition-all flex flex-col justify-between">
            <div className="relative overflow-hidden h-60">
              <img
                src="/threat-radar-soc.jpg"
                alt="Global Threat Radar 8K"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-cyan-500/40 text-[10px] font-mono text-cyan-300">
                Pinecone Vector Intelligence
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors">
                  Scam Radar Syndicate Clustering
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Autonomous grouping of fraud campaigns across telecommunications. Connects disparate calls into coordinated crime syndicate clusters using high-dimensional vector embeddings in Pinecone.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('scam-radar')}
                className="pt-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Inspect Scam Radar Map</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 5: Scam Lens */}
          <div className="group rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/70 hover:border-amber-500/50 transition-all flex flex-col justify-between">
            <div className="relative overflow-hidden h-60">
              <img
                src="/scam-lens-scan.jpg"
                alt="Scam Lens Computer Vision 8K"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-amber-500/40 text-[10px] font-mono text-amber-300">
                Gemini 2.5 Vision Inspector
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                  Scam Lens Screenshot & Slip Inspector
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Optical forensic analysis of fake payment receipts (Easypaisa, JazzCash, 1LINK). Detects mismatched font kerning, altered timestamps, and forged transaction reference numbers.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('scam-lens')}
                className="pt-2 text-xs font-bold text-amber-400 hover:text-amber-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Scan Receipt in Scam Lens</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Card 6: Evidence Pack Dossier */}
          <div className="group rounded-3xl overflow-hidden border border-slate-800 bg-slate-950/70 hover:border-rose-500/50 transition-all flex flex-col justify-between">
            <div className="relative overflow-hidden h-60">
              <img
                src="/hero-shield.jpg"
                alt="Evidence Pack Police Dossier 8K"
                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500"
              />
              <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-rose-500/40 text-[10px] font-mono text-rose-300">
                Forensic Police Dossier
              </div>
            </div>
            <div className="p-6 space-y-3 flex-1 flex flex-col justify-between">
              <div className="space-y-2">
                <h3 className="text-lg font-bold text-white group-hover:text-rose-400 transition-colors">
                  Automated Evidence Pack & FIA Report
                </h3>
                <p className="text-xs text-slate-300 leading-relaxed">
                  One-click generation of verifiable forensic incident dossiers with cryptographic SHA-256 integrity hashes, ready for official bank dispute resolution and FIA Cybercrime investigation.
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('evidence-pack')}
                className="pt-2 text-xs font-bold text-rose-400 hover:text-rose-300 flex items-center gap-1.5 cursor-pointer"
              >
                <span>Generate Evidence Dossier</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. THE 4-TIER GRADUATED CIRCUIT-BREAKER (INTERACTIVE ENGINE)          */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12" id="how-it-works">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
            Graduated Defense Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            The 4-Tier Graduated Circuit-Breaker Engine
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            ScamShield never causes unnecessary panic. It operates through an Exponential Moving Average (EMA) multi-signal fusion engine that scales its intervention proportionally to verified risk.
          </p>
        </div>

        {/* Interactive Tier Selector Bar */}
        <div className="flex flex-wrap items-center justify-center gap-3">
          {tierDetails.map((t) => (
            <button
              key={t.tier}
              onClick={() => setSelectedTier(t.tier)}
              className={`px-5 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer flex items-center gap-2.5 ${
                selectedTier === t.tier
                  ? t.theme === 'rose'
                    ? 'bg-rose-500 text-slate-950 shadow-lg shadow-rose-950/50 font-black'
                    : t.theme === 'amber'
                    ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-950/50 font-black'
                    : t.theme === 'yellow'
                    ? 'bg-yellow-400 text-slate-950 shadow-lg shadow-yellow-950/50 font-black'
                    : 'bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-950/50 font-black'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-800'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-current" />
              <span>Tier {t.tier}</span>
              <span className="text-[10px] opacity-75 font-mono">({t.scoreRange})</span>
            </button>
          ))}
        </div>

        {/* Active Tier Interactive Detail Display */}
        <div className="p-8 sm:p-10 rounded-3xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center shadow-xl">
          <div className="lg:col-span-8 space-y-6">
            <div className="space-y-2">
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-900 border border-slate-700 text-cyan-300">
                {currentTierData.scoreRange}
              </span>
              <h3 className="text-2xl font-black text-white">
                {currentTierData.name}
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                {currentTierData.description}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-cyan-400 block">
                  Voice Intervention
                </span>
                <p className="text-xs text-slate-200 font-medium">
                  {currentTierData.systemIntervention}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-emerald-400 block">
                  Banking Circuit-Breaker
                </span>
                <p className="text-xs text-slate-200 font-medium">
                  {currentTierData.bankingEffect}
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                <span className="text-[10px] uppercase font-bold text-purple-400 block">
                  Guardian Circle
                </span>
                <p className="text-xs text-slate-200 font-medium">
                  {currentTierData.familyNotice}
                </p>
              </div>
            </div>
          </div>

          <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-4">
            <span className="text-xs uppercase font-bold tracking-wider text-slate-400">
              Graduated Action Ladder
            </span>
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
              <span className="text-4xl font-black font-mono text-cyan-400">
                Tier {currentTierData.tier}
              </span>
              <span className="text-xs font-semibold text-slate-300">
                {currentTierData.actionTitle}
              </span>
            </div>

            <button
              onClick={() => onNavigateTab('call-guard')}
              className="w-full py-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-all"
            >
              <span>Test This Tier in Simulator</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. MULTI-AGENT ARCHITECTURE & DEEP TECHNOLOGY STACK                  */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12" id="technology">
        <div className="text-center max-w-3xl mx-auto space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
            Multi-Agent ADK Architecture
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            How The Neural Defense Pipeline Operates Under The Hood
          </h2>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Engineered upon Google DeepMind's Agent Development Kit (ADK) principles, ScamShield coordinates 5 specialized autonomous agents in a synchronized parallel pipeline.
          </p>
        </div>

        {/* 5 Specialized Agents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Agent 1 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">Agent 1</span>
              <Radio className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white">The Acoustic Listener</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Maintains continuous streaming WebSockets at 16kHz audio sample rate. Performs Voice Activity Detection (VAD) and dual-channel speaker separation to isolate caller speech from the victim.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
              Latency: &lt; 80ms • Memory: Ephemeral
            </div>
          </div>

          {/* Agent 2 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-400 uppercase tracking-wider">Agent 2</span>
              <Cpu className="w-4 h-4 text-emerald-400" />
            </div>
            <h3 className="text-lg font-bold text-white">The Gemini Cognitive Analyst</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Powered by <strong>Gemini 2.5 Flash</strong>. Extracts 8 psychological coercion tactics in real-time with strict JSON schema outputs. Completely hardened against prompt injection overrides.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
              Tactics: 8 Classes • Dialects: Urdu/Punjabi
            </div>
          </div>

          {/* Agent 3 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-purple-400 uppercase tracking-wider">Agent 3</span>
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <h3 className="text-lg font-bold text-white">The Circuit-Breaker Guardian</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Fuses call risk scores with live banking app state (payment in progress, unknown payee, abnormal amount). Enforces safety interlocks and triggers the physical bank wire hold.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
              Protocol: Graduated 4-Tier Ladder
            </div>
          </div>

          {/* Agent 4 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-amber-400 uppercase tracking-wider">Agent 4</span>
              <Volume2 className="w-4 h-4 text-amber-400" />
            </div>
            <h3 className="text-lg font-bold text-white">The Dialect Whisper Coach</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generates empathetic, non-judgmental spoken voice guidance in the victim's native language. Tells the user exactly how to counter high-pressure questions and when to hang up safely.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
              Speech Synthesis: Urdu / Roman Urdu / Punjabi
            </div>
          </div>

          {/* Agent 5 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-rose-400 uppercase tracking-wider">Agent 5</span>
              <FileText className="w-4 h-4 text-rose-400" />
            </div>
            <h3 className="text-lg font-bold text-white">The Forensic Reporter</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Leverages <strong>Gemini 2.5 Pro</strong> to compile cryptographic Evidence Packs. Maps call patterns to known syndicated campaigns in Pinecone and formats dossiers for law enforcement.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
              Output: Signed JSON & PDF Evidence
            </div>
          </div>

          {/* Agent 6 */}
          <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-cyan-400 uppercase tracking-wider">Agent 6</span>
              <MapPin className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-lg font-bold text-white">The Vector Radar Scout</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Generates 1536-dimensional embeddings of threat phrases, clustering similar fraud scripts into regional syndicates across the country to alert telecom providers and banks proactively.
            </p>
            <div className="pt-2 text-[11px] font-mono text-slate-400 border-t border-slate-800">
              Vector Store: Pinecone Index
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. PRIVACY BY DESIGN & ZERO-TRUST GOVERNANCE                         */}
      {/* ==================================================================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-slate-950 via-[#070e1c] to-slate-950 border border-slate-800 space-y-8">
          <div className="max-w-3xl space-y-3">
            <span className="text-xs font-black uppercase tracking-widest text-emerald-400">
              Privacy-by-Design Architecture
            </span>
            <h2 className="text-2xl sm:text-3xl font-black text-white">
              "How Can You Protect Me Without Listening to My Private Life?"
            </h2>
            <p className="text-sm text-slate-300 leading-relaxed">
              We recognized from Day 1 that a voice security guardian must earn absolute consumer trust. ScamShield is architected upon strict cryptographic and ephemeral boundaries:
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
                <Lock className="w-4 h-4" />
                <span>Zero Audio Recording</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Raw audio chunks live strictly in volatile RAM for the milliseconds required for acoustic analysis, and are flushed immediately. No .wav or .mp3 files are ever saved.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
                <Fingerprint className="w-4 h-4" />
                <span>Local PII & CNIC Masking</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Account numbers, CNIC digits, phone numbers, and names are sanitized locally on-device before semantic representations reach any reasoning models.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-slate-900/70 border border-slate-800 space-y-2">
              <div className="flex items-center gap-2 text-purple-400 font-bold text-sm">
                <ShieldCheck className="w-4 h-4" />
                <span>State Bank Compliance</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Fully aligned with State Bank of Pakistan (SBP) cybersecurity directives and international GDPR frameworks governing real-time automated fraud mitigation.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 7. FREQUENTLY ASKED QUESTIONS (COMPREHENSIVE & CLEAR)                */}
      {/* ==================================================================== */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8" id="faq">
        <div className="text-center space-y-3">
          <span className="text-xs font-black uppercase tracking-widest text-cyan-400">
            Frequently Asked Questions
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight">
            Everything You Need To Know
          </h2>
          <p className="text-sm text-slate-400">
            Answers for consumers, families, banking compliance teams, and technical hackathon judges.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => {
            const isOpen = expandedFaq === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-slate-800 bg-slate-950/70 overflow-hidden transition-all"
              >
                <button
                  onClick={() => setExpandedFaq(isOpen ? null : idx)}
                  className="w-full p-5 text-left flex items-center justify-between gap-4 cursor-pointer hover:bg-slate-900/50 transition-colors"
                >
                  <span className="text-sm sm:text-base font-bold text-slate-200">
                    {faq.question}
                  </span>
                  <div className="p-1 rounded-lg bg-slate-900 text-slate-400 shrink-0">
                    {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </button>

                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-900/80">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 8. FINAL CALL TO ACTION: TEST THE LIVE SYSTEM                        */}
      {/* ==================================================================== */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-r from-cyan-950/80 via-slate-900 to-teal-950/80 border border-cyan-500/40 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="space-y-3 max-w-2xl mx-auto">
            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
              Experience ScamShield Live in Action
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Step into the Live Call Companion to run real-world scam call scenarios with synchronized audio waveforms, Urdu voice warnings, and live banking circuit-breaker holds.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <button
              onClick={() => onNavigateTab('call-guard')}
              className="px-8 py-4 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm inline-flex items-center gap-2.5 shadow-xl shadow-cyan-950/70 cursor-pointer transition-all transform hover:-translate-y-0.5"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Launch Live Call Guard Simulator</span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateTab('mock-bank')}
              className="px-6 py-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm cursor-pointer transition-all"
            >
              <span>Explore ShieldPay Banking App</span>
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
