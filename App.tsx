import React, { useState } from 'react';
import Sidebar from './components/Layout/Sidebar';
import Dashboard from './components/Dashboard';
import MeetingArchive from './components/MeetingArchive';
import CustomerIntel from './components/CustomerIntel';
import TrainingSimulator from './components/TrainingSimulator';
import { AppView, Language, CustomerProfile } from './types';
import { Globe } from 'lucide-react';
import { analyzeCustomerData } from './services/geminiService';

// Initial Mock Data moved here
const INITIAL_CUSTOMERS: CustomerProfile[] = [
    {
      id: '1', name: 'Acme Corp', industry: 'Logistics', 
      painPoints: ['High shipping costs'], personalityTraits: [], 
      lastContact: '2 days ago', status: 'Active', notes: ''
    },
    {
      id: '2', name: 'TechGlobal Inc', industry: 'Software', 
      painPoints: ['Scaling issues'], personalityTraits: [], 
      lastContact: '1 week ago', status: 'Lead', notes: ''
    },
];

function App() {
  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);
  const [language, setLanguage] = useState<Language>('en');
  
  // Shared Customer State
  const [customers, setCustomers] = useState<CustomerProfile[]>(INITIAL_CUSTOMERS);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Handle Training Completion
  const handleTrainingSessionEnd = async (transcript: string, customerName: string) => {
    // 1. Create a temporary ID
    const newId = Date.now().toString();
    
    // 2. We could run the analysis here immediately to populate the profile
    // Or pass the raw data to CRM to analyze on load. 
    // Let's run a quick pre-analysis or just create the shell and let CRM expand it.
    // For better UX, we'll create the shell and trigger analysis inside CRM component or pass data.
    
    const newCustomer: CustomerProfile = {
        id: newId,
        name: customerName,
        industry: 'Pending Analysis',
        painPoints: [],
        personalityTraits: [],
        lastContact: 'Just now',
        status: 'Lead',
        notes: 'Generated from Training Session',
        conversationLogs: [{
            date: new Date().toISOString(),
            summary: 'Training Simulation',
            fullText: transcript
        }]
    };

    // 3. Update State
    setCustomers(prev => [newCustomer, ...prev]);
    
    // 4. Navigate
    setSelectedCustomerId(newId);
    setCurrentView(AppView.CRM_INTEL);
  };

  const renderView = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard lang={language} />;
      case AppView.MEETING_ARCHIVE:
        return <MeetingArchive lang={language} />;
      case AppView.CRM_INTEL:
        return (
            <CustomerIntel 
                lang={language} 
                customers={customers}
                initialSelectedId={selectedCustomerId}
                onSelectionChange={setSelectedCustomerId}
            />
        );
      case AppView.TRAINING_SIMULATOR:
        return <TrainingSimulator lang={language} onEndSession={handleTrainingSessionEnd} />;
      default:
        return <Dashboard lang={language} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-[#e0e5ec] text-slate-700 font-sans transition-colors duration-300">
      <Sidebar currentView={currentView} onChangeView={setCurrentView} lang={language} setLanguage={setLanguage} />
      
      <main className="flex-1 ml-64 p-8 overflow-y-auto h-screen relative">
        {/* Top Decoration */}
        <div className="fixed top-0 right-0 p-8 z-20 flex gap-4 pointer-events-none">
             {/* Floating Blobs for aesthetics */}
             <div className="absolute top-[-100px] right-[-100px] w-96 h-96 bg-blue-400 opacity-10 rounded-full blur-3xl pointer-events-none"></div>
        </div>

        <header className="flex justify-end mb-8 relative z-30">
            <div className="flex items-center gap-4">
                <div className="neu-card px-4 py-2 flex items-center gap-2">
                    <Globe size={16} className="text-neu-accent" />
                    <select 
                        value={language} 
                        onChange={(e) => setLanguage(e.target.value as Language)}
                        className="bg-transparent border-none outline-none text-sm font-semibold text-slate-600 cursor-pointer"
                    >
                        <option value="en">English</option>
                        <option value="zh-cn">简体中文</option>
                        <option value="zh-tw">繁體中文</option>
                    </select>
                </div>

                <div className="text-right hidden sm:block">
                    <p className="text-sm font-bold text-slate-700">Admin User</p>
                    <p className="text-xs text-slate-500">Global Manager</p>
                </div>
                <div className="w-12 h-12 rounded-full neu-flat flex items-center justify-center font-bold text-neu-accent shadow-neu-flat">
                    AU
                </div>
            </div>
        </header>

        <div className="animate-fade-in relative z-10">
             {renderView()}
        </div>
      </main>

      {/* Global CSS for animations */}
      <style>{`
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
            animation: fadeIn 0.4s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  );
}

export default App;