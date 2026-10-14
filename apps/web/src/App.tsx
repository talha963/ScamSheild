import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage/HomePage';
import { CallCompanion } from './components/CallCompanion/CallCompanion';
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
    'ScamShield Tier 3 Alert: Active unknown caller asking for OTP'
  );

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
    <div className="min-h-screen bg-[#050811] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Sleek Enterprise Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={{
          connected: true,
          geminiModel: 'Gemini 2.5 Flash',
          latencyMs: 340,
          activeTier: currentRiskEvent.tier,
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full">
        {activeTab === 'home' ? (
          <HomePage onNavigateTab={setActiveTab} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Interactive Breadcrumb Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800 text-xs">
              <div className="flex items-center gap-2 text-slate-400">
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-cyan-400 transition-colors flex items-center gap-1 font-semibold text-slate-300 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Homepage Overview</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-bold text-cyan-400 capitalize">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-400 hidden sm:inline">
                  Interactive Simulator Active
                </span>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold cursor-pointer text-[11px]"
                >
                  Back to Website
                </button>
              </div>
            </div>

            {/* Active Interactive Component */}
            {activeTab === 'call-guard' && (
              <CallCompanion
                currentRiskEvent={currentRiskEvent}
                onUpdateRiskEvent={setCurrentRiskEvent}
                onTriggerBankHold={handleTriggerBankHold}
                onOpenMockBank={() => setActiveTab('mock-bank')}
                onViewEvidencePack={() => setActiveTab('evidence-pack')}
              />
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

      {/* Corporate Comprehensive Footer */}
      <Footer onNavigateTab={setActiveTab} />
    </div>
  );
}

export default App;
