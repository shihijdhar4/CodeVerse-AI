import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Play, 
  Save, 
  Sparkles, 
  Settings, 
  Bot, 
  Trash2, 
  Plus, 
  X, 
  Code2, 
  FileCode,
  Maximize2,
  Terminal,
  Sun,
  Moon,
  AlertTriangle,
  Lightbulb,
  Check,
  Send,
  HelpCircle,
  Copy,
  Download
} from 'lucide-react';

const DEFAULT_CODE = {
  javascript: `// CodeVerse AI - Javascript Sandbox\nconsole.log("Hello, developers!");\n\nfunction add(a, b) {\n    return a + b;\n}\nconsole.log("Sum result: " + add(15, 27));`,
  python: `# CodeVerse AI - Python Sandbox\nprint("Hello, Pythonistas!")\n\ndef greet(name):\n    return f"Welcome, {name}!"\n\nprint(greet("Developer"))`,
  java: `// CodeVerse AI - Java Sandbox\npublic class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n        int sum = 0;\n        for (int i = 1; i <= 10; i++) {\n            sum += i;\n        }\n        System.out.println("Sum of 1-10: " + sum);\n    }\n}`,
  c: `// CodeVerse AI - C Sandbox\n#include <stdio.h>\n\nint main() {\n    printf("Hello from C compilation!\\n");\n    int val = 100;\n    printf("Value: %d\\n", val);\n    return 0;\n}`,
  cpp: `// CodeVerse AI - C++ Sandbox\n#include <iostream>\nusing namespace std;\n\nint main() {\n    cout << "Hello from C++!" << endl;\n    return 0;\n}`
};

const Editor = ({ loadedProgram, clearLoadedProgram }) => {
  const { token, fetchDashboardStats } = useApp();

  // Multi-tab files state
  const [tabs, setTabs] = useState([
    { id: '1', title: 'main.js', language: 'javascript', code: DEFAULT_CODE.javascript }
  ]);
  const [activeTabId, setActiveTabId] = useState('1');

  // Load custom workspace program if requested from History page
  useEffect(() => {
    if (loadedProgram) {
      const existingTab = tabs.find(t => t.programId === loadedProgram._id);
      if (existingTab) {
        setActiveTabId(existingTab.id);
      } else {
        const newId = Math.random().toString(36).substring(7);
        const newTab = {
          id: newId,
          title: loadedProgram.title,
          language: loadedProgram.language,
          code: loadedProgram.code,
          programId: loadedProgram._id
        };
        setTabs(prev => [...prev, newTab]);
        setActiveTabId(newId);
      }
      if (clearLoadedProgram) clearLoadedProgram();
    }
  }, [loadedProgram]);

  // IDE Configs
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fontSize, setFontSize] = useState(14);
  const [isAutoSave, setIsAutoSave] = useState(true);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  // Console Outputs
  const [consoleOutput, setConsoleOutput] = useState('');
  const [consoleError, setConsoleError] = useState('');
  const [runTime, setRunTime] = useState(0);
  const [runMemory, setRunMemory] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  // Right-hand AI Panel Tabs
  const [aiActiveTab, setAiActiveTab] = useState('chat'); // 'chat', 'review', 'explain'
  
  // AI Chat
  const [chatMessages, setChatMessages] = useState([
    { sender: 'ai', text: 'Hello! I am your CodeVerse coding assistant. How can I help you write, review, or debug your script today?' }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [aiLoading, setAiLoading] = useState(false);

  // AI Review
  const [reviewResult, setReviewResult] = useState('');
  const [reviewScore, setReviewScore] = useState(null);

  // AI Explain
  const [explanationResult, setExplanationResult] = useState('');

  const activeTab = tabs.find(t => t.id === activeTabId) || tabs[0];
  const autoSaveTimeout = useRef(null);

  // Handle Code Change
  const handleCodeChange = (e) => {
    const updatedCode = e.target.value;
    setTabs(prev => prev.map(t => t.id === activeTabId ? { ...t, code: updatedCode } : t));

    // Handle Auto Save triggering
    if (isAutoSave) {
      if (autoSaveTimeout.current) clearTimeout(autoSaveTimeout.current);
      autoSaveTimeout.current = setTimeout(() => {
        saveProgram(activeTab.title, updatedCode, activeTab.language);
      }, 2500); // Trigger saving 2.5s after user stops typing
    }
  };

  // Switch language
  const handleLanguageChange = (e) => {
    const lang = e.target.value;
    const newTitle = `script.${lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang === 'java' ? 'java' : lang === 'cpp' ? 'cpp' : 'c'}`;
    
    setTabs(prev => prev.map(t => t.id === activeTabId ? { 
      ...t, 
      language: lang, 
      title: newTitle,
      code: DEFAULT_CODE[lang] || ''
    } : t));
  };

  // Add new script tab
  const addTab = () => {
    const newId = Math.random().toString(36).substring(7);
    const newTab = {
      id: newId,
      title: `module_${tabs.length + 1}.py`,
      language: 'python',
      code: DEFAULT_CODE.python
    };
    setTabs(prev => [...prev, newTab]);
    setActiveTabId(newId);
  };

  // Close Tab
  const closeTab = (tabId, e) => {
    e.stopPropagation();
    if (tabs.length === 1) return; // Keep at least 1 open
    
    const index = tabs.findIndex(t => t.id === tabId);
    const updated = tabs.filter(t => t.id !== tabId);
    setTabs(updated);

    if (activeTabId === tabId) {
      // Switch focus
      const nextActiveIndex = index > 0 ? index - 1 : 0;
      setActiveTabId(updated[nextActiveIndex].id);
    }
  };

  // Keyboard Shortcuts Bindings (Ctrl+S to save, Ctrl+Enter to run)
  useEffect(() => {
    const handleShortcuts = (e) => {
      if (e.ctrlKey && e.key === 's') {
        e.preventDefault();
        saveProgram(activeTab.title, activeTab.code, activeTab.language);
      }
      if (e.ctrlKey && e.key === 'Enter') {
        e.preventDefault();
        runCode();
      }
    };
    window.addEventListener('keydown', handleShortcuts);
    return () => window.removeEventListener('keydown', handleShortcuts);
  }, [activeTab]);

  // Save code to backend DB
  const saveProgram = async (title = activeTab.title, code = activeTab.code, language = activeTab.language) => {
    if (!token) return;
    try {
      const res = await fetch('http://localhost:5000/api/programs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title, code, language })
      });
      if (res.ok) {
        console.log('Saved successfully');
        fetchDashboardStats();
      }
    } catch (err) {
      console.warn('Failed to save script:', err.message);
    }
  };

  // Run Code sandbox compilation
  const runCode = async () => {
    setIsRunning(true);
    setConsoleOutput('Compiling and executing sandbox code thread...\n');
    setConsoleError('');
    
    try {
      const res = await fetch('http://localhost:5000/api/executions/run', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: activeTab.code,
          language: activeTab.language,
          input: ''
        })
      });
      const data = await res.json();
      
      setIsRunning(false);
      if (res.ok) {
        setConsoleOutput(data.stdout || '');
        setConsoleError(data.stderr || '');
        setRunTime(data.executionTime || 0);
        setRunMemory(data.memoryUsage || 0);

        // If compiler threw error, auto switch AI panel to compiler helper to review it!
        if (data.stderr) {
          setExplanationResult('');
          setAiActiveTab('explain');
          explainCompilerError(data.stderr, activeTab.code, activeTab.language);
        }
      } else {
        setConsoleError(data.message || 'Execution error');
      }
    } catch (err) {
      setIsRunning(false);
      setConsoleError(`Execution failed: ${err.message}`);
    }
  };

  // AI Actions: Explanation
  const explainCompilerError = async (errorLog = consoleError, codeText = activeTab.code, lang = activeTab.language) => {
    if (!errorLog) return;
    setAiLoading(true);
    setExplanationResult('AI is diagnosing compiler parameters...');
    try {
      const res = await fetch('http://localhost:5000/api/ai/explain', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: codeText, language: lang, error: errorLog })
      });
      const data = await res.json();
      if (res.ok) {
        setExplanationResult(data.explanation);
      } else {
        setExplanationResult('Failed to diagnose error.');
      }
    } catch (err) {
      setExplanationResult(`AI Explain failure: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Actions: Code Review
  const requestReview = async () => {
    setAiLoading(true);
    setReviewResult('AI is generating review card metric...');
    setReviewScore(null);
    try {
      const res = await fetch('http://localhost:5000/api/ai/review', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: activeTab.code, language: activeTab.language })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewResult(data.review);
        setReviewScore(data.score);
      } else {
        setReviewResult('Failed to compile code review.');
      }
    } catch (err) {
      setReviewResult(`AI Review failure: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Actions: Optimization Suggestion
  const requestOptimization = async () => {
    setAiLoading(true);
    setReviewResult('AI is calculating computational complexity plan...');
    setReviewScore(null);
    try {
      const res = await fetch('http://localhost:5000/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code: activeTab.code, language: activeTab.language })
      });
      const data = await res.json();
      if (res.ok) {
        setReviewResult(data.optimization);
      } else {
        setReviewResult('Failed to map optimizations.');
      }
    } catch (err) {
      setReviewResult(`AI Optimization failure: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // Send AI Chat Message
  const sendChatMessage = async (e) => {
    e?.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = chatInput;
    setChatMessages(prev => [...prev, { sender: 'user', text: userMessage }]);
    setChatInput('');
    setAiLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code: activeTab.code,
          language: activeTab.language,
          message: userMessage
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChatMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
      } else {
        setChatMessages(prev => [...prev, { sender: 'ai', text: `Sorry, I'm having trouble analyzing: ${data.message}` }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { sender: 'ai', text: `Diagnostic thread failed: ${err.message}` }]);
    } finally {
      setAiLoading(false);
    }
  };

  // Quick suggestions prompt trigger
  const handleQuickPrompt = (promptText) => {
    setChatInput(promptText);
  };

  // Lines generator helper
  const lineCount = activeTab.code.split('\n').length;
  const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1);

  // Download Code Action
  const downloadCode = () => {
    const element = document.createElement("a");
    const file = new Blob([activeTab.code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = activeTab.title;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#0b0f19] h-screen overflow-hidden animate-fade-in">
      
      {/* LEFT HALF: Code Workspace Editor & Consol output */}
      <div className="flex-1 flex flex-col h-full border-r border-slate-900 bg-[#0f1422]">
        
        {/* Editor Tabs bar */}
        <div className="flex items-center justify-between border-b border-slate-950/70 bg-[#080b13] px-2 h-11">
          <div className="flex items-center overflow-x-auto gap-0.5 scrollbar-none">
            {tabs.map((t) => {
              const isActive = t.id === activeTabId;
              return (
                <div
                  key={t.id}
                  onClick={() => setActiveTabId(t.id)}
                  className={`
                    flex items-center gap-2 px-3 py-2 cursor-pointer text-xs font-semibold select-none border-t-2 transition
                    ${isActive 
                      ? 'bg-[#0f1422] text-indigo-400 border-indigo-500' 
                      : 'bg-transparent text-slate-500 hover:text-slate-350 border-transparent'}
                  `}
                >
                  <FileCode className="w-3.5 h-3.5" />
                  <span>{t.title}</span>
                  <button 
                    onClick={(e) => closeTab(t.id, e)} 
                    className="p-0.5 hover:bg-slate-800 rounded text-slate-650 hover:text-slate-205 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
            <button 
              onClick={addTab} 
              className="p-1 px-2.5 ml-2 hover:bg-slate-900/60 rounded text-slate-400 hover:text-indigo-400 transition"
              title="Add New Script Tab"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick shortcuts legend button */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsShortcutsOpen(!isShortcutsOpen)} 
              className="p-1.5 text-slate-500 hover:text-slate-300 rounded hover:bg-slate-900 transition mr-2"
              title="IDE Hotkey shortcuts"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* IDE Config parameters panel */}
        <div className="flex items-center justify-between py-2 px-4 bg-[#0c101b] border-b border-slate-950/60 flex-wrap gap-2">
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <select 
              value={activeTab.language} 
              onChange={handleLanguageChange}
              className="bg-slate-950 border border-slate-900 rounded-lg text-xs leading-normal py-1.5 px-3 select-none text-slate-300 focus:outline-none focus:border-indigo-650"
            >
              <option value="javascript">JavaScript (Node.js)</option>
              <option value="python">Python 3</option>
              <option value="java">Java 13</option>
              <option value="c">C (GCC)</option>
              <option value="cpp">C++ (G++)</option>
            </select>

            {/* Font Picker */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600 bg-slate-950 border border-slate-900 px-2 py-1 rounded-lg">
              <span className="font-semibold text-slate-500">Size:</span>
              <input 
                type="number"
                min="12"
                max="24"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-8 ml-0.5 bg-transparent border-none text-white focus:outline-none focus:ring-0 text-center font-bold"
              />
            </div>

            {/* Theme Toggle (Mock Visual mode) */}
            <button
              onClick={() => setIsDarkMode(!isDarkMode)}
              className="p-1.5 bg-slate-950 border border-slate-900 rounded-lg text-slate-500 hover:text-white transition"
              title="Toggle editor theme mode"
            >
              {isDarkMode ? <Moon className="w-3.5 h-3.5 text-indigo-400" /> : <Sun className="w-3.5 h-3.5 text-amber-500" />}
            </button>
          </div>

          <div className="flex items-center gap-3.5">
            {/* Download script */}
            <button 
              onClick={downloadCode} 
              className="flex items-center gap-1 bg-slate-950 border border-slate-905 hover:bg-slate-900 text-slate-400 hover:text-white py-1.5 px-3 rounded-lg text-xs font-semibold transition cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>

            {/* AutoSave trigger switch */}
            <div className="flex items-center gap-2 bg-slate-950 border border-slate-900 px-3 py-1.5 rounded-lg">
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Auto Save</span>
              <button 
                onClick={() => setIsAutoSave(!isAutoSave)} 
                className={`w-7 h-4 rounded-full p-0.5 transition ${isAutoSave ? 'bg-indigo-650' : 'bg-slate-700'}`}
              >
                <div className={`w-3 h-3 bg-white rounded-full transition-transform ${isAutoSave ? 'translate-x-3' : 'translate-x-0'}`} />
              </button>
            </div>

            {/* Run Button */}
            <button
              onClick={runCode}
              disabled={isRunning}
              className="flex items-center gap-1.5 bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white py-1.5 px-4 rounded-lg text-xs font-bold transition shadow-md shadow-emerald-950/20 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>{isRunning ? 'Compiling...' : 'Run Code'}</span>
            </button>
          </div>
        </div>

        {/* Text editor input window */}
        <div className={`
          flex-1 flex overflow-hidden border-b border-slate-950/70 relative
          ${isDarkMode ? 'bg-[#0b0e17] text-indigo-100' : 'bg-white text-slate-900'}
        `}>
          {/* Custom line numbers column */}
          <div className={`
            w-11 text-center py-4 select-none flex flex-col font-mono text-[10px] border-r border-slate-950/45 leading-relaxed
            ${isDarkMode ? 'bg-[#090b12] text-slate-650' : 'bg-slate-105 text-slate-400'}
          `} style={{ fontSize: `${fontSize}px` }}>
            {lineNumbers.map(n => <span key={n}>{n}</span>)}
          </div>

          {/* IDE textarea */}
          <textarea
            value={activeTab.code}
            onChange={handleCodeChange}
            placeholder="// Paste or write source scripts here..."
            className={`
              flex-1 py-4 px-4 resize-none focus:outline-none font-mono focus:ring-0 leading-relaxed overflow-y-auto whitespace-pre
              ${isDarkMode ? 'bg-transparent text-slate-300' : 'bg-white text-slate-800'}
            `}
            style={{ fontSize: `${fontSize}px` }}
          />

          {/* Shortcut Legend Overlay popup */}
          {isShortcutsOpen && (
            <div className="absolute top-4 left-4 p-4 rounded-xl glass-panel bg-slate-950/90 max-w-xs border border-indigo-950/50 shadow-2xl animate-fade-in">
              <div className="flex justify-between items-center pb-2 border-b border-indigo-950/70 mb-2">
                <h4 className="text-white text-xs font-bold">IDE Keyboard Shortcuts</h4>
                <button onClick={() => setIsShortcutsOpen(false)} className="text-slate-500 hover:text-white"><X className="w-3.5 h-3.5" /></button>
              </div>
              <div className="space-y-2 text-[11px]">
                <div className="flex justify-between items-center"><span className="text-slate-400">Save workspace</span><kbd className="bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-white text-[9px]">Ctrl + S</kbd></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Execute compilation</span><kbd className="bg-slate-900 border border-slate-850 px-1.5 py-0.5 rounded text-white text-[9px]">Ctrl + Enter</kbd></div>
                <div className="flex justify-between items-center"><span className="text-slate-400">Auto Save toggle</span><span className="text-slate-500 italic">Preconfigured</span></div>
              </div>
            </div>
          )}
        </div>

        {/* Console outputs area */}
        <div className="h-44 bg-[#090b12] flex flex-col">
          <div className="flex justify-between items-center py-1.5 px-4 bg-[#06080e] border-b border-slate-950/80">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-indigo-400" />
              <span>Execution Output Logs</span>
            </span>
            {(runTime > 0 || runMemory > 0) && (
              <div className="flex items-center gap-3 text-[10px] text-slate-500 font-medium">
                <span>Time: <strong className="text-slate-350">{runTime} ms</strong></span>
                <span>Memory: <strong className="text-slate-350">{runMemory} KB</strong></span>
              </div>
            )}
          </div>
          
          <div className="flex-1 p-4 font-mono text-xs overflow-y-auto leading-relaxed select-text select-all">
            {consoleError ? (
              <div className="text-rose-400">
                <span className="font-bold">[COMPILATION ERROR]</span><br />
                <pre className="mt-1 font-mono whitespace-pre-wrap">{consoleError}</pre>
              </div>
            ) : consoleOutput ? (
              <pre className="text-emerald-450 font-mono whitespace-pre-wrap">{consoleOutput}</pre>
            ) : (
              <span className="text-slate-650 italic">Execute code scripts to view compiling console outputs.</span>
            )}
          </div>
        </div>
      </div>

      {/* RIGHT HALF: AI Copilot & Compiler Helper Panel */}
      <div className="w-full lg:w-96 bg-[#090d16] flex flex-col border-t lg:border-t-0 border-slate-900">
        
        {/* Right subheader tabs */}
        <div className="grid grid-cols-3 border-b border-slate-950/60 bg-[#07090f] text-center" style={{ height: '44px' }}>
          <button
            onClick={() => setAiActiveTab('chat')}
            className={`
              flex items-center justify-center gap-1 text-[11px] font-bold transition
              ${aiActiveTab === 'chat' ? 'bg-[#090d16] text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>AI Copilot</span>
          </button>
          
          <button
            onClick={() => {
              setAiActiveTab('review');
              if (!reviewResult) requestReview();
            }}
            className={`
              flex items-center justify-center gap-1 text-[11px] font-bold transition
              ${aiActiveTab === 'review' ? 'bg-[#090d16] text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}
            `}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Review</span>
          </button>

          <button
            onClick={() => setAiActiveTab('explain')}
            className={`
              flex items-center justify-center gap-1 text-[11px] font-bold transition
              ${aiActiveTab === 'explain' ? 'bg-[#090d16] text-indigo-400 border-b-2 border-indigo-500' : 'text-slate-500 hover:text-slate-300'}
            `}
            disabled={!consoleError}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Compiler Help</span>
          </button>
        </div>

        {/* Tab contents window */}
        <div className="flex-1 flex flex-col overflow-hidden p-4">
          
          {/* TAB 1: AI Chat assistant block */}
          {aiActiveTab === 'chat' && (
            <div className="flex-grow flex flex-col justify-between overflow-hidden">
              {/* Chat timeline bubbles */}
              <div className="flex-grow overflow-y-auto space-y-4 pr-1 mb-4 select-text">
                {chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`
                      max-w-[85%] rounded-2xl p-3 text-xs leading-relaxed
                      ${msg.sender === 'user' 
                        ? 'bg-indigo-650 text-white rounded-tr-none' 
                        : 'bg-slate-950/65 text-slate-300 border border-slate-900 rounded-tl-none'}
                    `}>
                      <span className="font-bold block mb-1 text-[10px] opacity-75">
                        {msg.sender === 'user' ? 'You' : 'CodeVerse AI'}
                      </span>
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>
                  </div>
                ))}
                {aiLoading && (
                  <div className="text-left">
                    <div className="bg-slate-950/60 text-slate-400 p-3 rounded-2xl rounded-tl-none text-xs inline-flex items-center gap-2 border border-slate-900/60">
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      <span className="font-semibold text-[10px] ml-1">AI parsing...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input form & Quick action buttons */}
              <div>
                {/* Suggestions triggers */}
                <div className="flex gap-1.5 overflow-x-auto pb-3 scrollbar-none flex-nowrap shrink-0">
                  <button 
                    onClick={() => handleQuickPrompt("Find the bug in my active file.")}
                    className="shrink-0 bg-slate-950 border border-slate-900 text-[10px] font-semibold text-slate-500 hover:text-white px-2.5 py-1.5 rounded-lg transition"
                  >
                    🔍 Find Bug
                  </button>
                  <button 
                    onClick={() => handleQuickPrompt("Explain this code in simple English.")}
                    className="shrink-0 bg-slate-950 border border-slate-900 text-[10px] font-semibold text-slate-500 hover:text-white px-2.5 py-1.5 rounded-lg transition"
                  >
                    📖 Explain Script
                  </button>
                  <button 
                    onClick={() => handleQuickPrompt(`Convert this ${activeTab.language === 'python' ? 'Python to Java' : 'code to Python'}.`)}
                    className="shrink-0 bg-slate-950 border border-slate-900 text-[10px] font-semibold text-slate-500 hover:text-white px-2.5 py-1.5 rounded-lg transition"
                  >
                    🔁 Translate Lang
                  </button>
                </div>

                <form onSubmit={sendChatMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask AI Copilot..."
                    className="flex-grow bg-slate-950 border border-slate-900 text-xs py-2 px-3 rounded-xl focus:outline-none focus:border-indigo-500 text-white placeholder-slate-600"
                  />
                  <button 
                    type="submit" 
                    className="p-2 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </form>
              </div>
            </div>
          )}

          {/* TAB 2: AI Code Review & Optimizer */}
          {aiActiveTab === 'review' && (
            <div className="flex-grow flex flex-col justify-between overflow-hidden">
              <div className="flex-grow overflow-y-auto mb-4 select-text">
                
                {/* Score badge if review completed */}
                {reviewScore !== null && (
                  <div className="mb-4 p-4 rounded-xl bg-indigo-950/20 border border-indigo-950/60 flex items-center justify-between">
                    <div>
                      <h5 className="text-[11px] font-semibold text-indigo-400 uppercase tracking-wider">Quality Scorecard</h5>
                      <p className="text-[10px] text-slate-500 mt-0.5">Optimized standard grading metrics</p>
                    </div>
                    <div className="relative flex items-center justify-center">
                      <div className="w-12 h-12 rounded-full border-2 border-indigo-500 flex items-center justify-center">
                        <span className="font-extrabold text-sm text-white">{reviewScore}</span>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Review logs text */}
                <div className="opacity-95 text-slate-350 text-xs leading-relaxed space-y-3 whitespace-pre-wrap select-text">
                  {reviewResult ? reviewResult : (
                    <div className="text-center text-slate-500 py-10">
                      <Bot className="w-8 h-8 mx-auto mb-2 text-slate-600 animate-bounce" />
                      <span>Select Code Review or Optimization suggestions.</span>
                    </div>
                  )}
                </div>
              </div>

              {aiLoading && (
                <div className="text-center py-2 text-slate-500 text-xs">AI analyzing code layout...</div>
              )}

              {/* Action Buttons */}
              <div className="grid grid-cols-2 gap-3.5 pt-2 border-t border-slate-950">
                <button
                  onClick={requestReview}
                  className="py-2.5 bg-slate-950 hover:bg-slate-900 border border-slate-850 hover:border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Bot className="w-3.5 h-3.5 text-indigo-400" />
                  <span>AI Review</span>
                </button>
                <button
                  onClick={requestOptimization}
                  className="py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Sparkles className="w-3.5 h-3.5 fill-white/10" />
                  <span>Optimize Code</span>
                </button>
              </div>
            </div>
          )}

          {/* TAB 3: Compiler diagnostic explanation */}
          {aiActiveTab === 'explain' && (
            <div className="flex-grow flex flex-col justify-between overflow-hidden select-text">
              <div className="flex-grow overflow-y-auto mb-4">
                <h5 className="text-[11px] text-rose-400 font-bold uppercase tracking-wider mb-2.5 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-455" />
                  <span>Diagnostics Helper explanation</span>
                </h5>
                <div className="opacity-95 text-slate-350 text-xs leading-relaxed whitespace-pre-wrap select-text">
                  {explanationResult ? explanationResult : 'Diagnostics report ready. Click Explain Error below for analysis.'}
                </div>
              </div>

              <button
                onClick={() => explainCompilerError(consoleError, activeTab.code, activeTab.language)}
                disabled={!consoleError || aiLoading}
                className="w-full py-2.5 bg-rose-950/20 hover:bg-rose-950/40 border border-rose-900/60 hover:border-rose-900 text-rose-400 rounded-xl text-xs font-bold shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <AlertTriangle className="w-4 h-4 text-rose-400" />
                <span>Explain Compiler Error</span>
              </button>
            </div>
          )}

        </div>
      </div>

    </div>
  );
};

export default Editor;
