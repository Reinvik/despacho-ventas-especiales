import React, { useState } from 'react';
import { 
  CheckCheck, 
  RotateCcw, 
  Filter, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  PackageCheck,
  Search
} from 'lucide-react';
import { TransportSummary, TransportItem } from '../types';

interface DetailSkuTableProps {
  transport: TransportSummary;
  onUpdateItemQuantity: (sku: string, qty: number, posicion?: string) => void;
  onPrepareAll: (prepareAll: boolean) => void;
  onExportExcel: () => void;
}

export const DetailSkuTable: React.FC<DetailSkuTableProps> = ({
  transport,
  onUpdateItemQuantity,
  onPrepareAll,
  onExportExcel
}) => {
  const [onlyDifferences, setOnlyDifferences] = useState<boolean>(false);
  const [skuSearch, setSkuSearch] = useState<string>("");

  const filteredItems = transport.items.filter(item => {
    const matchDiff = !onlyDifferences || item.tiene_diferencias === "Si";
    const matchSearch = 
      item.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
      item.descripcion.toLowerCase().includes(skuSearch.toLowerCase());
    return matchDiff && matchSearch;
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl">
      
      {/* Cabecera del Detalle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800/60 flex items-center justify-center text-cyan-400 font-black">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-white tracking-wide">
                  Matriz de Preparación por SKU
                </h3>
                <span className="px-2 py-0.5 rounded bg-cyan-900/60 border border-cyan-700/60 font-mono text-xs text-cyan-300 font-bold">
                  TKNUM: {transport.numero_transporte}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-medium">
                  {transport.cliente}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {transport.semana} • {transport.cantidad_pallet} Pallets • {transport.total_skus} SKUs en lista
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Búsqueda de SKU o descripción */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="Buscar SKU o nombre..."
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="bg-slate-900 border border-slate-800 text-xs rounded-lg pl-8 pr-3 py-1.5 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-48 transition-all"
            />
          </div>

          {/* Toggle Solo Diferencias */}
          <button
            onClick={() => setOnlyDifferences(!onlyDifferences)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              onlyDifferences 
                ? 'bg-rose-950/60 border-rose-700 text-rose-300 shadow-sm shadow-rose-950' 
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Solo Faltantes ({transport.skus_con_diferencia})</span>
          </button>

          {/* Preparar 100% */}
          <button
            onClick={() => onPrepareAll(true)}
            className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 border border-emerald-700/60 text-xs font-semibold transition-all active:scale-95 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Preparar 100%</span>
          </button>

          {/* Resetear a 0 */}
          <button
            onClick={() => onPrepareAll(false)}
            className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700 text-xs transition-all active:scale-95 cursor-pointer"
            title="Reiniciar cantidades preparadas a 0"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Exportar Excel */}
          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-md shadow-emerald-900/40 transition-all active:scale-95 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Descargar Excel</span>
          </button>

        </div>
      </div>

      {/* Tabla con las 11 columnas exactas solicitadas */}
      <div className="overflow-x-auto mt-4 max-h-[580px] overflow-y-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-900 shadow-sm">
            <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-2.5 px-3">SKU</th>
              <th className="py-2.5 px-3 min-w-[220px]">descripción</th>
              <th className="py-2.5 px-3 text-right">Cantidad pedido</th>
              <th className="py-2.5 px-3 text-center">UMV</th>
              <th className="py-2.5 px-3 text-center">Cantidad preparada</th>
              <th className="py-2.5 px-3 text-center">Diferencia preparación</th>
              <th className="py-2.5 px-3">Cliente</th>
              <th className="py-2.5 px-3 text-center">Documento transporte</th>
              <th className="py-2.5 px-3 text-center">Fecha</th>
              <th className="py-2.5 px-3 text-center">Tiene diferencias</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-medium">
            {filteredItems.map((item, index) => {
              const hasDiff = item.tiene_diferencias === "Si";
              return (
                <tr 
                  key={`${item.sku}-${item.posicion || index}`}
                  className={`transition-colors ${
                    hasDiff 
                      ? 'bg-rose-950/15 hover:bg-rose-950/25' 
                      : index % 2 === 0 ? 'bg-transparent hover:bg-slate-800/30' : 'bg-slate-900/30 hover:bg-slate-800/40'
                  }`}
                >
                  {/* 1. SKU */}
                  <td className="py-2.5 px-3 font-mono text-cyan-400 font-bold whitespace-nowrap">
                    {item.sku}
                  </td>

                  {/* 2. Descripción */}
                  <td className="py-2.5 px-3 text-slate-200" title={item.descripcion}>
                    {item.descripcion}
                  </td>

                  {/* 3. Cantidad pedido */}
                  <td className="py-2.5 px-3 text-right font-bold text-slate-200">
                    {item.cantidad_pedido}
                  </td>

                  {/* 4. UMV */}
                  <td className="py-2.5 px-3 text-center text-slate-400 font-mono">
                    {item.umv}
                  </td>

                  {/* 5. Cantidad preparada (Editable) */}
                  <td className="py-2.5 px-3 text-center">
                    <input
                      type="number"
                      min="0"
                      max={item.cantidad_pedido * 2}
                      value={item.cantidad_preparada}
                      onChange={(e) => onUpdateItemQuantity(item.sku, parseFloat(e.target.value) || 0, item.posicion)}
                      className={`w-18 text-center rounded px-2 py-1 font-bold text-xs border focus:outline-none transition-all ${
                        hasDiff
                          ? 'bg-rose-950/60 border-rose-600/70 text-rose-300 focus:border-rose-400'
                          : 'bg-emerald-950/40 border-emerald-600/50 text-emerald-300 focus:border-emerald-400'
                      }`}
                    />
                  </td>

                  {/* 6. Diferencia preparación */}
                  <td className="py-2.5 px-3 text-center font-bold">
                    {hasDiff ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-rose-950/80 text-rose-400 border border-rose-800/60 font-mono text-xs">
                        {item.diferencia_preparacion}
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono text-sm">
                        -
                      </span>
                    )}
                  </td>

                  {/* 7. Cliente */}
                  <td className="py-2.5 px-3 text-slate-300 whitespace-nowrap max-w-[180px] truncate" title={item.cliente}>
                    {item.cliente}
                  </td>

                  {/* 8. Documento transporte */}
                  <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                    {item.documento_transporte}
                  </td>

                  {/* 9. Fecha */}
                  <td className="py-2.5 px-3 text-center font-medium text-slate-300 whitespace-nowrap">
                    {item.fecha}
                  </td>

                  {/* 10. Tiene diferencias */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    {hasDiff ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950 border border-rose-700 text-rose-400 font-bold text-[10px]">
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Si
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-semibold text-[10px]">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                        No
                      </span>
                    )}
                  </td>

                  {/* 11. Status */}
                  <td className="py-2.5 px-3 text-center whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                      item.status === 'Listo'
                        ? 'bg-emerald-950/50 border-emerald-700/60 text-emerald-300'
                        : item.status === 'Parcial'
                        ? 'bg-amber-950/50 border-amber-700/60 text-amber-300'
                        : 'bg-slate-800 border-slate-700 text-slate-400'
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

    </div>
  );
};
