import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Sparkles, Mail, Lock, User, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';

const Login = () => {
  const { login, register } = useApp();
  const [isRegister, setIsRegister] = useState(false);
  const [isForgot, setIsForgot] = useState(false);
  
  // Registration and login state fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('student');

  const [loading, setLoading] = useState(false);
  const [errorVal, setErrorVal] = useState('');
  const [successVal, setSuccessVal] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorVal('');
    setSuccessVal('');
    setLoading(true);

    try {
      if (isForgot) {
        // Forgot password route
        const res = await fetch('http://localhost:5000/api/auth/forgot-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Verification failed');
        setSuccessVal(data.message || 'Reset password successfully.');
      } else if (isRegister) {
        // Register route
        await register(name, email, password, role);
      } else {
        // Login route
        await login(email, password);
      }
    } catch (err) {
      setErrorVal(err.message || 'Authentication failed. Please verify credentials.');
    } finally {
      setLoading(false);
    }
  };

  const loadDemoUser = (type) => {
    setErrorVal('');
    setSuccessVal('');
    if (type === 'student') {
      setEmail('student@codeverse.com');
      setPassword('password123');
      setIsRegister(false);
      setIsForgot(false);
    } else if (type === 'admin') {
      setEmail('admin@codeverse.com');
      setPassword('password123');
      setIsRegister(false);
      setIsForgot(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070b13] flex items-center justify-center relative px-4 overflow-hidden">
      {/* Background Neon Glow Orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/10 rounded-full filter blur-[100px] pointer-events-none" />
      
      <div className="w-full max-w-md animate-fade-in relative z-10">
        {/* Brand Banner */}
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-sky-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 mb-3">
            <Sparkles className="w-8 h-8 text-white animate-pulse" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-wider bg-gradient-to-r from-indigo-400 via-sky-405 to-emerald-400 bg-clip-text text-transparent">
            CODEVERSE AI
          </h1>
          <p className="text-slate-500 text-sm mt-1 text-center font-medium">
            AI-Powered Online Code Editor, Testing & Learning Platform
          </p>
        </div>

        {/* Card Panel */}
        <div className="glass-panel rounded-3xl p-8 border border-slate-900 shadow-2xl relative">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isForgot ? 'Recover Password' : (isRegister ? 'Create Account' : 'Welcome Back')}
          </h2>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {errorVal && (
              <div className="flex items-center gap-2.5 p-3.5 bg-rose-950/30 border border-rose-900/60 rounded-xl text-rose-350 text-xs leading-relaxed">
                <AlertCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{errorVal}</span>
              </div>
            )}

            {successVal && (
              <div className="flex items-center gap-2.5 p-3.5 bg-emerald-950/30 border border-emerald-900/60 rounded-xl text-emerald-350 text-xs leading-relaxed">
                <CheckCircle className="w-4.5 h-4.5 shrink-0" />
                <span>{successVal}</span>
              </div>
            )}

            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold block">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jane Doe"
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-slate-400 text-xs font-semibold block">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full bg-slate-950/50 border border-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {!isForgot && (
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-slate-400 text-xs font-semibold">Password</label>
                  {!isRegister && (
                    <button
                      type="button"
                      onClick={() => { setIsForgot(true); setErrorVal(''); setSuccessVal(''); }}
                      className="text-xs text-indigo-400 hover:text-indigo-305 font-medium transition"
                    >
                      Forgot?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>
              </div>
            )}

            {isRegister && (
              <div className="space-y-1.5">
                <label className="text-slate-400 text-xs font-semibold block">Define Role</label>
                <div className="grid grid-cols-2 gap-3.5">
                  <button
                    type="button"
                    onClick={() => setRole('student')}
                    className={`
                      py-2.5 rounded-xl border text-sm font-semibold transition
                      ${role === 'student' 
                        ? 'bg-indigo-950/40 border-indigo-500 text-indigo-300' 
                        : 'bg-slate-950/30 border-slate-900 text-slate-400 hover:text-slate-205'}
                    `}
                  >
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('admin')}
                    className={`
                      py-2.5 rounded-xl border text-sm font-semibold transition
                      ${role === 'admin' 
                        ? 'bg-rose-955/20 border-rose-500 text-rose-350' 
                        : 'bg-slate-955/20 border-slate-900 text-slate-400 hover:text-slate-205'}
                    `}
                  >
                    Admin
                  </button>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 mt-2 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-950/20 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <span>Securing authorization...</span>
              ) : (
                <>
                  <span>
                    {isForgot ? 'Send Verification Link' : (isRegister ? 'Register Account' : 'Authenticate')}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Switch link */}
          <div className="mt-6 text-center text-xs">
            {isForgot ? (
              <button 
                onClick={() => { setIsForgot(false); setErrorVal(''); setSuccessVal(''); }} 
                className="text-slate-400 hover:text-white transition font-medium"
              >
                Back to Sign In
              </button>
            ) : (
              <p className="text-slate-500">
                {isRegister ? 'Already have a credentials key?' : "Haven't registered, student?"}{' '}
                <button
                  onClick={() => { setIsRegister(!isRegister); setErrorVal(''); setSuccessVal(''); }}
                  className="text-indigo-400 hover:text-indigo-300 transition font-bold"
                >
                  {isRegister ? 'Log In' : 'Sign Up'}
                </button>
              </p>
            )}
          </div>
        </div>

        {/* Demo Fast Sandbox Login Shortcuts */}
        <div className="mt-6 glass-panel rounded-2xl p-4.5 border border-slate-900/60 shadow-xl bg-slate-950/40 text-center">
          <p className="text-slate-400 text-[11px] font-bold tracking-wider uppercase mb-3">
            ⚡ QUICK DEMO ENTRY SHORTCUTS
          </p>
          <div className="grid grid-cols-2 gap-3.5">
            <button
              onClick={() => loadDemoUser('student')}
              className="px-3 py-2 bg-indigo-955/10 hover:bg-indigo-955/35 border border-indigo-950/40 hover:border-indigo-950 text-indigo-400 rounded-lg text-xs font-semibold transition"
            >
              👩‍💻 Student Account
            </button>
            <button
              onClick={() => loadDemoUser('admin')}
              className="px-3 py-2 bg-pink-955/10 hover:bg-pink-955/25 border border-pink-950/40 hover:border-pink-950 text-pink-400 rounded-lg text-xs font-semibold transition"
            >
              🛡️ Admin Account
            </button>
          </div>
          <p className="text-slate-500 text-[10px] mt-2 leading-relaxed">
            Instantly auto-fills fields. Both use password <code className="text-slate-400 font-mono">password123</code>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
