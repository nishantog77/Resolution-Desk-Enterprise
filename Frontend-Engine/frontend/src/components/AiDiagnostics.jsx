import React, { useState } from 'react';
import { ServerCog, Loader2, ShieldAlert, CheckCircle2 } from 'lucide-react';
import api from '../api';

const AiDiagnostics = () => {
  const [formData, setFormData] = useState({ description: '', category: 'NETWORK', device: '' });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDiagnose = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      // THE FIX: Route the AI Diagnosis directly to the Python Microservice on port 8000
      const response = await fetch('http://localhost:8000/solve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error(`Python Engine Error: ${response.status}`);
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError('Connection to analysis engine failed. Verify backend services are active.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-7">
      <header className="flex items-center gap-4 border-b border-white/[0.06] pb-5">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 ring-1 ring-indigo-500/25">
          <ServerCog className="h-5 w-5 text-indigo-400" />
        </div>
        <div className="page-header">
          <h1>Diagnostic Console</h1>
          <p>Query historical support logs via vector retrieval.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        {/* LEFT: Input Form */}
        <div className="glass-panel p-6">
          <h3 className="mb-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Input Parameters</h3>
          <form onSubmit={handleDiagnose} className="space-y-5">
            <div>
              <label className="form-label">System Layer (Category)</label>
              <select
                className="form-input"
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              >
                <option value="NETWORK">NETWORK</option>
                <option value="DEVICE">DEVICE</option>
                <option value="BILLING">BILLING</option>
                <option value="ACCOUNT">ACCOUNT</option>
                <option value="SERVICE_OUTAGE">SERVICE OUTAGE</option>
              </select>
            </div>

            <div>
              <label className="form-label">Hardware / Device</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g., iPhone 15 Pro, Samsung TV..."
                value={formData.device}
                onChange={(e) => setFormData({ ...formData, device: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="form-label">Customer Query / Error Log</label>
              <textarea
                rows="5"
                className="form-input resize-none font-mono text-sm"
                placeholder="Paste the exact issue here..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={loading}>
              {loading
                ? <><Loader2 className="h-4 w-4 animate-spin" /> Processing Query...</>
                : 'Execute System Diagnosis'
              }
            </button>
          </form>

          {error && <div className="error-box">{error}</div>}
        </div>

        {/* RIGHT: Response Console */}
        <div className="glass-panel border-emerald-500/[0.08] p-6">
          <h3 className="mb-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Triage Analysis</h3>

          {!result && !loading && (
            <div className="empty-state font-mono text-xs">
              Awaiting system parameters...
            </div>
          )}

          {loading && (
            <div className="flex flex-col items-center justify-center py-16 text-center gap-4">
              <div className="pulse-ring" />
              <p className="text-xs text-slate-500 tracking-wide">Retrieving historical case data...</p>
            </div>
          )}

          {result && !loading && (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 rounded-xl border px-4 py-3 text-xs font-black uppercase tracking-widest ${
                result.action === 'AUTO_RESOLVE'
                  ? 'border-emerald-500/25 bg-emerald-500/[0.07] text-emerald-400'
                  : 'border-amber-500/25 bg-amber-500/[0.07] text-amber-400'
              }`}>
                {result.action === 'AUTO_RESOLVE'
                  ? <CheckCircle2 className="h-4 w-4 shrink-0" />
                  : <ShieldAlert className="h-4 w-4 shrink-0" />
                }
                <span>PIPELINE: {result.action}</span>
              </div>

              <div className="rounded-xl border border-white/[0.05] bg-black/25 p-4">
                <span className="block text-[10px] font-bold uppercase tracking-widest text-slate-500">Confidence Score</span>
                <span className="mt-1 block text-2xl font-black text-sky-400 tracking-tight">{result.ml_confidence_metric}</span>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Suggested Remediation</h4>
                <div className="terminal-block text-xs whitespace-pre-wrap">{result.suggested_resolution}</div>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Historical Case Matches</h4>
                <div className="terminal-block muted text-xs whitespace-pre-wrap">
                  <strong>Ticket:</strong> {result.ticket_id}<br />
                  <strong>Context:</strong> {result.matched_historical_ticket}
                </div>
              </div>

              {result.warning && (
                <div className="rounded-xl border border-amber-500/25 bg-amber-500/[0.07] px-4 py-3 text-xs text-amber-400">
                  <strong>WARNING:</strong> {result.warning}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AiDiagnostics;