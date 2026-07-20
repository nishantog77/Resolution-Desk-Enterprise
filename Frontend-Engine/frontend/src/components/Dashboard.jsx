import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Activity, Smartphone, AlertCircle, Loader2 } from 'lucide-react';
import api from '../api';

const COLORS = ['#38bdf8', '#818cf8', '#34d399', '#fbbf24', '#f87171'];

const Dashboard = () => {
  const [trending, setTrending] = useState([]);
  const [devices, setDevices] = useState([]);
  const [topOffender, setTopOffender] = useState("N/A");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [trendRes, deviceRes] = await Promise.all([
          api.get('/analytics/trending'),
          api.get('/analytics/devices')
        ]);

        
        const trendData = trendRes.data || [];
        // Map blank database strings to "Unknown Device" so it doesn't render empty text
        const devData = (deviceRes.data || []).map(d => ({
          name: (d.name && d.name.trim() !== '') ? d.name : 'Unknown Device',
          value: d.value
        }));
        // Sort the devices to actually find the highest top offender
        if (devData.length > 0) {
          const sortedDevices = [...devData].sort((a, b) => b.value - a.value);
          setTopOffender(sortedDevices[0].name);
        }

        setTrending(trendData);
        setDevices(devData);
        setLoading(false);
      } catch (error) {
        console.error("Backend connection failed:", error);
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 text-slate-400">
      <Loader2 className="h-10 w-10 animate-spin text-sky-400 mb-5" />
      <span className="font-medium tracking-widest text-sm uppercase">Aggregating Platform Data...</span>
    </div>
  );

  return (
    <div className="space-y-8">
      <header className="border-b border-white/[0.06] pb-6">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-sky-400 to-indigo-400 bg-clip-text text-transparent tracking-tight">
          Platform Analytics
        </h1>
        <p className="text-slate-400 mt-2 text-sm">Live service desk aggregation and hardware analytics.</p>
      </header>

      <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
        <div className="glass-panel p-6 flex items-center shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-sky-500/20 group transform-gpu">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-500/10 ring-1 ring-sky-500/20 transition-colors duration-300 group-hover:bg-sky-500/20 mr-5">
            <Activity className="h-5 w-5 text-sky-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Active Categories</h3>
            <p className="mt-1 text-3xl font-black text-white tracking-tight">{trending.length}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-emerald-500/20 group transform-gpu">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 ring-1 ring-emerald-500/20 transition-colors duration-300 group-hover:bg-emerald-500/20 mr-5">
            <Smartphone className="h-5 w-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Flagged Devices</h3>
            <p className="mt-1 text-3xl font-black text-white tracking-tight">{devices.length}</p>
          </div>
        </div>

        <div className="glass-panel p-6 flex items-center shadow-xl transition-all duration-300 hover:-translate-y-0.5 hover:border-rose-500/20 group transform-gpu">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-rose-500/10 ring-1 ring-rose-500/20 transition-colors duration-300 group-hover:bg-rose-500/20 mr-5">
            <AlertCircle className="h-5 w-5 text-rose-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Top Offender</h3>
            <p className="mt-1 truncate text-xl font-black text-white tracking-tight max-w-[150px]">{topOffender}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="glass-panel p-7 shadow-2xl relative overflow-hidden">
          <div className="absolute -top-24 -right-24 w-56 h-56 bg-sky-500/[0.06] rounded-full blur-3xl pointer-events-none" />
          <h2 className="mb-7 text-[10px] font-bold uppercase tracking-widest text-slate-500">Issue Volume by Category</h2>
          <div className="h-64 w-full">
            
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={trending} barCategoryGap="35%">
                <defs>
                  <linearGradient id="colorSky" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.9} />
                    <stop offset="100%" stopColor="#0284c7" stopOpacity={0.5} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dy={10} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} axisLine={false} dx={-8} />
                <Tooltip
                  cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                  contentStyle={{ backgroundColor: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)', padding: '10px 14px' }}
                  itemStyle={{ color: '#38bdf8', fontWeight: 700, fontSize: 13 }}
                  labelStyle={{ color: '#94a3b8', fontSize: 11, marginBottom: 4 }}
                />
                
                <Bar dataKey="value" fill="url(#colorSky)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="glass-panel p-7 shadow-2xl relative overflow-hidden">
          <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-indigo-500/[0.06] rounded-full blur-3xl pointer-events-none" />
          <h2 className="mb-7 text-[10px] font-bold uppercase tracking-widest text-slate-500">Hardware Failure Distribution</h2>
          <div className="h-64 w-full">
            
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                
                <Pie data={devices} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value" nameKey="name" stroke="none">
                  {devices.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} opacity={0.85} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: 'rgba(10,15,28,0.95)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', color: '#f1f5f9', boxShadow: '0 20px 40px -10px rgba(0,0,0,0.6)', padding: '10px 14px' }}
                  itemStyle={{ color: '#f1f5f9', fontWeight: 700 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 justify-center">
            {devices.slice(0, 5).map((d, i) => (
              <div key={d.name} className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-[10px] text-slate-500 font-medium truncate max-w-[80px]">{d.name}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;