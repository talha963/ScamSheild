import React, { useCallback, useEffect, useRef, useState } from 'react';
import { BarChart3, Mic, MicOff, Play, RefreshCw, CheckCircle2, XCircle, MinusCircle, Users, AlertTriangle } from 'lucide-react';

// ---------- API types (mirror reports/evaluation_report.json) ----------
interface Target { metric: string; label: string; value: number | null; goal: string; status: 'PASS' | 'FAIL' | 'NOT_MEASURED' }
interface LangRow { n_scam: number; n_genuine: number; recall_pct: number | null; far_pct: number | null }
interface Report {
  generated_at: string; engine: string; mode: string; runtime_seconds: number;
  evaluated_calls: { scam: number; genuine: number };
  targets: Target[];
  detection: {
    operating_point_tier2: { recall_pct: number; far_pct: number };
    recall_at_far_2pct: { threshold: number; recall_pct: number; far_pct: number };
    auc: number; false_alarms: number; false_alarms_per_100_genuine: number;
    time_to_detect: { p50: number | null; p90: number | null; n: number };
    roc: { threshold: number; tpr: number; fpr: number }[];
  };
  latency: { measured_compute: { p50_ms?: number; p95_ms?: number }; projected_end_to_end_s: number };
  fairness: { per_language: Record<string, LangRow>; per_playbook_recall: Record<string, { n: number; recall_pct: number }>; language_recall_gap_pts: number | null };
  understanding: {
    scam_type: { accuracy: number; macro_f1: number };
    requested_action: { accuracy: number };
    tactics: Record<string, { precision: number; recall: number; f1: number }>;
    evidence_phrase_rate: number | null; schema_valid_rate: number;
  };
  calibration: { ece: number; brier: number };
  fusion_rules: { total: number; passed: number; tests: { test: string; status: string; detail: string; kind: string }[] };
  voice_clone: { data_source: string; synthetic_recall: number; false_flag_rate_on_real: number; auc: number; eer: number; warning: string | null };
  scam_lens: { available: boolean; engine?: string; scam_recall?: number; false_flag_rate_on_genuine?: number; brand_impersonation_accuracy?: number; warning?: string | null };
  prompt_injection: { recall_without_injection: number; recall_with_injection: number; verdicts_flipped_by_injection: number } | null;
  user_comprehension: { n_testers: number; n_passed: number; score_out_of_10: number | null };
}
interface Utterance {
  extracted: { tactics: Record<string, { score: number; evidence: string }>; scam_type: string; requested_action: string; caller_claims_org: string | null; next_likely_ask: string };
  evaluation: { fused_score: number; tier: number; reasons: string[]; actions: string[]; user_warning: string; user_warning_ur: string };
  latency_ms: number; engine: string;
}
interface CompQuestion { q1: string; q1_options: string[]; q2: string; q2_options: string[]; warning_shown: string }

const pct = (x: number | null | undefined, d = 1) => (x === null || x === undefined ? 'n/a' : `${x.toFixed(d)}%`);
const TIER_STYLE = ['text-emerald-400 border-emerald-500/50 bg-emerald-500/10', 'text-yellow-300 border-yellow-500/50 bg-yellow-500/10', 'text-amber-400 border-amber-500/50 bg-amber-500/10', 'text-rose-400 border-rose-500/50 bg-rose-500/10'];
const SAMPLES = [
  'Main State Bank security se bol raha hoon, aap ka account block ho raha hai, OTP abhi bata dein.',
  'میں سٹیٹ بینک سے بول رہا ہوں، آپ کا اکاؤنٹ بلاک ہو جائے گا، کوڈ بتائیں۔',
  'Hi, your parcel will reach you by 6 pm today, please keep your phone handy.',
];

const StatusIcon: React.FC<{ s: string }> = ({ s }) =>
  s === 'PASS' ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : s === 'FAIL' ? <XCircle className="w-4 h-4 text-rose-400" /> : <MinusCircle className="w-4 h-4 text-slate-500" />;

export const EvaluationDashboard: React.FC = () => {
  const [report, setReport] = useState<Report | null>(null);
  const [status, setStatus] = useState<{ running: boolean; done: number; total: number; error: string | null }>({ running: false, done: 0, total: 0, error: null });
  const [apiError, setApiError] = useState<string>('');

  // Speak & evaluate
  const [text, setText] = useState('');
  const [lang, setLang] = useState('ur-PK');
  const [ctxApp, setCtxApp] = useState(false);
  const [ctxPayee, setCtxPayee] = useState(false);
  const [listening, setListening] = useState(false);
  const [utt, setUtt] = useState<Utterance | null>(null);
  const recRef = useRef<any>(null);

  // Comprehension
  const [cq, setCq] = useState<CompQuestion | null>(null);
  const [q1, setQ1] = useState<number | null>(null);
  const [q2, setQ2] = useState<number | null>(null);
  const [tester, setTester] = useState('');

  const loadReport = useCallback(async () => {
    try {
      const r = await fetch('/v1/evaluation/report');
      if (r.ok) setReport(await r.json());
      else setReport(null);
      setApiError('');
    } catch { setApiError('Backend not reachable. Start it with: python run_system.py'); }
  }, []);

  const loadComp = useCallback(async () => {
    try { const r = await fetch('/v1/evaluation/comprehension'); if (r.ok) setCq((await r.json()).question); } catch { /* offline */ }
  }, []);

  useEffect(() => { loadReport(); loadComp(); }, [loadReport, loadComp]);

  useEffect(() => {
    if (!status.running) return;
    const id = setInterval(async () => {
      const s = await (await fetch('/v1/evaluation/status')).json();
      setStatus(s);
      if (!s.running) { clearInterval(id); loadReport(); }
    }, 800);
    return () => clearInterval(id);
  }, [status.running, loadReport]);

  const runBenchmark = async (quick: boolean) => {
    const r = await fetch(`/v1/evaluation/run?quick=${quick}`, { method: 'POST' });
    if (r.ok) setStatus({ running: true, done: 0, total: 0, error: null });
  };

  const evaluateText = async (t: string = text) => {
    if (!t.trim()) return;
    const r = await fetch('/v1/evaluation/analyze', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: t, language_hint: lang, banking_app_open: ctxApp, new_payee: ctxPayee, amount_vs_history: ctxPayee ? 6 : 1 }),
    });
    if (r.ok) setUtt(await r.json());
  };

  const toggleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition is not supported in this browser. Use Chrome/Edge, or type the sentence.'); return; }
    if (listening) { recRef.current?.stop(); return; }
    const rec = new SR();
    rec.lang = lang; rec.interimResults = false; rec.continuous = false;
    rec.onresult = (e: any) => { const t = e.results[0][0].transcript; setText(t); evaluateText(t); };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec; rec.start(); setListening(true);
  };

  const submitComp = async () => {
    if (q1 === null || q2 === null) return;
    await fetch('/v1/evaluation/comprehension', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tester: tester || undefined, q1, q2, language: lang.slice(0, 2) }) });
    setQ1(null); setQ2(null); setTester(''); loadReport();
  };

  const card = 'glass-panel rounded-2xl border border-slate-800 p-4';

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className={`${card} flex flex-col md:flex-row md:items-center justify-between gap-4`}>
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            <h2 className="text-sm font-bold text-white uppercase tracking-wider">Evaluation • Measured results (PDF Section 8)</h2>
          </div>
          <p className="text-xs text-slate-300 mt-1">
            Replays scam and genuine calls through speech extraction and risk fusion, then measures recall, false alarms, time-to-detect, per-language fairness and more.
          </p>
          {report && <p className="text-[11px] text-slate-500 mt-1 font-mono">engine: {report.engine} • {report.evaluated_calls.scam} scam + {report.evaluated_calls.genuine} genuine calls • {report.mode} • {new Date(report.generated_at).toLocaleString()}</p>}
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button onClick={() => runBenchmark(true)} disabled={status.running} className="px-3 py-1.5 rounded-lg text-xs font-bold border border-slate-700 text-slate-200 hover:bg-slate-800 disabled:opacity-50 cursor-pointer">Quick run</button>
          <button onClick={() => runBenchmark(false)} disabled={status.running} className="px-3 py-1.5 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 hover:bg-cyan-500/30 disabled:opacity-50 flex items-center gap-1.5 cursor-pointer">
            {status.running ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {status.running ? `Running ${status.done}/${status.total || '…'}` : 'Run full evaluation'}
          </button>
        </div>
      </div>
      {apiError && <div className="text-xs text-amber-300 border border-amber-500/40 bg-amber-500/10 rounded-lg p-3">{apiError}</div>}
      {status.error && <div className="text-xs text-rose-300 border border-rose-500/40 bg-rose-500/10 rounded-lg p-3">{status.error}</div>}

      {/* Speak & Evaluate */}
      <div className={card}>
        <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3 flex items-center gap-2"><Mic className="w-4 h-4 text-cyan-400" />Speak &amp; evaluate (extract what was said, then score it)</h3>
        <div className="flex flex-col md:flex-row gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} dir="auto" placeholder="Speak with the mic, or type what the caller said (Urdu, Punjabi, Roman Urdu, English)…"
            className="flex-1 bg-slate-950/70 border border-slate-700 rounded-lg p-2 text-sm text-slate-100 outline-none focus:border-cyan-500" />
          <div className="flex md:flex-col gap-2">
            <select value={lang} onChange={(e) => setLang(e.target.value)} className="bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-slate-200">
              <option value="ur-PK">Urdu</option><option value="pa-PK">Punjabi</option><option value="en-US">English</option>
            </select>
            <button onClick={toggleMic} className={`px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer border ${listening ? 'bg-rose-500/20 text-rose-300 border-rose-500/50' : 'bg-slate-800 text-slate-200 border-slate-700'}`}>
              {listening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}{listening ? 'Stop' : 'Speak'}
            </button>
            <button onClick={() => evaluateText()} className="px-3 py-2 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 cursor-pointer">Evaluate</button>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3 mt-2 text-[11px] text-slate-400">
          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={ctxApp} onChange={(e) => setCtxApp(e.target.checked)} />banking app open during call</label>
          <label className="flex items-center gap-1.5 cursor-pointer"><input type="checkbox" checked={ctxPayee} onChange={(e) => setCtxPayee(e.target.checked)} />new payee + large amount</label>
          <span className="text-slate-600">Try:</span>
          {SAMPLES.map((s, i) => <button key={i} onClick={() => { setText(s); evaluateText(s); }} className="underline decoration-dotted hover:text-cyan-300 cursor-pointer">sample {i + 1}</button>)}
        </div>
        {utt && (
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            <div className={`rounded-xl border p-3 ${TIER_STYLE[utt.evaluation.tier]}`}>
              <div className="text-[10px] uppercase tracking-wider opacity-80">Fused risk</div>
              <div className="text-3xl font-black">{utt.evaluation.fused_score}<span className="text-sm font-medium opacity-70"> / 100</span></div>
              <div className="text-xs font-bold">TIER {utt.evaluation.tier}</div>
              <div className="text-[10px] mt-2 opacity-80 font-mono">{utt.engine} • {utt.latency_ms} ms</div>
            </div>
            <div className="rounded-xl border border-slate-800 p-3 text-xs space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Extracted from speech</div>
              <div>Scam type: <b className="text-white">{utt.extracted.scam_type}</b></div>
              <div>Requested action: <b className="text-white">{utt.extracted.requested_action}</b></div>
              <div>Claims to be: <b className="text-white">{utt.extracted.caller_claims_org ?? '—'}</b></div>
              <div>Likely next ask: <b className="text-white">{utt.extracted.next_likely_ask}</b></div>
              {Object.entries(utt.extracted.tactics).length === 0 && <div className="text-slate-500">No manipulation tactics detected.</div>}
              {Object.entries(utt.extracted.tactics).map(([k, v]) => <div key={k} className="text-slate-300"><span className="text-cyan-300">{k}</span> {v.score.toFixed(2)} — <i>{v.evidence}</i></div>)}
            </div>
            <div className="rounded-xl border border-slate-800 p-3 text-xs space-y-1.5">
              <div className="text-[10px] uppercase tracking-wider text-slate-400">Why &amp; what the system does</div>
              {utt.evaluation.reasons.map((r, i) => <div key={i}>• {r}</div>)}
              <div className="text-slate-400">Actions: {utt.evaluation.actions.join(', ')}</div>
              <div className="text-amber-200">{utt.evaluation.user_warning}</div>
              <div dir="rtl" className="text-amber-200">{utt.evaluation.user_warning_ur}</div>
            </div>
          </div>
        )}
      </div>

      {!report && !apiError && <div className={`${card} text-sm text-slate-300`}>No report yet. Click <b>Run full evaluation</b> to measure the system.</div>}

      {report && (
        <>
          {/* Targets */}
          <div className={card}>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Acceptance targets</h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {report.targets.map((t) => (
                <div key={t.metric} className={`rounded-xl border p-3 ${t.status === 'PASS' ? 'border-emerald-500/40' : t.status === 'FAIL' ? 'border-rose-500/40' : 'border-slate-700'}`}>
                  <div className="flex items-center justify-between"><span className="text-[11px] text-slate-300">{t.label}</span><StatusIcon s={t.status} /></div>
                  <div className="text-2xl font-black text-white mt-1">{t.value === null ? 'n/a' : t.value.toFixed(2)}</div>
                  <div className="text-[10px] text-slate-500 font-mono">goal {t.goal}</div>
                </div>
              ))}
            </div>
            {report.engine === 'heuristic_fallback' && (
              <div className="mt-3 text-[11px] text-amber-200 flex gap-2"><AlertTriangle className="w-4 h-4 shrink-0" />These numbers measure the built-in keyword fallback because no GEMINI_API_KEY is set. Add a key to .env and re-run to evaluate Gemini.</div>
            )}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* Language fairness */}
            <div className={card}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Per-language recall &amp; false alarms</h3>
              <table className="w-full text-xs">
                <thead><tr className="text-slate-400 text-left"><th className="py-1">Language</th><th>Scam n</th><th>Recall</th><th>FAR</th></tr></thead>
                <tbody>
                  {Object.entries(report.fairness.per_language).map(([l, v]) => (
                    <tr key={l} className="border-t border-slate-800">
                      <td className="py-1 font-mono text-cyan-300">{l}</td><td>{v.n_scam}</td>
                      <td><div className="flex items-center gap-2"><div className="w-24 h-1.5 bg-slate-800 rounded"><div className="h-1.5 rounded bg-cyan-500" style={{ width: `${v.recall_pct ?? 0}%` }} /></div>{pct(v.recall_pct)}</div></td>
                      <td>{pct(v.far_pct, 2)}</td>
                    </tr>))}
                </tbody>
              </table>
              <div className="text-[11px] text-slate-400 mt-2">Best-vs-worst recall gap: <b className="text-white">{report.fairness.language_recall_gap_pts?.toFixed(1)} pts</b> (goal ≤ 10)</div>
            </div>

            {/* ROC */}
            <div className={card}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">ROC curve • AUC {report.detection.auc.toFixed(3)}</h3>
              <svg viewBox="0 0 200 200" className="w-full max-w-[260px] mx-auto bg-slate-950/60 rounded-lg border border-slate-800">
                <line x1="10" y1="190" x2="190" y2="10" stroke="#334155" strokeDasharray="3" />
                <polyline fill="none" stroke="#22d3ee" strokeWidth="2" points={report.detection.roc.map((p) => `${10 + p.fpr * 180},${190 - p.tpr * 180}`).join(' ')} />
                <text x="100" y="199" fontSize="8" fill="#94a3b8" textAnchor="middle">false-alarm rate →</text>
              </svg>
              <div className="text-[11px] text-slate-400 mt-2 grid grid-cols-2 gap-1">
                <span>Tier-2 recall: <b className="text-white">{pct(report.detection.operating_point_tier2.recall_pct)}</b></span>
                <span>Tier-2 FAR: <b className="text-white">{pct(report.detection.operating_point_tier2.far_pct, 2)}</b></span>
                <span>Time-to-detect p50: <b className="text-white">{report.detection.time_to_detect.p50?.toFixed(1) ?? 'n/a'} s</b></span>
                <span>Latency p95: <b className="text-white">{report.latency.measured_compute.p95_ms?.toFixed(2)} ms</b></span>
              </div>
            </div>

            {/* Understanding */}
            <div className={card}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Understanding what was said</h3>
              <div className="text-xs text-slate-300 space-y-1 mb-3">
                <div>Scam-type accuracy: <b className="text-white">{pct(report.understanding.scam_type.accuracy * 100)}</b> (macro-F1 {report.understanding.scam_type.macro_f1.toFixed(2)})</div>
                <div>Requested-action accuracy: <b className="text-white">{pct(report.understanding.requested_action.accuracy * 100)}</b></div>
                <div>Evidence phrase present: <b className="text-white">{pct((report.understanding.evidence_phrase_rate ?? 0) * 100)}</b> • schema valid: <b className="text-white">{pct(report.understanding.schema_valid_rate * 100, 2)}</b></div>
                <div>Calibration: ECE <b className="text-white">{report.calibration.ece.toFixed(3)}</b>, Brier <b className="text-white">{report.calibration.brier.toFixed(3)}</b></div>
              </div>
              <table className="w-full text-[11px]"><thead><tr className="text-slate-400 text-left"><th>Tactic</th><th>P</th><th>R</th><th>F1</th></tr></thead>
                <tbody>{Object.entries(report.understanding.tactics).map(([k, v]) => <tr key={k} className="border-t border-slate-800"><td className="py-0.5 text-cyan-300">{k}</td><td>{v.precision.toFixed(2)}</td><td>{v.recall.toFixed(2)}</td><td>{v.f1.toFixed(2)}</td></tr>)}</tbody></table>
            </div>

            {/* Components */}
            <div className={card}>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Components</h3>
              <div className="text-xs text-slate-300 space-y-2">
                <div><b className="text-white">Fusion design rules:</b> {report.fusion_rules.passed}/{report.fusion_rules.total} passed</div>
                <div><b className="text-white">Voice-Clone Shield</b> ({report.voice_clone.data_source}): recall {pct(report.voice_clone.synthetic_recall * 100)}, false flag {pct(report.voice_clone.false_flag_rate_on_real * 100)}, AUC {report.voice_clone.auc.toFixed(2)}, EER {report.voice_clone.eer.toFixed(2)}
                  {report.voice_clone.warning && <div className="text-amber-300 text-[11px] mt-0.5">{report.voice_clone.warning}</div>}</div>
                {report.scam_lens.available && <div><b className="text-white">Scam Lens</b> ({report.scam_lens.engine}): recall {pct((report.scam_lens.scam_recall ?? 0) * 100)}, false flag {pct((report.scam_lens.false_flag_rate_on_genuine ?? 0) * 100)}
                  {report.scam_lens.warning && <div className="text-amber-300 text-[11px] mt-0.5">{report.scam_lens.warning}</div>}</div>}
                {report.prompt_injection && <div><b className="text-white">Prompt injection:</b> recall {pct(report.prompt_injection.recall_without_injection * 100)} → {pct(report.prompt_injection.recall_with_injection * 100)}; verdicts flipped {report.prompt_injection.verdicts_flipped_by_injection}</div>}
              </div>
            </div>
          </div>
        </>
      )}

      {/* Comprehension */}
      {cq && (
        <div className={card}>
          <h3 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2"><Users className="w-4 h-4 text-cyan-400" />User comprehension test (goal: at least 8 of 10 testers)</h3>
          <p className="text-[11px] text-slate-400 mb-3">Show the tester this warning, then record their answers: <b className="text-amber-200">“{cq.warning_shown}”</b>
            {report && <> — recorded so far: <b className="text-white">{report.user_comprehension.n_passed}/{report.user_comprehension.n_testers}</b> passed</>}</p>
          <div className="grid md:grid-cols-2 gap-4 text-xs">
            {[{ q: cq.q1, o: cq.q1_options, v: q1, set: setQ1 }, { q: cq.q2, o: cq.q2_options, v: q2, set: setQ2 }].map((blk, i) => (
              <div key={i}><div className="font-bold text-slate-200 mb-1">{blk.q}</div>
                {blk.o.map((opt, j) => <label key={j} className="flex items-center gap-2 py-0.5 cursor-pointer"><input type="radio" name={`q${i}`} checked={blk.v === j} onChange={() => blk.set(j)} />{opt}</label>)}</div>))}
          </div>
          <div className="flex items-center gap-2 mt-3">
            <input value={tester} onChange={(e) => setTester(e.target.value)} placeholder="Tester name or id (optional)" className="bg-slate-950 border border-slate-700 rounded-lg text-xs p-2 text-slate-100 w-56" />
            <button onClick={submitComp} disabled={q1 === null || q2 === null} className="px-3 py-2 rounded-lg text-xs font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 disabled:opacity-40 cursor-pointer">Record tester</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default EvaluationDashboard;
