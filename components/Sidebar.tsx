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
    <aside className="hidden md:flex flex-col w-64 bg-[#1E1E1E] dark:bg-neutral-900 border-r border-white/5 dark:border-crm-border h-screen transition-colors duration-300">
      <div className="p-6 flex items-center gap-3">
        <Logo size="md" />
        <div>
          <h1 className="font-black text-white dark:text-white tracking-tighter leading-none text-base font-mono">SHREE SELF DRIVING</h1>
          <p className="text-[10px] font-bold text-slate-500 dark:text-neutral-500 uppercase tracking-widest mt-0.5 font-mono">& CAR RENTAL SERVICE</p>
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
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${
                isActive
                  ? 'bg-white dark:bg-white text-slate-900 dark:text-slate-900 shadow-lg shadow-white/10 dark:shadow-none font-bold'
                  : 'text-slate-400 dark:text-neutral-400 hover:bg-white/5 dark:hover:bg-neutral-800 hover:text-white dark:hover:text-white'
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

      <div className="p-6 border-t border-white/5 dark:border-crm-border">
        <div className="bg-white/5 dark:bg-neutral-800/50 rounded-2xl p-4">
          <p className="text-[10px] font-bold text-slate-500 dark:text-neutral-400 uppercase mb-2">System Status</p>
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs font-medium text-slate-300 dark:text-neutral-300">All Systems Online</span>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
