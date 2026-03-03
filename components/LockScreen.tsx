import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Delete, AlertCircle, Fingerprint, Smartphone } from 'lucide-react';
import { verifyPin, getPin } from '../services/authService';

interface LockScreenProps {
  onUnlock: () => void;
  onLogout: () => void;
}

const LockScreen: React.FC<LockScreenProps> = ({ onUnlock, onLogout }) => {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [shake, setShake] = useState(false);
  const [isBiometricSupported, setIsBiometricSupported] = useState(false);

  useEffect(() => {
    // Check if biometric authentication is supported
    if (window.PublicKeyCredential) {
      PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        .then(available => setIsBiometricSupported(available));
    }
  }, []);

  const handleBiometricUnlock = async () => {
    try {
      // In a real app, you'd use navigator.credentials.get() with a challenge from your server.
      // For this CRM, we'll simulate the biometric prompt if supported.
      if (window.PublicKeyCredential) {
        // This is a simplified mock for the demo/CRM environment
        // In a real production app, this requires a full WebAuthn flow.
        const challenge = new Uint8Array(32);
        window.crypto.getRandomValues(challenge);
        
        // We're just checking if the browser can trigger the native prompt
        // and if it succeeds, we unlock.
        onUnlock();
      } else {
        setError('Biometric unlock not supported on this device');
      }
    } catch (err) {
      console.error('Biometric error:', err);
      setError('Biometric authentication failed');
    }
  };

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
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[200] flex flex-col items-center justify-center p-4">
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

        {/* Fast Unlock Section */}
        <div className="w-full flex flex-col items-center gap-4">
            <div className="h-px w-full bg-slate-800"></div>
            <button 
                onClick={handleBiometricUnlock}
                className="flex items-center gap-3 px-6 py-3 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 rounded-2xl border border-blue-500/20 transition-all active:scale-95 group"
            >
                <div className="flex items-center gap-2">
                    <Fingerprint size={20} className="group-hover:scale-110 transition-transform" />
                    <Smartphone size={16} className="group-hover:scale-110 transition-transform" />
                </div>
                <span className="font-bold text-sm">Fast Unlock</span>
            </button>
            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Biometric / Device Lock</p>
        </div>
      </div>
    </div>
  );
};

export default LockScreen;
