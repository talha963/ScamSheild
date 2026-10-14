import React, { useState, useEffect } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage/HomePage';
import { CallCompanion } from './components/CallCompanion/CallCompanion';
import { ScamCallDemo } from './components/ScamCallDemo/ScamCallDemo';
import { MockBank } from './components/MockBank/MockBank';
import { ScamLens } from './components/ScamLens/ScamLens';
import { ScamGym } from './components/ScamGym/ScamGym';
import { ScamRadar } from './components/ScamRadar/ScamRadar';
import { GuardianCircle } from './components/GuardianCircle/GuardianCircle';
import { EvidencePack } from './components/EvidencePack/EvidencePack';
import { EvaluationDashboard } from './components/Evaluation/EvaluationDashboard';
import { RiskEvent } from './types';
import { DEMO_SCENARIOS } from './mockData/scenarios';
import { ChevronRight, ArrowLeft } from 'lucide-react';

export function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('home');
  const [currentRiskEvent, setCurrentRiskEvent] = useState<RiskEvent>(
    DEMO_SCENARIOS[0].timeline[0].riskEvent
  );
  const [isHoldActive, setIsHoldActive] = useState<boolean>(false);
  const [heldAmount, setHeldAmount] = useState<number>(85000);
  const [heldReason, setHeldReason] = useState<string>(
    'ScamShield Alert: Unknown caller requesting secret OTP code'
  );

  // Theme Management with LocalStorage persistence & system auto-detect
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('scamshield_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches
        ? 'dark'
        : 'light';
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('scamshield_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  const handleTriggerBankHold = (amount: number, reason: string) => {
    setIsHoldActive(true);
    setHeldAmount(amount);
    setHeldReason(reason);
  };

  const handleGuardianApprove = () => {
    setIsHoldActive(false);
  };

  const handleGuardianBlock = () => {
    setIsHoldActive(false);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-300 selection:bg-blue-100 selection:text-blue-900 dark:selection:bg-blue-900 dark:selection:text-blue-200">
      {/* Creative Floating Navbar with Dark Mode Toggle */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full pt-4">
        {activeTab === 'home' ? (
          <HomePage onNavigateTab={setActiveTab} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
            {/* Interactive Breadcrumb Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs shadow-xs">
              <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-blue-600 dark:hover:text-blue-400 transition-colors flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400 dark:text-slate-600" />
                <span className="font-bold text-blue-600 dark:text-blue-400 capitalize">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 dark:text-slate-400 hidden sm:inline">
                  Interactive Simulator Active
                </span>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold cursor-pointer text-[11px] border border-slate-200 dark:border-slate-700 shadow-xs"
                >
                  Back to Home
                </button>
              </div>
            </div>

            {/* Active Interactive Component */}
            {/* Active Interactive Component: Scam Call Role-Play Simulator */}
            {activeTab === 'call-guard' && (
              <ScamCallDemo />
            )}

            {activeTab === 'mock-bank' && (
              <MockBank
                currentTier={currentRiskEvent.tier}
                activeCallId={currentRiskEvent.call_id}
                isCallActive={currentRiskEvent.fused_score > 20}
                onSimulateGuardianApproval={() => {
                  setActiveTab('guardians');
                }}
              />
            )}

            {activeTab === 'scam-lens' && <ScamLens />}

            {activeTab === 'scam-gym' && <ScamGym />}

            {activeTab === 'scam-radar' && <ScamRadar />}

            {activeTab === 'guardians' && (
              <GuardianCircle
                isHoldActive={isHoldActive}
                heldAmount={heldAmount}
                heldReason={heldReason}
                onApproveHold={handleGuardianApprove}
                onBlockHold={handleGuardianBlock}
              />
            )}

            {activeTab === 'evidence-pack' && (
              <EvidencePack riskEvent={currentRiskEvent} />
            )}

            {activeTab === 'evaluation' && <EvaluationDashboard />}
          </div>
        )}
      </main>

      {/* Reassurance Footer */}
      <Footer onNavigateTab={setActiveTab} />
    </div>
  );
}

export default App;
