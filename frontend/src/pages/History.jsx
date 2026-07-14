import React, { useEffect, useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  FolderOpen, 
  Search, 
  Trash2, 
  Copy, 
  FileCode, 
  Star, 
  Share2, 
  Download, 
  Printer, 
  Edit2, 
  Plus, 
  X,
  Sparkles,
  ExternalLink,
  ChevronRight
} from 'lucide-react';

const HistoryPage = ({ setActiveView, setOpenProgramTrigger }) => {
  const { token } = useApp();
  const [loading, setLoading] = useState(true);
  const [programsList, setProgramsList] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  
  // Dialog controls
  const [renameItemId, setRenameItemId] = useState(null);
  const [renameItemTitle, setRenameItemTitle] = useState('');
  const [shareItemUrl, setShareItemUrl] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    loadPrograms();
  }, [searchVal]);

  const loadPrograms = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/programs?search=${searchVal}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setProgramsList(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Toggle favorite
  const handleToggleFavorite = async (program) => {
    try {
      const res = await fetch(`http://localhost:5000/api/programs/${program._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ isFavorite: !program.isFavorite })
      });
      if (res.ok) {
        loadPrograms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Duplicate program card
  const handleDuplicate = async (programId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/programs/${programId}/duplicate`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadPrograms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete program
  const handleDelete = async (programId) => {
    if (!window.confirm("Are you sure you want to delete this program file?")) return;
    try {
      const res = await fetch(`http://localhost:5000/api/programs/${programId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        loadPrograms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Rename program
  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    if (!renameItemTitle.trim()) return;

    try {
      const res = await fetch(`http://localhost:5000/api/programs/${renameItemId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ title: renameItemTitle })
      });
      if (res.ok) {
        setRenameItemId(null);
        loadPrograms();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Share program link
  const handleShare = async (programId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/programs/${programId}/share`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (res.ok) {
        // Construct public URL links
        const absoluteUrl = `${window.location.origin}/#/shared/${data.shareToken}`;
        setShareItemUrl(absoluteUrl);
        setShowShareModal(true);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Open file in Editor
  const handleOpenFile = (program) => {
    setOpenProgramTrigger(program);
    setActiveView('editor');
  };

  // Download raw code
  const handleDownload = (program) => {
    const element = document.createElement("a");
    const file = new Blob([program.code], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    
    // Choose appropriate file suffix
    const lang = program.language.toLowerCase();
    const suffix = lang === 'javascript' ? 'js' : lang === 'python' ? 'py' : lang === 'java' ? 'java' : lang === 'cpp' ? 'cpp' : 'c';
    const filename = program.title.endsWith(`.${suffix}`) ? program.title : `${program.title}.${suffix}`;
    
    element.download = filename;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  // Export to PDF
  const handleExportPDF = (program) => {
    // Open print view in new window containing structured paper layout markup
    const printWindow = window.open('', '_blank');
    const today = new Date().toLocaleDateString();
    
    printWindow.document.write(`
      <html>
        <head>
          <title>${program.title} - CodeVerse PDF Export</title>
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
          <p>Exported from CodeVerse AI - Programming details: ${program.language.toUpperCase()} | Date: ${today}</p>
          <pre>${program.code.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</pre>
          <script>
            window.onload = function() {
              window.print();
              // window.close();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="flex-1 bg-[#0b0f19] overflow-y-auto p-6 lg:p-8 animate-fade-in relative">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-900 pb-5 mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-extrabold text-white">Saved Workspace Codes</h1>
          <p className="text-slate-500 text-xs mt-1">Manage files, share links, duplicate templates, or compile PDFs</p>
        </div>

        {/* Search input */}
        <div className="relative w-full max-w-xs shrink-0">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
          <input
            type="text"
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            placeholder="Search programs..."
            className="w-full bg-slate-950 border border-slate-900 rounded-xl py-2 pl-9 pr-4 text-xs text-white placeholder-slate-655 focus:outline-none focus:border-indigo-650"
          />
        </div>
      </div>

      {/* Grid listing */}
      {loading ? (
        <div className="text-center py-20 text-slate-550 italic">Retrieving workspaces...</div>
      ) : programsList.length === 0 ? (
        <div className="glass-panel rounded-2xl py-16 text-center border-slate-900 text-slate-500">
          <FolderOpen className="w-12 h-12 mx-auto text-slate-700 mb-2" />
          <p className="text-sm">No saved programs found.</p>
          <button 
            onClick={() => setActiveView('editor')} 
            className="mt-4 px-4 py-2 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 mx-auto cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Script</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {programsList.map((program) => (
            <div 
              key={program._id} 
              className="glass-panel glass-panel-hover rounded-2xl p-5 border border-slate-900 flex flex-col justify-between"
              style={{ minHeight: '190px' }}
            >
              {/* Card Top Title Row */}
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1 min-w-0 pr-4">
                    {renameItemId === program._id ? (
                      <form onSubmit={handleRenameSubmit} className="flex gap-1">
                        <input
                          type="text"
                          value={renameItemTitle}
                          onChange={(e) => setRenameItemTitle(e.target.value)}
                          className="bg-slate-950 border border-indigo-650 rounded px-2 py-1 text-xs text-white focus:outline-none w-full"
                          autoFocus
                          required
                        />
                        <button type="submit" className="p-1.5 bg-indigo-650 rounded text-xs hover:bg-indigo-500 text-white"><ChevronRight className="w-3.5 h-3.5" /></button>
                        <button onClick={() => setRenameItemId(null)} className="p-1.5 bg-slate-900 rounded text-xs hover:bg-slate-800 text-slate-400"><X className="w-3.5 h-3.5" /></button>
                      </form>
                    ) : (
                      <h3 
                        onClick={() => handleOpenFile(program)} 
                        className="text-white hover:text-indigo-400 font-bold text-sm tracking-wide leading-normal truncate cursor-pointer"
                      >
                        {program.title}
                      </h3>
                    )}
                    
                    <span className="text-[10px] text-slate-500 font-bold uppercase mt-1 block">
                      Language: {program.language}
                    </span>
                  </div>

                  {/* Favorite Indicator */}
                  <button 
                    onClick={() => handleToggleFavorite(program)} 
                    className="p-1 hover:bg-slate-900 rounded text-slate-500 hover:text-amber-500 transition shrink-0"
                  >
                    <Star className={`w-4.5 h-4.5 ${program.isFavorite ? 'fill-amber-500 text-amber-500' : 'text-slate-600'}`} />
                  </button>
                </div>

                {/* Brief preview code block */}
                <p className="text-slate-550 text-[10px] leading-relaxed line-clamp-2 mt-3 font-mono bg-slate-950/45 p-2 rounded-lg border border-slate-900/60 overflow-hidden">
                  {program.code || '// Empty program workspace'}
                </p>
              </div>

              {/* Bottom Card Controls Row */}
              <div className="flex items-center justify-between border-t border-slate-905 pt-4.5 mt-4">
                <span className="text-[9px] text-slate-500 font-medium">Mod: {new Date(program.updatedAt || program.createdAt).toLocaleDateString()}</span>
                
                <div className="flex items-center gap-1">
                  {/* Open */}
                  <button
                    onClick={() => handleOpenFile(program)}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                    title="Open Workspace"
                  >
                    <FolderOpen className="w-4 h-4" />
                  </button>

                  {/* Rename */}
                  <button
                    onClick={() => { setRenameItemId(program._id); setRenameItemTitle(program.title); }}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                    title="Rename File"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Share Link */}
                  <button
                    onClick={() => handleShare(program._id)}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                    title="Share Link"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicate(program._id)}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                    title="Duplicate Tab"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Download */}
                  <button
                    onClick={() => handleDownload(program)}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                    title="Download Source Code"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Export PDF */}
                  <button
                    onClick={() => handleExportPDF(program)}
                    className="p-2 text-slate-500 hover:text-indigo-400 hover:bg-slate-900 rounded-lg transition"
                    title="Export as PDF"
                  >
                    <Printer className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDelete(program._id)}
                    className="p-2 text-slate-600 hover:text-rose-400 hover:bg-slate-950 rounded-lg transition"
                    title="Delete File"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

      {/* Share Modal Dialog Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-955/30 backdrop-blur-sm" onClick={() => setShowShareModal(false)} />
          <div className="glass-panel bg-[#0d121f] rounded-2xl max-w-sm w-full p-6 border border-indigo-950/60 shadow-2xl relative z-10 animate-fade-in text-center">
            <div className="w-10 h-10 rounded-xl bg-indigo-950/40 border border-indigo-900/40 flex items-center justify-center text-indigo-400 mx-auto mb-3">
              <Share2 className="w-5 h-5 animate-pulse" />
            </div>
            <h3 className="text-white text-sm font-bold mb-2">Share Workspace Link</h3>
            <p className="text-slate-500 text-xs mb-4">Anyone with this link can view this code file in read-only mode.</p>
            
            <div className="flex gap-2 mb-4 bg-slate-950 border border-slate-900 rounded-xl p-1.5 items-center">
              <input
                type="text"
                readOnly
                value={shareItemUrl}
                className="bg-transparent border-none text-[11px] text-indigo-300 font-semibold px-2 focus:outline-none flex-grow truncate select-all"
              />
              <button
                onClick={() => {
                  navigator.clipboard.writeText(shareItemUrl);
                  alert("Link copied to clipboard!");
                }}
                className="bg-indigo-650 hover:bg-indigo-500 text-white rounded-lg px-3 py-1.5 text-xs font-bold transition cursor-pointer"
              >
                Copy
              </button>
            </div>
            
            <button
              onClick={() => setShowShareModal(false)}
              className="text-slate-500 hover:text-white text-xs font-semibold"
            >
              Close Drawer
            </button>
          </div>
        </div>
      )}

    </div>
  );
};

export default HistoryPage;
