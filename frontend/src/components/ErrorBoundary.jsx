import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('UI Foundation Breach:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 font-outfit">
          <div className="max-w-md w-full card p-8 text-center space-y-6 shadow-2xl border-red-100 dark:border-red-900/30">
            <div className="w-20 h-20 bg-red-50 dark:bg-red-900/10 rounded-3xl flex items-center justify-center mx-auto text-red-500 animate-bounce-slow">
              <AlertTriangle size={40} />
            </div>
            
            <div className="space-y-2">
              <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Oops! Terjadi Gangguan</h1>
              <p className="text-sm text-gray-500 leading-relaxed">
                Pondasi aplikasi mendeteksi ketidakstabilan sementara. Jangan khawatir, data Anda tetap aman.
              </p>
            </div>

            <div className="bg-gray-100 dark:bg-gray-800/50 p-4 rounded-2xl text-[10px] font-mono text-gray-500 text-left overflow-hidden">
               <p className="font-bold text-red-500 mb-1">LOG ERROR:</p>
               {this.state.error?.toString()}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => window.location.reload()}
                className="btn-primary py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
              >
                <RefreshCw size={16} /> Segarkan
              </button>
              <button 
                onClick={() => window.location.href = '/dashboard'}
                className="btn-secondary py-3 rounded-2xl flex items-center justify-center gap-2 text-xs font-black uppercase tracking-widest"
              >
                <Home size={16} /> Beranda
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
