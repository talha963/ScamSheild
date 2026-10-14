import React, { useState } from 'react';
import { Header, ActiveTab } from './components/Header';
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
import { PlayCircle, Shield, Award } from 'lucide-react';

export function App() {
  // Start on the comprehensive Home Page
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
    <div className="min-h-screen bg-[#070d18] text-slate-100 flex flex-col font-sans selection:bg-cyan-500 selection:text-slate-950">
      {/* Top Cyber Defense Header */}
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

      {/* Hero Quick Banner for Hackathon Judges */}
      <div className="border-b border-slate-800/80 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-950/40 px-4 py-2 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-slate-300">
            <Award className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              <strong>AI Builder Cup 2026</strong> • Banking, Financial Services & Insurance (BFSI) Track
            </span>
            <span className="hidden md:inline text-slate-600">|</span>
            <span className="hidden md:inline text-slate-400">
              Multimodal Voice Scam Guardian with Graduated Circuit-Breaker
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setActiveTab('call-guard');
              }}
              className="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 font-bold flex items-center gap-1.5 cursor-pointer text-[11px]"
            >
              <PlayCircle className="w-3.5 h-3.5 text-cyan-400" />
              <span>3-Min Judge Demo Flow</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'home' && (
          <HomePage onNavigateTab={setActiveTab} />
        )}

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
      </main>

      {/* Cyber Defense Footer */}
      <footer className="mt-auto border-t border-slate-900 bg-slate-950/80 py-5 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-slate-400">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">ScamShield Live v1.0</span>
            <span>— The real-time guardian that stops voice scams before the money moves.</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-400">
            <span>Vertex AI / Gemini 2.5</span>
            <span>•</span>
            <span>Pinecone Vector Index</span>
            <span>•</span>
            <span>Privacy Vault Compliant</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;
