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
    'ScamShield Alert: Unknown caller requesting secret OTP code'
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
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-100 selection:text-blue-900">
      {/* Pristine Clean Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        systemStatus={{
          connected: true,
          geminiModel: 'Smart Live Shield',
          latencyMs: 340,
          activeTier: currentRiskEvent.tier,
        }}
      />

      {/* Main View Area */}
      <main className="flex-1 w-full bg-white">
        {activeTab === 'home' ? (
          <HomePage onNavigateTab={setActiveTab} />
        ) : (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            {/* Interactive Breadcrumb Bar */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs shadow-sm">
              <div className="flex items-center gap-2 text-slate-600">
                <button
                  onClick={() => setActiveTab('home')}
                  className="hover:text-blue-600 transition-colors flex items-center gap-1 font-semibold text-slate-700 cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Home</span>
                </button>
                <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-bold text-blue-600 capitalize">
                  {activeTab.replace('-', ' ')}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[11px] text-slate-500 hidden sm:inline">
                  Demo Interactive Mode
                </span>
                <button
                  onClick={() => setActiveTab('home')}
                  className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-700 font-semibold cursor-pointer text-[11px] border border-slate-200 shadow-xs"
                >
                  Back to Home
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

      {/* Consumer-Friendly Clean Footer */}
      <Footer onNavigateTab={setActiveTab} />
    </div>
  );
}

export default App;
