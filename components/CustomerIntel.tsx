import React, { useState, useEffect } from 'react';
import { User, Users, BrainCircuit, MessageSquare, ChevronRight, Wand2, Upload, FileText, CheckCircle } from 'lucide-react';
import { CustomerProfile, Language } from '../types';
import { analyzeCustomerData } from '../services/geminiService';
import { t } from '../utils/i18n';

interface CustomerIntelProps {
    lang: Language;
    customers: CustomerProfile[];
    initialSelectedId: string | null;
    onSelectionChange: (id: string | null) => void;
    // We keep import logic here for manual imports if needed, 
    // but primary flow is now via App state
    importedData?: string | null;
    clearImport?: () => void;
}

const CustomerIntel: React.FC<CustomerIntelProps> = ({ 
    lang, 
    customers, 
    initialSelectedId, 
    onSelectionChange,
    importedData, 
    clearImport 
}) => {
  const [analysis, setAnalysis] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [importText, setImportText] = useState('');

  // Sync selection with parent
  useEffect(() => {
    if (initialSelectedId) {
        // If the newly selected ID has conversation logs that haven't been analyzed,
        // we might want to trigger auto-analysis here.
        // For now, reset analysis view to force user to click "Analyze" or see empty state
        setAnalysis(null); 
    }
  }, [initialSelectedId]);

  const selectedCustomer = customers.find(c => c.id === initialSelectedId);

  const handleAnalyze = async (customerName: string, textToAnalyze?: string) => {
    setIsLoading(true);
    try {
        // Use provided text, or fetch from logs, or use mock
        let text = textToAnalyze;
        if (!text && selectedCustomer?.conversationLogs?.[0]) {
            text = selectedCustomer.conversationLogs[0].fullText;
        }
        text = text || "Mock conversation history..."; // Fallback

        const result = await analyzeCustomerData(text, customerName);
        setAnalysis(result);
    } catch (e) {
        alert("Failed to analyze. Check API Key.");
    }
    setIsLoading(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 h-[calc(100vh-8rem)] relative">
      
      {/* List */}
      <div className="neu-card flex flex-col overflow-hidden">
        <div className="p-6 pb-2 flex justify-between items-center">
          <h3 className="font-bold text-slate-700 text-lg">{t('crmIntel', lang)}</h3>
          <div className="text-xs text-slate-400 font-bold">{customers.length} Clients</div>
        </div>
        <div className="overflow-y-auto flex-1 p-4 space-y-4">
          {customers.map(c => (
            <div 
              key={c.id} 
              onClick={() => { onSelectionChange(c.id); setAnalysis(null); }}
              className={`p-5 rounded-2xl cursor-pointer transition-all duration-300 flex justify-between items-center ${
                  initialSelectedId === c.id 
                  ? 'shadow-neu-pressed text-neu-accent' 
                  : 'shadow-neu-flat hover:translate-x-1'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg ${
                    initialSelectedId === c.id ? 'shadow-neu-pressed text-neu-accent' : 'shadow-neu-flat text-slate-500'
                }`}>
                    {c.name.substring(0, 2)}
                </div>
                <div>
                    <h4 className="font-bold">{c.name}</h4>
                    <p className="text-xs opacity-70 font-semibold uppercase">{c.industry}</p>
                </div>
              </div>
              <ChevronRight size={20} className={initialSelectedId === c.id ? 'text-neu-accent' : 'text-slate-300'} />
            </div>
          ))}
        </div>
      </div>

      {/* Detail / Analysis */}
      <div className="lg:col-span-2 neu-card flex flex-col overflow-hidden">
        {selectedCustomer ? (
          <div className="flex flex-col h-full">
             <div className="p-8 border-b border-white/50 flex justify-between items-start">
                <div>
                    <h2 className="text-3xl font-black text-slate-700">
                        {selectedCustomer.name}
                    </h2>
                    <div className="flex gap-2 mt-3">
                        <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-neu-flat text-green-600">{selectedCustomer.status}</span>
                        {selectedCustomer.conversationLogs && selectedCustomer.conversationLogs.length > 0 && (
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest shadow-neu-flat text-blue-600">New Data Available</span>
                        )}
                    </div>
                </div>
                <button 
                    onClick={() => handleAnalyze(selectedCustomer.name)}
                    className="neu-btn px-6 py-3 rounded-xl flex items-center gap-3 transition-all active:scale-95"
                    disabled={isLoading}
                >
                    {isLoading ? <div className="animate-spin w-5 h-5 border-2 border-neu-accent border-t-transparent rounded-full" /> : <BrainCircuit size={20} className="text-neu-accent" />}
                    <span className="text-neu-accent font-bold">{t('analyze', lang)}</span>
                </button>
             </div>
             
             <div className="p-8 overflow-y-auto flex-1 space-y-8">
                {/* Pending Log View */}
                {!analysis && selectedCustomer.conversationLogs && selectedCustomer.conversationLogs.length > 0 && (
                    <div className="neu-card p-6 border-l-4 border-blue-400 mb-4 animate-fade-in">
                        <h4 className="font-bold text-blue-600 mb-2 flex items-center gap-2"><MessageSquare size={18}/> Latest Interaction Log</h4>
                        <div className="neu-input p-4 max-h-40 overflow-y-auto text-xs font-mono text-slate-500">
                            {selectedCustomer.conversationLogs[0].fullText}
                        </div>
                        <p className="text-center text-xs text-blue-400 mt-2 font-bold">Click 'Deep Analysis' to process this log</p>
                    </div>
                )}

                {/* AI Analysis Result */}
                {analysis ? (
                    <div className="grid gap-8 animate-fade-in">
                        <div className="neu-card p-6 border-l-4 border-neu-accent">
                            <h4 className="font-bold text-neu-accent flex items-center gap-3 mb-4 text-lg">
                                <User size={24} /> {t('generatedPersona', lang)}
                            </h4>
                            <p className="text-slate-600 leading-relaxed font-medium">{analysis.personaAnalysis}</p>
                        </div>

                        <div className="grid md:grid-cols-2 gap-8">
                            <div className="neu-card p-6 border-l-4 border-red-400">
                                <h4 className="font-bold text-red-500 mb-4">{t('painPoints', lang)}</h4>
                                <ul className="space-y-3">
                                    {analysis.painPoints?.map((pt: string, i: number) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-600 text-sm">
                                            <div className="w-1.5 h-1.5 rounded-full bg-red-400 mt-2 shrink-0"></div>
                                            {pt}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                             <div className="neu-card p-6 border-l-4 border-green-400">
                                <h4 className="font-bold text-green-500 mb-4">{t('relationshipScore', lang)}</h4>
                                <div className="flex items-center gap-6">
                                    <div className="text-5xl font-black text-slate-700 shadow-neu-flat w-24 h-24 rounded-full flex items-center justify-center">
                                        {analysis.relationshipScore}
                                    </div>
                                    <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider max-w-[120px]">
                                        Based on sentiment analysis of last interactions.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="neu-card p-6 border-l-4 border-indigo-400">
                             <h4 className="font-bold text-indigo-500 flex items-center gap-3 mb-4 text-lg">
                                <Wand2 size={24} /> {t('marketingPitch', lang)}
                            </h4>
                            <div className="neu-input p-6 text-slate-600 italic leading-relaxed">
                                "{analysis.suggestedMarketingCopy}"
                            </div>
                        </div>
                    </div>
                ) : (
                    !selectedCustomer.conversationLogs?.length && (
                        <div className="flex flex-col items-center justify-center h-full opacity-40">
                            <BrainCircuit size={80} className="mb-4" />
                            <p>No data to analyze. Run a simulation first.</p>
                        </div>
                    )
                )}
             </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
             <Users size={64} className="mb-4 opacity-30 shadow-neu-flat p-4 rounded-full" />
             <p className="text-lg font-bold">Select a client to view intelligence</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CustomerIntel;