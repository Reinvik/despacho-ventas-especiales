import React from 'react';
import { 
  Package, 
  Layers, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp,
  Truck
} from 'lucide-react';
import { TransportSummary } from '../types';

interface KpiCardsProps {
  transports: TransportSummary[];
}

export const KpiCards: React.FC<KpiCardsProps> = ({ transports }) => {
  const totalTransports = transports.length;
  const totalPallets = transports.reduce((acc, t) => acc + (t.cantidad_pallet || 0), 0);
  const totalCajasPedidas = transports.reduce((acc, t) => acc + (t.total_cajas_pedido || 0), 0);
  const totalCajasPreparadas = transports.reduce((acc, t) => acc + (t.total_cajas_preparadas || 0), 0);
  const totalDiffSkus = transports.reduce((acc, t) => acc + (t.skus_con_diferencia || 0), 0);
  
  const despachadosCount = transports.filter(t => t.despachado === 'Despachado' || t.fase_global === 'Despachado').length;
  const preparadosCount = transports.filter(t => t.preparado === 'Listo' || t.preparado === 'Preparado').length;

  const pctCumplimiento = totalCajasPedidas > 0 
    ? Math.min(100, Math.round((totalCajasPreparadas / totalCajasPedidas) * 100)) 
    : 0;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
      
      {/* 1. Transportes */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Transportes</p>
            <h3 className="text-2xl font-black text-white mt-1">{totalTransports}</h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Truck className="w-3 h-3 text-cyan-400" />
              <span>{despachadosCount} despachados</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-cyan-950/60 border border-cyan-800/40 flex items-center justify-center text-cyan-400">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Pallets */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Pallets</p>
            <h3 className="text-2xl font-black text-amber-400 mt-1">{totalPallets}</h3>
            <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
              <Layers className="w-3 h-3 text-amber-400" />
              <span>Espacio en bodega</span>
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-amber-950/60 border border-amber-800/40 flex items-center justify-center text-amber-400">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Cajas / Bultos */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cajas / UMV</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-emerald-400">{totalCajasPreparadas}</span>
              <span className="text-xs text-slate-400 font-semibold">/ {totalCajasPedidas}</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Preparadas vs Pedidas
            </p>
          </div>
          <div className="w-10 h-10 rounded-lg bg-emerald-950/60 border border-emerald-800/40 flex items-center justify-center text-emerald-400">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. % Cumplimiento */}
      <div className="bg-[#111827] border border-slate-800 rounded-xl p-4 shadow-sm relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Cumplimiento</p>
            <h3 className="text-2xl font-black text-cyan-300 mt-1">{pctCumplimiento}%</h3>
            <div className="w-24 bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500" 
                style={{ width: `${pctCumplimiento}%` }}
              />
            </div>
          </div>
          <div className="w-10 h-10 rounded-lg bg-blue-950/60 border border-blue-800/40 flex items-center justify-center text-cyan-400">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 5. Alertas Diferencias */}
      <div className={`bg-[#111827] border rounded-xl p-4 shadow-sm relative overflow-hidden transition-all ${
        totalDiffSkus > 0 ? 'border-rose-900/60 bg-rose-950/10' : 'border-slate-800'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Diferencias</p>
            <h3 className={`text-2xl font-black mt-1 ${totalDiffSkus > 0 ? 'text-rose-400' : 'text-slate-200'}`}>
              {totalDiffSkus}
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              {totalDiffSkus > 0 ? 'SKUs con faltante' : 'Sin diferencias pendientes'}
            </p>
          </div>
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${
            totalDiffSkus > 0 
              ? 'bg-rose-950/70 border-rose-800/60 text-rose-400' 
              : 'bg-emerald-950/40 border-emerald-800/40 text-emerald-400'
          }`}>
            {totalDiffSkus > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>
      </div>

    </div>
  );
};
