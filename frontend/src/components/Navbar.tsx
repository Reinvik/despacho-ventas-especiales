import React from 'react';
import { 
  Truck, 
  Zap, 
  ClipboardPaste, 
  FileSpreadsheet, 
  Download, 
  Code, 
  CheckCircle2, 
  AlertCircle,
  Database
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
    <header className="sticky top-0 z-40 bg-[#0F172A]/90 backdrop-blur-md border-b border-slate-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
        
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3.5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <Truck className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                DESPACHO <span className="text-cyan-400">VENTAS ESPECIALES</span>
              </h1>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                VL06O
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium">
              Control de preparación, pallets y conexión SAP
            </p>
          </div>
        </div>

        {/* Status indicator & Action buttons */}
        <div className="flex items-center space-x-2.5">
          {/* SAP Status Pill */}
          <div 
            title={sapStatus?.sap_gui.message || "Consultando estado de SAP GUI"}
            className={`hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${
              isSapActive 
                ? 'bg-emerald-950/40 border-emerald-700/60 text-emerald-300' 
                : 'bg-slate-800/60 border-slate-700/60 text-slate-400'
            }`}
          >
            <span className={`w-2 h-2 rounded-full ${isSapActive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{isSapActive ? 'SAP GUI Activo' : 'SAP GUI en Espera'}</span>
          </div>

          {/* Action: SAP Connect */}
          <button
            onClick={onOpenSapModal}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3.5 py-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-md shadow-cyan-500/20 hover:shadow-cyan-500/35 transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            <Zap className="w-4 h-4" />
            <span>Conectar SAP</span>
          </button>

          {/* Action: Fast Paste */}
          <button
            onClick={onOpenPasteModal}
            disabled={isLoading}
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
          >
            <ClipboardPaste className="w-4 h-4 text-cyan-400" />
            <span>Pegar Datos</span>
          </button>

          {/* Action: Seed Sample */}
          <button
            onClick={onSeedSample}
            disabled={isLoading}
            title="Cargar ejemplo de transporte 3417089 (Comercial Dollinco)"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
          >
            <Database className="w-4 h-4 text-amber-400" />
            <span className="hidden sm:inline">Ejemplo</span>
          </button>

          {/* Action: View Macro */}
          <button
            onClick={onOpenMacroModal}
            title="Ver código de macro VBA y script VBS"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs hover:border-slate-600 transition-all active:scale-95 cursor-pointer"
          >
            <Code className="w-4 h-4 text-cyan-400" />
          </button>

          {/* Action: Export All */}
          <button
            onClick={onExportAll}
            disabled={isLoading}
            title="Descargar reporte Excel consolidado"
            className="flex items-center space-x-1.5 px-3 py-2 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
            <span className="hidden md:inline">Excel</span>
          </button>
        </div>

      </div>
    </header>
  );
};
