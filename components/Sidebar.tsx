import React from 'react';
import { ViewState } from '../types';
import { LucideIcon } from 'lucide-react';
import Logo from './Logo';

interface NavItem {
  id: string;
  icon: LucideIcon;
  label: string;
}

interface SidebarProps {
  navItems: NavItem[];
  currentView: ViewState;
  onViewChange: (view: ViewState) => void;
  darkMode: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ navItems, currentView, onViewChange, darkMode }) => {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-neutral-900 border-r border-slate-200 dark:border-crm-border h-screen transition-colors duration-300">
      <div className="p-6 flex items-center gap-3">
        <Logo size="md" />
        <div>
          <h1 className="font-bold text-slate-900 dark:text-white tracking-tight leading-none text-lg font-display">SHREE SELF DRIVING</h1>
          <p className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-[0.2em] mt-1 font-sans opacity-80">& CAR RENTAL SERVICE</p>
        </div>
      </div>

      <nav className="flex-1 px-4 py-4 space-y-2">
        {navItems.map((item) => {
          const isActive = currentView === item.id;
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id as ViewState)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-bold'
                  : 'text-slate-500 dark:text-neutral-400 hover:bg-slate-50 dark:hover:bg-neutral-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon 
                size={20} 
                className={`transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-110'}`} 
              />
              <span className="text-sm">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
              )}
            </button>
          );
        })}
      </nav>

      <div className="p-6 border-t border-slate-100 dark:border-crm-border">
        <div className="bg-slate-50 dark:bg-neutral-800/50 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-400 dark:text-neutral-500 uppercase mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-600 dark:text-neutral-300">All Systems Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
