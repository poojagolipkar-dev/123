import React, { useState, useEffect } from 'react';
import { Moon, Sun, Smartphone, Lock, User, Key, Shield, Check, X, Eye, EyeOff, LogOut, AlertCircle } from 'lucide-react';
import { updateCredentials, getCredentials, setPin, getPin, removePin, verifyPin, setAppLocked } from '../services/authService';

interface SettingsViewProps {
  darkMode: boolean;
  toggleTheme: () => void;
  showBottomNav: boolean;
  toggleBottomNav: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  darkMode, 
  toggleTheme, 
  showBottomNav, 
  toggleBottomNav,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security'>('general');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  
  // Security State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPasswords, setShowPasswords] = useState(false);
  
  // PIN State
  const [hasPin, setHasPin] = useState(false);
  const [pin, setLocalPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isSettingPin, setIsSettingPin] = useState(false);

  // Feedback State
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const creds = getCredentials();
    setCredentials(creds);
    setHasPin(!!getPin());
    setNewUsername(creds.username);
  }, []);

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verify current password
    if (currentPassword !== credentials.password) {
        showMessage('error', 'Incorrect current password');
        return;
    }

    if (newPassword && newPassword !== confirmPassword) {
        showMessage('error', 'New passwords do not match');
        return;
    }

    const finalUsername = newUsername || credentials.username;
    const finalPassword = newPassword || credentials.password;

    updateCredentials(finalUsername, finalPassword);
    setCredentials({ username: finalUsername, password: finalPassword });
    
    // Reset fields
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    
    showMessage('success', 'Profile updated successfully');
  };

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (pin.length < 4) {
        showMessage('error', 'PIN must be at least 4 digits');
        return;
    }

    if (pin !== confirmPin) {
        showMessage('error', 'PINs do not match');
        return;
    }

    setPin(pin);
    setHasPin(true);
    setIsSettingPin(false);
    setLocalPin('');
    setConfirmPin('');
    showMessage('success', 'App Lock PIN set successfully');
  };

  const handleRemovePin = () => {
    if (window.confirm('Are you sure you want to remove the App Lock?')) {
        removePin();
        setAppLocked(false);
        setHasPin(false);
        showMessage('success', 'App Lock removed');
    }
  };

  return (
    <div className="space-y-6 animate-enter p-1 md:p-5 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-slate-800 dark:text-white tracking-tight animate-slide-in">Settings</h2>
        <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm"
        >
            <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl mb-6 w-full md:w-fit">
        <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'general' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700'}`}
        >
            General
        </button>
        <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all ${activeTab === 'security' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700'}`}
        >
            Security
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 animate-fade-in flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />} // Note: AlertCircle needs import if used
            <span className="font-medium">{message.text}</span>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="grid gap-4 animate-slide-up">
            {/* Dark Mode Toggle */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-neutral-700 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${darkMode ? 'bg-slate-800 text-yellow-400' : 'bg-amber-100 text-amber-600'}`}>
                        {darkMode ? <Moon size={24} /> : <Sun size={24} />}
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Dark Mode</h3>
                        <p className="text-slate-500 dark:text-neutral-400 text-sm">Adjust the appearance to reduce eye strain</p>
                    </div>
                </div>
                <button 
                    onClick={toggleTheme}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${darkMode ? 'bg-blue-600' : 'bg-slate-200 dark:bg-neutral-700'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${darkMode ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Bottom Nav Toggle */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-neutral-700 flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${showBottomNav ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                        <Smartphone size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Floating Navigation</h3>
                        <p className="text-slate-500 dark:text-neutral-400 text-sm">Show the floating menu on mobile screens</p>
                    </div>
                </div>
                <button 
                    onClick={toggleBottomNav}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${showBottomNav ? 'bg-blue-600' : 'bg-slate-200 dark:bg-neutral-700'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${showBottomNav ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid gap-6 animate-slide-up">
            {/* App Lock Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-neutral-700">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${hasPin ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                            <Lock size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 dark:text-white text-lg">App Lock</h3>
                            <p className="text-slate-500 dark:text-neutral-400 text-sm">Secure the app with a PIN code</p>
                        </div>
                    </div>
                    {hasPin ? (
                        <button 
                            onClick={handleRemovePin}
                            className="px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-bold hover:bg-red-100 transition-colors"
                        >
                            Disable Lock
                        </button>
                    ) : (
                        <button 
                            onClick={() => setIsSettingPin(!isSettingPin)}
                            className="px-4 py-2 bg-blue-50 text-blue-600 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors"
                        >
                            {isSettingPin ? 'Cancel' : 'Setup PIN'}
                        </button>
                    )}
                </div>

                {isSettingPin && !hasPin && (
                    <form onSubmit={handlePinSubmit} className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-200 dark:border-neutral-700 animate-fade-in">
                        <h4 className="font-bold text-slate-700 dark:text-neutral-300 mb-4 text-sm uppercase tracking-wider">Set New PIN</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Enter PIN</label>
                                <input 
                                    type="password" 
                                    maxLength={6}
                                    value={pin}
                                    onChange={(e) => setLocalPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full p-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-center tracking-widest text-lg"
                                    placeholder="••••"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-500 mb-1">Confirm PIN</label>
                                <input 
                                    type="password" 
                                    maxLength={6}
                                    value={confirmPin}
                                    onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
                                    className="w-full p-3 bg-white dark:bg-neutral-800 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all font-mono text-center tracking-widest text-lg"
                                    placeholder="••••"
                                />
                            </div>
                        </div>
                        <button type="submit" className="w-full mt-4 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200 dark:shadow-blue-900/20">
                            Save PIN Code
                        </button>
                    </form>
                )}
            </div>

            {/* Credentials Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-neutral-700">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                        <User size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Account Credentials</h3>
                        <p className="text-slate-500 dark:text-neutral-400 text-sm">Update your login username and password</p>
                    </div>
                </div>

                <form onSubmit={handleUpdateProfile} className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Username</label>
                        <div className="relative">
                            <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type="text" 
                                value={newUsername}
                                onChange={(e) => setNewUsername(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white font-medium"
                            />
                        </div>
                    </div>

                    <div className="border-t border-slate-100 dark:border-neutral-700 my-4"></div>

                    <div>
                        <label className="block text-xs font-bold text-slate-500 mb-1">Current Password (Required)</label>
                        <div className="relative">
                            <Key size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input 
                                type={showPasswords ? "text" : "password"}
                                value={currentPassword}
                                onChange={(e) => setCurrentPassword(e.target.value)}
                                className="w-full pl-10 pr-10 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white font-medium"
                                placeholder="Enter current password to make changes"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPasswords(!showPasswords)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                            >
                                {showPasswords ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">New Password</label>
                            <input 
                                type={showPasswords ? "text" : "password"}
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white font-medium"
                                placeholder="Leave blank to keep current"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-500 mb-1">Confirm New Password</label>
                            <input 
                                type={showPasswords ? "text" : "password"}
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 transition-all text-slate-800 dark:text-white font-medium"
                                placeholder="Confirm new password"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <button 
                            type="submit" 
                            disabled={!currentPassword}
                            className={`px-6 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${!currentPassword ? 'bg-slate-300 dark:bg-neutral-700 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700 hover:scale-105 active:scale-95 shadow-indigo-200 dark:shadow-indigo-900/20'}`}
                        >
                            <Shield size={18} /> Update Credentials
                        </button>
                    </div>
                </form>
            </div>
        </div>
      )}
    </div>
  );
};

export default SettingsView;
