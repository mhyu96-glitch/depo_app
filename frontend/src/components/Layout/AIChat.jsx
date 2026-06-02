import { useState, useEffect, useRef } from 'react';
import { 
  Bot, Send, X, MessageSquare, Sparkles, 
  TrendingUp, AlertTriangle, CheckCircle2,
  Minimize2, Maximize2, Mic
} from 'lucide-react';

const MI = ({ name, className = '', size = 20 }) => (
  <span className={`mi ${className}`} style={{ fontSize: `${size}px` }}>{name}</span>
);

export default function AIChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'ai', text: 'Halo Boss! Saya AI Commander Anda. Ada yang bisa saya bantu analisa hari ini?', time: new Date().toLocaleTimeString() }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => { scrollToBottom(); }, [messages, isTyping]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMsg = { role: 'user', text: input, time: new Date().toLocaleTimeString() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Mock AI Response Logic
    setTimeout(() => {
      let aiResponse = "";
      const text = input.toLowerCase();

      if (text.includes('omset') || text.includes('penjualan')) {
        aiResponse = "Omset Anda hari ini mencapai Rp 1.450.000 (naik 12% dari kemarin). Cabang Pusat menyumbang 60% dari total ini.";
      } else if (text.includes('kurir') || text.includes('performa')) {
        aiResponse = "Kurir Andi Saputra sedang memimpin leaderboard dengan 145 poin. Kurir Budi sedang tidak aktif hari ini.";
      } else if (text.includes('stok') || text.includes('tandon')) {
        aiResponse = "Stok air di Tandon A masih aman (85%), tapi Tandon B mulai menipis di level 30%. Segera jadwalkan pengisian.";
      } else if (text.includes('komplain') || text.includes('masalah')) {
        aiResponse = "Ada 2 komplain pending: 1 di Cabang Melati tentang keterlambatan, dan 1 di Cabang Mawar tentang galon bocor.";
      } else {
        aiResponse = "Maaf Boss, saya masih belajar. Tapi saya bisa membantu Anda cek omset, performa kurir, stok tandon, atau komplain pelanggan.";
      }

      setMessages(prev => [...prev, { role: 'ai', text: aiResponse, time: new Date().toLocaleTimeString() }]);
      setIsTyping(false);
    }, 1500);
  };

  if (!isOpen) return (
    <button 
      onClick={() => setIsOpen(true)}
      className="fixed bottom-6 right-6 w-16 h-16 bg-primary-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all z-[100] group overflow-hidden"
    >
       <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform" />
       <Bot size={32} className="relative z-10" />
       <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-pulse" />
    </button>
  );

  return (
    <div className={`fixed bottom-6 right-6 w-full max-w-[380px] bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-[0_20px_60px_-15px_rgba(0,0,0,0.3)] z-[100] overflow-hidden border border-white/20 animate-scale-in flex flex-col ${isMinimized ? 'h-[80px]' : 'h-[600px] max-h-[85vh]'}`}>
       {/* Header */}
       <div className="p-6 bg-gradient-to-r from-primary-600 to-primary-800 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                <Bot size={22} className="text-white" />
             </div>
             <div>
                <h3 className="text-sm font-black tracking-tight">AI Business Commander</h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                   <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Active Analysing</p>
                </div>
             </div>
          </div>
          <div className="flex items-center gap-1">
             <button onClick={() => setIsMinimized(!isMinimized)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
             </button>
             <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors"><X size={18} /></button>
          </div>
       </div>

       {/* Chat Body */}
       {!isMinimized && (
         <>
           <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar bg-gray-50/50 dark:bg-gray-800/30">
              {messages.map((m, i) => (
                <div key={i} className={`flex ${m.role === 'ai' ? 'justify-start' : 'justify-end'} animate-fade-in`}>
                   <div className={`max-w-[85%] p-4 rounded-3xl text-sm ${
                      m.role === 'ai' 
                        ? 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 shadow-lg shadow-gray-200/20 rounded-bl-none' 
                        : 'bg-primary-600 text-white shadow-lg shadow-primary-600/20 rounded-br-none'
                   }`}>
                      <p className="font-bold leading-relaxed">{m.text}</p>
                      <p className={`text-[9px] font-black uppercase mt-2 opacity-40 text-right ${m.role === 'ai' ? '' : 'text-white/60'}`}>{m.time}</p>
                   </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex justify-start">
                   <div className="bg-white dark:bg-gray-800 p-4 rounded-3xl shadow-lg shadow-gray-200/20 flex gap-1">
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce" />
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.2s]" />
                      <div className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce [animation-delay:0.4s]" />
                   </div>
                </div>
              )}
              <div ref={chatEndRef} />
           </div>

           {/* Input Area */}
           <form onSubmit={handleSend} className="p-6 bg-white dark:bg-gray-900 border-t dark:border-gray-800">
              <div className="relative">
                 <input 
                   value={input} onChange={e => setInput(e.target.value)}
                   className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-2xl py-4 pl-5 pr-14 text-sm font-bold focus:ring-2 focus:ring-primary-500 transition-all text-gray-800 dark:text-gray-200"
                   placeholder="Tanya apapun ke AI..."
                 />
                 <button 
                   type="submit"
                   className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-primary-600 text-white rounded-xl flex items-center justify-center hover:bg-primary-700 transition-colors shadow-lg"
                 >
                    <Send size={18} />
                 </button>
              </div>
              <div className="mt-4 flex items-center justify-center gap-4">
                 <button type="button" className="text-[10px] font-black text-gray-400 hover:text-primary-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Mic size={14} /> Voice Command
                 </button>
                 <div className="w-1 h-1 rounded-full bg-gray-200" />
                 <button type="button" className="text-[10px] font-black text-gray-400 hover:text-primary-500 uppercase tracking-widest flex items-center gap-1.5">
                    <Sparkles size={14} /> AI Insight
                 </button>
              </div>
           </form>
         </>
       )}
    </div>
  );
}
