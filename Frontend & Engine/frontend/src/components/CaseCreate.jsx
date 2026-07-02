import React, { useState, useEffect } from 'react';
import { Lightbulb, Save, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api';

const CaseCreate = () => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    device: '',
    severity: 'P3'
  });

  const [isTyping, setIsTyping] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // This watches the description box.
  
  useEffect(() => {
    if (formData.description.length < 20) return;

    const delayDebounceFn = setTimeout(async () => {
      setIsTyping(true);
      try {
        const aiRequest = {
          description: formData.description,
          category: formData.category || 'NETWORK',
          device: formData.device || 'Unknown'
        };

        const response = await api.post('/cases/recommend', aiRequest);
        setAiSuggestion(response.data);

        if (response.data.system_layer && response.data.system_layer !== 'N/A') {
          setFormData(prev => ({
            ...prev,
            category: response.data.system_layer,
            severity: response.data.severity !== 'N/A' ? response.data.severity : 'P3'
          }));
        }
      } catch (error) {
        console.error("AI Auto-Triage failed", error);
      } finally {
        setIsTyping(false);
      }
    }, 1500);

    return () => clearTimeout(delayDebounceFn);
  }, [formData.description]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    const newCase = {
      title: formData.title || `Issue: ${formData.category}`,
      description: formData.description,
      category: formData.category,
      device: formData.device,
      severity: formData.severity,
      status: "OPEN"
    };

    try {
      await api.post('/cases', newCase);
      setSuccessMsg(`Case logged successfully. Auto-Triage Confidence: ${aiSuggestion?.ml_confidence_metric || 'N/A'}`);
      setFormData({ title: '', description: '', category: '', device: '', severity: 'P3' });
      setAiSuggestion(null);
    } catch (error) {
      console.error("Failed to create case", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="page-header border-b border-white/[0.06] pb-5">
        <h1>Log New Support Ticket</h1>
        <p>Enter issue details. Triage fields will automatically populate based on historical data.</p>
      </header>

      {successMsg && (
        <div className="flex items-center gap-3 rounded-xl border border-emerald-500/25 bg-emerald-500/[0.07] px-5 py-4 text-sm text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-5">
        {/* Form Panel */}
        <div className="glass-panel p-6 lg:col-span-3">
          <h3 className="mb-5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Ticket Parameters</h3>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="form-label">Ticket Title</label>
              <input
                type="text"
                className="form-input"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                placeholder="Brief summary of the issue..."
              />
            </div>

            <div>
              <label className="form-label">Customer Query</label>
              <textarea
                rows="6"
                className="form-input resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Paste the customer complaint here..."
                required
              />
              {isTyping && (
                <div className="mt-2 flex items-center gap-2 text-[11px] font-semibold text-indigo-400">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Analyzing context...
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="form-label">
                  Category <span className="ai-tag">Auto-Filled</span>
                </label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={e => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">-- Select --</option>
                  <option value="NETWORK">NETWORK</option>
                  <option value="DEVICE">DEVICE</option>
                  <option value="BILLING">BILLING</option>
                  <option value="ACCOUNT">ACCOUNT</option>
                  <option value="SERVICE_OUTAGE">SERVICE OUTAGE</option>
                </select>
              </div>
              <div>
                <label className="form-label">
                  Severity <span className="ai-tag">Auto-Filled</span>
                </label>
                <select
                  className="form-input"
                  value={formData.severity}
                  onChange={e => setFormData({ ...formData, severity: e.target.value })}
                >
                  <option value="P1">P1 — Critical</option>
                  <option value="P2">P2 — High</option>
                  <option value="P3">P3 — Medium</option>
                </select>
              </div>
            </div>

            <div>
              <label className="form-label">Hardware / Device</label>
              <input
                type="text"
                className="form-input"
                value={formData.device}
                onChange={e => setFormData({ ...formData, device: e.target.value })}
                placeholder="e.g., iPhone 15 Pro"
              />
            </div>

            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={isSubmitting || !formData.description}
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Committing to Database...' : 'Log Ticket into System'}
            </button>
          </form>
        </div>

        {/* AI Triage Sidebar */}
        <div className="glass-panel border-indigo-500/[0.1] p-6 lg:col-span-2">
          <h3 className="mb-5 flex items-center gap-2 text-sm font-semibold text-white">
            <Lightbulb className="h-4 w-4 text-indigo-400" /> Automated Triage
          </h3>

          {!aiSuggestion && !isTyping && (
            <div className="empty-state text-xs">
              Start typing a description to initialize automated triage.
            </div>
          )}

          {isTyping && !aiSuggestion && (
            <div className="flex flex-col items-center justify-center py-10 gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-indigo-400" />
              <p className="text-xs text-slate-500 tracking-wide">Running vector retrieval...</p>
            </div>
          )}

          {aiSuggestion && (
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-indigo-500/20 bg-indigo-500/[0.05] px-4 py-3">
                <span className="text-xs text-slate-400">Confidence Score</span>
                <span className="text-lg font-black text-sky-400 tracking-tight">{aiSuggestion.ml_confidence_metric}</span>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Recommended Runbook</h4>
                <div className="tech-box text-xs">{aiSuggestion.suggested_resolution}</div>
              </div>

              <div>
                <h4 className="mb-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">Similar Historical Ticket</h4>
                <div className="tech-box muted text-xs">
                  <strong>ID:</strong> {aiSuggestion.ticket_id}<br />
                  {aiSuggestion.matched_historical_ticket}
                </div>
              </div>

              <div className="flex items-start gap-2.5 rounded-xl border border-sky-500/15 bg-sky-500/[0.04] px-3.5 py-3 text-[11px] text-sky-300/75">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                <span>The form has been auto-filled based on this prediction. You can override before saving.</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CaseCreate;
