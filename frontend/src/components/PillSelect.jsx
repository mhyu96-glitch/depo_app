import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown } from 'lucide-react';

export default function PillSelect({ 
  label, 
  options = [], 
  value, 
  onChange, 
  placeholder = '-- Pilih --',
  icon: Icon,
  className = ""
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find(o => String(o.value) === String(value));

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="text-[10px] font-black text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em] mb-2 block">
          {label}
        </label>
      )}
      
      <div className="relative">
        <motion.div
          onClick={() => setIsOpen(!isOpen)}
          whileTap={{ scale: 0.98 }}
          className={`w-full h-12 bg-white dark:bg-gray-800/40 border border-gray-100 dark:border-gray-800 rounded-2xl px-5 flex items-center justify-between cursor-pointer transition-all hover:border-primary-500/30 shadow-sm ${isOpen ? 'ring-2 ring-primary-500/20 border-primary-500/50' : ''}`}
        >
          <div className="flex items-center gap-3 overflow-hidden">
            {Icon && <Icon size={16} className="text-primary-500 shrink-0" />}
            <span className={`text-xs font-black uppercase tracking-widest truncate ${selectedOption ? 'text-gray-900 dark:text-white' : 'text-gray-400'}`}>
              {selectedOption ? selectedOption.label : placeholder}
            </span>
          </div>
          <ChevronDown size={16} className={`text-gray-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </motion.div>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 5, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              className="absolute top-full left-0 right-0 bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[1.5rem] p-2 shadow-2xl z-[999] max-h-64 overflow-y-auto custom-scrollbar"
            >
              {options.length > 0 ? options.map((opt, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ x: 5 }}
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all mb-1 last:mb-0 ${String(value) === String(opt.value) ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/20' : 'text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'}`}
                >
                  <div className={`w-1.5 h-1.5 rounded-full ${String(value) === String(opt.value) ? 'bg-white' : 'bg-primary-500/30'}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest">{opt.label}</span>
                </motion.div>
              )) : (
                <div className="p-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest italic">Tidak ada pilihan</div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
