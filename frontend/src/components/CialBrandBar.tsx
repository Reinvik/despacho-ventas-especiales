import React from 'react';
import { Building2, ShieldCheck, MapPin, Sparkles, CheckCircle2, AlertCircle } from 'lucide-react';
import { SapStatusResponse } from '../types';

interface CialBrandBarProps {
  sapStatus: SapStatusResponse | null;
}

export const CialBrandBar: React.FC<CialBrandBarProps> = ({ sapStatus }) => {
  const isSapActive = sapStatus?.sap_gui.running ?? false;
  const isLocalBridge = sapStatus?.is_local_bridge ?? false;

  return (
    <div className="bg-[#08482a] border-b border-[#063820] text-emerald-100 text-xs py-1.5 px-4 sm:px-6 lg:px-8 shadow-inner select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2">
        
        {/* Marcas Oficiales de CIAL */}
        <div className="flex items-center space-x-3 text-[11px] font-bold tracking-wide">
          <span className="text-emerald-400 font-black flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" />
            CIAL ALIMENTOS
          </span>
          <span className="text-emerald-600">•</span>
          <span className="text-white hover:text-emerald-200 transition-colors">SAN JORGE</span>
          <span className="text-emerald-600">•</span>
          <span className="text-white hover:text-emerald-200 transition-colors">LA PREFERIDA</span>
          <span className="text-emerald-600">•</span>
          <span className="text-white hover:text-emerald-200 transition-colors">WINTER</span>
        </div>

        {/* Ubicación y Conexión SAP */}
        <div className="flex items-center space-x-3 text-[11px]">
          <span className="hidden md:flex items-center gap-1 text-emerald-300 font-medium">
            <MapPin className="w-3 h-3 text-emerald-400" />
            CD San Jorge — Muelle Outbound
          </span>
          <span className="hidden md:inline text-emerald-600">•</span>
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isSapActive ? 'bg-emerald-400 animate-pulse' : isLocalBridge ? 'bg-amber-400' : 'bg-slate-400'}`} />
            <span className="font-semibold text-white">
              {isSapActive ? 'SAP GUI Conectado' : isLocalBridge ? 'Agente Windows Listo' : 'Modo Web'}
            </span>
          </div>
        </div>

      </div>
    </div>
  );
};
