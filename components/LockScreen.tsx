import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete, AlertCircle, Mail, Key, ArrowLeft, CheckCircle } from 'lucide-react';
import { verifyPin, getPin, RECOVERY_EMAIL, verifyRecoveryKey, removePin } from '../services/authService';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onLogout }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  
  // Recovery State
  const [isRecovering, setIsRecovering] = useState(false);
  const [recoveryKey, setRecoveryKey] = useState('');
  const [recoveryStep, setRecoveryStep] = useState<'request' | 'verify' | 'success'>('request');

  const handleNumberClick = (num: number) => {
    if (pin.length < 4) {
      setPin(prev => prev + num);
      setError('');
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError('');
  };

  const [isSending, setIsSending] = useState(false);

  const handleRequestRecovery = () => {
    // Simulate sending email with a small delay
    setError('');
    setIsSending(true);
    
    setTimeout(() => {
      setRecoveryStep('verify');
      setIsSending(false);
    }, 1500);
  };

  const handleVerifyRecovery = () => {
    if (verifyRecoveryKey(recoveryKey)) {
      setRecoveryStep('success');
      setError('');
      // Reset PIN
      removePin();
    } else {
      setError('Invalid Recovery Key');
      setShake(true);
      setTimeout(() => setShake(false), 500);
    }
  };

  const handleUnlock = () => {
    if (verifyPin(pin)) {
      onUnlock();
    } else {
      setError('Incorrect PIN');
      setShake(true);
      setTimeout(() => setShake(false), 500);
      setPin('');
    }
  };

  useEffect(() => {
    if (pin.length === 4) {
      handleUnlock();
    }
  }, [pin]);

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs flex flex-col items-center animate-enter">
        {!isRecovering ? (
          <>
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-crm-border">
              <Lock size={32} className="text-blue-500" />
            </div>
            
            <h2 className="text-2xl font-bold text-white mb-2">App Locked</h2>
            <p className="text-slate-400 text-sm mb-8 text-center">Enter your 4-digit PIN to unlock</p>

            {/* PIN Dots */}
            <div className={`flex gap-4 mb-8 ${shake ? 'animate-shake' : ''}`}>
              {[0, 1, 2, 3].map((i) => (
                <div 
                  key={i} 
                  className={`w-4 h-4 rounded-full transition-all duration-300 ${
                    pin.length > i ? 'bg-blue-500 scale-110' : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>

            {error && (
              <div className="text-red-500 text-sm font-medium mb-4 flex items-center gap-2 animate-pulse">
                <AlertCircle size={14} /> {error}
              </div>
            )}

            {/* Keypad */}
            <div className="grid grid-cols-3 gap-4 w-full mb-8">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  onClick={() => handleNumberClick(num)}
                  className="h-16 rounded-full bg-slate-800/50 text-white text-2xl font-medium hover:bg-slate-700 active:scale-95 transition-all border border-slate-700/50"
                >
                  {num}
                </button>
              ))}
              <button 
                onClick={() => setIsRecovering(true)}
                className="h-16 rounded-full text-xs font-bold text-slate-500 hover:text-white transition-colors flex flex-col items-center justify-center"
              >
                FORGOT?
              </button>
              <button
                onClick={() => handleNumberClick(0)}
                className="h-16 rounded-full bg-slate-800/50 text-white text-2xl font-medium hover:bg-slate-700 active:scale-95 transition-all border border-slate-700/50"
              >
                0
              </button>
              <button
                onClick={handleBackspace}
                className="h-16 rounded-full text-slate-400 hover:text-white hover:bg-slate-800/30 transition-colors flex items-center justify-center active:scale-95"
              >
                <Delete size={24} />
              </button>
            </div>
          </>
        ) : (
          <div className="w-full bg-slate-800/50 p-8 rounded-[2.5rem] border border-crm-border shadow-2xl animate-enter">
            <button 
                onClick={() => { setIsRecovering(false); setRecoveryStep('request'); }}
                className="mb-6 text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold transition-colors"
            >
                <ArrowLeft size={16} /> Back to PIN
            </button>

            {recoveryStep === 'request' && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Mail size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Account Recovery</h3>
                    <p className="text-slate-400 text-sm mb-8">
                        We will send a recovery key to <br/>
                        <span className="text-blue-400 font-bold">{RECOVERY_EMAIL}</span>
                    </p>
                    <button 
                        onClick={handleRequestRecovery}
                        disabled={isSending}
                        className={`w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95 flex items-center justify-center gap-2 ${isSending ? 'opacity-70 cursor-not-allowed' : ''}`}
                    >
                        {isSending ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                Sending...
                            </>
                        ) : (
                            'Send Recovery Key'
                        )}
                    </button>
                </div>
            )}

            {recoveryStep === 'verify' && (
                <div>
                    <div className="w-16 h-16 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Key size={32} className="text-blue-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 text-center">Verify Key</h3>
                    <p className="text-slate-400 text-xs mb-6 text-center">
                        Enter the recovery key sent to <br/>
                        <span className="text-blue-400 font-bold">{RECOVERY_EMAIL}</span>
                    </p>
                    
                    <div className="space-y-4">
                        <input 
                            type="text"
                            placeholder="Enter Recovery Key"
                            value={recoveryKey}
                            onChange={(e) => setRecoveryKey(e.target.value)}
                            className={`w-full p-4 bg-slate-900 border ${shake ? 'border-red-500' : 'border-slate-700'} rounded-2xl outline-none focus:ring-2 focus:ring-blue-500 text-white font-bold text-center tracking-widest uppercase transition-all`}
                        />
                        {error && <p className="text-red-500 text-xs font-bold text-center">{error}</p>}
                        <button 
                            onClick={handleVerifyRecovery}
                            className="w-full py-4 bg-blue-600 text-white font-bold rounded-2xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-500/20 active:scale-95"
                        >
                            Verify & Reset PIN
                        </button>
                    </div>
                </div>
            )}

            {recoveryStep === 'success' && (
                <div className="text-center">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle size={32} className="text-emerald-500" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">PIN Reset!</h3>
                    <p className="text-slate-400 text-sm mb-8">
                        Your App Lock has been disabled. You can set a new PIN in Settings.
                    </p>
                    <button 
                        onClick={onUnlock}
                        className="w-full py-4 bg-emerald-600 text-white font-bold rounded-2xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                    >
                        Enter CRM
                    </button>
                </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default LockScreen;
