import React, { useState, useEffect } from 'react';
import { Moon, Sun, Smartphone, Lock, User, Key, Shield, Check, X, Eye, EyeOff, LogOut, AlertCircle, Database, RefreshCw, Link, Save, Activity } from 'lucide-react';
import { updateCredentials, getCredentials, setPin, getPin, removePin, verifyPin, setAppLocked } from '../services/authService';
import { getSyncSettings, saveSyncSettings, performSync, restoreFromGoogleSheet, SyncSettings } from '../services/syncService';

interface SettingsViewProps {
  darkMode: boolean;
  toggleTheme: () => void;
  showBottomNav: boolean;
  toggleBottomNav: () => void;
  autoHideNav: boolean;
  toggleAutoHideNav: () => void;
  onLogout: () => void;
}

const SettingsView: React.FC<SettingsViewProps> = ({ 
  darkMode, 
  toggleTheme, 
  showBottomNav, 
  toggleBottomNav,
  autoHideNav,
  toggleAutoHideNav,
  onLogout
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'security' | 'sync'>('general');
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [refreshRateTrigger, setRefreshRateTrigger] = useState(0);
  
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

  // Sync State
  const [syncSettings, setSyncSettings] = useState<SyncSettings>({ enabled: false, scriptUrl: '', autoSyncInterval: 60 });
  const [isSyncing, setIsSyncing] = useState(false);

  // Feedback State
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  useEffect(() => {
    const creds = getCredentials();
    setCredentials(creds);
    setHasPin(!!getPin());
    setNewUsername(creds.username);
    setSyncSettings(getSyncSettings());
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

  const handleSyncSettingsSave = () => {
      saveSyncSettings(syncSettings);
      showMessage('success', 'Sync settings saved');
  };

  const handleManualSync = async () => {
      setIsSyncing(true);
      const result = await performSync();
      setIsSyncing(false);
      
      if (result.success) {
          showMessage('success', result.message);
          setSyncSettings(getSyncSettings()); // Refresh to get last synced time
      } else {
          showMessage('error', result.message);
      }
  };

  const handleRestore = async () => {
      if (window.confirm('This will overwrite your local data with data from Google Sheets. Are you sure?')) {
          setIsSyncing(true);
          const result = await restoreFromGoogleSheet();
          setIsSyncing(false);
          
          if (result.success) {
              showMessage('success', result.message);
              // Optionally reload or refresh data
              window.location.reload();
          } else {
              showMessage('error', result.message);
          }
      }
  };

  return (
    <div className="space-y-6 animate-enter p-1 md:p-5 pb-24">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white tracking-tight animate-slide-in">Settings</h2>
        <button 
            onClick={onLogout}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors font-medium text-sm"
        >
            <LogOut size={16} /> Logout
        </button>
      </div>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 dark:bg-neutral-800 rounded-xl mb-6 w-full md:w-fit overflow-x-auto">
        <button 
            onClick={() => setActiveTab('general')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'general' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700'}`}
        >
            General
        </button>
        <button 
            onClick={() => setActiveTab('security')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'security' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700'}`}
        >
            Security
        </button>
        <button 
            onClick={() => setActiveTab('sync')}
            className={`flex-1 md:flex-none px-6 py-2.5 rounded-lg text-sm font-bold transition-all whitespace-nowrap ${activeTab === 'sync' ? 'bg-white dark:bg-neutral-700 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 dark:text-neutral-400 hover:text-slate-700'}`}
        >
            Data Sync
        </button>
      </div>

      {message && (
        <div className={`p-4 rounded-xl mb-6 animate-fade-in flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
            {message.type === 'success' ? <Check size={20} /> : <AlertCircle size={20} />}
            <span className="font-medium">{message.text}</span>
        </div>
      )}

      {activeTab === 'general' && (
        <div className="grid gap-4 animate-slide-up">
            {/* Dark Mode Toggle */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-crm-border flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
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
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-crm-border flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
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

            {/* Auto-Hide Nav Toggle */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-crm-border flex items-center justify-between group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${autoHideNav ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-400'}`}>
                        <RefreshCw size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Auto-Hide Menu</h3>
                        <p className="text-slate-500 dark:text-neutral-400 text-sm">Automatically hide the menu when idle</p>
                    </div>
                </div>
                <button 
                    onClick={toggleAutoHideNav}
                    className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${autoHideNav ? 'bg-blue-600' : 'bg-slate-200 dark:bg-neutral-700'}`}
                >
                    <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${autoHideNav ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
            </div>

            {/* Refresh Rate Selection */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-5 shadow-sm border border-slate-100 dark:border-crm-border flex flex-col gap-4 group hover:border-blue-200 dark:hover:border-blue-900 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                        <Activity size={24} />
                    </div>
                    <div>
                        <h3 className="font-bold text-slate-800 dark:text-white text-lg">Refresh Rate</h3>
                        <p className="text-slate-500 dark:text-neutral-400 text-sm">Adjust frame rate limit for performance</p>
                    </div>
                </div>
                
                <div className="grid grid-cols-4 gap-2 bg-slate-50 dark:bg-neutral-900 p-1.5 rounded-xl">
                    {['auto', '60', '90', '120'].map((rate) => {
                        const currentRate = localStorage.getItem('preferredRefreshRate') || 'auto';
                        const isActive = currentRate === rate;
                        return (
                            <button
                                key={rate}
                                onClick={() => {
                                    localStorage.setItem('preferredRefreshRate', rate);
                                    window.dispatchEvent(new Event('refreshRateChanged'));
                                    // Force re-render
                                    setActiveTab('general'); 
                                    // Small hack to force update without adding state just for this if we want to keep it simple, 
                                    // but better to use state. Let's assume we add state in the component.
                                    setRefreshRateTrigger(prev => prev + 1);
                                }}
                                className={`py-2 rounded-lg text-xs font-bold transition-all ${
                                    isActive 
                                    ? 'bg-white dark:bg-neutral-700 text-purple-600 dark:text-white shadow-sm' 
                                    : 'text-slate-500 dark:text-neutral-500 hover:text-slate-700 dark:hover:text-neutral-300'
                                }`}
                            >
                                {rate === 'auto' ? 'Auto' : `${rate}Hz`}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
      )}

      {activeTab === 'security' && (
        <div className="grid gap-6 animate-slide-up">
            {/* App Lock Section */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-crm-border">
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
                    
                    {/* Toggle Switch for App Lock */}
                    <button 
                        onClick={() => {
                            if (hasPin) {
                                handleRemovePin();
                            } else {
                                setIsSettingPin(true);
                            }
                        }}
                        className={`w-14 h-8 rounded-full p-1 transition-colors duration-300 ease-in-out ${hasPin ? 'bg-emerald-500' : 'bg-slate-200 dark:bg-neutral-700'}`}
                    >
                        <div className={`w-6 h-6 bg-white rounded-full shadow-md transform transition-transform duration-300 ${hasPin ? 'translate-x-6' : 'translate-x-0'}`} />
                    </button>
                </div>

                {isSettingPin && !hasPin && (
                    <form onSubmit={handlePinSubmit} className="bg-slate-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-slate-200 dark:border-neutral-700 animate-fade-in mt-4">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-bold text-slate-700 dark:text-neutral-300 text-sm uppercase tracking-wider">Set New PIN</h4>
                            <button 
                                type="button"
                                onClick={() => setIsSettingPin(false)}
                                className="text-slate-400 hover:text-slate-600 dark:hover:text-neutral-300"
                            >
                                <X size={16} />
                            </button>
                        </div>
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
                                    autoFocus
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
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-crm-border">
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

      {activeTab === 'sync' && (
          <div className="grid gap-6 animate-slide-up">
              <div className="bg-white dark:bg-neutral-800 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-crm-border">
                  <div className="flex items-center gap-4 mb-6">
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                          <Database size={24} />
                      </div>
                      <div>
                          <h3 className="font-bold text-slate-800 dark:text-white text-lg">Google Sheet Sync</h3>
                          <p className="text-slate-500 dark:text-neutral-400 text-sm">Automatically sync your data to Google Sheets</p>
                      </div>
                  </div>

                  <div className="space-y-4">
                      <div>
                          <label className="block text-xs font-bold text-slate-500 mb-1">Google Apps Script URL</label>
                          <div className="relative">
                              <Link size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                  type="text" 
                                  value={syncSettings.scriptUrl}
                                  onChange={(e) => setSyncSettings({...syncSettings, scriptUrl: e.target.value})}
                                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all text-slate-800 dark:text-white font-medium"
                                  placeholder="https://script.google.com/macros/s/..."
                              />
                          </div>
                          <p className="text-[10px] text-slate-400 mt-1">Deploy your Google Apps Script as a Web App and paste the URL here.</p>
                      </div>

                      <div className="flex items-center justify-between bg-slate-50 dark:bg-neutral-900 p-4 rounded-xl border border-slate-200 dark:border-neutral-700">
                          <div>
                              <h4 className="font-bold text-slate-800 dark:text-white text-sm">Automatic Sync</h4>
                              <p className="text-xs text-slate-500 dark:text-neutral-400">Sync data in background periodically</p>
                          </div>
                          <button 
                              onClick={() => setSyncSettings({...syncSettings, enabled: !syncSettings.enabled})}
                              className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ease-in-out ${syncSettings.enabled ? 'bg-green-500' : 'bg-slate-300 dark:bg-neutral-700'}`}
                          >
                              <div className={`w-4 h-4 bg-white rounded-full shadow-md transform transition-transform duration-300 ${syncSettings.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                      </div>

                      {syncSettings.enabled && (
                          <div>
                              <label className="block text-xs font-bold text-slate-500 mb-1">Sync Frequency (Minutes)</label>
                              <input 
                                  type="number" 
                                  min="15"
                                  value={syncSettings.autoSyncInterval}
                                  onChange={(e) => setSyncSettings({...syncSettings, autoSyncInterval: parseInt(e.target.value) || 60})}
                                  className="w-full px-4 py-3 bg-slate-50 dark:bg-neutral-900 border border-slate-200 dark:border-neutral-700 rounded-xl outline-none focus:ring-2 focus:ring-green-500 transition-all text-slate-800 dark:text-white font-medium"
                              />
                          </div>
                      )}

                      <div className="pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
                          <button 
                              onClick={handleSyncSettingsSave}
                              className="py-4 px-6 bg-slate-900 dark:bg-white text-white dark:text-black font-bold rounded-2xl hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 active:scale-95"
                          >
                              <Save size={20} />
                              <span>Save Config</span>
                          </button>
                          
                          <button 
                              onClick={handleManualSync}
                              disabled={isSyncing || !syncSettings.scriptUrl}
                              className={`py-4 px-6 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border-2 active:scale-95 ${isSyncing ? 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed' : 'bg-white dark:bg-neutral-800 text-green-600 dark:text-green-400 border-green-100 dark:border-green-900/30 hover:border-green-500 dark:hover:border-green-500 hover:shadow-md hover:-translate-y-0.5'}`}
                          >
                              <RefreshCw size={20} className={isSyncing ? 'animate-spin' : ''} /> 
                              <span>{isSyncing ? 'Syncing...' : 'Sync Data'}</span>
                          </button>

                          <button 
                              onClick={handleRestore}
                              disabled={isSyncing || !syncSettings.scriptUrl}
                              className={`py-4 px-6 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all border-2 active:scale-95 ${isSyncing ? 'bg-slate-100 text-slate-400 border-transparent cursor-not-allowed' : 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/30 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md hover:-translate-y-0.5'}`}
                          >
                              <Database size={20} /> 
                              <span>Restore Data</span>
                          </button>
                      </div>

                      {syncSettings.lastSynced && (
                          <p className="text-center text-xs text-slate-400 mt-2">
                              Last synced: {syncSettings.lastSynced}
                          </p>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default SettingsView;
