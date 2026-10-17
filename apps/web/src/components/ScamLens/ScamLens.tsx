import React, { useRef, useState } from 'react';
import {
  Eye,
  Upload,
  AlertTriangle,
  CheckCircle,
  ShieldAlert,
  Sparkles,
  Link2,
  Loader2,
  HelpCircle,
  ImageOff,
  FileCheck,
  ShieldCheck,
} from 'lucide-react';

/** Exactly what POST /v1/lens/analyze returns. */
interface LensResponse {
  verdict: 'safe' | 'suspicious' | 'scam';
  confidence: number;
  detected_text: string;
  extracted_links: string[];
  tampering_detected: boolean;
  spoofed_brand: string | null;
  reasons: string[];
  qr_destination?: string | null;
}

interface PresetSample {
  id: string;
  name: string;
  category: 'scam' | 'genuine';
  brand: string;
  url: string;
  description: string;
}

const PRESET_SAMPLES: PresetSample[] = [
  {
    id: 'scam_hbl',
    name: 'Fake HBL Suspension SMS',
    category: 'scam',
    brand: 'HBL',
    url: '/samples/scam_hbl_alert.png',
    description: 'CNIC block threat + bit.ly link + tampered date block',
  },
  {
    id: 'scam_jazzcash',
    name: 'Fake JazzCash Rs 25k Prize',
    category: 'scam',
    brand: 'JazzCash',
    url: '/samples/scam_jazzcash_prize.png',
    description: 'Lottery cash reward lure directing to fake credential portal',
  },
  {
    id: 'scam_bisp',
    name: 'BISP Rs 12,500 Support Fraud',
    category: 'scam',
    brand: 'BISP',
    url: '/samples/scam_bisp_relief.png',
    description: 'Advance fee fraud demanding Rs 500 mobile processing payment',
  },
  {
    id: 'genuine_hbl',
    name: 'Authentic Bank Debit Alert',
    category: 'genuine',
    brand: 'HBL',
    url: '/samples/genuine_hbl_debit.png',
    description: 'Genuine store POS debit alert with official 111-111-425 UAN hotline',
  },
  {
    id: 'genuine_ke',
    name: 'Authentic Utility Bill Notice',
    category: 'genuine',
    brand: 'K-Electric',
    url: '/samples/genuine_ke_bill.png',
    description: 'Legitimate monthly bill notice directing payment via official app',
  },
];

const VERDICT = {
  scam: {
    label: 'Scam Detected',
    tone: 'text-rose-700 dark:text-rose-300',
    bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900',
    Icon: ShieldAlert,
  },
  suspicious: {
    label: 'Suspicious Content',
    tone: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900',
    Icon: AlertTriangle,
  },
  safe: {
    label: 'Looks Authentic & Safe',
    tone: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-900',
    Icon: CheckCircle,
  },
} as const;

/**
 * Scam Lens — Image is analyzed by the multimodal vision engine with live Gemini models
 * and resilient pre-indexed forensic benchmark dataset fallback.
 */
export const ScamLens: React.FC = () => {
  const [preview, setPreview] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string>('');
  const [activeSampleId, setActiveSampleId] = useState<string | null>(null);
  const [result, setResult] = useState<LensResponse | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const analyse = async (file: File) => {
    setError(null);
    setResult(null);
    setFileName(file.name);
    setPreview(URL.createObjectURL(file));
    setScanning(true);

    try {
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/v1/lens/analyze', { method: 'POST', body });

      if (!res.ok) {
        const detail = await res.text();
        setError(
          res.status === 503
            ? 'The image analyser needs a Gemini API key on the server.'
            : `The server could not analyse this image (HTTP ${res.status}). ${detail.slice(0, 120)}`,
        );
        return;
      }
      setResult(await res.json());
    } catch {
      setError('Could not reach the ScamShield server. Is the backend running?');
    } finally {
      setScanning(false);
    }
  };

  const loadPresetSample = async (sample: PresetSample) => {
    setActiveSampleId(sample.id);
    setError(null);
    setResult(null);
    setFileName(`${sample.name}.png`);
    setPreview(sample.url);
    setScanning(true);

    try {
      const imgRes = await fetch(sample.url);
      const blob = await imgRes.blob();
      const file = new File([blob], `${sample.name}.png`, { type: 'image/png' });
      const body = new FormData();
      body.append('file', file);
      const res = await fetch('/v1/lens/analyze', { method: 'POST', body });

      if (!res.ok) {
        const detail = await res.text();
        setError(`Analysis failed (HTTP ${res.status}): ${detail.slice(0, 120)}`);
        return;
      }
      setResult(await res.json());
    } catch {
      setError('Could not reach the ScamShield server. Is the backend running?');
    } finally {
      setScanning(false);
    }
  };

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setActiveSampleId(null);
      analyse(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      setActiveSampleId(null);
      analyse(file);
    }
  };

  const openPicker = (e?: React.MouseEvent) => {
    if (e && e.target instanceof HTMLInputElement) return;
    if (inputRef.current) {
      inputRef.current.click();
    } else {
      const el = document.getElementById('scam-lens-file-input') as HTMLInputElement | null;
      el?.click();
    }
  };

  const v = result ? VERDICT[result.verdict] : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-start gap-3.5">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 shrink-0">
            <Eye className="w-6 h-6 text-amber-600 dark:text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg font-black text-slate-900 dark:text-white">Scam Lens</h2>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                Visual OCR &amp; Forensic Model
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-300 mt-1">
              Upload a screenshot of an SMS, payment receipt, or QR code. The forensic vision model detects brand spoofing, urgency coercion, phishing links, and graphical tampering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label
            htmlFor="scam-lens-file-input"
            onClick={openPicker}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer select-none"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload Screenshot</span>
          </label>
        </div>
      </div>

      {/* Preset Samples Tray */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Try One-Click Forensic Demo Samples:
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400">
            Click any sample to analyze instantly
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
          {PRESET_SAMPLES.map((sample) => {
            const isScam = sample.category === 'scam';
            const isSelected = activeSampleId === sample.id;
            return (
              <button
                key={sample.id}
                onClick={() => loadPresetSample(sample)}
                disabled={scanning}
                className={`p-3 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-blue-500 bg-blue-50/70 dark:bg-blue-950/40 ring-2 ring-blue-500/20'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${
                        isScam
                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900'
                          : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900'
                      }`}
                    >
                      {isScam ? 'Scam Sample' : 'Genuine'}
                    </span>
                    <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                      {sample.brand}
                    </span>
                  </div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                    {sample.name}
                  </div>
                </div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">
                  {sample.description}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Preview (5 cols) */}
        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          className="lg:col-span-5 rounded-3xl border-2 border-dashed border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 p-5 flex flex-col min-h-[380px] shadow-xs"
        >
          {preview ? (
            <div className="flex-1 flex flex-col items-center justify-center">
              <img
                src={preview}
                alt={fileName}
                className="w-full max-h-72 object-contain rounded-2xl bg-slate-100 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-inner"
              />
            </div>
          ) : (
            <label
              htmlFor="scam-lens-file-input"
              onClick={openPicker}
              className="flex-1 flex flex-col items-center justify-center text-center gap-3 py-12 cursor-pointer select-none"
            >
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  Tap anywhere here to choose a screenshot
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                  Supports fake bank SMS alerts, WhatsApp lottery vouchers, JazzCash/Easypaisa receipts, and QR codes.
                </p>
              </div>
            </label>
          )}

          <input
            id="scam-lens-file-input"
            ref={inputRef}
            type="file"
            accept="image/*"
            onChange={onPick}
            onClick={(e) => {
              (e.target as HTMLInputElement).value = '';
            }}
            className="hidden"
          />

          <label
            htmlFor="scam-lens-file-input"
            onClick={openPicker}
            className={`mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm cursor-pointer shadow-md shadow-blue-600/20 select-none ${
              scanning ? 'opacity-60 pointer-events-none' : ''
            }`}
          >
            {scanning ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Forensic OCR &amp; Vision Model…</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                <span>{preview ? 'Choose Another Screenshot' : 'Select Screenshot from Device'}</span>
              </>
            )}
          </label>

          {fileName && (
            <p className="mt-2 text-[11px] text-center text-slate-500 dark:text-slate-400 font-mono truncate">
              {fileName}
            </p>
          )}
        </div>

        {/* Results & Forensic Breakdown (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {!result && !scanning && !error && (
            <div className="min-h-[380px] rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-8 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                <HelpCircle className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
                  Forensic Verdict Ready
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                  Upload an image from your device or select one of the preset samples above to see the AI inspection in action.
                </p>
              </div>
            </div>
          )}

          {scanning && (
            <div className="min-h-[380px] rounded-3xl border border-blue-200 dark:border-blue-900 bg-blue-50/60 dark:bg-blue-950/30 p-8 flex flex-col items-center justify-center text-center gap-3 shadow-xs">
              <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              <div>
                <h3 className="text-base font-bold text-blue-900 dark:text-blue-200">
                  Inspecting Visual Artifacts &amp; Text…
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  Extracting OCR typography, validating URLs against threat registries, and checking for forged typography.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="rounded-3xl border border-rose-300 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/40 p-5 flex gap-3 shadow-xs">
              <ImageOff className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-rose-900 dark:text-rose-200">
                  Could not analyse this image
                </p>
                <p className="text-xs text-rose-700 dark:text-rose-300 mt-1">{error}</p>
              </div>
            </div>
          )}

          {result && v && (
            <div className="space-y-4">
              {/* Verdict Banner */}
              <div className={`rounded-3xl border p-5 shadow-xs ${v.bg}`}>
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-2xl bg-white/80 dark:bg-slate-900/80 shadow-xs">
                      <v.Icon className={`w-8 h-8 ${v.tone}`} />
                    </div>
                    <div>
                      <p className={`text-lg font-black ${v.tone}`}>{v.label}</p>
                      <p className="text-xs text-slate-700 dark:text-slate-300 mt-0.5">
                        Confidence {Math.round(result.confidence * 100)}%
                        {result.spoofed_brand && ` • Impersonating: ${result.spoofed_brand}`}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-full text-xs font-mono font-black uppercase ${
                      result.verdict === 'scam'
                        ? 'bg-rose-200 dark:bg-rose-900 text-rose-900 dark:text-rose-100'
                        : result.verdict === 'suspicious'
                        ? 'bg-amber-200 dark:bg-amber-900 text-amber-900 dark:text-amber-100'
                        : 'bg-emerald-200 dark:bg-emerald-900 text-emerald-900 dark:text-emerald-100'
                    }`}
                  >
                    {result.verdict}
                  </span>
                </div>

                {/* Key Forensic Reasons */}
                {result.reasons.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-current/15 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 block">
                      Forensic Findings:
                    </span>
                    <ul className="space-y-1.5">
                      {result.reasons.map((r, i) => (
                        <li
                          key={i}
                          className="flex items-start gap-2.5 text-xs text-slate-800 dark:text-slate-200"
                        >
                          <span className="mt-1 w-1.5 h-1.5 rounded-full bg-current shrink-0" />
                          <span>{r}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* Tampering Alert */}
              {result.tampering_detected && (
                <div className="rounded-2xl border border-amber-300 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 p-4 flex gap-3 shadow-xs">
                  <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-amber-900 dark:text-amber-200">
                      Doctored Graphics or Tampered Timestamp Detected
                    </p>
                    <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-0.5">
                      Font sizing, alignment, or date artifacts do not match standard banking templates. Treat transaction IDs or amounts on this screenshot as fraudulent.
                    </p>
                  </div>
                </div>
              )}

              {/* Extracted Links */}
              {result.extracted_links.length > 0 && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Phishing Links Identified ({result.extracted_links.length})
                  </p>
                  <ul className="mt-2 space-y-1.5">
                    {result.extracted_links.map((l, i) => (
                      <li
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs font-mono text-rose-600 dark:text-rose-400 break-all"
                      >
                        <Link2 className="w-4 h-4 shrink-0 text-slate-400" />
                        <span>{l}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-[11px] text-rose-600 dark:text-rose-400 font-semibold">
                    ⚠️ Never open links received from SMS claiming your bank account is suspended.
                  </p>
                </div>
              )}

              {/* Detected Text OCR */}
              {result.detected_text && (
                <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 shadow-xs">
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    Extracted Text Content (OCR)
                  </p>
                  <p className="mt-2 p-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-200 font-mono leading-relaxed whitespace-pre-wrap break-words">
                    {result.detected_text}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
