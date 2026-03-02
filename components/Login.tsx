
import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, Eye, EyeOff, ShieldCheck, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { login, resetCredentials, initAuth } from '../services/authService';

interface LoginProps {
  onLogin: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('admin');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [showRecovery, setShowRecovery] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryMsg, setRecoveryMsg] = useState('');

  useEffect(() => {
    initAuth();
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (login(username, password, rememberMe)) {
      onLogin();
    } else {
      setError('Invalid username or password');
      setTimeout(() => setError(''), 3000);
    }
  };

  const handleRecovery = (e: React.FormEvent) => {
      e.preventDefault();
      // Hardcoded recovery key for demo purposes
      if (recoveryKey === 'admin123' || recoveryKey === 'shree') {
          resetCredentials();
          setRecoveryMsg('Success! Credentials reset to: admin / admin');
          setTimeout(() => {
              setShowRecovery(false);
              setRecoveryMsg('');
              setRecoveryKey('');
          }, 3000);
      } else {
          setRecoveryMsg('Invalid Recovery Key');
      }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#1E1E1E] dark:bg-black p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/5 rounded-full blur-[100px] animate-blob"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/5 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="bg-white/5 dark:bg-neutral-900 w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/10 dark:border-crm-border relative z-10 animate-scale-in backdrop-blur-sm">
         <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
                <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-white dark:text-white tracking-tight">Welcome Back</h1>
            <p className="text-slate-400 dark:text-neutral-400 text-sm font-medium mt-2">Sign in to Shree CRM</p>
         </div>

         {!showRecovery ? (
             <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-neutral-500 ml-1 uppercase">Username</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <User size={20} />
                        </div>
                        <input 
                            type="text" 
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter username"
                            className="w-full pl-12 pr-4 py-3.5 bg-white/5 dark:bg-neutral-800 border border-white/10 dark:border-neutral-700 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-white dark:text-white"
                        />
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-neutral-500 ml-1 uppercase">Password</label>
                    <div className="relative group">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors">
                            <Lock size={20} />
                        </div>
                        <input 
                            type={showPassword ? "text" : "password"} 
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter password"
                            className="w-full pl-12 pr-12 py-3.5 bg-white/5 dark:bg-neutral-800 border border-white/10 dark:border-neutral-700 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-white dark:text-white"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 dark:hover:text-neutral-300"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-400 dark:text-neutral-400 font-medium select-none">
                        <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-white/10 bg-white/5 text-blue-600 focus:ring-blue-500"
                        />
                        Keep me logged in
                    </label>
                    <button type="button" onClick={() => setShowRecovery(true)} className="text-blue-400 dark:text-blue-400 hover:underline font-bold text-xs">
                        Forgot Password?
                    </button>
                </div>

                {error && (
                    <div className="bg-red-500/10 dark:bg-red-900/20 text-red-400 dark:text-red-400 p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-enter">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full bg-white dark:bg-white text-black dark:text-black py-4 rounded-xl font-bold text-lg shadow-xl shadow-black/20 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <LogIn size={20} /> Login
                </button>
             </form>
         ) : (
             <form onSubmit={handleRecovery} className="space-y-5 animate-enter">
                 <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-amber-500/10 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-2 text-amber-400 dark:text-amber-400">
                        <HelpCircle size={24} />
                    </div>
                    <h3 className="font-bold text-white dark:text-white">Recover Account</h3>
                    <p className="text-xs text-slate-400 dark:text-neutral-400 mt-1">Enter Master Key to reset credentials</p>
                 </div>

                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-neutral-500 ml-1 uppercase">Recovery Key</label>
                    <input 
                        type="password" 
                        value={recoveryKey}
                        onChange={(e) => setRecoveryKey(e.target.value)}
                        placeholder="Enter key (Try 'admin123')"
                        className="w-full px-4 py-3.5 bg-white/5 dark:bg-neutral-800 border border-white/10 dark:border-neutral-700 rounded-xl outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all font-medium text-white dark:text-white"
                    />
                </div>

                {recoveryMsg && (
                    <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-enter ${recoveryMsg.includes('Success') ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                         {recoveryMsg.includes('Success') ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
                         {recoveryMsg}
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <button 
                        type="button" 
                        onClick={() => { setShowRecovery(false); setRecoveryMsg(''); }}
                        className="py-3 bg-white/5 dark:bg-neutral-800 text-slate-300 dark:text-neutral-300 font-bold rounded-xl border border-white/10"
                    >
                        Back
                    </button>
                    <button 
                        type="submit"
                        className="py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 dark:shadow-none"
                    >
                        Reset
                    </button>
                </div>
             </form>
         )}
         
         <div className="mt-8 text-center text-xs text-slate-400 font-medium">
             &copy; {new Date().getFullYear()} Shree Self Driving CRM
         </div>
      </div>
    </div>
  );
};

export default Login;
