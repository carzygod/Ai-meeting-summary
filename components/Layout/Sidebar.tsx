import React from 'react';
import { LayoutDashboard, Database, Users, GraduationCap, Settings } from 'lucide-react';
import { AppView, Language } from '../../types';
import { t } from '../../utils/i18n';

interface SidebarProps {
  currentView: AppView;
  onChangeView: (view: AppView) => void;
  lang: Language;
  setLanguage: (lang: Language) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onChangeView, lang }) => {
  const menuItems = [
    { id: AppView.DASHBOARD, label: t('dashboard', lang), icon: LayoutDashboard },
    { id: AppView.MEETING_ARCHIVE, label: t('meetingArchive', lang), icon: Database },
    { id: AppView.CRM_INTEL, label: t('crmIntel', lang), icon: Users },
    { id: AppView.TRAINING_SIMULATOR, label: t('trainingCenter', lang), icon: GraduationCap },
  ];

  return (
    <div className="w-64 bg-[#e0e5ec] text-slate-600 flex flex-col h-screen fixed left-0 top-0 z-40 border-r border-white/50 shadow-[5px_0_15px_rgba(0,0,0,0.05)]">
      <div className="p-8 pb-4">
        <h1 className="text-2xl font-black tracking-tight text-slate-700 flex items-center gap-2">
           <span className="text-neu-accent">Corp</span>Master
        </h1>
        <p className="text-xs text-slate-400 font-semibold tracking-widest mt-1 uppercase">Enterprise AI</p>
      </div>

      <nav className="flex-1 px-6 py-4 space-y-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all duration-300 ${
                isActive
                  ? 'text-neu-accent shadow-neu-pressed font-bold'
                  : 'text-slate-500 hover:text-neu-accent hover:shadow-neu-flat font-medium'
              }`}
            >
              <Icon size={20} className={isActive ? "text-neu-accent" : "text-slate-400"} />
              <span className="">{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-6">
        <button className="w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-slate-500 hover:text-neu-accent hover:shadow-neu-flat transition-all">
            <Settings size={20} />
            <span className="font-medium">{t('settings', lang)}</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
