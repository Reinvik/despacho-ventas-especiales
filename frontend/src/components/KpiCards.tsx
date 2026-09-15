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
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transportes</p>
            <h3 className="text-2xl font-black text-slate-900 mt-1">{totalTransports}</h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <Truck className="w-3.5 h-3.5 text-[#0a5c36]" />
              <span>{despachadosCount} despachados</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 shadow-xs">
            <Truck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 2. Pallets */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Pallets</p>
            <h3 className="text-2xl font-black text-amber-600 mt-1">{totalPallets}</h3>
            <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1 font-medium">
              <Layers className="w-3.5 h-3.5 text-amber-600" />
              <span>Espacio en muelle</span>
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-600 shadow-xs">
            <Layers className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 3. Cajas / Bultos */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cajas / UMV</p>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-2xl font-black text-[#0a5c36]">{totalCajasPreparadas}</span>
              <span className="text-xs text-slate-400 font-bold">/ {totalCajasPedidas}</span>
            </div>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              Preparadas vs Pedidas
            </p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0a5c36] shadow-xs">
            <Package className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 4. % Cumplimiento */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cumplimiento</p>
            <h3 className="text-2xl font-black text-blue-600 mt-1">{pctCumplimiento}%</h3>
            <div className="w-24 bg-slate-100 h-2 rounded-full mt-2 overflow-hidden border border-slate-200">
              <div 
                className="h-full bg-gradient-to-r from-emerald-500 to-[#0a5c36] rounded-full transition-all duration-500" 
                style={{ width: `${pctCumplimiento}%` }}
              />
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* 5. Alertas Diferencias */}
      <div className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-all relative overflow-hidden ${
        totalDiffSkus > 0 ? 'border-rose-300 ring-1 ring-rose-200' : 'border-slate-200'
      }`}>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Diferencias</p>
            <h3 className={`text-2xl font-black mt-1 ${totalDiffSkus > 0 ? 'text-rose-600' : 'text-slate-800'}`}>
              {totalDiffSkus}
            </h3>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">
              {totalDiffSkus > 0 ? 'SKUs con faltante' : 'Sin diferencias pendientes'}
            </p>
          </div>
          <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shadow-xs ${
            totalDiffSkus > 0 
              ? 'bg-rose-50 border-rose-200 text-rose-600' 
              : 'bg-emerald-50 border-emerald-200 text-[#0a5c36]'
          }`}>
            {totalDiffSkus > 0 ? <AlertTriangle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
          </div>
        </div>
      </div>

    </div>
  );
};
