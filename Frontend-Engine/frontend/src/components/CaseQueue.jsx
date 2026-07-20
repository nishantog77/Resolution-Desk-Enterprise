import React, { useState, useEffect } from 'react';
import { Download, Loader2, ListFilter } from 'lucide-react';
import api from '../api';

const CaseQueue = ({ onRowClick }) => {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);

  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  useEffect(() => {
    fetchCases();
  }, [categoryFilter, statusFilter]);

  const fetchCases = async () => {
    setLoading(true);
    try {
      // THE FIX: Safe URL Query Parameter Building
      let url = '/cases';
      const queryParts = [];
      if (categoryFilter) queryParts.push(`category=${categoryFilter}`);
      if (statusFilter) queryParts.push(`status=${statusFilter}`);
      
      if (queryParts.length > 0) {
        url += `?${queryParts.join('&')}`;
      }

      const response = await api.get(url);
      
      const sorted = [...response.data].sort((a, b) => {
        const idA = a.id || a.caseId || "";
        const idB = b.id || b.caseId || "";
        return idB.localeCompare(idA); 
      });
      
      setCases(sorted);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch cases", error);
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ["Ticket ID", "Status", "Severity", "Category", "Device", "Description"];
    const rows = cases.map(c => [
      c.id || c.caseId || "N/A", // Fallback for ID in CSV
      c.status || "N/A",
      c.severity || "N/A",
      c.category || "N/A",
      c.device || "N/A",
      `"${(c.description || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = "data:text/csv;charset=utf-8,"
      + [headers.join(","), ...rows.map(e => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Support_Ticket_Export.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between border-b border-white/[0.06] pb-5">
        <header>
          <h1 className="text-3xl font-bold text-white tracking-tight">Active Ticket Queue</h1>
          <p className="text-sm text-slate-500 mt-1">Real-time monitoring and routing of customer issues.</p>
        </header>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 border border-white/[0.06] transition-colors duration-200 hover:border-sky-500/20">
            <ListFilter size={14} className="text-slate-500 shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Statuses</option>
              <option value="OPEN" className="bg-slate-900">Open</option>
              <option value="RESOLVED" className="bg-slate-900">Resolved</option>
            </select>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-black/30 px-3 py-2 border border-white/[0.06] transition-colors duration-200 hover:border-sky-500/20">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-sm font-medium text-slate-300 outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900">All Categories</option>
              <option value="NETWORK" className="bg-slate-900">Network</option>
              <option value="DEVICE" className="bg-slate-900">Device</option>
              <option value="BILLING" className="bg-slate-900">Billing</option>
              <option value="ACCOUNT" className="bg-slate-900">Account</option>
              <option value="SERVICE_OUTAGE" className="bg-slate-900">Service Outage</option>
            </select>
          </div>

          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 rounded-lg bg-white/[0.04] border border-white/[0.08] px-4 py-2 text-sm font-semibold text-slate-300 transition-all duration-200 hover:bg-white/[0.08] hover:text-white active:scale-[0.97] transform-gpu"
          >
            <Download size={14} /> Export CSV
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Loader2 className="h-7 w-7 animate-spin text-sky-400 mb-4" />
          <span className="font-medium tracking-widest text-xs uppercase">Synchronizing Database...</span>
        </div>
      ) : (
        <div className="glass-panel overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead>
                <tr className="border-b border-white/[0.06] bg-black/30">
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">ID</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Status</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Severity</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Category</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500">Device</th>
                  <th className="px-5 py-3.5 text-[10px] font-bold uppercase tracking-widest text-slate-500 w-full">Query</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {cases.map((ticket, index) => (
                  <tr
                    key={ticket.id || ticket.caseId || index} // Safe map key
                    onClick={() => onRowClick(ticket.id || ticket.caseId)}
                    className="group cursor-pointer transition-colors duration-150 hover:bg-sky-500/[0.04] border-l-2 border-l-transparent hover:border-l-sky-500/40"
                  >
                    {/* Safely display the ID regardless of what Java named it */}
                    <td className="px-5 py-3.5 font-mono text-sm font-semibold text-sky-400 group-hover:text-sky-300 transition-colors duration-150">
                      {ticket.id || ticket.caseId || "N/A"}
                    </td>
                    
                    {/* Safely handle toLowerCase so it never crashes on null fields */}
                    <td className="px-5 py-3.5">
                      <span className={`status-badge ${ticket.status?.toLowerCase() || ''}`}>{ticket.status || "Open"}</span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`severity-badge ${ticket.severity?.toLowerCase() || ''}`}>{ticket.severity || "Unassigned"}</span>
                    </td>
                    <td className="px-5 py-3.5 font-medium text-slate-300 text-xs">{ticket.category}</td>
                    <td className="px-5 py-3.5 text-slate-500 text-xs">{ticket.device}</td>
                    <td className="max-w-[280px] truncate px-5 py-3.5 text-slate-500 font-mono text-xs">{ticket.description}</td>
                  </tr>
                ))}
                {cases.length === 0 && (
                  <tr>
                    <td colSpan="6" className="py-14 text-center text-xs text-slate-600 italic tracking-wide">No tickets match current filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaseQueue;