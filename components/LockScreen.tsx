import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete, AlertCircle } from 'lucide-react';
import { verifyPin, getPin } from '../services/authService';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onLogout }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);

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
    <div className="fixed inset-0 bg-slate-900 z-[200] flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-xs flex flex-col items-center animate-enter">
        <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-6 shadow-xl border border-crm-border">
          <Lock size={32} className="text-blue-500" />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">App Locked</h2>
        <p className="text-slate-400 text-sm mb-8">Enter your 4-digit PIN to unlock</p>

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
            onClick={onLogout}
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
      </div>
    </div>
  );
};

export default LockScreen;
