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
  RotateCcw,
  Flame,
  Key,
  Lock,
  HeartHandshake,
  ShieldCheck,
  PhoneCall,
  Volume2,
  HelpCircle,
} from 'lucide-react';
import { ActiveTab } from '../Header';

interface HomePageProps {
  onNavigateTab: (tab: ActiveTab) => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigateTab }) => {
  // Simple interactive demo slider for non-tech users
  const [selectedStoryStep, setSelectedStoryStep] = useState<number>(0);

  const storySteps = [
    {
      badge: 'Step 1: The Trap Call Begins',
      title: 'A Stranger Calls Your Phone',
      description: 'The caller sounds polite but official: "Assalam-o-Alaikum, I am calling from State Bank security. Your account will be frozen in 10 minutes!"',
      whatScamShieldDoes: 'ScamShield quietly listens in the background. It instantly recognizes that official banks never threaten customers with sudden account blocks.',
      alertStatus: 'Listening quietly • Safe',
      color: 'emerald',
      score: 15,
    },
    {
      badge: 'Step 2: Urgency & Panic',
      title: 'The Scammer Pressures You',
      description: 'They urge you not to tell anyone: "Do not visit the branch, stay on the line and open your mobile banking app right now to verify."',
      whatScamShieldDoes: 'ScamShield detects the secrecy tactic and prompts a calm Urdu warning: "بینک کبھی خفیہ رکھنے کو نہیں کہتا" (The bank never asks for secrecy).',
      alertStatus: 'Warning • Stay Calm',
      color: 'orange',
      score: 65,
    },
    {
      badge: 'Step 3: The Moment of Theft Prevented',
      title: 'They Ask for Your Secret OTP Code',
      description: '"A 6-digit code has been sent to your phone. Read it out to me immediately or your money is gone!"',
      whatScamShieldDoes: 'EMERGENCY BRAKE ENGAGED! ScamShield immediately locks your outgoing payment before a single rupee can move, and sends a WhatsApp alert to your son or daughter.',
      alertStatus: 'CRITICAL FRAUD STOPPED',
      color: 'rose',
      score: 96,
    },
  ];

  const currentStory = storySteps[selectedStoryStep];

  return (
    <div className="space-y-16 py-2">
      {/* ==================================================================== */}
      {/* 1. HERO SECTION: SIMPLE, EMOTIONAL, POWERFUL                        */}
      {/* ==================================================================== */}
      <section className="relative overflow-hidden rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 via-slate-950 to-[#070d18] p-6 sm:p-10 lg:p-12 shadow-2xl">
        {/* Ambient background glows */}
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-emerald-500/15 rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
          {/* Left Hero Story */}
          <div className="lg:col-span-7 space-y-5">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-950/90 border border-cyan-700/60 text-cyan-300 text-xs font-semibold">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>AI Protection for Every Family & Bank</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400">Simple • Safe • Real-Time</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
              Stop Voice Scams{' '}
              <span className="bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                Before The Money Moves.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal">
              When scammers call pretending to be your bank or a child in trouble, they trick you into sending money. 
              <strong> ScamShield Live</strong> is your real-time guardian: it hears the deception in <strong>Urdu, Punjabi, Roman Urdu, and English</strong>, warns you calmly, and puts a safety brake on your bank account in seconds.
            </p>

            {/* Simple Human Actions */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => onNavigateTab('call-guard')}
                className="px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-slate-950 font-black text-sm flex items-center gap-2.5 shadow-lg shadow-cyan-950/60 cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <Play className="w-4 h-4 fill-current" />
                <span>See Live Demo in Action</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => onNavigateTab('mock-bank')}
                className="px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 text-slate-200 border border-slate-700 font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Smartphone className="w-4 h-4 text-cyan-400" />
                <span>Try Bank Simulator</span>
              </button>

              <button
                onClick={() => onNavigateTab('guardians')}
                className="px-5 py-3.5 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/40 text-emerald-300 border border-emerald-800/60 font-bold text-sm flex items-center gap-2 cursor-pointer transition-all"
              >
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Family WhatsApp Alert</span>
              </button>
            </div>

            {/* Plain-English Badges */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-4 text-xs text-slate-300">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Understands Urdu & Punjabi</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Zero Audio Recorded (100% Private)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Family WhatsApp Protection</span>
              </div>
            </div>
          </div>

          {/* Right Hero Video Card */}
          <div className="lg:col-span-5 relative">
            <div className="relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-2xl glow-cyan group">
              <video
                src={heroVideo}
                aria-label="ScamShield Live Cyber Shield"
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-80 sm:h-96 object-cover object-center group-hover:scale-105 transition-transform duration-700"
              >
                Your browser does not support the video element.
              </video>

              {/* Friendly Floating Badge */}
              <div className="absolute top-4 left-4 right-4 flex items-center justify-between p-3 rounded-xl bg-slate-950/35 backdrop-blur-md border border-white/10 text-xs text-white shadow-lg shadow-cyan-950/20">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                  <span className="font-bold text-emerald-200/80">GUARDIAN ACTIVE</span>
                </div>
                <span className="text-slate-100/60 font-medium">Protecting Your Savings</span>
              </div>

              {/* Bottom Live Alert Floating Card */}
              <div className="absolute bottom-4 left-4 right-4 p-4 rounded-xl bg-slate-950/45 backdrop-blur-md border border-rose-500/40 shadow-xl shadow-rose-950/20">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="font-black text-rose-200/80 flex items-center gap-1.5">
                    <ShieldAlert className="w-4 h-4" /> SCAM STOPPED BEFORE TRANSFER
                  </span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/15 text-rose-200/80 border border-rose-300/30">
                    PROTECTED
                  </span>
                </div>
                <p className="text-xs text-slate-100/75 mt-1">
                  Someone asked for your secret OTP code. Outgoing transfer of <strong>Rs. 85,000</strong> has been safely frozen.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 2. THREE SIMPLE STEPS: HOW IT WORKS IN PLAIN WORDS                   */}
      {/* ==================================================================== */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
            Simple 3-Step Protection
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            How ScamShield Protects You in 3 Simple Steps
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            No technical knowledge needed. ScamShield works automatically on phone calls and banking apps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Step 1 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-cyan-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-300 font-black text-lg">
                1
              </div>
              <h3 className="text-lg font-bold text-white">1. You Receive A Call</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                When an unknown caller dials your phone, ScamShield quietly listens. It doesn’t store your voice. It only detects psychological pressure words like <em>"Account block ho raha hai"</em> or <em>"Main police se bol raha hoon"</em>.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-cyan-300 font-medium">
              ✓ Completely private • No recordings saved
            </div>
          </div>

          {/* Step 2 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-amber-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-300 font-black text-lg">
                2
              </div>
              <h3 className="text-lg font-bold text-white">2. Calm Urdu Voice Warning</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                If the caller pushes you into a hurry, ScamShield whispers a calm, clear alert on your screen and speaker:
                <strong className="block text-cyan-300 font-semibold mt-1">
                  "بینک کبھی فون پر OTP یا PIN نہیں مانگتا۔ فوراً کال کاٹ دیں"
                </strong>
                (Banks never ask for codes by phone. Hang up now).
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-amber-300 font-medium">
              ✓ Clear spoken warnings in Urdu & English
            </div>
          </div>

          {/* Step 3 */}
          <div className="glass-panel p-6 rounded-2xl border border-slate-800 space-y-4 hover:border-rose-500/40 transition-all flex flex-col justify-between">
            <div className="space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-300 font-black text-lg">
                3
              </div>
              <h3 className="text-lg font-bold text-white">3. Your Money is Frozen</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Even if you were panicked and typed the payment, ScamShield's <strong>Circuit-Breaker</strong> holds the funds before they leave. A WhatsApp notification is instantly sent to your trusted family member with 1-tap Approve or Block buttons.
              </p>
            </div>
            <div className="p-2.5 rounded-xl bg-slate-950/70 border border-slate-800/80 text-[11px] text-rose-300 font-medium">
              ✓ Money stays safe in your account
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 3. INTERACTIVE STORY PLAYER: EXPERIENCE A SCAM WITHOUT ANY RISK      */}
      {/* ==================================================================== */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-300">
                Interactive Walkthrough
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white mt-0.5">
              Experience How ScamShield Intervenes in Real Life
            </h2>
          </div>

          <div className="flex items-center gap-1.5">
            {storySteps.map((step, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedStoryStep(idx)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedStoryStep === idx
                    ? 'bg-cyan-500 text-slate-950 shadow-md'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-800 border border-slate-800'
                }`}
              >
                Step {idx + 1}
              </button>
            ))}
          </div>
        </div>

        {/* Story Card Box */}
        <div className="p-6 rounded-2xl bg-slate-950/90 border border-slate-800 grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-8 space-y-3">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-mono">
              {currentStory.badge}
            </span>
            <h3 className="text-lg font-bold text-white">{currentStory.title}</h3>
            <p className="text-sm text-slate-300 italic bg-slate-900/80 p-3 rounded-xl border border-slate-800">
              {currentStory.description}
            </p>
            <div className="pt-2">
              <span className="text-xs font-bold text-emerald-400 block mb-0.5">
                🛡️ What ScamShield Does:
              </span>
              <p className="text-xs text-slate-200 leading-relaxed">
                {currentStory.whatScamShieldDoes}
              </p>
            </div>
          </div>

          <div className="md:col-span-4 flex flex-col items-center justify-center p-5 rounded-2xl bg-slate-900/90 border border-slate-800 text-center space-y-2">
            <span className="text-[10px] uppercase font-bold text-slate-400">Real-Time Threat Level</span>
            <div
              className={`text-4xl font-black font-mono ${
                currentStory.color === 'rose'
                  ? 'text-rose-400'
                  : currentStory.color === 'orange'
                  ? 'text-orange-400'
                  : 'text-emerald-400'
              }`}
            >
              {currentStory.score}%
            </div>
            <span
              className={`px-3 py-1 rounded-full text-xs font-bold ${
                currentStory.color === 'rose'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/50'
                  : currentStory.color === 'orange'
                  ? 'bg-orange-500/20 text-orange-300 border border-orange-500/50'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
              }`}
            >
              {currentStory.alertStatus}
            </span>

            <button
              onClick={() => onNavigateTab('call-guard')}
              className="mt-3 w-full py-2 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-200 border border-cyan-500/40 text-xs font-bold flex items-center justify-center gap-1.5 cursor-pointer"
            >
              Test in Call Guard <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 4. THE 3 SIMPLE FEATURE HUBS (WELL ORGANIZED FOR EVERYONE)            */}
      {/* ==================================================================== */}
      <section className="space-y-8">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
            Simple 3-Part Defense Hub
          </span>
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            All Features Organized In 3 Clear Hubs
          </h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Everything you need: Protect calls while speaking, freeze suspicious transfers, and check fake screenshots.
          </p>
        </div>

        <div className="space-y-6">
          {/* ---------------- HUB 1: LIVE CALL PROTECTION ---------------- */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-cyan-500/40 shadow-xl glow-cyan">
              <img
                src="/voice-clone-ai.jpg"
                alt="AI Voice Detection"
                className="w-full h-64 sm:h-72 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-4 flex flex-col justify-end">
                <span className="text-xs font-bold text-cyan-300">Feature F1, F7 & F8</span>
                <span className="text-sm font-bold text-white">Live Call Guard & Voice-Clone Shield</span>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-cyan-400">
                <Radio className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Hub 1 • Live Call & Deepfake Voice Guardian
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Protects you <strong>while you are talking</strong> on the phone:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Live Call Guard:</strong> Continuously scores psychological tricks sentence by sentence in Urdu, Punjabi, Roman Urdu, and English.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Voice-Clone Shield:</strong> Detects AI-generated fake voices pretending to be a family member in distress and prompts a secret family safe-word ("Falcon77").</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                  <span><strong>Calm Urdu Whispers:</strong> Speaks reassuring instructions so you know when to hang up without feeling embarrassed.</span>
                </li>
              </ul>

              <button
                onClick={() => onNavigateTab('call-guard')}
                className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                Open Call Guard Screen <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ---------------- HUB 2: BANK & FAMILY SAFETY NET ------------ */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 space-y-4 order-2 lg:order-1">
              <div className="flex items-center gap-2 text-emerald-400">
                <Users className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Hub 2 • Bank Freeze & Guardian Circle
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Protects the <strong>money in your account</strong> and keeps your loved ones in the loop:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>ShieldPay Circuit-Breaker:</strong> If someone asks for your OTP while you are inside your banking app, the transfer is frozen on the spot.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Guardian Circle (WhatsApp):</strong> Trusted children or family members get a WhatsApp message with 1-tap Approve or Block buttons.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span><strong>Peace of Mind:</strong> If an elderly parent is confused, their money cannot move without family confirmation.</span>
                </li>
              </ul>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => onNavigateTab('mock-bank')}
                  className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  View ShieldPay App <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateTab('guardians')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Family WhatsApp Hub
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-emerald-500/40 shadow-xl glow-emerald order-1 lg:order-2">
              <img
                src="/guardian-family.jpg"
                alt="Family Guardian WhatsApp Protection"
                className="w-full h-64 sm:h-72 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-4 flex flex-col justify-end">
                <span className="text-xs font-bold text-emerald-300">Feature F4, F5 & F6</span>
                <span className="text-sm font-bold text-white">Family Protection Network</span>
              </div>
            </div>
          </div>

          {/* ---------------- HUB 3: PHOTO CHECKER & TRAINING ----------- */}
          <div className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-5 relative rounded-2xl overflow-hidden border border-purple-500/40 shadow-xl glow-cyan">
              <img
                src="/scam-lens-scan.jpg"
                alt="Scam Lens Photo Checker"
                className="w-full h-64 sm:h-72 object-cover object-center"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent p-4 flex flex-col justify-end">
                <span className="text-xs font-bold text-purple-300">Feature F9, F12 & F13</span>
                <span className="text-sm font-bold text-white">Scam Lens, Gym & Evidence Dossier</span>
              </div>
            </div>

            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-2 text-purple-400">
                <Eye className="w-5 h-5" />
                <h3 className="text-lg font-bold text-white uppercase tracking-wider">
                  Hub 3 • Photo Checker, AI Sparring & Police Dossier
                </h3>
              </div>
              <p className="text-sm text-slate-300 leading-relaxed">
                Tools to verify suspicious messages, train yourself, and report fraud:
              </p>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Scam Lens:</strong> Take a photo of a suspicious SMS, WhatsApp screenshot, or doctored JazzCash/Easypaisa payment slip to check if it’s forged.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Scam Gym:</strong> Practice chatting with a fake AI scammer safely to build resistance against pressure tricks.</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                  <span><strong>Evidence Pack:</strong> 1-click official PDF report generated for bank disputes and the FIA Cybercrime department.</span>
                </li>
              </ul>

              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => onNavigateTab('scam-lens')}
                  className="px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  Try Scam Lens <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => onNavigateTab('scam-gym')}
                  className="px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-purple-800/60 font-bold text-xs flex items-center gap-1.5 cursor-pointer"
                >
                  Spar in Scam Gym
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 5. BEFORE VS AFTER COMPARISON TABLE (SUPER EASY TO UNDERSTAND)       */}
      {/* ==================================================================== */}
      <section className="glass-panel p-6 sm:p-8 rounded-3xl border border-slate-800 space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-1">
          <span className="text-xs uppercase font-bold tracking-wider text-cyan-400">
            Clear Difference
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Life Before ScamShield vs With ScamShield Live
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Before */}
          <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-500/40 space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <XCircle className="w-5 h-5" />
              <span>WITHOUT SCAMSHIELD (TODAY)</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Scammer calls claiming an emergency; victim is terrified and stressed.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Victim authorizes the transfer themselves, so the bank thinks it is genuine.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Savings are stolen in under 3 minutes; recovery is nearly impossible.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span>Victim suffers shame and emotional distress alone.</span>
              </li>
            </ul>
          </div>

          {/* With ScamShield */}
          <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/40 space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              <span>WITH SCAMSHIELD LIVE</span>
            </div>
            <ul className="space-y-2.5 text-xs sm:text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>ScamShield hears the panic words and speaks a calm warning in Urdu.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>The bank transfer is automatically frozen before the money moves.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>A trusted family member gets a WhatsApp ping to approve or block with 1 tap.</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span>Zero financial loss. The family and bank stay protected.</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* ==================================================================== */}
      {/* 6. CALL TO ACTION FOOTER                                             */}
      {/* ==================================================================== */}
      <section className="p-8 sm:p-10 rounded-3xl bg-gradient-to-r from-cyan-950/70 via-slate-900 to-teal-950/70 border border-cyan-500/40 text-center space-y-4">
        <h3 className="text-2xl sm:text-3xl font-black text-white">
          Ready to Test the System Yourself?
        </h3>
        <p className="text-xs sm:text-sm text-slate-300 max-w-lg mx-auto">
          Choose any feature from the navigation bar above or click below to launch the live call simulator.
        </p>

        <button
          onClick={() => onNavigateTab('call-guard')}
          className="px-6 py-3.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-sm inline-flex items-center gap-2 shadow-lg cursor-pointer"
        >
          <Play className="w-4 h-4 fill-current" />
          <span>Launch Live Call Guard Demo</span>
        </button>
      </section>
    </div>
  );
};
