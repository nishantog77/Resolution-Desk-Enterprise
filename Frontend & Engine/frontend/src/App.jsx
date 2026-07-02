import React, { useState } from 'react';
import { LayoutDashboard, Inbox, PlusCircle, ServerCog, Layers } from 'lucide-react';
import Dashboard from './components/Dashboard';
import CaseQueue from './components/CaseQueue';
import AiDiagnostics from './components/AiDiagnostics';
import CaseCreate from './components/CaseCreate';
import CaseDetail from './components/CaseDetail';
import BackgroundAnimation from './components/BackgroundAnimation';

const NAV_ITEMS = [
  { id: 'analytics', label: 'Platform Analytics', icon: LayoutDashboard },
  { id: 'queue',     label: 'Active Queue',       icon: Inbox           },
  { id: 'create',    label: 'Log Ticket',         icon: PlusCircle      },
  { id: 'ai',        label: 'Diagnostic Console', icon: ServerCog       },
];

function App() {
  const [activeTab, setActiveTab]           = useState('analytics');
  const [selectedCaseId, setSelectedCaseId] = useState(null);

  const handleRowClick = (caseId) => {
    setSelectedCaseId(caseId);
    setActiveTab('detail');
  };

  return (
    <>
      
      <BackgroundAnimation />
      
    
      <div className="relative z-10 flex min-h-screen flex-col w-full">

        {/* ── Navbar ─────────────────────────────────────────────────────── */}
        <nav className="sticky top-0 z-50 border-b border-white/4 bg-[#050505]/85 backdrop-blur-2xl shadow-sm shadow-black/50">
          <div className="mx-auto flex max-w-[1600px] items-center justify-between px-6 py-4">

            {/* Brand */}
            <div className="flex items-center gap-3 shrink-0">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/20 bg-gradient-to-b from-sky-400/10 to-sky-600/5">
                <Layers className="h-4 w-4 text-sky-400" />
              </div>
              <div>
                <h2 className="text-sm font-bold tracking-tight text-white leading-tight">Resolution Desk</h2>
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600">Service Operations</p>
              </div>
            </div>

            {/* Nav pills */}
            <div className="flex items-center gap-1 rounded-xl border border-white/4 bg-black/25 p-1.5 overflow-x-auto">
              {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id)}
                  className={`nav-link flex items-center gap-2 whitespace-nowrap ${activeTab === id ? 'nav-link-active' : ''}`}
                >
                  <Icon className={`h-3.5 w-3.5 shrink-0 transition-colors duration-200 ${activeTab === id ? 'text-sky-400' : 'text-slate-500'}`} />
                  <span className="hidden sm:inline text-xs font-semibold">{label}</span>
                </button>
              ))}
            </div>

          </div>
        </nav>

        {/* ── Page content ────────────────────────────────────────────────── */}
        <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-8 sm:px-6">
          {activeTab === 'analytics' && <Dashboard />}
          {activeTab === 'queue'     && <CaseQueue onRowClick={handleRowClick} />}
          {activeTab === 'create'    && <CaseCreate />}
          {activeTab === 'ai'        && <AiDiagnostics />}
          {activeTab === 'detail'    && (
            <CaseDetail caseId={selectedCaseId} onBack={() => setActiveTab('queue')} />
          )}
        </main>

      </div>
    </>
  );
}

export default App;