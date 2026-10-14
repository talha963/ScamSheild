import React, { useState } from 'react';
import {
  ShieldAlert,
  Sparkles,
  Radio,
  Smartphone,
  Eye,
  Swords,
  MapPin,
  Users,
  FileText,
  BarChart3,
  ArrowRight,
  Menu,
  X,
  ChevronDown,
  Home,
  CheckCircle2,
  Shield,
} from 'lucide-react';

export type ActiveTab =
  | 'home'
  | 'call-guard'
  | 'mock-bank'
  | 'scam-lens'
  | 'scam-gym'
  | 'scam-radar'
  | 'guardians'
  | 'evidence-pack'
  | 'evaluation';

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
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [toolsDropdownOpen, setToolsDropdownOpen] = useState(false);

  // Friendly everyday consumer descriptions - NO tech jargon or feature codes
  const interactiveTools: { id: ActiveTab; name: string; desc: string; icon: React.ReactNode }[] = [
    {
      id: 'call-guard',
      name: 'Phone Call Guardian',
      desc: 'Simulate a scam call and hear the safety warning',
      icon: <Radio className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'mock-bank',
      name: 'Safe Bank Simulator',
      desc: 'See how your money is locked before theft happens',
      icon: <Smartphone className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'guardians',
      name: 'Family WhatsApp Alert',
      desc: 'See how sons & daughters protect their parents',
      icon: <Users className="w-4 h-4 text-indigo-600" />,
    },
    {
      id: 'scam-lens',
      name: 'Fake Receipt Checker',
      desc: 'Check suspicious JazzCash, Easypaisa, or bank slips',
      icon: <Eye className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'scam-gym',
      name: 'Scam Practice Chat',
      desc: 'Practice chatting with a fake scammer safely',
      icon: <Swords className="w-4 h-4 text-rose-600" />,
    },
    {
      id: 'scam-radar',
      name: 'Live Scam Trends',
      desc: 'See what tricks scammers are using across the country',
      icon: <MapPin className="w-4 h-4 text-teal-600" />,
    },
    {
      id: 'evidence-pack',
      name: 'Police & Bank Report',
      desc: 'Create an official report to help recover funds',
      icon: <FileText className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'evaluation',
      name: 'Protection Accuracy Test',
      desc: 'Tested on 700+ real scam calls with 94%+ safety',
      icon: <BarChart3 className="w-4 h-4 text-emerald-600" />,
    },
  ];

  const handleNavClick = (anchorId: string) => {
    if (activeTab !== 'home') {
      setActiveTab('home');
      setTimeout(() => {
        const el = document.getElementById(anchorId);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(anchorId);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200 transition-all shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo & Product Title */}
          <div
            onClick={() => setActiveTab('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="relative flex items-center justify-center w-11 h-11 rounded-2xl bg-blue-50 border border-blue-200 group-hover:scale-105 transition-all shadow-xs">
              <Shield className="w-6 h-6 text-blue-600" />
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
                  ScamShield <span className="text-blue-600">Live</span>
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block font-medium">
                Your Personal Guardian Against Phone Scams & Money Theft
              </p>
            </div>
          </div>

          {/* Desktop Clean Navigation */}
          <nav className="hidden lg:flex items-center gap-8 text-sm font-semibold text-slate-700">
            <button
              onClick={() => handleNavClick('overview')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              How It Helps
            </button>
            <button
              onClick={() => handleNavClick('the-problem')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Common Scams
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              3 Simple Steps
            </button>
            <button
              onClick={() => handleNavClick('features')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('faq')}
              className="hover:text-blue-600 transition-colors cursor-pointer"
            >
              Questions & Answers
            </button>

            {/* Interactive Tools Dropdown */}
            <div className="relative">
              <button
                onClick={() => setToolsDropdownOpen(!toolsDropdownOpen)}
                onBlur={() => setTimeout(() => setToolsDropdownOpen(false), 200)}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 hover:border-blue-300 hover:text-blue-600 transition-all cursor-pointer text-slate-800 font-semibold"
              >
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>Try Demo Features</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {toolsDropdownOpen && (
                <div className="absolute top-full right-0 mt-2 w-80 rounded-2xl bg-white border border-slate-200 shadow-xl p-2 z-50 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100 text-[11px] uppercase font-bold text-slate-400 tracking-wider">
                    Interactive Safety Demos
                  </div>
                  {interactiveTools.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveTab(t.id);
                        setToolsDropdownOpen(false);
                      }}
                      className="w-full text-left p-2.5 rounded-xl hover:bg-slate-50 transition-all flex items-start gap-3 cursor-pointer group"
                    >
                      <div className="p-2 rounded-xl bg-slate-100 border border-slate-200 group-hover:bg-blue-50 group-hover:border-blue-200 shrink-0">
                        {t.icon}
                      </div>
                      <div className="flex-1 min-w-0">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 block">
                          {t.name}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">
                          {t.desc}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </nav>

          {/* Right Action & Status Indicator */}
          <div className="hidden sm:flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-medium px-3.5 py-1.5 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Protection Active</span>
            </div>

            {activeTab === 'home' ? (
              <button
                onClick={() => setActiveTab('call-guard')}
                className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md shadow-blue-600/20 cursor-pointer transition-all transform hover:-translate-y-0.5"
              >
                <span>Try Live Demo</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                onClick={() => setActiveTab('home')}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center gap-1.5 cursor-pointer border border-slate-200"
              >
                <Home className="w-3.5 h-3.5 text-blue-600" />
                <span>Return to Home</span>
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2.5 rounded-xl bg-slate-100 border border-slate-200 text-slate-700 hover:text-slate-900 cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden py-4 border-t border-slate-200 space-y-3 bg-white">
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
              <button
                onClick={() => handleNavClick('overview')}
                className="p-2.5 rounded-xl bg-slate-50 text-left text-slate-700 hover:text-blue-600"
              >
                How It Helps
              </button>
              <button
                onClick={() => handleNavClick('the-problem')}
                className="p-2.5 rounded-xl bg-slate-50 text-left text-slate-700 hover:text-blue-600"
              >
                Common Scams
              </button>
              <button
                onClick={() => handleNavClick('how-it-works')}
                className="p-2.5 rounded-xl bg-slate-50 text-left text-slate-700 hover:text-blue-600"
              >
                3 Simple Steps
              </button>
              <button
                onClick={() => handleNavClick('features')}
                className="p-2.5 rounded-xl bg-slate-50 text-left text-slate-700 hover:text-blue-600"
              >
                Features
              </button>
              <button
                onClick={() => handleNavClick('faq')}
                className="p-2.5 rounded-xl bg-slate-50 text-left text-slate-700 hover:text-blue-600"
              >
                Questions & Answers
              </button>
            </div>

            <div className="pt-2 border-t border-slate-100">
              <span className="text-[11px] uppercase font-bold text-slate-400 block mb-2">
                Try Demo Features
              </span>
              <div className="grid grid-cols-1 gap-1.5">
                {interactiveTools.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => {
                      setActiveTab(t.id);
                      setMobileMenuOpen(false);
                    }}
                    className="p-2 rounded-xl bg-slate-50 hover:bg-slate-100 flex items-center justify-between text-xs text-slate-800"
                  >
                    <div className="flex items-center gap-2">
                      {t.icon}
                      <span className="font-medium">{t.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
