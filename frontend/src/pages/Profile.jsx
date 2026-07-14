import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { User, Lock, Mail, Shield, CheckCircle, AlertCircle, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile } = useApp();
  const [name, setName] = useState(user?.name || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [errorVal, setErrorVal] = useState('');
  const [successVal, setSuccessVal] = useState('');

  const handleUpdate = async (e) => {
    e.preventDefault();
    setErrorVal('');
    setSuccessVal('');

    if (password && password !== confirmPassword) {
      setErrorVal('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      await updateProfile(name, password || undefined);
      setSuccessVal('Profile changes applied successfully.');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setErrorVal(err.message || 'Failed to apply profile changes.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 bg-[#0b0f19] overflow-y-auto p-6 lg:p-8 animate-fade-in">
      
      {/* Title */}
      <h1 className="text-2xl lg:text-3xl font-extrabold text-white mb-8 border-b border-slate-900 pb-5">
        Account Settings
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 max-w-5xl">
        
        {/* Left column: profile summary card */}
        <div className="glass-panel rounded-2xl p-6 border border-slate-900 flex flex-col items-center text-center self-start bg-slate-950/45">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-505 to-emerald-505 flex items-center justify-center font-black text-white text-3xl mb-4 shadow-xl">
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <h3 className="text-white text-md font-bold">{user?.name}</h3>
          <p className="text-slate-400 text-xs mt-1 font-medium select-all">{user?.email}</p>
          
          <div className="flex items-center gap-1.5 mt-3.5">
            <span className={`
              text-[10px] font-extrabold tracking-wider px-3.5 py-0.5 rounded-full uppercase
              ${user?.role === 'admin' ? 'bg-gradient-to-r from-pink-505 to-rose-505 text-white' : 'bg-slate-900 text-slate-405 border border-slate-900'}
            `}>
              {user?.role}
            </span>
          </div>

          <div className="w-full mt-6 pt-5 border-t border-slate-900 text-left text-xs space-y-2.5">
            <div className="flex justify-between items-center"><span className="text-slate-500 font-semibold">Joined Client:</span><span className="text-slate-350">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active Member'}</span></div>
            <div className="flex justify-between items-center"><span className="text-slate-500 font-semibold">Workspace Access:</span><span className="text-slate-350 italic">Full Dev Sandbox</span></div>
          </div>
        </div>

        {/* Right column: Edit forms */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-slate-900">
          <h2 className="text-white text-md font-bold mb-5 flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-indigo-400" />
            <span>Update Account Profile</span>
          </h2>
          
          <form onSubmit={handleUpdate} className="space-y-4">
            
            {errorVal && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/20 border border-rose-909/60 rounded-xl text-rose-350 text-xs">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{errorVal}</span>
              </div>
            )}

            {successVal && (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-950/20 border border-emerald-900/60 rounded-xl text-emerald-350 text-xs">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{successVal}</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-550" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-900 focus:border-indigo-650 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none transition font-semibold"
                  />
                </div>
              </div>

              {/* Email (Read Only) */}
              <div className="space-y-1.5">
                <label className="text-slate-555 text-xs font-semibold block">Email Address (Locked)</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-655" />
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="w-full bg-slate-955/50 border border-slate-905 rounded-xl py-2.5 pl-10 pr-4 text-xs text-slate-600 focus:outline-none cursor-not-allowed select-all"
                  />
                </div>
              </div>
            </div>

            <hr className="border-slate-900 my-2" />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Reset Password */}
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold block">New Password (Optional)</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-550" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-900 focus:border-indigo-650 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none transition"
                  />
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-550" />
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-905 focus:border-indigo-650 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder-slate-700 focus:outline-none transition"
                  />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-indigo-950/20 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{loading ? 'Applying changes...' : 'Save Profile Details'}</span>
            </button>

          </form>
        </div>

      </div>

    </div>
  );
};

// Simple inline Settings icon component for safety
const SettingsIcon = (props) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    {...props}
  >
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.1a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

export default Profile;
