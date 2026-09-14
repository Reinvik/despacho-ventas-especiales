import React, { useState, useEffect } from 'react';
import { Code, X, Copy, Check, Download, ExternalLink } from 'lucide-react';
import { api } from '../services/api';

interface MacroModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTknum?: string;
}

export const MacroModal: React.FC<MacroModalProps> = ({
  isOpen,
  onClose,
  defaultTknum = "3417089"
}) => {
  const [tknum, setTknum] = useState<string>(defaultTknum);
  const [vbaCode, setVbaCode] = useState<string>("");
  const [vbsCode, setVbsCode] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'vba' | 'vbs'>('vba');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      api.getMacroCode(tknum)
        .then(data => {
          setVbaCode(data.vba_macro);
          setVbsCode(data.vbs_script);
        })
        .catch(console.error);
    }
  }, [isOpen, tknum]);

  if (!isOpen) return null;

  const currentCode = activeTab === 'vba' ? vbaCode : vbsCode;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const ext = activeTab === 'vba' ? 'bas' : 'vbs';
    const blob = new Blob([currentCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `extraer_despacho_${tknum}.${ext}`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Code className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Scripts de Conexión a SAP VL06O
              </h3>
              <p className="text-[11px] text-slate-400">
                Código para ejecutar desde Excel (VBA) o directamente en Windows (.vbs)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          
          {/* Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-400">Transporte (TKNUM):</span>
              <input
                type="text"
                value={tknum}
                onChange={(e) => setTknum(e.target.value)}
                className="w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs font-mono text-cyan-400 font-bold focus:border-cyan-400 focus:outline-none"
              />
            </div>

            {/* Tabs */}
            <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                onClick={() => setActiveTab('vba')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'vba' 
                    ? 'bg-cyan-500 text-black shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Excel VBA (.bas)
              </button>
              <button
                onClick={() => setActiveTab('vbs')}
                className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                  activeTab === 'vbs' 
                    ? 'bg-cyan-500 text-black shadow-sm' 
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Windows Script (.vbs)
              </button>
            </div>

            {/* Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={handleCopy}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copiado' : 'Copiar Código'}</span>
              </button>
              <button
                onClick={handleDownload}
                className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800 text-xs font-semibold transition-all cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Descargar Archivo</span>
              </button>
            </div>
          </div>

          {/* Code Viewer */}
          <div className="relative">
            <pre className="bg-[#090D16] border border-slate-800 rounded-xl p-4 text-xs font-mono text-slate-300 overflow-x-auto max-h-[380px] overflow-y-auto leading-relaxed">
              <code>{currentCode}</code>
            </pre>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center justify-between">
            <span>
              {activeTab === 'vba' 
                ? 'Pega este código en un módulo nuevo de Excel (Alt + F11 > Insertar > Módulo).' 
                : 'Ejecuta haciendo doble clic en el archivo .vbs o con "cscript //nologo archivo.vbs".'}
            </span>
          </div>

        </div>

      </div>
    </div>
  );
};
