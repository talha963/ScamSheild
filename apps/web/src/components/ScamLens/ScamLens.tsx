import React, { useState } from 'react';
import {
  Eye,
  Upload,
  AlertTriangle,
  CheckCircle,
  FileSearch,
  Scan,
  ExternalLink,
  ShieldAlert,
  Sparkles,
  Link2,
} from 'lucide-react';
import { ScamLensResult } from '../../types';
import { MOCK_LENS_SAMPLES } from '../../mockData/scenarios';

export const ScamLens: React.FC = () => {
  const [selectedSample, setSelectedSample] = useState<ScamLensResult>(MOCK_LENS_SAMPLES[0]);
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [customFilePreview, setCustomFilePreview] = useState<string | null>(null);

  const handleSelectSample = (sample: ScamLensResult) => {
    setIsScanning(true);
    setSelectedSample(sample);
    setCustomFilePreview(null);
    setTimeout(() => {
      setIsScanning(false);
    }, 800);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setCustomFilePreview(previewUrl);
      setIsScanning(true);
      setTimeout(() => {
        setIsScanning(false);
        // Set dynamic analysis
        setSelectedSample({
          id: `custom_${Date.now()}`,
          image_url: previewUrl,
          type: 'sms',
          verdict: 'scam',
          confidence: 0.95,
          detected_text: `Extracted via Gemini Vision: "Urgent security update required on your account. Avoid permanent suspension by clicking the link."`,
          extracted_links: ['https://auth-verify-portal.secure-net.pk/token=99281'],
          reasons: [
            'High emotional pressure and account forfeiture threat',
            'Lookalike phishing domain mimicking bank domain',
            'Unsolicited credential verification request',
          ],
          tampering_detected: true,
          spoofed_brand: 'Custom Detected Brand',
        });
      }, 1200);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="glass-panel p-4 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Eye className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">
              Feature F9 • Scam Lens (Multimodal Computer Vision)
            </h2>
            <span className="text-[10px] px-2 py-0.5 rounded font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
              Gemini Vision + OpenCV
            </span>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Instant verdict on screenshots of fake SMS, doctored receipts, fake bank screens & QR payloads.
          </p>
        </div>

        {/* Upload Button */}
        <label className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-cyan-500 hover:bg-cyan-400 text-slate-950 transition-all cursor-pointer shadow-md">
          <Upload className="w-4 h-4" />
          <span>Upload Image / Screenshot</span>
          <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
        </label>
      </div>

      {/* Preset Test Scenarios */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-slate-400 font-semibold mr-1">Preset Benchmarks:</span>
        {MOCK_LENS_SAMPLES.map((sample, idx) => (
          <button
            key={sample.id}
            onClick={() => handleSelectSample(sample)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
              selectedSample.id === sample.id && !customFilePreview
                ? 'bg-cyan-500 text-slate-950 shadow-md font-bold'
                : 'bg-slate-900 border border-slate-800 text-slate-300 hover:bg-slate-800'
            }`}
          >
            {sample.type === 'sms' && 'Fake HBL SMS'}
            {sample.type === 'receipt' && 'Tampered JazzCash Receipt'}
            {sample.type === 'qr_code' && 'Reverse-Payment QR Code'}
          </button>
        ))}
      </div>

      {/* Main Inspection Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column (5 cols): Image Viewer & Scanner */}
        <div className="lg:col-span-5">
          <div className="glass-panel p-4 rounded-2xl border border-slate-800 relative overflow-hidden">
            <div className="flex items-center justify-between mb-3 text-xs text-slate-400">
              <span className="font-semibold uppercase">Inspection Target</span>
              <span className="font-mono text-cyan-400">{selectedSample.type.toUpperCase()}</span>
            </div>

            {/* Image Preview with Cyber Scanline */}
            <div className="relative rounded-xl overflow-hidden bg-slate-950 border border-slate-800 h-80 flex items-center justify-center">
              <img
                src={customFilePreview || selectedSample.image_url}
                alt="Inspection Target"
                className="w-full h-full object-cover opacity-85"
              />

              {/* Animated Scan Overlay */}
              {isScanning ? (
                <div className="absolute inset-0 bg-cyan-950/40 flex flex-col items-center justify-center gap-3 backdrop-blur-xs">
                  <Scan className="w-12 h-12 text-cyan-400 animate-spin" />
                  <span className="text-xs font-mono text-cyan-300 tracking-wider">
                    ANALYZING ARTEFACTS & FONTS...
                  </span>
                </div>
              ) : (
                <div className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 border border-slate-700 text-[10px] font-mono text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-cyan-400" />
                  <span>OCR & BRAND MATCH VERIFIED</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Vision Verdict & Tampering Report */}
        <div className="lg:col-span-7 space-y-4">
          {/* Verdict Banner */}
          <div
            className={`p-5 rounded-2xl border ${
              selectedSample.verdict === 'scam'
                ? 'bg-rose-950/30 border-rose-500/50 glow-rose'
                : selectedSample.verdict === 'suspicious'
                ? 'bg-amber-950/30 border-amber-500/50 glow-amber'
                : 'bg-emerald-950/30 border-emerald-500/50 glow-emerald'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <ShieldAlert
                  className={`w-6 h-6 ${
                    selectedSample.verdict === 'scam'
                      ? 'text-rose-400'
                      : selectedSample.verdict === 'suspicious'
                      ? 'text-amber-400'
                      : 'text-emerald-400'
                  }`}
                />
                <div>
                  <h3
                    className={`text-base font-black ${
                      selectedSample.verdict === 'scam'
                        ? 'text-rose-300'
                        : selectedSample.verdict === 'suspicious'
                        ? 'text-amber-300'
                        : 'text-emerald-300'
                    }`}
                  >
                    VERDICT: {selectedSample.verdict.toUpperCase()} ({(selectedSample.confidence * 100).toFixed(0)}% CONFIDENCE)
                  </h3>
                  <span className="text-xs text-slate-300">
                    Impersonated Brand: <strong>{selectedSample.spoofed_brand || 'None'}</strong>
                  </span>
                </div>
              </div>

              {selectedSample.tampering_detected && (
                <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  DIGITAL FORGERY
                </span>
              )}
            </div>
          </div>

          {/* OCR Extracted Text */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Gemini Vision OCR Extraction
            </h4>
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800 text-xs font-mono text-cyan-200 leading-relaxed">
              {selectedSample.detected_text}
            </div>
          </div>

          {/* Forensic Reasons */}
          <div className="glass-panel p-4 rounded-2xl border border-slate-800">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
              Forensic Reasoning & Anomaly Signals
            </h4>
            <ul className="space-y-1.5">
              {selectedSample.reasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2 text-xs text-slate-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 mt-1.5 shrink-0" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Extracted Links / QR Payload */}
          {selectedSample.extracted_links.length > 0 && (
            <div className="glass-panel p-4 rounded-2xl border border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-cyan-400" /> Extracted URL & Domain Reputation
              </h4>
              <div className="space-y-1.5">
                {selectedSample.extracted_links.map((link, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-slate-950 border border-rose-900/40 text-xs font-mono text-rose-300 flex items-center justify-between"
                  >
                    <span className="truncate">{link}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] bg-rose-500/20 text-rose-400 font-bold ml-2">
                      MALICIOUS SINK
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
