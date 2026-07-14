import React, { useEffect, useState } from 'react';
import { Sparkles, Download, Printer, User, FileCode, Clock } from 'lucide-react';

const SharedView = ({ shareToken }) => {
  const [loading, setLoading] = useState(true);
  const [program, setProgram] = useState(null);
  const [errorLog, setErrorLog] = useState('');

  useEffect(() => {
    const fetchShared = async () => {
      try {
        const res = await fetch(`http://localhost:5000/api/programs/shared/${shareToken}`);
        const data = await res.json();
        if (res.ok) {
          setProgram(data);
        } else {
          setErrorLog(data.message || 'Shared link has expired or is invalid.');
        }
      } catch (err) {
        setErrorLog('Network connection failed. Try again.');
      } finally {
        setLoading(false);
      }
    };
    if (shareToken) {
      fetchShared();
    }
  }, [shareToken]);

  const handleDownload = () => {
    if (!program) return;
    const element = document.createElement("a");
    const file = new Blob([program.code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = program.title || 'shared_code.txt';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleExportPDF = () => {
    if (!program) return;
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${program.title} - CodeVerse Shared Code</title>
          <style>
            body { font-family: sans-serif; padding: 40px; color: #222; }
            h1 { font-size: 24px; margin-bottom: 5px; color: #1e1b4b; }
            p { font-size: 12px; color: #555; margin-bottom: 20px; }
            pre { 
              font-family: monospace; 
              background-color: #f4f4f5; 
              border: 1px solid #e4e4e7; 
              padding: 20px; 
              border-radius: 8px; 
              white-space: pre-wrap; 
              font-size: 13px; 
              line-height: 1.5;
            }
          </style>
        </head>
        <body>
          <h1>${program.title}</h1>
          <p>Shared via CodeVerse AI - Author: ${program.creatorName} | Language: ${program.language.toUpperCase()} | Date: ${today}</p>
          <pre>${program.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070b13] flex items-center justify-center text-xs lg:text-sm">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-indigo-505 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 font-semibold">Loading shared workspace file...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070b13] flex flex-col relative px-4 py-8 overflow-y-auto text-xs lg:text-sm">
      {/* Background radial glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[550px] h-[550px] bg-indigo-500/5 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Shared Header Brand */}
      <div className="flex flex-col items-center mb-8 shrink-0 select-none">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-6 h-6 text-indigo-400" />
          <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-indigo-400 to-sky-400 bg-clip-text text-transparent">CODEVERSE AI</span>
        </div>
        <p className="text-slate-500 text-xs font-semibold">Open-source code sharing & execution canvas</p>
      </div>

      {/* Main content card */}
      <div className="w-full max-w-4xl mx-auto z-10 select-text">
        {errorLog ? (
          <div className="glass-panel rounded-2xl p-8 border border-rose-950/40 text-center text-rose-350">
            <h3 className="text-md font-bold mb-2">Workspace Unavailable</h3>
            <p className="text-xs">{errorLog}</p>
          </div>
        ) : (
          <div className="glass-panel rounded-2xl border border-slate-900 overflow-hidden shadow-2xl flex flex-col">
            
            {/* Context details header bar */}
            <div className="p-5 bg-slate-950/40 border-b border-slate-900 flex justify-between items-center flex-wrap gap-4 select-none">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-indigo-400">
                  <FileCode className="w-5.5 h-5.5 animate-pulse" />
                </div>
                <div>
                  <h2 className="text-white font-extrabold text-sm tracking-wide">{program.title}</h2>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500">
                    <span className="flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> <strong className="text-slate-400">{program.creatorName}</strong></span>
                    <span className="flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> <span>{new Date(program.createdAt).toLocaleDateString()}</span></span>
                  </div>
                </div>
              </div>

              {/* Code tools */}
              <div className="flex gap-2.5">
                <span className="px-3 py-1 bg-slate-950 border border-slate-950 text-indigo-305 font-bold uppercase rounded-lg self-center tracking-wider text-[10px]">
                  {program.language}
                </span>

                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1 bg-slate-950 hover:bg-slate-900 border border-slate-900 text-slate-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>

                <button
                  onClick={handleExportPDF}
                  className="flex items-center gap-1 bg-indigo-650 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Export PDF</span>
                </button>
              </div>
            </div>

            {/* Code canvas viewport */}
            <div className="bg-[#0b0e17] p-5 font-mono text-xs text-slate-300 leading-relaxed overflow-x-auto whitespace-pre select-all min-h-[320px]">
              <code>
                {program.code || '// Workspace code is empty'}
              </code>
            </div>

          </div>
        )}
      </div>

    </div>
  );
};

export default SharedView;
