import React, { useState } from 'react';
import {
  Swords,
  Send,
  Sparkles,
  Trophy,
  RotateCcw,
  Bot,
  User,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import { GymScenario } from '../../types';
import { MOCK_GYM_SCENARIOS } from '../../mockData/scenarios';

interface ChatMessage {
  sender: 'ai_scammer' | 'user' | 'coach';
  text: string;
  timestamp: string;
  coachTip?: string;
  vulnerabilityWarning?: boolean;
}

export const ScamGym: React.FC = () => {
  const [selectedGym, setSelectedGym] = useState<GymScenario>(MOCK_GYM_SCENARIOS[0]);
  const [userInput, setUserInput] = useState<string>('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: 'ai_scammer',
      text: MOCK_GYM_SCENARIOS[0].opening_message,
      timestamp: '10:00 AM',
    },
    {
      sender: 'coach',
      text: 'Coach Whisper: Notice the immediate authority claim ("Inspector Naveed") and artificial emergency. Do not verify any personal details.',
      timestamp: '10:00 AM',
    },
  ]);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [resilienceScore, setResilienceScore] = useState<number>(88);

  const handleSelectScenario = (sc: GymScenario) => {
    setSelectedGym(sc);
    setIsCompleted(false);
    setMessages([
      {
        sender: 'ai_scammer',
        text: sc.opening_message,
        timestamp: 'Just now',
      },
      {
        sender: 'coach',
        text: `Coach Whisper: You are facing a "${sc.caller_role}". Their hidden objective is: ${sc.target_ask}. Stay calm and resist!`,
        timestamp: 'Just now',
      },
    ]);
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;

    const userMsg: ChatMessage = {
      sender: 'user',
      text: userInput,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setUserInput('');

    // AI Scammer Response simulation
    setTimeout(() => {
      let scammerReply = '';
      let coachNote = '';
      const inputLower = userInput.toLowerCase();

      if (inputLower.includes('otp') || inputLower.includes('code') || inputLower.includes('pin') || /\d{4,6}/.test(inputLower)) {
        scammerReply = 'Thank you for verifying. Let me now process the cancellation immediately...';
        coachNote = 'CRITICAL VULNERABILITY: You just shared sensitive digits! In a real call, the attacker would now drain the funds.';
        setResilienceScore(35);
      } else if (inputLower.includes('branch') || inputLower.includes('hang up') || inputLower.includes('fake') || inputLower.includes('police')) {
        scammerReply = 'Sir please do not disconnect! If you go to the branch your account will be permanently blocked before you reach!';
        coachNote = 'EXCELLENT DEFENSE: You resisted the pressure and questioned their authority! This broke their script.';
        setResilienceScore((prev) => Math.min(100, prev + 8));
      } else {
        scammerReply = 'Sir, time is running out. We need your 6-digit verification code right now to cancel the debit transaction.';
        coachNote = 'ATTENTION: Scammer is repeating urgency pressure. Ask them to verify their official employee ID and hang up.';
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'ai_scammer',
          text: scammerReply,
          timestamp: 'Just now',
        },
        {
          sender: 'coach',
          text: coachNote,
          timestamp: 'Just now',
          vulnerabilityWarning: coachNote.includes('CRITICAL'),
        },
      ]);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Swords className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Feature F12 • Scam Gym (Interactive Resistance Arena)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-purple-950 text-purple-300 border border-purple-800">
              Interactive Judged Challenge
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Test your psychological resilience against real scam playbooks. Safe sandbox with live AI coaching.
          </p>
        </div>

        {/* Level Selector */}
        <div className="flex items-center gap-2">
          {MOCK_GYM_SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(sc)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedGym.id === sc.id
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
              }`}
            >
              {sc.difficulty}: {sc.title.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Gym Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (8 cols): Interactive Chat Simulation Arena */}
        <div className="lg:col-span-8 flex flex-col h-[520px] glass-panel rounded-2xl border border-slate-800 overflow-hidden">
          {/* Scenario Info Bar */}
          <div className="p-3.5 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span className="text-xs font-bold text-white">{selectedGym.caller_role}</span>
              <span className="text-[10px] text-slate-400 font-mono">• Difficulty: {selectedGym.difficulty}</span>
            </div>
            <button
              onClick={() => handleSelectScenario(selectedGym)}
              className="text-xs text-slate-400 hover:text-white flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Reset Sparring
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 p-4 overflow-y-auto space-y-3">
            {messages.map((m, idx) => {
              if (m.sender === 'coach') {
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl text-xs border flex items-start gap-2.5 ${
                      m.vulnerabilityWarning
                        ? 'bg-rose-950/40 border-rose-500/60 text-rose-200'
                        : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-200'
                    }`}
                  >
                    <Sparkles className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{m.text}</p>
                  </div>
                );
              }

              const isUser = m.sender === 'user';
              return (
                <div
                  key={idx}
                  className={`flex items-start gap-2.5 ${isUser ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-xs font-bold ${
                      isUser
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                    }`}
                  >
                    {isUser ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                  </div>

                  <div
                    className={`max-w-[78%] p-3 rounded-2xl text-xs leading-relaxed ${
                      isUser
                        ? 'bg-cyan-600/30 border border-cyan-500/40 text-white rounded-tr-none'
                        : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <p>{m.text}</p>
                    <span className="text-[10px] text-slate-500 block mt-1 text-right font-mono">
                      {m.timestamp}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input Box */}
          <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={userInput}
              onChange={(e) => setUserInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type your response to the scammer (e.g., 'What is your employee ID?' or 'I am hanging up')..."
              className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
            <button
              onClick={handleSendMessage}
              className="p-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold transition-all cursor-pointer shadow-md"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Right Column (4 cols): User Immunity Report */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 text-center">
            <Trophy className="w-10 h-10 text-cyan-400 mx-auto mb-2" />
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Vulnerability Resistance Score
            </span>
            <div className="text-4xl font-black font-mono text-cyan-300 mt-1">
              {resilienceScore}%
            </div>
            <p className="text-xs text-slate-300 mt-1">
              {resilienceScore >= 80 ? 'HIGH IMMUNITY (Trained Defender)' : 'VULNERABLE TO SOCIAL PRESSURE'}
            </p>

            <div className="mt-4 pt-4 border-t border-slate-800 space-y-2 text-left text-xs">
              <div className="flex justify-between text-slate-300">
                <span>Authority Resistance:</span>
                <span className="text-emerald-400 font-bold">92%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Urgency Deflection:</span>
                <span className="text-cyan-400 font-bold">85%</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Credential Withholding:</span>
                <span className="text-emerald-400 font-bold">96%</span>
              </div>
            </div>
          </div>

          <div className="glass-panel p-4 rounded-2xl border border-slate-800 space-y-2 text-xs">
            <h4 className="font-bold text-white flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Dual Value of Scam Gym
            </h4>
            <p className="text-slate-400 leading-normal">
              1. <strong>Customer Training</strong>: Builds behavioral immunity before an attack occurs.
            </p>
            <p className="text-slate-400 leading-normal">
              2. <strong>Synthetic Data Engine</strong>: Every interaction creates anonymized training samples in Urdu & English for tuning the Risk Fusion Engine.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
