import React, { useState, useEffect } from 'react';
import {
  PhoneCall,
  PhoneOff,
  AlertCircle,
  Play,
  RotateCcw,
  Sparkles,
  Key,
  Flame,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import { RiskGauge } from './RiskGauge';
import { AudioWaveform } from './AudioWaveform';
import { DEMO_SCENARIOS, DemoScenario } from '../../mockData/scenarios';
import { RiskEvent, TranscriptSnippet } from '../../types';

interface CallCompanionProps {
  onTriggerBankHold?: (amount: number, reason: string) => void;
  onOpenMockBank?: () => void;
  onViewEvidencePack?: (callId: string) => void;
  currentRiskEvent: RiskEvent | null;
  onUpdateRiskEvent: (event: RiskEvent) => void;
}

export const CallCompanion: React.FC<CallCompanionProps> = ({
  onTriggerBankHold,
  onOpenMockBank,
  onViewEvidencePack,
  currentRiskEvent,
  onUpdateRiskEvent,
}) => {
  const [selectedScenarioIndex, setSelectedScenarioIndex] = useState<number>(0);
  const [timelineIndex, setTimelineIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [timelineProgress, setTimelineProgress] = useState<number>(0);
  const [transcripts, setTranscripts] = useState<TranscriptSnippet[]>([]);
  const [isMicLive, setIsMicLive] = useState<boolean>(false);

  const scenario: DemoScenario = DEMO_SCENARIOS[selectedScenarioIndex];

  // Reset when scenario changes
  const handleSelectScenario = (index: number) => {
    setSelectedScenarioIndex(index);
    setTimelineIndex(0);
    setIsPlaying(false);
    setTimelineProgress(0);
    const firstItem = DEMO_SCENARIOS[index].timeline[0];
    setTranscripts([firstItem.transcript]);
    onUpdateRiskEvent(firstItem.riskEvent);
  };

  // Initial load
  useEffect(() => {
    const firstItem = scenario.timeline[0];
    setTranscripts([firstItem.transcript]);
    onUpdateRiskEvent(firstItem.riskEvent);
  }, []);

  // Step progression simulation
  useEffect(() => {
    if (!isPlaying) return;

    const timer = setInterval(() => {
      setTimelineIndex((prev) => {
        const next = prev + 1;
        if (next < scenario.timeline.length) {
          const item = scenario.timeline[next];
          setTranscripts((old) => [...old, item.transcript]);
          onUpdateRiskEvent(item.riskEvent);

          // If reached Tier 3, automatically hold transaction
          if (item.riskEvent.tier === 3 && onTriggerBankHold) {
            onTriggerBankHold(scenario.targetAmount, item.riskEvent.reasons[0] || 'ScamShield Tier 3 Hold');
          }
          return next;
        } else {
          setIsPlaying(false);
          return prev;
        }
      });
    }, 4500);

    return () => clearInterval(timer);
  }, [isPlaying, scenario, onTriggerBankHold, onUpdateRiskEvent]);

  // Handle manual play/pause
  const togglePlay = () => {
    if (timelineIndex >= scenario.timeline.length - 1) {
      // Reached end, reset
      setTimelineIndex(0);
      const firstItem = scenario.timeline[0];
      setTranscripts([firstItem.transcript]);
      onUpdateRiskEvent(firstItem.riskEvent);
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = () => {
    setIsPlaying(false);
    setTimelineIndex(0);
    const firstItem = scenario.timeline[0];
    setTranscripts([firstItem.transcript]);
    onUpdateRiskEvent(firstItem.riskEvent);
  };

  const activeEvent = currentRiskEvent || scenario.timeline[timelineIndex].riskEvent;

  return (
    <div className="space-y-6">
      {/* Top Scenario Picker Banner */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4 border border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider font-bold text-cyan-400">
              Interactive Call Simulation Deck
            </span>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              3-Min Pitch Mode
            </span>
          </div>
          <p className="text-sm text-slate-300 mt-1 font-medium">
            Select a verified scenario to test real-time linguistic and behavioral detection
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {DEMO_SCENARIOS.map((sc, idx) => (
            <button
              key={sc.id}
              onClick={() => handleSelectScenario(idx)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                selectedScenarioIndex === idx
                  ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                  : 'bg-slate-900/90 text-slate-300 hover:bg-slate-800 border border-slate-700/60'
              }`}
            >
              {sc.title.split('(')[0]}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Call Companion + Intelligence Feeds */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Call State, Risk Gauge & Whisper Coach */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Call Card */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 relative overflow-hidden">
            {activeEvent.tier === 3 && (
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 via-red-500 to-rose-600 animate-pulse" />
            )}

            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                    activeEvent.tier >= 2
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/50 glow-rose'
                      : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                  }`}
                >
                  <PhoneCall className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {scenario.callerName}
                  </h3>
                  <p className="text-xs font-mono text-slate-400">
                    {scenario.callerNumber} • Unknown Network
                  </p>
                </div>
              </div>

              <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-800 text-cyan-300 border border-cyan-800/40">
                {scenario.badge}
              </span>
            </div>

            {/* Audio Waveform Stream */}
            <div className="mt-4">
              <AudioWaveform
                isStreaming={isPlaying || isMicLive}
                speaker="caller"
                detectedLanguage="Roman Urdu & English"
                onToggleStreaming={() => setIsMicLive(!isMicLive)}
              />
            </div>

            {/* Simulation Controls */}
            <div className="mt-4 flex items-center gap-2">
              <button
                onClick={togglePlay}
                className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                  isPlaying
                    ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md'
                    : 'bg-gradient-to-r from-cyan-500 to-teal-400 text-slate-950 hover:opacity-95 shadow-md font-extrabold'
                }`}
              >
                {isPlaying ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
                {isPlaying ? 'Pause Simulation' : timelineIndex > 0 ? 'Resume Simulation' : 'Run Call Flow'}
              </button>

              <button
                onClick={handleReset}
                title="Reset scenario"
                className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
              </button>

              <button
                onClick={() => {
                  setIsPlaying(false);
                  if (onViewEvidencePack) onViewEvidencePack(activeEvent.call_id);
                }}
                className="py-2.5 px-3 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <PhoneOff className="w-4 h-4 text-rose-400" />
                Hang Up & Claim
              </button>
            </div>

            {/* Timeline Progress */}
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>PROGRESSION: Step {timelineIndex + 1} of {scenario.timeline.length}</span>
              <span className="text-cyan-400">
                {activeEvent.tier === 3 ? 'CRITICAL BREACH PREVENTED' : 'MONITORING CALL STREAM'}
              </span>
            </div>
          </div>

          {/* Risk Gauge */}
          <RiskGauge
            score={activeEvent.fused_score}
            tier={activeEvent.tier}
            syntheticVoiceScore={activeEvent.acoustic.synthetic_voice}
          />

          {/* Coach Whisper: Live Calm Urdu & English Warning */}
          <div className="glass-panel p-5 rounded-2xl border border-cyan-500/30 bg-gradient-to-b from-cyan-950/20 to-slate-900/40">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span className="text-xs uppercase font-bold tracking-wider text-cyan-300">
                Feature F8 • Live Coach Whisper (بینک گارڈین)
              </span>
            </div>

            {/* Urdu Warning Box */}
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-cyan-900/60 mb-2">
              <p className="text-base text-cyan-200 font-medium text-right leading-relaxed" dir="rtl" style={{ fontFamily: 'system-ui, sans-serif' }}>
                {activeEvent.user_warning_ur}
              </p>
            </div>

            {/* English Translation */}
            <p className="text-xs text-slate-300 leading-normal">
              "{activeEvent.user_warning}"
            </p>

            <div className="mt-3 flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-2">
              <span>Next likely ask: <strong className="text-slate-200">{activeEvent.next_likely_ask}</strong></span>
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Live Transcript, Call-Transaction Correlation, Tactics & Actions */}
        <div className="lg:col-span-7 space-y-6">
          {/* Call-Transaction Correlation Live Signal Banner (F4) */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 bg-slate-900/60">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-400" />
                <span className="text-xs uppercase font-bold tracking-wider text-amber-300">
                  Feature F4 • Call-Transaction Correlation
                </span>
              </div>
              {onOpenMockBank && (
                <button
                  onClick={onOpenMockBank}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold cursor-pointer"
                >
                  View ShieldPay App <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3 text-center">
              <div className={`p-2.5 rounded-xl border ${activeEvent.context.unknown_caller ? 'bg-amber-500/10 border-amber-500/40 text-amber-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="text-[10px] uppercase font-semibold">Unknown Caller</div>
                <div className="text-xs font-bold mt-0.5">{activeEvent.context.unknown_caller ? 'ACTIVE' : 'NO'}</div>
              </div>

              <div className={`p-2.5 rounded-xl border ${activeEvent.context.banking_app_open ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="text-[10px] uppercase font-semibold">Banking App</div>
                <div className="text-xs font-bold mt-0.5">{activeEvent.context.banking_app_open ? 'OPENED' : 'CLOSED'}</div>
              </div>

              <div className={`p-2.5 rounded-xl border ${activeEvent.context.new_payee ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="text-[10px] uppercase font-semibold">New Payee</div>
                <div className="text-xs font-bold mt-0.5">{activeEvent.context.new_payee ? 'DETECTED' : 'NONE'}</div>
              </div>

              <div className={`p-2.5 rounded-xl border ${activeEvent.context.amount_vs_history > 3 ? 'bg-rose-500/10 border-rose-500/40 text-rose-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
                <div className="text-[10px] uppercase font-semibold">Amount vs Hist</div>
                <div className="text-xs font-bold mt-0.5">{activeEvent.context.amount_vs_history}x Avg</div>
              </div>
            </div>

            {activeEvent.context.banking_app_open && activeEvent.tier >= 2 && (
              <div className="mt-3 p-2.5 rounded-lg bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200 flex items-center justify-between">
                <span>Joint anomaly detected: Caller guiding user inside banking app in real-time!</span>
                <span className="font-bold text-rose-400 underline">F5 Circuit-Breaker Engaged</span>
              </div>
            )}
          </div>

          {/* Voice Clone Safe-Word Challenge (F7) */}
          {activeEvent.safe_word_challenge && (
            <div className="p-4 rounded-2xl bg-purple-950/30 border border-purple-500/40 glow-cyan">
              <div className="flex items-center gap-2 text-purple-300">
                <Key className="w-5 h-5 text-purple-400" />
                <h4 className="text-sm font-bold">
                  Feature F7 • Voice-Clone Shield (Family Safe-Word Challenge)
                </h4>
              </div>
              <p className="text-xs text-purple-200 mt-1">
                {activeEvent.safe_word_challenge.suggested_prompt}
              </p>
              <div className="mt-3 flex items-center justify-between p-2 rounded-lg bg-slate-950/80 border border-purple-900/60 text-xs">
                <span className="text-slate-400 font-mono">ENCRYPTED SAFE-WORD HASH:</span>
                <span className="font-bold text-purple-300 font-mono tracking-widest">
                  {activeEvent.safe_word_challenge.family_safe_word || 'FALCON-77'}
                </span>
              </div>
            </div>
          )}

          {/* Live Rolling Transcripts Feed */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                <span className="text-xs uppercase font-bold tracking-wider text-slate-300">
                  Rolling Transcript & Multilingual Code-Switch Stream (F2)
                </span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Window: 20s
              </span>
            </div>

            <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1">
              {transcripts.map((t, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-xl border text-xs leading-relaxed transition-all ${
                    t.is_flagged
                      ? 'bg-rose-950/30 border-rose-500/40 text-rose-100 font-medium shadow-sm'
                      : 'bg-slate-900/70 border-slate-800/80 text-slate-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1 text-[10px] text-slate-400">
                    <span className="font-bold uppercase tracking-wider text-cyan-400">
                      {t.speaker === 'caller' ? 'Unknown Caller' : 'User'}
                    </span>
                    <span className="font-mono text-slate-500">
                      +{t.timestamp_s}s • {t.language}
                    </span>
                  </div>
                  <p className="text-sm font-sans">{t.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Detected Tactic Scores Breakdown */}
          <div className="glass-panel p-5 rounded-2xl border border-slate-800">
            <h4 className="text-xs uppercase font-bold tracking-wider text-slate-400 mb-3">
              Linguistic Scam Tactics Scored by Gemini 2.5 (0.0 to 1.0)
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {Object.entries(activeEvent.tactics).map(([tacticKey, signal]) => {
                const score = signal ? signal.score : 0;
                const formattedName = tacticKey
                  .split('_')
                  .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
                  .join(' ');

                return (
                  <div
                    key={tacticKey}
                    className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-semibold text-slate-200">{formattedName}</span>
                      <span
                        className={`font-mono font-bold ${
                          score > 0.7 ? 'text-rose-400' : score > 0.4 ? 'text-amber-400' : 'text-emerald-400'
                        }`}
                      >
                        {(score * 100).toFixed(0)}%
                      </span>
                    </div>

                    <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mb-2">
                      <div
                        className={`h-full transition-all duration-500 ${
                          score > 0.7
                            ? 'bg-rose-500'
                            : score > 0.4
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${score * 100}%` }}
                      />
                    </div>

                    {signal && (
                      <span className="text-[10px] text-slate-400 italic truncate" title={signal.evidence}>
                        Evidence: "{signal.evidence}"
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Reasons & Guardian Actions */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[11px] uppercase font-bold text-slate-400">
                Graduated Action Ladder (ADK Guardian Agent)
              </span>
              <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                {activeEvent.actions.map((act, i) => (
                  <span
                    key={i}
                    className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-slate-800 text-cyan-300 border border-slate-700"
                  >
                    {act}
                  </span>
                ))}
              </div>
            </div>

            {onViewEvidencePack && (
              <button
                onClick={() => onViewEvidencePack(activeEvent.call_id)}
                className="px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 flex items-center justify-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                Inspect Evidence Pack <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
