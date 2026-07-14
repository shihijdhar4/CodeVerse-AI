import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, 
  PlusCircle, 
  Trash2, 
  BarChart4, 
  FileText, 
  CheckCircle2, 
  AlertTriangle,
  Bot, 
  Settings,
  Star,
  Check,
  X,
  Gauge
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

const AdminPanel = () => {
  const { token } = useApp();
  
  // Tabs: 'analytics', 'create-challenge', 'users', 'submissions'
  const [activeTab, setActiveTab] = useState('analytics');
  
  const [analytics, setAnalytics] = useState(null);
  const [userList, setUserList] = useState([]);
  const [submissionHistory, setSubmissionHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Challenge creation form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [constraints, setConstraints] = useState('');
  const [difficulty, setDifficulty] = useState('Easy');
  const [topic, setTopic] = useState('Arrays');
  const [testCases, setTestCases] = useState([
    { input: '', output: '', isSample: true }
  ]);
  const [formSuccess, setFormSuccess] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    loadAnalytics();
    loadUsers();
    loadSubmissions();
  }, [activeTab]);

  const loadAnalytics = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/analytics', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadUsers = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/auth/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUserList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubmissions = async () => {
    try {
      // Shared submissions from admin context
      const res = await fetch('http://localhost:5000/api/challenges/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissionHistory(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Delete user
  const handleDeleteUser = async (userId) => {
    if (!window.confirm("Are you sure you want to delete this user? This action is permanent!")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadUsers();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add test case inputs to form
  const addTestCase = () => {
    setTestCases(prev => [...prev, { input: '', output: '', isSample: false }]);
  };

  // Remove test case input from form
  const removeTestCase = (idx) => {
    if (testCases.length === 1) return;
    setTestCases(prev => prev.filter((_, i) => i !== idx));
  };

  const handleTestCaseChange = (idx, field, value) => {
    setTestCases(prev => prev.map((tc, i) => {
      if (i === idx) {
        return { ...tc, [field]: value };
      }
      return tc;
    }));
  };

  // Submit new OJ task challenge
  const handleCreateChallengeSubmit = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');

    // Check if test cases are filled
    const invalidTestCase = testCases.some(tc => !tc.input.trim() || !tc.output.trim());
    if (invalidTestCase) {
      setFormError('All test case input / output fields must be populated.');
      return;
    }

    try {
      const res = await fetch('http://localhost:5000/api/challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title,
          description,
          inputFormat,
          outputFormat,
          constraints,
          difficulty,
          topic,
          testCases
        })
      });
      const data = await res.json();
      if (res.ok) {
        setFormSuccess(`Challenge "${title}" published successfully!`);
        // Reset form fields
        setTitle('');
        setDescription('');
        setInputFormat('');
        setOutputFormat('');
        setConstraints('');
        setDifficulty('Easy');
        setTopic('Arrays');
        setTestCases([{ input: '', output: '', isSample: true }]);
      } else {
        setFormError(data.message || 'Failed to create challenge.');
      }
    } catch (err) {
      setFormError(`Request failed: ${err.message}`);
    }
  };

  if (loading && !analytics) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-505 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Compiling operations console...</p>
        </div>
      </div>
    );
  }

  // Formatting chart values
  const challengeChart = [
    { name: 'Easy', count: analytics?.challengesByDifficulty?.easy || 0, color: '#10b981' },
    { name: 'Medium', count: analytics?.challengesByDifficulty?.medium || 0, color: '#f59e0b' },
    { name: 'Hard', count: analytics?.challengesByDifficulty?.hard || 0, color: '#ef4444' },
  ];

  return (
    <div className="flex-1 bg-[#0b0f19] overflow-y-auto p-6 lg:p-8 animate-fade-in text-xs lg:text-sm">
      
      {/* Admin header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5 mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white flex items-center gap-2">
            <Gauge className="w-7 h-7 text-indigo-400" />
            <span>Admin Control Panel</span>
          </h1>
          <p className="text-slate-500 text-xs mt-1">Platform analytics, algorithmic catalogs, and registration management</p>
        </div>

        {/* Tab Selection */}
        <div className="flex gap-2">
          {/* Analytics */}
          <button
            onClick={() => setActiveTab('analytics')}
            className={`
              px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition
              ${activeTab === 'analytics' 
                ? 'bg-indigo-650 text-white' 
                : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'}
            `}
          >
            <BarChart4 className="w-4 h-4" />
            <span>Platform Stats</span>
          </button>
          
          {/* Create challenge */}
          <button
            onClick={() => setActiveTab('create-challenge')}
            className={`
              px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition
              ${activeTab === 'create-challenge' 
                ? 'bg-indigo-650 text-white' 
                : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'}
            `}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Compose Challenge</span>
          </button>

          {/* User management */}
          <button
            onClick={() => setActiveTab('users')}
            className={`
              px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition
              ${activeTab === 'users' 
                ? 'bg-indigo-650 text-white' 
                : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'}
            `}
          >
            <Users className="w-4 h-4" />
            <span>Manage Users</span>
          </button>

          {/* Submissions */}
          <button
            onClick={() => setActiveTab('submissions')}
            className={`
              px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition
              ${activeTab === 'submissions' 
                ? 'bg-indigo-650 text-white' 
                : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'}
            `}
          >
            <FileText className="w-4 h-4" />
            <span>OJ Submissions</span>
          </button>
        </div>
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* TAB A: Admin analytics */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 max-w-5xl">
          {/* Numeric Counters */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 lg:gap-5">
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4.5 text-center">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Total Students</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{analytics?.totals?.users || 0}</h3>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4.5 text-center">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Saved Scripts</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{analytics?.totals?.programs || 0}</h3>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4.5 text-center">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">Sandbox Runs</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{analytics?.totals?.runs || 0}</h3>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4.5 text-center">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">OJ Solutions</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{analytics?.totals?.submissions || 0}</h3>
            </div>
            <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-4.5 text-center col-span-2 lg:col-span-1">
              <span className="text-slate-500 font-bold uppercase text-[10px] tracking-wider block">AI History Hits</span>
              <h3 className="text-2xl font-extrabold text-white mt-1.5">{analytics?.totals?.aiQueries || 0}</h3>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Visual challenge levels distributions */}
            <div className="glass-panel border-r border-[#1e293b] p-5 rounded-2xl border flex flex-col justify-between" style={{ minHeight: '290px' }}>
              <div>
                <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">Challenge Difficulties Distribution</h4>
                <span className="text-slate-500 text-[10px] block">Relative numbers of compiled exercises</span>
              </div>
              <div className="w-full h-44 mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={challengeChart} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <XAxis dataKey="name" stroke="#475569" fontSize={11} tickLine={false} />
                    <YAxis stroke="#475569" fontSize={11} tickLine={false} allowDecimals={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '10px' }}
                      itemStyle={{ color: '#ffffff', fontSize: '12px' }}
                    />
                    <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                      {challengeChart.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Language frequency list */}
            <div className="glass-panel p-5 rounded-2xl border flex flex-col justify-between" style={{ minHeight: '290px' }}>
              <div>
                <h4 className="text-white text-xs font-extrabold uppercase tracking-wider mb-1">Compiler runtimes executed</h4>
                <span className="text-slate-500 text-[10px] block">Trace logs of runs per compiler environment</span>
              </div>
              <div className="space-y-3 mt-5">
                {Object.keys(analytics?.languageStats || {}).length === 0 ? (
                  <div className="text-center text-slate-500 italic py-10">No editor traces found.</div>
                ) : (
                  Object.keys(analytics.languageStats).map((lang) => {
                    const count = analytics.languageStats[lang];
                    return (
                      <div key={lang} className="flex justify-between items-center text-xs border-b border-slate-905 pb-2">
                        <span className="text-slate-350 font-bold uppercase">{lang}</span>
                        <span className="px-3 py-1 bg-slate-950 border border-slate-900 font-extrabold text-white rounded-lg">
                          {count} executions
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB B: Challenge Constructor Form */}
      {activeTab === 'create-challenge' && (
        <form onSubmit={handleCreateChallengeSubmit} className="glass-panel rounded-2xl p-6 border border-slate-900 max-w-4xl space-y-5 shadow-xl select-text">
          <h3 className="text-white font-bold text-sm tracking-wide border-b border-slate-905 pb-3">
            Author Coding Challenge
          </h3>

          {formSuccess && (
            <div className="flex items-center gap-2.5 p-3.5 bg-emerald-950/20 border border-emerald-900/60 rounded-xl text-emerald-350">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <span>{formSuccess}</span>
            </div>
          )}

          {formError && (
            <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/20 border border-rose-900/60 rounded-xl text-rose-350">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Title */}
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold block">Challenge Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. FizzBuzz Ultimate"
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-650 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none transition leading-normal font-semibold"
              />
            </div>

            {/* Topic dropdown */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold block">Category Topic</label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2 px-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-650 font-bold"
              >
                <option value="Arrays">Arrays</option>
                <option value="Strings">Strings</option>
                <option value="Trees">Trees</option>
                <option value="Graphs">Graphs</option>
                <option value="DP">DP (Dynamic Programming)</option>
                <option value="SQL">SQL</option>
              </select>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-slate-400 text-xs font-semibold block">Problem Description & Instructions</label>
            <textarea
              required
              rows="3"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Outline problem requirements..."
              className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-650 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none transition"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Input Format */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold block">Input Format</label>
              <textarea
                rows="2"
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                placeholder="e.g. Space-separated integers..."
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-650 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none transition"
              />
            </div>

            {/* Output Format */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold block">Expected Output Format</label>
              <textarea
                rows="2"
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                placeholder="e.g. A single integer sum..."
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-650 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none transition"
              />
            </div>

            {/* Constraints */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold block">Execution Constraints</label>
              <textarea
                rows="2"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                placeholder="e.g. N <= 1000, 1 sec runtime..."
                className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-650 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none transition"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-3 border-t border-slate-905">
            {/* Difficulty */}
            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold block">Difficulty Segment</label>
              <div className="grid grid-cols-3 gap-3">
                {['Easy', 'Medium', 'Hard'].map((diff) => (
                  <button
                    key={diff}
                    type="button"
                    onClick={() => setDifficulty(diff)}
                    className={`
                      py-2 rounded-xl text-xs font-semibold border transition
                      ${difficulty === diff 
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-950/20 border-slate-900 text-slate-500 hover:text-slate-300'}
                    `}
                  >
                    {diff}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Test cases authoring block */}
          <div className="space-y-4 border-t border-slate-905 pt-5">
            <div className="flex justify-between items-center">
              <h4 className="text-white text-xs font-bold uppercase tracking-wider">Test Case Configurations</h4>
              <button
                type="button"
                onClick={addTestCase}
                className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-[10px] font-bold text-slate-450 hover:text-indigo-400 rounded-lg transition"
              >
                + Add Testcase
              </button>
            </div>

            {testCases.map((tc, idx) => (
              <div key={idx} className="p-4 bg-slate-950/30 border border-slate-905 rounded-xl space-y-3 relative">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-[10px] text-slate-500 font-bold uppercase">Test Case #{idx + 1}</span>
                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-1.5 text-[10px] text-slate-500 font-bold uppercase cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={tc.isSample}
                        onChange={(e) => handleTestCaseChange(idx, 'isSample', e.target.checked)}
                        className="rounded bg-slate-950 border-slate-900 text-indigo-600 focus:ring-0 focus:ring-offset-0"
                      />
                      <span>Public Sample Case</span>
                    </label>
                    {testCases.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeTestCase(idx)}
                        className="p-1 text-slate-600 hover:text-rose-455 transition"
                      >
                        <Trash2 className="w-4.5 h-4.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  <div>
                    <label className="text-slate-655 text-[10px] font-bold uppercase mb-1 block">TestCase Input</label>
                    <textarea
                      required
                      rows="2"
                      value={tc.input}
                      onChange={(e) => handleTestCaseChange(idx, 'input', e.target.value)}
                      placeholder="e.g. 5\n1 2 3"
                      className="w-full bg-slate-950 border border-slate-900 focus:border-indigo-650 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-655 text-[10px] font-bold uppercase mb-1 block">Expected Output</label>
                    <textarea
                      required
                      rows="2"
                      value={tc.output}
                      onChange={(e) => handleTestCaseChange(idx, 'output', e.target.value)}
                      placeholder="e.g. 6"
                      className="w-full bg-slate-950 border border-slate-905 focus:border-indigo-650 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-700 focus:outline-none font-mono"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            type="submit"
            className="w-full py-2.5 mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-xs font-bold transition shadow-lg cursor-pointer"
          >
            Publish Coding Problem
          </button>
        </form>
      )}

      {/* TAB C: Users administration list */}
      {activeTab === 'users' && (
        <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden max-w-4xl shadow-xl select-text">
          <div className="p-5 bg-slate-950/40 border-b border-slate-900 flex justify-between items-center select-none">
            <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-4.5 h-4.5 text-indigo-400" />
              <span>Registered Accounts List</span>
            </h3>
            <span className="px-2 py-0.5 bg-slate-950 border border-slate-900 font-extrabold text-[10px] text-indigo-305 rounded-full uppercase">
              {userList.length} total users
            </span>
          </div>

          <div className="divide-y divide-slate-905 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#070b13] text-slate-500 uppercase font-bold text-[10px] tracking-wider select-none">
                <tr>
                  <th className="py-3.5 px-6">Account Profile</th>
                  <th className="py-3.5 px-6">Email Address</th>
                  <th className="py-3.5 px-6">Permissions Role</th>
                  <th className="py-3.5 px-6 text-center w-24">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-900 text-slate-300 font-medium">
                {userList.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-8 text-center text-slate-550 italic">No registrations audited.</td>
                  </tr>
                ) : (
                  userList.map((usr) => (
                    <tr key={usr._id} className="hover:bg-slate-950/30 transition">
                      <td className="py-4 px-6 font-bold text-white capitalize">{usr.name}</td>
                      <td className="py-4 px-6 select-all">{usr.email}</td>
                      <td className="py-4 px-6">
                        <span className={`
                          text-[9px] font-extrabold tracking-wider px-2 py-0.5 rounded-full uppercase
                          ${usr.role === 'admin' ? 'bg-pink-955/20 text-pink-400 border border-pink-900/40' : 'bg-slate-800 text-slate-400'}
                        `}>
                          {usr.role}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center select-none">
                        {usr.email !== 'admin@codeverse.com' ? (
                          <button
                            onClick={() => handleDeleteUser(usr._id)}
                            className="p-1.5 text-slate-500 hover:text-rose-455 hover:bg-slate-950 rounded-lg transition"
                          >
                            <Trash2 className="w-4.5 h-4.5" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-655 italic">Owner Lock</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB D: OJ Submissions monitor */}
      {activeTab === 'submissions' && (
        <div className="max-w-4xl space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          {submissionHistory.length === 0 ? (
            <div className="glass-panel py-14 text-center text-slate-505 border border-slate-900 font-medium">
              No submissions tracked. Instruct students to submit solutions.
            </div>
          ) : (
            submissionHistory.map((sub) => (
              <div 
                key={sub._id} 
                className="glass-panel rounded-2xl p-5 border border-slate-900 flex justify-between items-center sm:flex-row flex-col gap-4 select-text"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    <span className="font-bold text-indigo-400 select-all capitalize">{sub.creatorName || 'Student solver'}</span>
                    <span className="text-slate-600 block text-xs">solved</span>
                    <h4 className="text-white font-extrabold text-sm leading-normal">{sub.challengeTitle}</h4>
                    <span className="text-[10px] text-slate-550 font-bold px-2 py-0.5 bg-slate-955 border border-slate-900 rounded uppercase">{sub.language}</span>
                  </div>
                  <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                    Mod Date: {new Date(sub.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-5 shrink-0 select-none">
                  <div className="text-right hidden sm:block">
                    <span className="text-[10px] text-slate-550 block font-bold uppercase">Time / Memory</span>
                    <span className="text-xs text-slate-350 mt-1 block">
                      {sub.executionTime} ms / {sub.memoryUsage} KB
                    </span>
                  </div>

                  <div className="text-right flex flex-col items-end">
                    <span className={`
                      text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full uppercase
                      ${sub.status === 'Accepted' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : 'bg-rose-955/20 text-rose-350 border border-rose-900/60'}
                    `}>
                      {sub.status === 'Accepted' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" />
                      ) : (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-350" />
                      )}
                      <span>{sub.status}</span>
                    </span>
                    <span className="text-[10px] font-bold text-slate-500 mt-1.5 block pr-1">Grade: {sub.score}/100</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}

    </div>
  );
};

export default AdminPanel;
