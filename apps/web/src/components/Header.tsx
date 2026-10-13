import React from 'react';
import {
  ShieldAlert,
  Radio,
  Sparkles,
  Smartphone,
  Eye,
  Swords,
  MapPin,
  Users,
  FileText,
  Home,
} from 'lucide-react';

export type ActiveTab =
  | 'home'
  | 'call-guard'
  | 'mock-bank'
  | 'scam-lens'
  | 'scam-gym'
  | 'scam-radar'
  | 'guardians'
  | 'evidence-pack';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  systemStatus: {
    connected: boolean;
    geminiModel: string;
    latencyMs: number;
    activeTier: 0 | 1 | 2 | 3;
  };
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  systemStatus,
}) => {
  const getTierBadge = () => {
    switch (systemStatus.activeTier) {
      case 3:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/20 text-rose-400 border border-rose-500/50 animate-pulse">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
            TIER 3 • HARD HOLD
          </span>
        );
      case 2:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-400 border border-amber-500/50">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            TIER 2 • COOL-OFF
          </span>
        );
      case 1:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400 border border-yellow-500/50">
            <span className="w-2 h-2 rounded-full bg-yellow-400" />
            TIER 1 • CAUTION
          </span>
        );
      default:
        return (
          <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/50">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            TIER 0 • SECURE
          </span>
        );
    }
  };

  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: 'home', label: 'System Overview', icon: <Home className="w-4 h-4" /> },
    { id: 'call-guard', label: 'Live Call Guard', icon: <Radio className="w-4 h-4" />, badge: 'F1-F3' },
    { id: 'mock-bank', label: 'ShieldPay App', icon: <Smartphone className="w-4 h-4" />, badge: 'F4/F5' },
    { id: 'scam-lens', label: 'Scam Lens (CV)', icon: <Eye className="w-4 h-4" />, badge: 'F9' },
    { id: 'scam-gym', label: 'Scam Gym', icon: <Swords className="w-4 h-4" />, badge: 'F12' },
    { id: 'scam-radar', label: 'Scam Radar', icon: <MapPin className="w-4 h-4" />, badge: 'F10/F11' },
    { id: 'guardians', label: 'Guardian Circle', icon: <Users className="w-4 h-4" />, badge: 'F6' },
    { id: 'evidence-pack', label: 'Evidence Pack', icon: <FileText className="w-4 h-4" />, badge: 'F13' },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-slate-800 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Product Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-cyan-500/20 via-emerald-500/10 to-teal-500/30 border border-cyan-500/40 glow-cyan group-hover:scale-105 transition-transform">
              <ShieldAlert className="w-6 h-6 text-cyan-400" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full border-2 border-slate-900" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-teal-300 to-emerald-400 bg-clip-text text-transparent">
                  ScamShield Live
                </span>
                <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                  BFSI Track MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                Real-Time Voice Guardian & Transaction Circuit-Breaker
              </p>
            </div>
          </div>

          {/* System Telemetry & Status Badges */}
          <div className="flex items-center gap-3">
            <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span className="text-slate-300 font-medium">{systemStatus.geminiModel}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-mono">{systemStatus.latencyMs}ms</span>
            </div>

            {getTierBadge()}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto py-2 no-scrollbar border-t border-slate-800/60">
          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 to-teal-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`px-1.5 py-0.2 text-[9px] rounded font-semibold ${
                      isActive
                        ? 'bg-cyan-500/30 text-cyan-200'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </header>
  );
};
