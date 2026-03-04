
import React, { useState, useEffect } from 'react';
import { User, Lock, LogIn, Eye, EyeOff, ShieldCheck, HelpCircle, AlertTriangle, CheckCircle, Fingerprint, Smartphone, Mail, ArrowLeft } from 'lucide-react';
import { login, resetCredentials, initAuth, RECOVERY_EMAIL } from '../services/authService';

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
  const [recoveryEmail, setRecoveryEmail] = useState(RECOVERY_EMAIL);
  const [recoveryMsg, setRecoveryMsg] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    initAuth();
    // Check if biometric authentication is supported
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsBiometricSupported(available));
    }
  }, []);

  const handleBiometricLogin = async () => {
    try {
      // Simulate biometric authentication
      // In a real app, this would use WebAuthn
      onLogin();
    } catch (err) {
      console.error('Biometric error:', err);
      setError('Biometric authentication failed');
    }
  };

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
      setIsSending(true);
      setRecoveryMsg('');
      
      // Simulate sending reset link
      setTimeout(() => {
          setIsSending(false);
          setRecoveryMsg(`Success! A password reset link has been sent to ${recoveryEmail}`);
          setTimeout(() => {
              setShowRecovery(false);
              setRecoveryMsg('');
          }, 5000);
      }, 2000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-black p-4 relative overflow-hidden">
      {/* Background Ambience */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-500/10 rounded-full blur-[100px] animate-blob"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[100px] animate-blob animation-delay-2000"></div>
      </div>

      <div className="bg-white/80 dark:bg-neutral-900/80 backdrop-blur-md w-full max-w-md p-8 rounded-3xl shadow-2xl border border-white/20 dark:border-crm-border relative z-10 animate-scale-in">
         <div className="text-center mb-8">
            <div className="w-20 h-20 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/30 mb-4 transform rotate-3">
                <ShieldCheck size={40} className="text-white" />
            </div>
            <h1 className="text-3xl font-extrabold text-slate-800 dark:text-white tracking-tight">Welcome Back</h1>
            <p className="text-slate-500 dark:text-neutral-400 text-sm font-medium mt-2">Sign in to Shree CRM</p>
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
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800 dark:text-white"
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
                            className="w-full pl-12 pr-12 py-3.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800 dark:text-white"
                        />
                        <button 
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                        >
                            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                        </button>
                    </div>
                </div>

                <div className="flex justify-between items-center text-sm">
                    <label className="flex items-center gap-2 cursor-pointer text-slate-600 dark:text-neutral-400 font-medium select-none">
                        <input 
                            type="checkbox" 
                            checked={rememberMe}
                            onChange={(e) => setRememberMe(e.target.checked)}
                            className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        Keep me logged in
                    </label>
                    <button type="button" onClick={() => setShowRecovery(true)} className="text-blue-600 dark:text-blue-400 hover:underline font-bold text-xs">
                        Forgot Password?
                    </button>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-500 dark:text-red-400 p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-enter">
                        <AlertTriangle size={18} /> {error}
                    </div>
                )}

                <button 
                    type="submit"
                    className="w-full bg-slate-900 dark:bg-white text-white dark:text-black py-4 rounded-xl font-bold text-lg shadow-xl shadow-slate-300 dark:shadow-none hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
                >
                    <LogIn size={20} /> Login
                </button>

                {/* Biometric Login Option */}
                <div className="pt-4 flex flex-col items-center gap-4">
                    <div className="flex items-center gap-4 w-full">
                        <div className="h-px flex-1 bg-slate-200 dark:bg-neutral-800"></div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Or Secure Access</span>
                        <div className="h-px flex-1 bg-slate-200 dark:bg-neutral-800"></div>
                    </div>
                    
                    <button 
                        type="button"
                        onClick={handleBiometricLogin}
                        className="flex items-center gap-3 px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 rounded-2xl border border-blue-500/20 transition-all active:scale-95 group w-full justify-center"
                    >
                        <div className="flex items-center gap-2">
                            <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                            <Smartphone size={16} className="group-hover:scale-110 transition-transform" />
                        </div>
                        <span className="font-bold text-sm">Biometric Unlock</span>
                    </button>
                </div>
             </form>
         ) : (
             <form onSubmit={handleRecovery} className="space-y-5 animate-enter">
                 <div className="text-center mb-6">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-2 text-blue-600 dark:text-blue-400">
                        <Mail size={24} />
                    </div>
                    <h3 className="font-bold text-slate-800 dark:text-white">Forgot Password?</h3>
                    <p className="text-xs text-slate-500 dark:text-neutral-400 mt-1">Enter your email to receive a reset link</p>
                 </div>
 
                 <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-neutral-500 ml-1 uppercase">Email Address</label>
                    <div className="relative">
                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                            <Mail size={18} />
                        </div>
                        <input 
                            type="email" 
                            value={recoveryEmail}
                            onChange={(e) => setRecoveryEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-medium text-slate-800 dark:text-white"
                        />
                    </div>
                </div>
 
                {recoveryMsg && (
                    <div className={`p-3 rounded-xl text-sm font-bold flex items-center gap-2 animate-enter ${recoveryMsg.includes('Success') ? 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400' : 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400'}`}>
                         {recoveryMsg.includes('Success') ? <CheckCircle size={18}/> : <AlertTriangle size={18}/>}
                         {recoveryMsg}
                    </div>
                )}
 
                <div className="flex flex-col gap-3">
                    <button 
                        type="submit"
                        disabled={isSending}
                        className="w-full py-4 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 dark:shadow-none hover:bg-blue-700 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isSending ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            'Send Reset Link'
                        )}
                    </button>
                    <button 
                        type="button" 
                        onClick={() => { setShowRecovery(false); setRecoveryMsg(''); }}
                        className="w-full py-3 bg-slate-100 dark:bg-neutral-800 text-slate-600 dark:text-neutral-300 font-bold rounded-xl flex items-center justify-center gap-2"
                    >
                        <ArrowLeft size={16} /> Back to Login
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
