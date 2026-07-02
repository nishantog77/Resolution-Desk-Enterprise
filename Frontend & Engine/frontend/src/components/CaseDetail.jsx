import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Save, Loader2, ClipboardList, PenTool, Bot, Send, User } from 'lucide-react';
import api from '../api';

const CaseDetail = ({ caseId, onBack }) => {
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newNote, setNewNote] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [chatMessages, setChatMessages] = useState([
    { role: 'ai', content: 'Co-Pilot initialized. How can I assist with this ticket?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const chatScrollRef = useRef(null);

  useEffect(() => {
    const fetchCase = async () => {
      try {
        const response = await api.get(`/cases/${caseId}`);
        setTicket(response.data);
        setNewNote(response.data.resolutionNotes || response.data.notes || '');
      } catch (err) {
        console.error("Failed to load case details", err);
      } finally {
        setLoading(false);
      }
    };
    fetchCase();
  }, [caseId]);

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [chatMessages, isAiTyping]);

  const handleSaveNotes = async () => {
    if (!newNote.trim()) return;
    setIsSaving(true);
    try {
      await api.put(`/cases/${caseId}/notes`, newNote, {
        headers: { 'Content-Type': 'text/plain' }
      });
      setTicket(prev => ({ ...prev, resolutionNotes: newNote }));
      alert(" Resolution notes permanently saved to the cloud database!");
    } catch (err) {
      console.error("Failed to save notes", err);
      alert("Failed to save. Check your Java backend console.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput.trim();
    setChatMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setChatInput('');
    setIsAiTyping(true);

    try {
      const payload = {
        ticket_id: String(ticket?.caseId || "UNKNOWN"),
        ticket_context: String(ticket?.description || "No description provided."),
        category: String(ticket?.category || "GENERAL"),
        message: String(userMessage)
      };

      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server responded with ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: data.reply || "Task executed successfully."
      }]);
    } catch (err) {
      console.error("Chat API Failed", err);
      setChatMessages(prev => [...prev, {
        role: 'ai',
        content: `SYSTEM ERROR: ${err.message}. Verify Python backend is active on Port 8000.`
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
      <Loader2 className="h-7 w-7 animate-spin text-sky-400 mb-4" />
      <span className="font-medium tracking-widest text-xs uppercase">Retrieving Ticket Data...</span>
    </div>
  );

  if (!ticket) return (
    <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-6 text-rose-400 text-center text-sm font-medium tracking-wide">
      Ticket record could not be located in the database.
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      <button
        className="flex items-center gap-2 text-sm font-medium text-sky-400 transition-colors duration-200 hover:text-sky-300 w-fit"
        onClick={onBack}
      >
        <ArrowLeft size={15} /> Return to Queue
      </button>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between border-b border-white/[0.06] pb-5">
        <header>
          <h1 className="text-2xl font-bold text-white tracking-tight">{ticket.title || `Support Ticket ${ticket.caseId}`}</h1>
          <div className="mt-2.5 flex flex-wrap items-center gap-2 text-[10px] font-mono text-slate-500">
            <span className="rounded-md bg-white/[0.04] px-2 py-1 border border-white/[0.06]">ID: {ticket.caseId}</span>
            <span className="rounded-md bg-white/[0.04] px-2 py-1 border border-white/[0.06]">Category: {ticket.category}</span>
            <span className="rounded-md bg-white/[0.04] px-2 py-1 border border-white/[0.06]">Device: {ticket.device}</span>
          </div>
        </header>
        <div className={`status-badge ${ticket.status?.toLowerCase() || 'open'} shrink-0`}>{ticket.status || 'OPEN'}</div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 flex-1 min-h-[500px]">
        {/* LEFT COLUMN */}
        <div className="lg:col-span-2 flex flex-col gap-5">
          <div className="glass-panel p-5">
            <h3 className="mb-3.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <ClipboardList size={14} className="text-sky-400" /> Customer Report
            </h3>
            <div className="rounded-xl border border-white/[0.05] bg-black/25 p-5 text-sm leading-relaxed text-slate-300 font-mono min-h-[90px]">
              {ticket.description}
            </div>
          </div>

          <div className="glass-panel p-5 flex-1 flex flex-col">
            <h3 className="mb-3.5 flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-slate-500">
              <PenTool size={14} className="text-indigo-400" /> Resolution Notes
            </h3>
            <div className="flex flex-col gap-3 flex-1">
              <textarea
                className="form-input resize-none w-full text-sm flex-1 min-h-[140px] bg-black/20"
                placeholder="Record investigative steps or resolution details here..."
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
              />
              <button
                onClick={handleSaveNotes}
                disabled={isSaving}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-sky-500/[0.08] px-4 py-2.5 text-sm font-semibold text-sky-400 ring-1 ring-sky-500/25 transition-all duration-200 hover:bg-sky-500/[0.15] hover:ring-sky-500/40 active:scale-[0.98] disabled:opacity-50 transform-gpu"
              >
                {isSaving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
                {isSaving ? 'Saving to Cloud...' : 'Save Record'}
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: AI Co-Pilot */}
        <div className="glass-panel flex flex-col overflow-hidden border-indigo-500/12">
          <div className="border-b border-white/6 bg-black/20 p-4 flex items-center gap-3 shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-500/10 ring-1 ring-indigo-500/25 shrink-0">
              <Bot className="h-4 w-4 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white tracking-wide">Resolution Co-Pilot</h3>
              <p className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold">Context-Aware AI</p>
            </div>
          </div>

          <div ref={chatScrollRef} className="flex-1 overflow-y-auto p-4 space-y-3.5 min-h-[280px]">
            {chatMessages.map((msg, idx) => (
              <div key={idx} className={`flex w-full ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[88%] gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 ${msg.role === 'user' ? 'bg-sky-500/20 text-sky-400' : 'bg-indigo-500/20 text-indigo-400'}`}>
                    {msg.role === 'user' ? <User size={10} /> : <Bot size={10} />}
                  </div>
                  <div className={`rounded-xl px-3 py-2.5 text-xs leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-sky-500/[0.08] border border-sky-500/20 text-sky-100 rounded-tr-sm'
                      : 'bg-black/35 border border-white/[0.05] text-slate-300 rounded-tl-sm font-mono'
                  }`}>
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex w-full justify-start">
                <div className="flex max-w-[80%] gap-2.5">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full mt-0.5 bg-indigo-500/20 text-indigo-400">
                    <Bot size={10} />
                  </div>
                  <div className="rounded-xl rounded-tl-sm border border-white/[0.05] bg-black/35 px-3 py-3 flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400/50" style={{ animationDelay: '0ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400/50" style={{ animationDelay: '150ms' }} />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-indigo-400/50" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="border-t border-white/[0.06] bg-black/20 p-3 shrink-0">
            <form onSubmit={handleSendMessage} className="relative">
              <input
                type="text"
                className="w-full rounded-xl border border-white/[0.07] bg-black/35 py-2.5 pl-4 pr-11 text-sm text-slate-200 placeholder-slate-600 outline-none transition-all duration-200 focus:border-indigo-500/40 focus:ring-1 focus:ring-indigo-500/20"
                placeholder="Ask Co-Pilot..."
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                disabled={isAiTyping}
              />
              <button
                type="submit"
                disabled={isAiTyping || !chatInput.trim()}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-500 transition-all duration-150 hover:bg-indigo-500/15 hover:text-indigo-400 disabled:opacity-40"
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CaseDetail;
