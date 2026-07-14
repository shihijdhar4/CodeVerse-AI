import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Trophy, 
  Terminal, 
  ChevronLeft, 
  Cpu, 
  Filter, 
  ListTodo, 
  History, 
  Flame, 
  CheckCircle2, 
  XSquare, 
  AlertCircle,
  Play,
  Send
} from 'lucide-react';

const LANGUAGE_STUBS = {
  javascript: `// Write your solution here\n\nfunction solve(input) {\n    // process input...\n    return 0;\n}`,
  python: `# Write your solution here\n\ndef solve(input):\n    # process input...\n    pass\n`,
  java: `// Write your solution here\nimport java.util.Scanner;\n\npublic class Solution {\n    public static void main(String[] args) {\n        Scanner sc = new Scanner(System.in);\n        if (sc.hasNextLine()) {\n            String s = sc.nextLine();\n            System.out.println(s);\n        }\n    }\n}`,
  c: `// Write your solution here\n#include <stdio.h>\n\nint main() {\n    char buffer[100];\n    if (fgets(buffer, sizeof(buffer), stdin)) {\n        printf("%s", buffer);\n    }\n    return 0;\n}`,
  cpp: `// Write your solution here\n#include <iostream>\n#include <string>\nusing namespace std;\n\nint main() {\n    string s;\n    if (getline(cin, s)) {\n        cout << s << endl;\n    }\n    return 0;\n}`
};

const Challenges = () => {
  const { token, fetchDashboardStats } = useApp();
  
  // Tabs: 'list', 'leaderboard', 'my-subs'
  const [activeSubTab, setActiveSubTab] = useState('list');
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Selected challenge
  const [selectedChallengeId, setSelectedChallengeId] = useState(null);
  const [challengeDetails, setChallengeDetails] = useState(null);

  // Filters
  const [topicFilter, setTopicFilter] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState('');

  // Submit code workspace variables
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('javascript');
  const [compilerOut, setCompilerOut] = useState('');
  const [compilerErr, setCompilerErr] = useState('');
  const [isOJRunning, setIsOJRunning] = useState(false);
  const [ojVerdict, setOjVerdict] = useState(null); // { status, score, testCasesPassed, testCasesTotal, errorFeedback, casesFeedback }

  // Supplemental lists
  const [leaderboard, setLeaderboard] = useState([]);
  const [submissionsList, setSubmissionsList] = useState([]);

  useEffect(() => {
    loadChallenges();
    loadLeaderboard();
    loadSubmissions();
  }, []);

  const loadChallenges = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/challenges', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChallenges(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/challenges/leaderboard', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLeaderboard(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const loadSubmissions = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/challenges/submissions', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSubmissionsList(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const openChallenge = async (challengeId) => {
    setLoading(true);
    setOjVerdict(null);
    setCompilerOut('');
    setCompilerErr('');
    try {
      const res = await fetch(`http://localhost:5000/api/challenges/${challengeId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setChallengeDetails(data);
        setSelectedChallengeId(challengeId);
        setCode(LANGUAGE_STUBS[lang]);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLangChange = (selectedLang) => {
    setLang(selectedLang);
    setCode(LANGUAGE_STUBS[selectedLang]);
  };

  // Submit challenge resolution to remote compile & evaluate
  const handleSubmitCode = async (submitOverride = false) => {
    setIsOJRunning(true);
    setCompilerOut('');
    setCompilerErr('');
    setOjVerdict(null);

    // Call submit endpoint
    try {
      const res = await fetch(`http://localhost:5000/api/challenges/${selectedChallengeId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, language: lang })
      });
      const data = await res.json();
      setIsOJRunning(false);

      if (res.ok) {
        setOjVerdict(data);
        if (data.status === 'Accepted') {
          setCompilerOut(`✔ Test cases completed successfully. Correct answer!`);
        } else {
          setCompilerErr(`✘ Verdict: ${data.status}\nPassed: ${data.testCasesPassed}/${data.testCasesTotal}\n\nFeedback:\n${data.errorFeedback || ''}`);
        }
        
        // Refresh supplemental lists and dashboard metrics
        loadLeaderboard();
        loadSubmissions();
        fetchDashboardStats();
      } else {
        setCompilerErr(data.message || 'Submission runtime error.');
      }
    } catch (err) {
      setIsOJRunning(false);
      setCompilerErr(`OJ Request failed: ${err.message}`);
    }
  };

  const filteredChallenges = challenges.filter(c => {
    if (topicFilter && c.topic !== topicFilter) return false;
    if (difficultyFilter && c.difficulty !== difficultyFilter) return false;
    return true;
  });

  if (loading && !selectedChallengeId) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0b0f19]">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-indigo-505 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Compiling OJ challenges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 bg-[#0b0f19] flex flex-col h-screen overflow-hidden animate-fade-in text-xs lg:text-sm">
      
      {/* 1. SOLVER SCREEN STATE: Split screen Leetcode workspace */}
      {selectedChallengeId && challengeDetails ? (
        <div className="flex-1 flex flex-col h-full overflow-hidden">
          {/* Solver navigation bar */}
          <div className="flex items-center justify-between px-6 py-3 border-b border-slate-950/70 bg-[#080c14] h-14 shrink-0">
            <button 
              onClick={() => { setSelectedChallengeId(null); loadChallenges(); }}
              className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition cursor-pointer font-bold"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Algorithm Board</span>
            </button>
            <h2 className="font-extrabold text-white text-md tracking-wide">
              {challengeDetails.title}
            </h2>
            <div className="flex items-center gap-2">
              <span className={`
                text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full uppercase
                ${challengeDetails.difficulty === 'Easy' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : ''}
                ${challengeDetails.difficulty === 'Medium' ? 'bg-amber-955/20 text-amber-500 border border-amber-900/40' : ''}
                ${challengeDetails.difficulty === 'Hard' ? 'bg-rose-955/20 text-rose-455 border border-rose-900/50' : ''}
              `}>
                {challengeDetails.difficulty}
              </span>
            </div>
          </div>

          {/* Core double split column workspace */}
          <div className="flex-grow flex flex-col lg:flex-row overflow-hidden">
            
            {/* Split A: Challenge description side panel */}
            <div className="w-full lg:w-[45%] h-[50%] lg:h-full border-b lg:border-b-0 lg:border-r border-slate-900 flex flex-col overflow-hidden bg-[#0d121f]">
              <div className="flex-grow overflow-y-auto p-6 space-y-5 select-text">
                
                {/* Description */}
                <div>
                  <h3 className="text-white text-md font-bold mb-2">Description Instructions</h3>
                  <p className="text-slate-350 leading-relaxed font-medium whitespace-pre-wrap">{challengeDetails.description}</p>
                </div>

                {/* Input description formats */}
                {challengeDetails.inputFormat && (
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-900 leading-relaxed">
                    <h4 className="text-indigo-400 text-xs font-bold uppercase tracking-wider mb-1.5">Input Format parameters</h4>
                    <pre className="text-slate-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{challengeDetails.inputFormat}</pre>
                  </div>
                )}

                {challengeDetails.outputFormat && (
                  <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-900 leading-relaxed">
                    <h4 className="text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1.5">Expected Output Format</h4>
                    <pre className="text-slate-400 font-mono text-[11px] whitespace-pre-wrap leading-relaxed">{challengeDetails.outputFormat}</pre>
                  </div>
                )}

                {challengeDetails.constraints && (
                  <div>
                    <h4 className="text-white text-xs font-bold mb-1.5">Algorithmic Constraints</h4>
                    <pre className="text-slate-500 font-mono text-xs whitespace-pre-wrap leading-relaxed">{challengeDetails.constraints}</pre>
                  </div>
                )}

                {/* Sample Test Case references */}
                {challengeDetails.sampleTestCases && challengeDetails.sampleTestCases.map((tc, idx) => (
                  <div key={idx} className="space-y-2 border-t border-slate-900 pt-4">
                    <h4 className="text-amber-500 text-xs font-bold">Example Test Case {idx + 1}</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-900">
                        <span className="text-[10px] text-slate-550 block font-bold uppercase mb-1">Input Sample</span>
                        <pre className="font-mono text-[11px] text-slate-300 whitespace-pre">{tc.input}</pre>
                      </div>
                      <div className="p-2.5 bg-slate-950/80 rounded-lg border border-slate-900">
                        <span className="text-[10px] text-slate-550 block font-bold uppercase mb-1">Output Sample</span>
                        <pre className="font-mono text-[11px] text-slate-300 whitespace-pre">{tc.output}</pre>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Split B: Online compiler solver side panel */}
            <div className="flex-1 flex flex-col h-[50%] lg:h-full bg-[#0a0d16]">
              {/* Compiler subheader settings */}
              <div className="flex justify-between items-center px-4 py-2 bg-[#080a11] border-b border-slate-950/85">
                <select 
                  value={lang} 
                  onChange={(e) => handleLangChange(e.target.value)}
                  className="bg-slate-950 border border-slate-900 rounded-lg text-xs py-1.5 px-3 text-slate-300 focus:outline-none focus:border-indigo-500"
                >
                  <option value="javascript">JavaScript (Node.js)</option>
                  <option value="python">Python 3</option>
                  <option value="java">Java 13</option>
                  <option value="c">C (GCC)</option>
                  <option value="cpp">C++ (G++)</option>
                </select>

                <div className="flex gap-3">
                  <button
                    onClick={() => handleSubmitCode(false)}
                    disabled={isOJRunning}
                    className="flex items-center gap-1 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white py-1.5 px-4.5 rounded-lg text-xs font-bold transition shadow-lg shadow-indigo-950/20 cursor-pointer disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5 fill-white/10" />
                    <span>{isOJRunning ? 'Grading...' : 'Submit Resolution'}</span>
                  </button>
                </div>
              </div>

              {/* Textarea compiler input canvas */}
              <div className="flex-grow bg-[#090b12] flex overflow-hidden border-b border-slate-950/70">
                <textarea
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="// Code solver canvas"
                  className="flex-grow p-4 resize-none focus:outline-none font-mono focus:ring-0 leading-relaxed text-xs text-slate-300 border-none bg-transparent overflow-y-auto whitespace-pre"
                />
              </div>

              {/* Console logs output */}
              <div className="h-44 bg-[#06080e] flex flex-col justify-between shrink-0">
                <div className="flex justify-between items-center py-1.5 px-4 bg-slate-955 border-b border-slate-950/70">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
                    <Terminal className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Grading Verdict Console</span>
                  </span>
                  
                  {ojVerdict && (
                    <div className="text-[10px] flex items-center gap-3">
                      <span className="text-slate-500 font-medium">Cases passed: <strong className="text-white">{ojVerdict.testCasesPassed} / {ojVerdict.testCasesTotal}</strong></span>
                      <span className="text-slate-505 font-medium">Average Time: <strong className="text-white">{ojVerdict.executionTime} ms</strong></span>
                    </div>
                  )}
                </div>

                <div className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed select-text select-all">
                  {compilerErr ? (
                    <div className="text-rose-400">
                      <pre className="font-mono whitespace-pre-wrap">{compilerErr}</pre>
                    </div>
                  ) : compilerOut ? (
                    <div className="text-emerald-450">
                      <pre className="font-mono whitespace-pre-wrap">{compilerOut}</pre>
                    </div>
                  ) : (
                    <span className="text-slate-600 italic">Click Submit to compiling and verify code correctness onhidden test case configurations.</span>
                  )}
                </div>
              </div>

            </div>

          </div>
        </div>
      ) : (
        /* 2. DIRECTORIES SCREEN STATE: Challanges list, scoreboard, submissions */
        <div className="flex-grow overflow-y-auto p-6 lg:p-8">
          
          <div className="flex justify-between items-center border-b border-slate-900 pb-5 mb-6 flex-wrap gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-extrabold text-white">Coding Challenges</h1>
              <p className="text-slate-500 text-xs mt-1">Develop technical proficiency solving algorithmic exercises</p>
            </div>
            
            {/* Filter buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setActiveSubTab('list')}
                className={`
                  px-4 py-2 rounded-xl text-xs font-semibold transition
                  ${activeSubTab === 'list' 
                    ? 'bg-indigo-650 text-white' 
                    : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'}
                `}
              >
                Challenges Directory
              </button>
              <button
                onClick={() => { setActiveSubTab('leaderboard'); loadLeaderboard(); }}
                className={`
                  px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition
                  ${activeSubTab === 'leaderboard' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'}
                `}
              >
                <Trophy className="w-3.5 h-3.5 fill-black/10" />
                <span>Global Scoreboard</span>
              </button>
              <button
                onClick={() => { setActiveSubTab('my-subs'); loadSubmissions(); }}
                className={`
                  px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition
                  ${activeSubTab === 'my-subs' 
                    ? 'bg-indigo-655 text-white' 
                    : 'bg-slate-950 border border-slate-900 text-slate-400 hover:text-white'}
                `}
              >
                <History className="w-3.5 h-3.5" />
                <span>My Solutions</span>
              </button>
            </div>
          </div>

          {/* Sub tab contents rendering */}
          {activeSubTab === 'list' && (
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              
              {/* Left sidebar filters list */}
              <div className="space-y-5">
                {/* Topic selector list */}
                <div className="glass-panel rounded-2xl p-4.5 border border-slate-900">
                  <h3 className="text-white text-xs font-bold mb-3 flex items-center gap-2">
                    <Filter className="w-4 h-4 text-indigo-400" />
                    <span>Filter by Topic</span>
                  </h3>
                  <div className="space-y-1.5">
                    {['', 'Arrays', 'Strings', 'Trees', 'Graphs', 'DP', 'SQL'].map((topic) => (
                      <button
                        key={topic}
                        onClick={() => setTopicFilter(topic)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-xs leading-normal font-medium transition
                          ${(topicFilter === topic) 
                            ? 'bg-indigo-950/40 text-indigo-305 border-l-2 border-indigo-500 pl-2.5' 
                            : 'text-slate-450 hover:bg-slate-950 hover:text-slate-205'}
                        `}
                      >
                        {topic === '' ? 'All Topics' : topic}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Difficulty Filter */}
                <div className="glass-panel rounded-2xl p-4.5 border border-slate-900">
                  <h3 className="text-white text-xs font-bold mb-3 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500 animate-pulse" />
                    <span>Filter by Difficulty</span>
                  </h3>
                  <div className="space-y-1.5">
                    {['', 'Easy', 'Medium', 'Hard'].map((diff) => (
                      <button
                        key={diff}
                        onClick={() => setDifficultyFilter(diff)}
                        className={`
                          w-full text-left px-3 py-2 rounded-lg text-xs leading-normal font-medium transition
                          ${(difficultyFilter === diff) 
                            ? 'bg-amber-955/20 text-amber-505 border-l-2 border-amber-500 pl-2.5' 
                            : 'text-slate-450 hover:bg-slate-955 hover:text-slate-205'}
                        `}
                      >
                        {diff === '' ? 'All Difficulties' : diff}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right lists table grid */}
              <div className="lg:col-span-3 space-y-4">
                {filteredChallenges.length === 0 ? (
                  <div className="glass-panel rounded-2xl py-14 text-center border-slate-900 border text-slate-500 text-sm">
                    <ListTodo className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                    <span>No challenges match selected filters.</span>
                  </div>
                ) : (
                  filteredChallenges.map((ch) => (
                    <div 
                      key={ch._id}
                      onClick={() => openChallenge(ch._id)}
                      className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-900 flex justify-between items-center cursor-pointer select-none"
                    >
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center gap-2">
                          <h3 className="text-[14px] font-bold text-white leading-normal truncate">{ch.title}</h3>
                          <span className="text-[10px] text-slate-400 font-medium px-2 py-0.5 bg-slate-950 border border-slate-900 rounded">{ch.topic}</span>
                        </div>
                        <p className="text-slate-500 text-xs mt-1.5 line-clamp-1 leading-normal font-medium">{ch.description}</p>
                      </div>

                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`
                          text-[10px] font-extrabold tracking-wider px-2.5 py-0.5 rounded-full uppercase
                          ${ch.difficulty === 'Easy' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : ''}
                          ${ch.difficulty === 'Medium' ? 'bg-amber-955/20 text-amber-500 border border-amber-900/40' : ''}
                          ${ch.difficulty === 'Hard' ? 'bg-rose-955/20 text-rose-455 border border-rose-900/50' : ''}
                        `}>
                          {ch.difficulty}
                        </span>

                        <span className="text-[11px] text-slate-550 mr-2 font-medium">Testcases: {ch.testCasesCount}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* Sub tab contents: Leaderboard list */}
          {activeSubTab === 'leaderboard' && (
            <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden max-w-4xl mx-auto shadow-2xl">
              <div className="p-5 bg-slate-950/40 border-b border-slate-900 flex items-center justify-between">
                <h3 className="text-white text-md font-bold flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-550 fill-amber-505/10 animate-bounce" />
                  <span>Global Programmer Leaderboard</span>
                </h3>
                <span className="text-slate-400 text-xs font-semibold">Updated realtime</span>
              </div>

              <div className="divide-y divide-slate-905 overflow-x-auto">
                <table className="w-full text-left text-xs leading-normal">
                  <thead className="bg-[#070b13] text-slate-500 uppercase font-bold text-[10px] tracking-wider select-none">
                    <tr>
                      <th className="py-3 px-6 text-center w-16">Rank</th>
                      <th className="py-3 px-6">Name</th>
                      <th className="py-3 px-6 text-center">Trophies Solved</th>
                      <th className="py-3 px-6 text-right pr-8">Total Score Points</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-900 text-slate-300 font-medium">
                    {leaderboard.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="py-10 text-center text-slate-550 italic">No rankings registered in this window.</td>
                      </tr>
                    ) : (
                      leaderboard.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-950/30 transition">
                          <td className="py-4 px-6 text-center text-sm font-extrabold text-indigo-400 select-none">
                            #{idx + 1}
                          </td>
                          <td className="py-4 px-6">
                            <div>
                              <p className="text-white font-bold">{item.name}</p>
                              <span className="text-[10px] text-slate-550 font-normal">{item.email}</span>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-center font-bold text-slate-200">
                            {item.challengesSolved}
                          </td>
                          <td className="py-4 px-6 text-right pr-8 font-extrabold text-emerald-450">
                            {item.score} pts
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Sub tab contents: Solved tries list */}
          {activeSubTab === 'my-subs' && (
            <div className="max-w-5xl mx-auto space-y-4">
              {submissionsList.length === 0 ? (
                <div className="glass-panel rounded-2xl py-14 border border-slate-900 text-center text-slate-505 font-medium">
                  <History className="w-8 h-8 text-slate-655 mx-auto mb-2" />
                  <span>No submissions attempted yet. Open an algorithm to compile code.</span>
                </div>
              ) : (
                submissionsList.map((sub) => (
                  <div 
                    key={sub._id} 
                    className="glass-panel rounded-2xl p-5 border border-slate-900 flex justify-between items-center"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <h4 className="text-white font-bold text-sm leading-normal">{sub.challengeTitle}</h4>
                        <span className="text-[10px] text-slate-550 font-medium px-2 py-0.5 bg-slate-950 border border-slate-900 rounded">{sub.language}</span>
                      </div>
                      <span className="text-[10px] text-slate-500 font-semibold block uppercase">
                        {new Date(sub.createdAt).toLocaleDateString()} - {new Date(sub.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-right">
                        <span className="text-[10px] text-slate-550 block font-bold uppercase">Time / Memory</span>
                        <span className="text-xs text-slate-350 font-medium mt-1 block">
                          {sub.executionTime} ms / {sub.memoryUsage} KB
                        </span>
                      </div>

                      <div className="flex flex-col items-end">
                        <span className={`
                          text-xs font-bold flex items-center gap-1.5 px-3 py-1 rounded-full uppercase
                          ${sub.status === 'Accepted' ? 'bg-emerald-950/40 text-emerald-450 border border-emerald-900/40' : 'bg-rose-955/20 text-rose-350 border border-rose-900/60'}
                        `}>
                          {sub.status === 'Accepted' ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-450" />
                          ) : (
                            <XSquare className="w-3.5 h-3.5 text-rose-350" />
                          )}
                          <span>{sub.status}</span>
                        </span>
                        
                        <span className="text-[10px] text-slate-550 block mt-1.5 font-bold mr-1">
                          Grade score: {sub.score}/100
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>
      )}

    </div>
  );
};

export default Challenges;
