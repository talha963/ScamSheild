import React, { useEffect, useState } from 'react';
import { Mic, MicOff, Volume2, Globe } from 'lucide-react';

interface AudioWaveformProps {
  isStreaming: boolean;
  speaker: 'caller' | 'user';
  detectedLanguage?: string;
  volumeLevel?: number; // 0.0 to 1.0
  onToggleStreaming?: () => void;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isStreaming,
  speaker,
  detectedLanguage = 'Roman Urdu',
  volumeLevel = 0.65,
  onToggleStreaming,
}) => {
  const [bars, setBars] = useState<number[]>(Array(24).fill(15));

  useEffect(() => {
    if (!isStreaming) {
      setBars(Array(24).fill(6));
      return;
    }

    const interval = setInterval(() => {
      setBars(
        Array(24)
          .fill(0)
          .map(() => {
            const base = Math.random() * 45 + 10;
            return Math.min(65, Math.max(8, base * (volumeLevel * 1.5)));
          })
      );
    }, 120);

    return () => clearInterval(interval);
  }, [isStreaming, volumeLevel]);

  return (
    <div className="flex flex-col gap-2 p-3.5 rounded-xl glass-card border border-slate-800">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isStreaming
                ? 'bg-cyan-400 animate-ping'
                : 'bg-slate-600'
            }`}
          />
          <span className="text-xs font-semibold text-slate-300">
            {isStreaming ? (
              <span className="text-cyan-400">
                ACTIVE STREAM ({speaker.toUpperCase()})
              </span>
            ) : (
              'STREAM PAUSED'
            )}
          </span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-1">
            <Globe className="w-2.5 h-2.5 text-cyan-400" />
            {detectedLanguage}
          </span>
        </div>

        {onToggleStreaming && (
          <button
            onClick={onToggleStreaming}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer ${
              isStreaming
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30'
                : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30'
            }`}
          >
            {isStreaming ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            {isStreaming ? 'Mute Mic' : 'Start Mic'}
          </button>
        )}
      </div>

      {/* Dynamic Animated Waveform */}
      <div className="h-14 flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-950/70 rounded-lg border border-slate-900 overflow-hidden">
        {bars.map((height, idx) => (
          <div
            key={idx}
            className={`w-1.5 rounded-full transition-all duration-100 ease-out ${
              isStreaming
                ? speaker === 'caller'
                  ? 'bg-gradient-to-t from-cyan-500 to-teal-300'
                  : 'bg-gradient-to-t from-emerald-500 to-green-300'
                : 'bg-slate-700'
            }`}
            style={{
              height: `${height}px`,
              opacity: isStreaming ? 0.7 + (idx % 3) * 0.1 : 0.3,
            }}
          />
        ))}
      </div>

      <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono px-1">
        <span>VAD: {isStreaming ? 'SPEECH DETECTED' : 'SILENCE'}</span>
        <span className="flex items-center gap-1">
          <Volume2 className="w-3 h-3 text-cyan-400" />
          AUDIO LATENCY: 320ms (P95)
        </span>
      </div>
    </div>
  );
};
