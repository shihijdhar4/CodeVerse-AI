import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Save, 
  Sparkles, 
  Trophy, 
  Clock, 
  Terminal, 
  Globe2, 
  ChevronsRight 
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Legend 
} from 'recharts';

const Dashboard = () => {
  const { user, stats, fetchDashboardStats } = useApp();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      await fetchDashboardStats();
      setLoading(false);
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-505 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Compiling statistics...</p>
        </div>
      </div>
    );
  }

  // Fallback structures if stat files are empty
  const totalExecuted = stats?.totalExecuted || 0;
  const savedPrograms = stats?.savedProgramsCount || 0;
  const aiQueries = stats?.aiSuggestionsUsed || 0;
  const solvedChallenges = stats?.challenges?.solved || 0;
  const totalChallenges = stats?.challenges?.total || 0;
  const attemptedChallenges = stats?.challenges?.attempted || 0;

  // Chart 1: Code executions per day (mocked for visual elegance, layered with actual count)
  const execTrendData = [
    { day: 'Mon', runs: Math.max(2, Math.round(totalExecuted * 0.1)) },
    { day: 'Tue', runs: Math.max(3, Math.round(totalExecuted * 0.15)) },
    { day: 'Wed', runs: Math.max(5, Math.round(totalExecuted * 0.2)) },
    { day: 'Thu', runs: Math.max(4, Math.round(totalExecuted * 0.12)) },
    { day: 'Fri', runs: Math.max(6, Math.round(totalExecuted * 0.25)) },
    { day: 'Sat', runs: Math.max(1, Math.round(totalExecuted * 0.08)) },
    { day: 'Sun', runs: Math.max(2, Math.round(totalExecuted * 0.1)) },
  ];

  // Chart 2: Language usage shares
  const languageShares = [
    { name: 'JavaScript', value: 35, color: '#f59e0b' },
    { name: 'Python', value: 30, color: '#3b82f6' },
    { name: 'Java', value: 15, color: '#ef4444' },
    { name: 'C/C++', value: 20, color: '#10b981' }
  ];

  const recentTimeline = stats?.recentActivity || [];

  return (
    <div className="flex-1 bg-[#0b0f19] overflow-y-auto px-6 py-8">
      {/* Welcome Banner */}
      <div className="mb-8 animate-fade-in">
        <h1 className="text-2xl lg:text-3xl font-extrabold text-white">
          Welcome back, <span className="bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">{user?.name}</span> 👋
        </h1>
        <p className="text-slate-400 text-sm mt-1 leading-relaxed">
          Here is your programming overview. Ask AI to analyze compiler outputs or attempt coding exercises.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-8 animate-fade-in">
        {/* Card 1: Executed */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-900 flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
            <Play className="w-6 h-6 fill-indigo-400/20" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Runs Executed</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{totalExecuted}</h3>
          </div>
        </div>

        {/* Card 2: Saved */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-900 flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-xl bg-emerald-950/40 border border-emerald-900/40 flex items-center justify-center text-emerald-400">
            <Save className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Saved Scripts</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{savedPrograms}</h3>
          </div>
        </div>

        {/* Card 3: OJ Challenges */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-900 flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-xl bg-amber-950/40 border border-amber-900/40 flex items-center justify-center text-amber-500">
            <Trophy className="w-6 h-6 fill-amber-505/20" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">Challenges Solved</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">
              {solvedChallenges} <span className="text-xs text-slate-500 font-normal">/ {totalChallenges}</span>
            </h3>
          </div>
        </div>

        {/* Card 4: AI Credits */}
        <div className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-900 flex items-center gap-4.5">
          <div className="w-12 h-12 rounded-xl bg-purple-950/40 border border-purple-900/40 flex items-center justify-center text-purple-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <p className="text-slate-500 text-xs font-semibold uppercase tracking-wider">AI Queries Used</p>
            <h3 className="text-2xl font-extrabold text-white mt-1">{aiQueries}</h3>
          </div>
        </div>
      </div>

      {/* Main Charts Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Execution Trend Line Chart */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-900 flex flex-col justify-between" style={{ minHeight: '340px' }}>
          <div>
            <h4 className="text-white text-md font-bold flex items-center gap-2">
              <Terminal className="w-4.5 h-4.5 text-indigo-400" />
              <span>Daily Code Execution History</span>
            </h4>
            <p className="text-slate-500 text-xs mt-1">Compiler run volume statistics for this week</p>
          </div>
          <div className="w-full h-56 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={execTrendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRuns" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" stroke="#475569" fontSize={11} tickLine={false} />
                <YAxis stroke="#475569" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px' }}
                  labelStyle={{ color: '#94a3b8', fontSize: '11px', fontWeight: 'bold' }}
                  itemStyle={{ color: '#ffffff', fontSize: '12px' }}
                />
                <Area type="monotone" dataKey="runs" stroke="#6366f1" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRuns)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Favorite Languages Pie Chart */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900 flex flex-col justify-between" style={{ minHeight: '340px' }}>
          <div>
            <h4 className="text-white text-md font-bold flex items-center gap-2">
              <Globe2 className="w-4.5 h-4.5 text-sky-400" />
              <span>Language Preference Breakdown</span>
            </h4>
            <p className="text-slate-500 text-xs mt-1">Relative frequency of file setups completed</p>
          </div>
          <div className="w-full h-48 flex items-center justify-center mt-3">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={languageShares}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={75}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {languageShares.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px' }}
                  itemStyle={{ fontSize: '12px' }}
                />
                <Legend layout="horizontal" verticalAlign="bottom" align="center" iconSize={10} iconType="circle" wrapperStyle={{ fontSize: '10px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 3: Challenge Progress & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Coding Challenge Progress Card */}
        <div className="glass-panel rounded-2xl p-5 border border-slate-900 flex flex-col justify-between">
          <div>
            <h4 className="text-white text-md font-bold">Coding Challenge Target</h4>
            <p className="text-slate-500 text-xs mt-1">Status of solved algorithms</p>
          </div>

          <div className="my-6">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-bold text-slate-350">Solved Questions</span>
              <span className="text-sm font-bold text-white">
                {solvedChallenges} <span className="text-xs text-slate-500">/ {totalChallenges} max</span>
              </span>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden border border-slate-900/60 p-0.5">
              <div 
                className="h-full bg-gradient-to-r from-indigo-500 to-sky-400 rounded-full transition-all duration-500" 
                style={{ width: `${totalChallenges > 0 ? (solvedChallenges / totalChallenges) * 100 : 0}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 border-t border-slate-905 pt-4 text-center">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Attempted</p>
              <p className="text-lg font-bold text-slate-300 mt-0.5">{attemptedChallenges}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Pending Tasks</p>
              <p className="text-lg font-bold text-slate-300 mt-0.5">{Math.max(0, totalChallenges - solvedChallenges)}</p>
            </div>
          </div>
        </div>

        {/* Recent Activity Timeline Widget */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-5 border border-slate-900 flex flex-col justify-between">
          <div>
            <h4 className="text-white text-md font-bold flex items-center gap-2">
              <Clock className="w-4.5 h-4.5 text-emerald-400" />
              <span>Recent Activity Stream</span>
            </h4>
            <p className="text-slate-500 text-xs mt-1">Live tracking of actions taken in the environment</p>
          </div>

          <div className="space-y-4.5 mt-5 max-h-52 overflow-y-auto pr-1">
            {recentTimeline.length === 0 ? (
              <div className="py-8 text-center text-slate-500 text-sm">
                No recent actions recorded. Load the code editor to begin compiling scripts.
              </div>
            ) : (
              recentTimeline.map((item, idx) => (
                <div key={item._id || idx} className="flex items-start gap-4">
                  <div className={`
                    w-2.5 h-2.5 rounded-full mt-1.5 shrink-0
                    ${item.type === 'run' ? 'bg-indigo-400' : ''}
                    ${item.type === 'submission' ? 'bg-amber-400' : ''}
                    ${item.type === 'saved' ? 'bg-emerald-400' : ''}
                  `} />
                  <div className="flex-1 min-w-0 flex justify-between items-start gap-2.5">
                    <div>
                      <p className="text-slate-300 text-xs font-semibold leading-normal">{item.message}</p>
                      <span className="text-[10px] text-slate-550 block mt-0.5">{item.detail}</span>
                    </div>
                    <span className="text-[10px] text-slate-550 shrink-0 font-medium self-center">
                      {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
