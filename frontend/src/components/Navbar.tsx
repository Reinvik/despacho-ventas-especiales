import React from 'react';
import { 
  Truck, 
  Zap, 
  ClipboardPaste, 
  FileSpreadsheet, 
  Code, 
  Database,
  Cloud,
  Layers,
  Sparkles
} from 'lucide-react';
import { SapStatusResponse } from '../types';

interface NavbarProps {
  sapStatus: SapStatusResponse | null;
  onOpenSapModal: () => void;
  onOpenPasteModal: () => void;
  onOpenMacroModal: () => void;
  onSeedSample: () => void;
  onExportAll: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  sapStatus,
  onOpenSapModal,
  onOpenPasteModal,
  onOpenMacroModal,
  onSeedSample,
  onExportAll,
  isLoading
}) => {
  const isSapActive = sapStatus?.sap_gui.running ?? false;

  return (
    <header className="bg-[#0a5c36] text-white shadow-lg shadow-emerald-950/20 select-none shrink-0 sticky top-0 z-40 border-b border-[#08482a] w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex items-center justify-between gap-3">
        
        {/* CIAL Alimentos Brand Header (Identical to Nexus Almacenamiento & Nexus Despacho) */}
        <div className="flex items-center gap-3">
          <img 
            src="/cial-logo.png" 
            alt="CIAL Alimentos" 
            className="w-11 h-11 sm:w-12 sm:h-12 object-contain bg-white rounded-xl p-1 shadow-md shrink-0 ring-1 ring-white/30" 
          />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-black tracking-wider leading-none text-white drop-shadow-sm">
                NEXUS DESPACHO
              </h1>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-black bg-emerald-800 text-emerald-200 border border-emerald-400/30">
                SAN JORGE
              </span>
              <span className="hidden md:inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-white/10 text-white border border-white/20">
                VENTAS ESPECIALES
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] sm:text-[11px] text-emerald-200 font-bold tracking-widest uppercase">
                Control Outbound & Preparación — CD San Jorge • VL06O
              </span>
              <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-bold bg-emerald-950/70 text-emerald-300 border border-emerald-400/30">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <Cloud className="w-3 h-3 text-emerald-300" />
                <span>Nube en vivo</span>
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons with CIAL Nexus Styling */}
        <div className="flex items-center space-x-2">
          
          {/* Action: SAP Connect (Vibrant Amber CTA) */}
          <button
            onClick={onOpenSapModal}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 hover:shadow-amber-500/35 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
            title="Conectar y extraer directamente de SAP GUI (VL06O)"
          >
            <Zap className="w-4 h-4 fill-slate-950" />
            <span>Conectar SAP</span>
          </button>

          {/* Action: Fast Paste */}
          <button
            onClick={onOpenPasteModal}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          >
            <ClipboardPaste className="w-4 h-4 text-emerald-300" />
            <span className="hidden sm:inline">Pegar Datos</span>
          </button>

          {/* Action: Seed Sample */}
          <button
            onClick={onSeedSample}
            disabled={isLoading}
            title="Cargar ejemplo oficial de transporte 3417089 (Comercial Dollinco)"
            className="flex items-center space-x-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs font-semibold transition-all active:scale-95 cursor-pointer backdrop-blur-sm"
          >
            <Database className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden md:inline">Ejemplo</span>
          </button>

          {/* Action: View Macro */}
          <button
            onClick={onOpenMacroModal}
            title="Ver código de macro VBA y script VBS para Windows"
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white border border-white/20 text-xs transition-all active:scale-95 cursor-pointer"
          >
            <Code className="w-4 h-4 text-emerald-300" />
          </button>

          {/* Action: Export All */}
          <button
            onClick={onExportAll}
            disabled={isLoading}
            title="Descargar reporte Excel consolidado (.xlsx)"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black shadow-md shadow-emerald-900/30 transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span className="hidden sm:inline">Excel</span>
          </button>
        </div>

      </div>
    </header>
  );
};
