import { useEffect, useRef, useState } from 'react';
import JsBarcode from 'jsbarcode';
import { X, Download, QrCode } from 'lucide-react';

/**
 * Renders a barcode SVG for a given customer code.
 * Uses CODE128 format (supports alphanumeric voucher codes).
 */
export function BarcodeDisplay({ code, width = 1.5, height = 50, fontSize = 12 }) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !code) return;
    try {
      JsBarcode(svgRef.current, code, {
        format: 'CODE128',
        width,
        height,
        displayValue: true,
        fontSize,
        fontOptions: 'bold',
        textMargin: 4,
        margin: 8,
        background: '#ffffff',
        lineColor: '#111827',
      });
    } catch (e) {
      console.error('Barcode error:', e);
    }
  }, [code, width, height, fontSize]);

  if (!code) return null;
  return <svg ref={svgRef} className="w-full" />;
}

/**
 * Modal yang menampilkan barcode besar + tombol download untuk dicetak.
 */
export function BarcodeModal({ customer, onClose }) {
  const svgRef = useRef(null);

  useEffect(() => {
    const code = customer?.voucher_code || customer?.barcode_code;
    if (!svgRef.current || !code) return;
    JsBarcode(svgRef.current, code, {
      format: 'CODE128',
      width: 2.5,
      height: 80,
      displayValue: true,
      fontSize: 14,
      fontOptions: 'bold',
      textMargin: 6,
      margin: 16,
      background: '#ffffff',
      lineColor: '#111827',
    });
  }, [customer]);

  const handleDownload = () => {
    if (!svgRef.current) return;
    const svgData = new XMLSerializer().serializeToString(svgRef.current);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const a = document.createElement('a');
      a.download = `barcode-${customer.name}-${customer.voucher_code}.png`;
      a.href = canvas.toDataURL('image/png');
      a.click();
    };
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgData)));
  };

  const code = customer?.voucher_code || customer?.barcode_code;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-6 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary-100 text-primary-600 flex items-center justify-center">
              <QrCode size={20} />
            </div>
            <div>
              <p className="font-black text-gray-900 dark:text-white text-sm">{customer.name}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Barcode Pelanggan</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Barcode */}
        <div className="p-6 bg-white">
          <div className="border-2 border-dashed border-gray-200 rounded-2xl p-4">
            <svg ref={svgRef} className="w-full" />
          </div>
          <div className="mt-4 text-center space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kode Unik Pelanggan</p>
            <p className="font-black text-2xl tracking-widest text-gray-900 dark:text-white">{code}</p>
          </div>
        </div>

        {/* Instruksi */}
        <div className="px-6 pb-3">
          <div className="p-4 rounded-2xl bg-amber-50 border border-amber-100">
            <p className="text-xs font-bold text-amber-700 leading-relaxed">
              Tunjukkan barcode ini ke kasir saat tukar galon untuk klaim reward loyalty.
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="p-6 pt-3 flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 py-3.5 rounded-2xl bg-primary-500 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-primary-500/20 hover:scale-[1.02] transition-all"
          >
            <Download size={16} /> Download
          </button>
          <button
            onClick={onClose}
            className="px-6 py-3.5 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-500 font-black text-xs uppercase tracking-widest hover:bg-gray-200 transition-all"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
