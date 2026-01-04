import React, { useState, useEffect, useRef } from 'react';
import { Mic, Send, Volume2, User, Bot, AlertCircle, PlayCircle, StopCircle, Award, Power, ArrowRight, Clock } from 'lucide-react';
import { generateSimulationResponse, getCoachingTip, generateSpeech } from '../services/geminiService';
import { ChatMessage, RoleplayMode, SimulationConfig, Language } from '../types';
import { t } from '../utils/i18n';

interface TrainingSimulatorProps {
    lang: Language;
    onEndSession: (transcript: string, customerName: string) => void;
}

const TrainingSimulator: React.FC<TrainingSimulatorProps> = ({ lang, onEndSession }) => {
  const [config] = useState<SimulationConfig>({
    scenario: 'Life Insurance Sales',
    difficulty: 'Medium',
    customerName: 'Sarah Jenkins',
    customerPersona: 'A skeptical mother of two who thinks insurance is a scam.'
  });

  const [mode, setMode] = useState<RoleplayMode>(RoleplayMode.TEXT);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [coachTip, setCoachTip] = useState<string | null>(null);
  
  // Timer for browser limit (approx 60s for Web Speech API)
  const [timeLeft, setTimeLeft] = useState(60);
  
  const recognitionRef = useRef<any>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // We use a ref to track the latest transcript to solve closure staleness in event handlers
  const transcriptRef = useRef('');

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      
      // FIX 1: Enable continuous recording to prevent stopping on pauses
      recognitionRef.current.continuous = true;
      // FIX 2: Enable interim results to show text while speaking
      recognitionRef.current.interimResults = true;
      
      recognitionRef.current.lang = lang === 'en' ? 'en-US' : (lang === 'zh-cn' ? 'zh-CN' : 'zh-TW');

      recognitionRef.current.onresult = (event: any) => {
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }
        
        // Accumulate full text
        // Note: For continuous=true, event.results usually contains the whole session history in Chrome,
        // but we need to be careful. A simpler way is to grab the latest state.
        // Actually, let's just grab everything in the buffer.
        let allText = '';
        for (let i = 0; i < event.results.length; i++) {
             allText += event.results[i][0].transcript;
        }

        setInputText(allText);
        transcriptRef.current = allText;
      };

      recognitionRef.current.onend = () => {
        setIsRecording(false);
        // Do not auto-send here to avoid double sending if we triggered stop manually.
        // We handle sending in toggleRecording or timer.
      };
    }
  }, [lang]);

  // Countdown Timer Logic
  useEffect(() => {
    let interval: any;
    if (isRecording && timeLeft > 0) {
        interval = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    // Time up
                    stopAndSend();
                    return 60;
                }
                return prev - 1;
            });
        }, 1000);
    } else if (!isRecording) {
        setTimeLeft(60); // Reset
    }
    return () => clearInterval(interval);
  }, [isRecording, timeLeft]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const stopAndSend = () => {
    if (recognitionRef.current) {
        recognitionRef.current.stop();
    }
    setIsRecording(false);
    
    // Delay slightly to ensure state is settled/final result processed
    setTimeout(() => {
        if (transcriptRef.current.trim()) {
            handleSendMessage(transcriptRef.current, true);
        }
    }, 200);
  };

  const toggleRecording = () => {
    if (isRecording) {
      // STOP Action
      stopAndSend();
    } else {
      // START Action
      setInputText('');
      transcriptRef.current = '';
      setIsRecording(true);
      setTimeLeft(60);
      try {
        recognitionRef.current?.start();
      } catch (e) {
        console.error("Mic start failed", e);
        setIsRecording(false);
      }
    }
  };

  const playAudioResponse = async (text: string) => {
    const audioUrl = await generateSpeech(text);
    if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
    }
  };

  const handleSendMessage = async (textOverride?: string, isAudioSource: boolean = false) => {
    const textToSend = textOverride || inputText;
    if (!textToSend.trim()) return;

    const newUserMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: textToSend,
      timestamp: new Date(),
      isAudio: isAudioSource
    };
    
    const updatedMessages = [...messages, newUserMsg];
    setMessages(updatedMessages);
    setInputText('');
    transcriptRef.current = ''; // Clear ref
    setIsProcessing(true);

    try {
      const history = updatedMessages.map(m => ({ role: m.role, text: m.text }));
      const responseText = await generateSimulationResponse(history, config);

      const newAiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "...",
        timestamp: new Date()
      };

      setMessages(prev => [...prev, newAiMsg]);

      if (mode === RoleplayMode.VOICE) {
        await playAudioResponse(responseText || "");
      }

      getCoachingTip(textToSend, messages.length > 0 ? messages[messages.length - 1].text : "Start")
        .then(tip => setCoachTip(tip));

    } catch (error) {
      console.error(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleEndSession = () => {
      const transcript = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n');
      // Pass both transcript AND customer name to sync with CRM
      onEndSession(transcript, config.customerName);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] gap-8">
      <audio ref={audioRef} className="hidden" />
      
      {/* Header */}
      <div className="neu-card p-6 flex justify-between items-center">
        <div className="flex items-center gap-6">
            <div className="p-4 rounded-full shadow-neu-icon text-neu-accent">
                <Award size={28} />
            </div>
            <div>
                <h2 className="font-black text-2xl text-slate-700">{config.scenario}</h2>
                <div className="flex gap-2 mt-1">
                    <span className="text-xs font-bold bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full">{t('difficulty', lang)}: {config.difficulty}</span>
                    <span className="text-xs font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{config.customerName}</span>
                </div>
            </div>
        </div>
        
        <div className="flex gap-4">
             <div className="p-1 rounded-2xl shadow-neu-pressed flex items-center">
                <button 
                    onClick={() => setMode(RoleplayMode.TEXT)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all ${mode === RoleplayMode.TEXT ? 'bg-[#e0e5ec] shadow-neu-flat text-neu-accent' : 'text-slate-400'}`}
                >
                    Text
                </button>
                <button 
                    onClick={() => setMode(RoleplayMode.VOICE)}
                    className={`px-5 py-2 rounded-xl text-sm font-bold transition-all flex items-center gap-2 ${mode === RoleplayMode.VOICE ? 'bg-[#e0e5ec] shadow-neu-flat text-neu-accent' : 'text-slate-400'}`}
                >
                    <Mic size={14} /> Voice
                </button>
            </div>
            
            <button 
                onClick={handleEndSession}
                className="neu-btn px-6 py-2 text-red-500 hover:text-red-600 flex items-center gap-2"
            >
                <Power size={18} />
                {t('endSession', lang)}
            </button>
        </div>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        
        {/* Chat Area */}
        <div className="flex-1 neu-card p-1 flex flex-col relative overflow-hidden">
            <div className="flex-1 overflow-y-auto p-8 space-y-6">
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-40">
                        <Bot size={64} className="mb-4" />
                        <p className="font-bold text-lg">Start the conversation</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`flex gap-4 max-w-[80%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-neu-flat ${msg.role === 'user' ? 'text-neu-accent' : 'text-orange-500'}`}>
                                {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
                            </div>
                            <div className={`p-6 rounded-2xl shadow-neu-flat text-slate-700 leading-relaxed font-medium ${msg.role === 'user' ? 'bg-[#e0e5ec]' : 'bg-[#e0e5ec]'}`}>
                                <p>{msg.text}</p>
                            </div>
                        </div>
                    </div>
                ))}
                {isProcessing && (
                     <div className="flex justify-start">
                        <div className="flex gap-4 max-w-[80%]">
                             <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-neu-flat text-orange-500"><Bot size={20} /></div>
                             <div className="p-6 rounded-2xl shadow-neu-flat bg-[#e0e5ec]">
                                <div className="flex gap-1.5">
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-75"></span>
                                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-150"></span>
                                </div>
                             </div>
                        </div>
                     </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-6 bg-[#e0e5ec] border-t border-white/50 z-10">
                {mode === RoleplayMode.VOICE ? (
                    <div className="flex flex-col items-center justify-center gap-2 py-2">
                         {/* Timer Display */}
                        {isRecording && (
                            <div className="flex items-center gap-2 text-xs font-bold text-neu-accent animate-pulse">
                                <Clock size={12} />
                                <span>{timeLeft}s remaining</span>
                            </div>
                        )}
                        <div 
                            className={`w-24 h-24 rounded-full flex items-center justify-center transition-all cursor-pointer relative ${isRecording ? 'shadow-neu-pressed text-red-500' : 'shadow-neu-flat text-neu-accent hover:-translate-y-1'}`} 
                            onClick={toggleRecording}
                        >
                            {isRecording ? <StopCircle size={48} /> : <Mic size={48} />}
                            {/* Ripple Effect for recording */}
                            {isRecording && (
                                <span className="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-20 animate-ping"></span>
                            )}
                        </div>
                        <p className="text-xs text-slate-400 font-semibold mt-2">
                            {isRecording ? "Listening... (Tap to Send)" : "Tap to Speak"}
                        </p>
                    </div>
                ) : (
                    <div className="flex gap-4">
                        <input 
                            type="text" 
                            className="flex-1 neu-input px-6 py-4 text-slate-700 placeholder-slate-400 focus:outline-none transition-all"
                            placeholder={t('typeMessage', lang)}
                            value={inputText}
                            onChange={(e) => setInputText(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                        />
                        <button 
                            onClick={() => handleSendMessage()}
                            disabled={!inputText.trim() || isProcessing}
                            className="neu-btn px-6 rounded-2xl disabled:opacity-50 text-neu-accent"
                        >
                            <Send size={24} />
                        </button>
                    </div>
                )}
            </div>
        </div>

        {/* Coach / Stats Sidebar */}
        <div className="w-80 flex flex-col gap-6">
            {/* Live Coach */}
            <div className="neu-card p-6 border-l-4 border-yellow-400">
                <h3 className="text-slate-600 font-bold flex items-center gap-2 mb-4">
                    <AlertCircle size={20} className="text-yellow-500" /> AI Coach
                </h3>
                <p className="text-sm text-slate-600 italic font-medium leading-relaxed">
                    {coachTip ? `"${coachTip}"` : "Monitoring conversation..."}
                </p>
            </div>

            {/* Customer State */}
            <div className="neu-card p-6 flex-1 flex flex-col">
                <h3 className="text-slate-700 font-bold mb-6">Real-time Analysis</h3>
                <div className="space-y-6">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Persona Match</label>
                        <div className="mt-2 h-4 w-full bg-[#e0e5ec] shadow-neu-pressed rounded-full overflow-hidden p-1">
                            <div className="h-full bg-neu-accent rounded-full w-[85%] shadow-neu-flat"></div>
                        </div>
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sentiment</label>
                         <div className="mt-2 h-4 w-full bg-[#e0e5ec] shadow-neu-pressed rounded-full overflow-hidden p-1">
                            <div className="h-full bg-orange-400 rounded-full w-[60%] shadow-neu-flat"></div>
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-400 mt-2 font-bold uppercase">
                            <span>Negative</span>
                            <span>Positive</span>
                        </div>
                    </div>
                </div>
                
                <div className="mt-auto pt-6 border-t border-white/20">
                    <p className="text-xs text-slate-400 text-center">
                        End session to generate full performance report.
                    </p>
                </div>
            </div>
        </div>

      </div>
    </div>
  );
};

export default TrainingSimulator;