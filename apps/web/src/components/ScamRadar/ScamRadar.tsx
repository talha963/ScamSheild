import React, { useState } from 'react';
import {
  MapPin,
  TrendingUp,
  Search,
  Users,
  ShieldAlert,
  Layers,
  Activity,
  Globe2,
} from 'lucide-react';
import { CampaignCluster } from '../../types';
import { MOCK_CAMPAIGN_CLUSTERS } from '../../mockData/scenarios';

export const ScamRadar: React.FC = () => {
  const [clusters, setClusters] = useState<CampaignCluster[]>(MOCK_CAMPAIGN_CLUSTERS);
  const [searchPhone, setSearchPhone] = useState<string>('');
  const [searchResult, setSearchResult] = useState<{
    phone: string;
    reports: number;
    risk: 'clean' | 'suspicious' | 'high_risk';
    claimedOrgs: string[];
  } | null>(null);

  const handleSearchPhone = () => {
    if (!searchPhone.trim()) return;
    if (searchPhone.includes('9845') || searchPhone.includes('301')) {
      setSearchResult({
        phone: searchPhone,
        reports: 47,
        risk: 'high_risk',
        claimedOrgs: ['State Bank of Pakistan', 'FIA Cyber Crime Wing'],
      });
    } else {
      setSearchResult({
        phone: searchPhone,
        reports: 0,
        risk: 'clean',
        claimedOrgs: [],
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Feature F10/F11 • Scam Radar (Campaign Intelligence & Threat Map)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Pinecone Vector Clustering
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Aggregated, privacy-safe campaign clustering and early warning for banks, regulators, and users.
          </p>
        </div>

        {/* Global Statistics */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">7-DAY PREVENTED LOSS</span>
            <span className="text-emerald-400 font-bold text-sm">Rs. 42.8M</span>
          </div>
          <div className="text-right">
            <span className="text-slate-500 block text-[10px]">ACTIVE RINGS FLAGGED</span>
            <span className="text-rose-400 font-bold text-sm">14 Campaigns</span>
          </div>
        </div>
      </div>

      {/* Number Reputation Checker (F10) */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
          Crowd-Sourced Number Reputation & Caller-ID Spoof Check (F10)
        </h3>

        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              value={searchPhone}
              onChange={(e) => setSearchPhone(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearchPhone()}
              placeholder="Search suspect phone number (e.g. +92 301 9845120)..."
              className="w-full bg-slate-950 border border-slate-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
            />
          </div>
          <button
            onClick={handleSearchPhone}
            className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-md"
          >
            Check Reputation
          </button>
        </div>

        {searchResult && (
          <div
            className={`mt-3 p-3.5 rounded-xl border flex items-center justify-between text-xs ${
              searchResult.risk === 'high_risk'
                ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                : 'bg-emerald-950/30 border-emerald-500/50 text-emerald-200'
            }`}
          >
            <div>
              <span className="font-bold text-sm">
                {searchResult.risk === 'high_risk' ? '🚨 BLACKLISTED CALLER' : '✓ CLEAN REPUTATION'}
              </span>
              <p className="text-[11px] text-slate-300 mt-0.5">
                {searchResult.phone} was reported in <strong>{searchResult.reports} scam calls</strong> this week.
              </p>
            </div>
            {searchResult.claimedOrgs.length > 0 && (
              <div className="text-right text-[11px]">
                <span className="text-slate-400 block">Spoofed Entities:</span>
                <span className="font-semibold text-rose-300">{searchResult.claimedOrgs.join(', ')}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Grid: Regional Map + Campaign Clusters */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Regional Threat Heat-Map Simulation */}
        <div className="lg:col-span-5 glass-panel p-5 rounded-2xl border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Globe2 className="w-4 h-4 text-cyan-400" /> Coarse Regional Threat Map
            </span>
            <span className="text-[10px] text-slate-500 font-mono">Differential Privacy Safe</span>
          </div>

          {/* Pakistan Regional Simulation Grid */}
          <div className="space-y-2.5">
            {[
              { city: 'Karachi South / Central', count: 1840, level: 'critical', pct: '88%' },
              { city: 'Lahore & Gujranwala', count: 1420, level: 'high', pct: '74%' },
              { city: 'Rawalpindi / Islamabad', count: 910, level: 'high', pct: '58%' },
              { city: 'Faisalabad & Multan', count: 890, level: 'medium', pct: '49%' },
              { city: 'Peshawar & KPK Ring', count: 420, level: 'medium', pct: '32%' },
            ].map((reg, i) => (
              <div key={i} className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-xs">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-semibold text-slate-200">{reg.city}</span>
                  <span className="font-mono text-cyan-400 font-bold">{reg.count} calls/wk</span>
                </div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${
                      reg.level === 'critical'
                        ? 'bg-rose-500'
                        : reg.level === 'high'
                        ? 'bg-amber-500'
                        : 'bg-cyan-500'
                    }`}
                    style={{ width: reg.pct }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Column (7 cols): Vector Script Clusters Table */}
        <div className="lg:col-span-7 glass-panel p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Pinecone Semantic Script Clusters (F11)
              </h3>
              <p className="text-[11px] text-slate-400">
                Calls grouped by script intent even when phrasing and dialects vary
              </p>
            </div>
            <Activity className="w-4 h-4 text-cyan-400 animate-pulse" />
          </div>

          <div className="space-y-3">
            {clusters.map((c) => (
              <div
                key={c.campaign_id}
                className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 text-xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.name}</h4>
                    <span className="text-[11px] text-cyan-400 font-mono">
                      {c.region} • {c.call_count_7d} intercepted calls
                    </span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      c.trend === 'rising'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    {c.trend}
                  </span>
                </div>

                {/* Common phrases */}
                <div className="pt-2 border-t border-slate-800/80">
                  <span className="text-[10px] uppercase font-bold text-slate-500 block mb-1">
                    Characteristic Semantic Anchors:
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {c.common_phrases.map((phrase, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded-md bg-slate-950 text-slate-300 text-[10px] border border-slate-800 italic"
                      >
                        "{phrase}"
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                  <span>Mule Accounts Linked: <strong className="text-white">{c.active_mules_detected}</strong></span>
                  <span className="text-rose-400 font-mono font-bold">Threat Index: {c.risk_score}/100</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
