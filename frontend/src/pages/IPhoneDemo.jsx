import React, { useState } from 'react';
import { Smartphone, Monitor, Globe, RefreshCw, ChevronLeft, ChevronRight, Share, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const IPhoneDemo = () => {
    const [url, setUrl] = useState('/portal');
    const [iframeKey, setIframeKey] = useState(0);

    const refresh = () => setIframeKey(prev => prev + 1);

    return (
        <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-4 font-sans selection:bg-cyan-500/30">
            {/* Background Decorations */}
            <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-cyan-500/10 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
            </div>

            {/* Top Toolbar */}
            <div className="w-full max-w-5xl flex justify-between items-center mb-8 bg-white/5 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/20">
                        <Smartphone className="text-white" size={20} />
                    </div>
                    <div>
                        <h1 className="text-white font-black text-sm tracking-tight">Depo PWA Mockup</h1>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Device Simulator Pro</p>
                    </div>
                </div>

                <div className="flex items-center gap-2 bg-black/40 p-1.5 rounded-xl border border-white/5">
                    <button 
                        onClick={() => setUrl('/portal')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${url === '/portal' ? 'bg-cyan-500 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Customer Portal
                    </button>
                    <button 
                        onClick={() => setUrl('/courier-app')}
                        className={`px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${url === '/courier-app' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
                    >
                        Courier App
                    </button>
                </div>
            </div>

            <div className="flex flex-col lg:flex-row items-center gap-12">
                {/* Information Card */}
                <div className="hidden lg:block w-80 space-y-6">
                    <motion.div 
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-3xl"
                    >
                        <h2 className="text-xl font-black text-white mb-2">Live Preview</h2>
                        <p className="text-sm text-gray-400 leading-relaxed">Aplikasi ini berjalan sebagai Progressive Web App (PWA) di dalam simulasi iPhone 15 Pro.</p>
                        
                        <div className="mt-6 space-y-4">
                            <div className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-cyan-500 transition-colors">
                                    <Monitor size={14} className="text-cyan-400 group-hover:text-white" />
                                </div>
                                <span className="text-xs text-gray-300 font-bold">Responsive Design</span>
                            </div>
                            <div className="flex items-center gap-3 group">
                                <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center group-hover:bg-emerald-500 transition-colors">
                                    <Globe size={14} className="text-emerald-400 group-hover:text-white" />
                                </div>
                                <span className="text-xs text-gray-300 font-bold">PWA Ready</span>
                            </div>
                        </div>
                    </motion.div>
                    
                    <div className="p-6 text-center">
                         <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest italic">Built for Excellence</p>
                    </div>
                </div>

                {/* iPhone 15 Pro Mockup */}
                <motion.div 
                    initial={{ y: 50, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="relative"
                >
                    {/* The Frame */}
                    <div className="w-[340px] h-[700px] bg-[#1a1a1a] rounded-[3.5rem] p-3 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] border-[8px] border-[#333] relative outline outline-1 outline-white/10">
                        {/* Speaker Grill */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1.5 bg-black/40 rounded-full mt-2.5 z-50 border border-white/5" />
                        
                        {/* Dynamic Island */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-24 h-6 bg-black rounded-3xl z-50 flex items-center justify-end px-3">
                             <div className="w-1.5 h-1.5 bg-blue-500 rounded-full blur-[1px] opacity-40" />
                        </div>

                        {/* Buttons (Physical Look) */}
                        <div className="absolute -left-[10px] top-24 w-1 h-12 bg-[#222] rounded-l-md border-y border-l border-white/10" /> {/* Volume Up */}
                        <div className="absolute -left-[10px] top-40 w-1 h-12 bg-[#222] rounded-l-md border-y border-l border-white/10" /> {/* Volume Down */}
                        <div className="absolute -right-[10px] top-32 w-1 h-20 bg-[#222] rounded-r-md border-y border-r border-white/10" /> {/* Side Button */}

                        {/* Screen */}
                        <div className="w-full h-full bg-white rounded-[2.8rem] overflow-hidden relative shadow-inner">
                            {/* Status Bar Simulator - Clean & Sharp */}
                            <div className="absolute top-0 w-full h-12 px-8 flex justify-between items-center text-[11px] font-black z-[60] pointer-events-none">
                                <span className="text-black/90">9:41</span>
                                <div className="flex items-center gap-1.5">
                                    <Zap size={10} className="text-black/90" />
                                    <div className="w-5 h-2.5 border border-black/30 rounded-[3px] p-[1px] flex justify-start">
                                        <div className="w-full h-full bg-black/90 rounded-[1px]" />
                                    </div>
                                </div>
                            </div>

                            {/* Dynamic Island - Sharp & Solid */}
                            <div className="absolute top-3.5 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-3xl z-[70] shadow-lg flex items-center justify-end px-4 pointer-events-none">
                                 <div className="w-1.5 h-1.5 bg-[#1a1a1a] rounded-full border border-white/5" />
                            </div>

                            <div className="w-full h-full overflow-hidden bg-white">
                                <iframe 
                                    key={iframeKey}
                                    src={url} 
                                    className="border-none"
                                    style={{ 
                                        width: '393px', 
                                        height: '852px', 
                                        transform: 'scale(0.81)', 
                                        transformOrigin: 'top left',
                                        marginLeft: '-4px'
                                    }}
                                    title="App Preview"
                                />
                            </div>

                            {/* Home Indicator */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1.5 bg-black/10 rounded-full z-50" />
                        </div>
                    </div>

                    {/* Reflection Effect */}
                    <div className="absolute inset-0 rounded-[3.5rem] pointer-events-none bg-gradient-to-tr from-white/5 to-transparent" />
                </motion.div>

                {/* Right Controls */}
                <div className="flex flex-col gap-4">
                    <button 
                        onClick={refresh}
                        className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white hover:bg-cyan-500 transition-all group"
                    >
                        <RefreshCw size={24} className="group-active:rotate-180 transition-transform duration-500" />
                    </button>
                    <div className="w-14 h-14 bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-gray-500">
                        <Share size={24} />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <p className="mt-12 text-gray-500 text-[10px] font-black uppercase tracking-[0.4em]">Optimized for Chrome & Edge</p>
        </div>
    );
};

export default IPhoneDemo;
