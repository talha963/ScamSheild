import React from 'react';
import { Shield, ShieldAlert, AlertTriangle, ShieldX, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { RiskTier } from '../../types';

interface RiskGaugeProps {
  score: number; // 0 - 100
  tier: RiskTier;
  previousScore?: number;
  syntheticVoiceScore?: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({
  score,
  tier,
  previousScore = 0,
  syntheticVoiceScore = 0,
}) => {
  // SVG gauge constants
  const size = 220;
  const strokeWidth = 14;
  const center = size / 2;
  const radius = center - strokeWidth;
  const circumference = Math.PI * radius; // Half circle (180 deg)
  const clampedScore = Math.min(100, Math.max(0, score));
  const strokeDashoffset = circumference - (clampedScore / 100) * circumference;

  const getTierColor = () => {
    switch (tier) {
      case 3:
        return {
          stroke: '#f43f5e',
          text: 'text-rose-400',
          bg: 'bg-rose-500/10',
          border: 'border-rose-500/40',
          glow: 'glow-rose',
          title: 'TIER 3 • HARD HOLD',
          subtitle: 'Circuit-Breaker active: transfers locked',
          icon: <ShieldX className="w-6 h-6 text-rose-400 animate-pulse" />,
        };
      case 2:
        return {
          stroke: '#f97316',
          text: 'text-orange-400',
          bg: 'bg-orange-500/10',
          border: 'border-orange-500/40',
          glow: 'glow-amber',
          title: 'TIER 2 • WARNING',
          subtitle: '60-second cool-off & guardian soft alert',
          icon: <AlertTriangle className="w-6 h-6 text-orange-400" />,
        };
      case 1:
        return {
          stroke: '#eab308',
          text: 'text-yellow-400',
          bg: 'bg-yellow-500/10',
          border: 'border-yellow-500/40',
          glow: 'glow-amber',
          title: 'TIER 1 • CAUTION',
          subtitle: 'Soft prompt: banks never ask for credentials',
          icon: <ShieldAlert className="w-6 h-6 text-yellow-400" />,
        };
      default:
        return {
          stroke: '#10b981',
          text: 'text-emerald-400',
          bg: 'bg-emerald-500/10',
          border: 'border-emerald-500/40',
          glow: 'glow-emerald',
          title: 'TIER 0 • NORMAL',
          subtitle: 'No malicious manipulation detected',
          icon: <Shield className="w-6 h-6 text-emerald-400" />,
        };
    }
  };

  const currentTheme = getTierColor();

  const getTrendIcon = () => {
    if (score > previousScore + 2) {
      return (
        <span className="flex items-center text-xs text-rose-400 font-mono">
          <TrendingUp className="w-3.5 h-3.5 mr-1" /> +{(score - previousScore).toFixed(0)}
        </span>
      );
    } else if (score < previousScore - 2) {
      return (
        <span className="flex items-center text-xs text-emerald-400 font-mono">
          <TrendingDown className="w-3.5 h-3.5 mr-1" /> {(score - previousScore).toFixed(0)}
        </span>
      );
    }
    return (
      <span className="flex items-center text-xs text-slate-400 font-mono">
        <Minus className="w-3.5 h-3.5 mr-1" /> steady
      </span>
    );
  };

  return (
    <div className={`relative flex flex-col items-center p-6 rounded-2xl glass-panel ${currentTheme.border} ${currentTheme.glow} transition-all duration-500`}>
      <div className="flex items-center justify-between w-full mb-3">
        <span className="text-xs uppercase tracking-wider font-semibold text-slate-400">
          Scam Risk Fusion Index
        </span>
        <div className="flex items-center gap-2">
          {getTrendIcon()}
          {syntheticVoiceScore > 0.5 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 animate-pulse">
              SYNTHETIC VOICE: {(syntheticVoiceScore * 100).toFixed(0)}%
            </span>
          )}
        </div>
      </div>

      {/* SVG Arc Gauge */}
      <div className="relative w-[220px] h-[130px] flex items-center justify-center overflow-hidden">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-180 -translate-y-9"
        >
          {/* Background Track */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
            fill="none"
            stroke="rgba(30, 41, 59, 0.7)"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
          />

          {/* Value Arc */}
          <path
            d={`M ${strokeWidth} ${center} A ${radius} ${radius} 0 0 1 ${size - strokeWidth} ${center}`}
            fill="none"
            stroke={currentTheme.stroke}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {/* Center Score Readout */}
        <div className="absolute bottom-2 flex flex-col items-center">
          <div className="flex items-baseline">
            <span className={`text-5xl font-black tracking-tight font-mono ${currentTheme.text} transition-colors duration-300`}>
              {Math.round(score)}
            </span>
            <span className="text-sm font-semibold text-slate-500 ml-1">/100</span>
          </div>
          <span className="text-[11px] font-medium text-slate-400 mt-0.5">
            Real-Time Threat Score
          </span>
        </div>
      </div>

      {/* Threshold Indicators */}
      <div className="w-full flex justify-between px-3 text-[10px] font-mono text-slate-500 mt-2 border-b border-slate-800 pb-3">
        <span>0 (Safe)</span>
        <span className="text-yellow-600">30 (Caution)</span>
        <span className="text-orange-600">60 (Warning)</span>
        <span className="text-rose-600 font-bold">85+ (Hard Block)</span>
      </div>

      {/* Status Footer Banner */}
      <div className={`mt-3 w-full p-2.5 rounded-xl ${currentTheme.bg} border ${currentTheme.border} flex items-center gap-3 transition-colors duration-300`}>
        {currentTheme.icon}
        <div className="flex-1 min-w-0">
          <div className={`text-xs font-bold ${currentTheme.text}`}>
            {currentTheme.title}
          </div>
          <div className="text-[11px] text-slate-300 truncate">
            {currentTheme.subtitle}
          </div>
        </div>
      </div>
    </div>
  );
};
