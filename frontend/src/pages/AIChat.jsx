import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Bot, 
  Send, 
  Sparkles, 
  Trash2, 
  HelpCircle, 
  History, 
  Code2, 
  MessageSquare,
  MessageCircleQuestion
} from 'lucide-react';

const AIChat = () => {
  const { token } = useApp();
  const [messages, setMessages] = useState([
    { sender: 'ai', text: 'Welcome to CodeVerse AI Coding Studio! 🚀\n\nYou can chat with me, ask me to explain algorithms, suggest optimizations, generate test cases, find syntax blocks bugs, or convert code between Python, Java, C, and JavaScript.\n\nType a command or click a quick prompt template below to start!' }
  ]);
  const [inputVal, setInputVal] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiLogs, setAiLogs] = useState([]);

  useEffect(() => {
    loadAIHistory();
  }, []);

  const loadAIHistory = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/ai/history', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAiLogs(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!inputVal.trim()) return;

    const userMsg = inputVal;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInputVal('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:5000/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ message: userMsg })
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(prev => [...prev, { sender: 'ai', text: data.reply }]);
        loadAIHistory();
      } else {
        setMessages(prev => [...prev, { sender: 'ai', text: `Failed to compile request: ${data.message}` }]);
      }
    } catch (err) {
      setMessages(prev => [...prev, { sender: 'ai', text: `Error connecting to AI: ${err.message}` }]);
    } finally {
      setLoading(false);
    }
  };

  const loadQuickPrompt = (promptText) => {
    setInputVal(promptText);
  };

  return (
    <div className="flex-1 bg-[#0b0f19] flex flex-col lg:flex-row h-screen overflow-hidden animate-fade-in text-xs lg:text-sm">
      
      {/* Column A: Conversational chat canvas */}
      <div className="flex-grow flex flex-col justify-between overflow-hidden bg-[#0d121f] p-6">
        
        {/* Chat Header */}
        <div className="flex justify-between items-center border-b border-slate-900 pb-4 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h2 className="text-white font-bold text-sm tracking-wide">AI Developer Assistant</h2>
              <span className="text-[10px] text-slate-500 font-semibold block uppercase">Conversational helper agent</span>
            </div>
          </div>
        </div>

        {/* Bubble Messages stream */}
        <div className="flex-grow overflow-y-auto space-y-4 my-5 select-text pr-1.5">
          {messages.map((m, idx) => (
            <div key={idx} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`
                max-w-[80%] rounded-2xl p-4 gap-1 leading-relaxed
                ${m.sender === 'user' 
                  ? 'bg-indigo-650 text-white rounded-tr-none shadow-xl' 
                  : 'bg-slate-950/60 border border-slate-900 text-slate-350 rounded-tl-none'}
              `}>
                <span className="text-[10px] uppercase font-bold opacity-60 block mb-1">
                  {m.sender === 'user' ? 'You' : 'CodeVerse AI'}
                </span>
                <p className="whitespace-pre-line text-xs font-semibold">{m.text}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="text-left">
              <div className="bg-slate-950/60 border border-slate-900/60 p-4 rounded-2xl rounded-tl-none text-xs inline-flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                <span className="font-bold text-[10px] ml-1 text-slate-500">AI Thinking...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input box and Quick suggestions */}
        <div className="shrink-0 border-t border-slate-905 pt-4">
          
          {/* Quick presets */}
          <div className="flex gap-2 overflow-x-auto pb-3.5 scrollbar-none flex-nowrap shrink-0">
            <button 
              onClick={() => loadQuickPrompt("Generate a boilerplate Python code for a binary search tree.")}
              className="shrink-0 bg-slate-950 border border-slate-900 hover:border-slate-800 text-[10px] font-bold text-slate-500 hover:text-white px-3 py-2 rounded-xl transition"
            >
              🌳 Boilerplate BST
            </button>
            <button 
              onClick={() => loadQuickPrompt("Find the bug in this function:\ndef fib(n):\n    return fib(n-1) + fib(n-2)")}
              className="shrink-0 bg-slate-950 border border-slate-900 hover:border-slate-800 text-[10px] font-bold text-slate-500 hover:text-white px-3 py-2 rounded-xl transition"
            >
              🐛 Find Python Bug
            </button>
            <button 
              onClick={() => loadQuickPrompt("Convert this JavaScript code to Java:\nconsole.log('hi');")}
              className="shrink-0 bg-slate-950 border border-slate-900 hover:border-slate-800 text-[10px] font-bold text-slate-500 hover:text-white px-3 py-2 rounded-xl transition"
            >
              🔁 JS to Java
            </button>
            <button 
              onClick={() => loadQuickPrompt("Generate test cases for validating a palindrome input.")}
              className="shrink-0 bg-slate-950 border border-slate-905 hover:border-[#2f394d] text-[10px] font-bold text-slate-500 hover:text-white px-3 py-2 rounded-xl transition"
            >
              🧪 Boundary Palindrome Tests
            </button>
          </div>

          <form onSubmit={handleSend} className="flex gap-3">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              placeholder="Start typing developer prompt here..."
              className="flex-grow bg-slate-950 border border-slate-900 text-xs py-3 px-4 rounded-xl focus:outline-none focus:border-indigo-650 text-white placeholder-slate-655"
            />
            <button 
              type="submit" 
              className="p-3 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl transition flex items-center justify-center cursor-pointer shadow-lg shadow-indigo-950/20"
            >
              <Send className="w-4 h-4 fill-white/10" />
            </button>
          </form>
        </div>

      </div>

      {/* Column B: Prompt Logs History Sidebar */}
      <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-900 bg-[#090c15] flex flex-col overflow-hidden max-h-56 lg:max-h-full">
        <div className="p-5 border-b border-slate-950/60 bg-[#07090f] shrink-0">
          <h3 className="text-white text-xs font-bold uppercase tracking-wider flex items-center gap-2">
            <History className="w-4.5 h-4.5 text-indigo-400" />
            <span>AI Interaction Log</span>
          </h3>
          <p className="text-slate-500 text-[10px] mt-0.5">Audits of queries compiled locally</p>
        </div>

        <div className="flex-grow overflow-y-auto p-4 space-y-3.5 select-text hover:scrollbar">
          {aiLogs.length === 0 ? (
            <div className="text-center py-10 text-slate-600 text-xs italic">No logs registered yet.</div>
          ) : (
            aiLogs.map((log, idx) => (
              <div 
                key={log._id || idx} 
                onClick={() => setMessages(prev => [...prev, 
                  { sender: 'user', text: log.prompt }, 
                  { sender: 'ai', text: log.response }
                ])}
                className="bg-slate-950/60 border border-slate-900/60 p-3 rounded-lg hover:border-slate-800 transition cursor-pointer select-none"
              >
                <div className="flex justify-between items-start gap-2 mb-1">
                  <span className="text-[9px] text-indigo-400 font-bold uppercase tracking-wider">{log.type}</span>
                  <span className="text-[8px] text-slate-550">{new Date(log.createdAt).toLocaleDateString()}</span>
                </div>
                <p className="text-slate-350 text-[11px] truncate leading-normal font-semibold font-mono">{log.prompt}</p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
};

export default AIChat;
