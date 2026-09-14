import React, { useState } from 'react';
import { 
  Truck, 
  Layers, 
  FileSpreadsheet, 
  ChevronRight, 
  Trash2, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ArrowRight,
  Filter
} from 'lucide-react';
import { TransportSummary } from '../types';

interface SummaryTableProps {
  transports: TransportSummary[];
  selectedTransportId: string | null;
  onSelectTransport: (id: string) => void;
  onUpdateSummary: (id: string, updates: Partial<TransportSummary>) => void;
  onDeleteTransport: (id: string) => void;
  onExportExcel: (id: string) => void;
}

const FASE_GLOBAL_OPTIONS = [
  { value: "Pendiente", label: "🟡 Pendiente", bg: "bg-amber-950/40 text-amber-300 border-amber-800/60" },
  { value: "En Preparación", label: "🟠 En Preparación", bg: "bg-orange-950/40 text-orange-300 border-orange-800/60" },
  { value: "Preparado", label: "🔵 Preparado", bg: "bg-blue-950/40 text-blue-300 border-blue-800/60" },
  { value: "En Andén", label: "🟣 En Andén", bg: "bg-purple-950/40 text-purple-300 border-purple-800/60" },
  { value: "Despachado", label: "🟢 Despachado", bg: "bg-emerald-950/40 text-emerald-300 border-emerald-800/60" }
];

const PREPARADO_OPTIONS = [
  { value: "Pendiente", label: "Pendiente", color: "text-amber-400 bg-amber-950/50 border-amber-800/60" },
  { value: "En Preparación", label: "En Preparación", color: "text-orange-400 bg-orange-950/50 border-orange-800/60" },
  { value: "Listo", label: "Listo (100%)", color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/60" },
  { value: "Con Diferencias", label: "Con Diferencias", color: "text-rose-400 bg-rose-950/50 border-rose-800/60" }
];

const DESPACHADO_OPTIONS = [
  { value: "Pendiente", label: "No Despachado", color: "text-slate-400 bg-slate-900 border-slate-700" },
  { value: "En Andén", label: "En Andén / Carga", color: "text-purple-400 bg-purple-950/50 border-purple-800/60" },
  { value: "Despachado", label: "Despachado (Camión)", color: "text-emerald-400 bg-emerald-950/50 border-emerald-800/60" }
];

export const SummaryTable: React.FC<SummaryTableProps> = ({
  transports,
  selectedTransportId,
  onSelectTransport,
  onUpdateSummary,
  onDeleteTransport,
  onExportExcel
}) => {
  const [selectedSemana, setSelectedSemana] = useState<string>("TODAS");
  const [searchQuery, setSearchQuery] = useState<string>("");

  // Obtener lista única de semanas
  const semanas = Array.from(new Set(transports.map(t => t.semana))).sort();

  // Filtrado
  const filteredTransports = transports.filter(t => {
    const matchSemana = selectedSemana === "TODAS" || t.semana === selectedSemana;
    const matchQuery = 
      t.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.numero_transporte.includes(searchQuery);
    return matchSemana && matchQuery;
  });

  return (
    <div className="bg-[#111827] border border-slate-800 rounded-2xl p-5 shadow-xl mb-8">
      
      {/* Barra superior de Resumen */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-slate-800">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-base font-bold text-white tracking-wide uppercase flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              Resumen Operativo por Semana y Transporte
            </h2>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-semibold">
              {filteredTransports.length} activos
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Modifica en tiempo real la cantidad de pallets, el estado de preparación y despacho.
          </p>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Selector de Semana */}
          <div className="flex items-center space-x-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedSemana}
              onChange={(e) => setSelectedSemana(e.target.value)}
              className="bg-transparent text-xs text-slate-200 font-medium focus:outline-none cursor-pointer"
            >
              <option value="TODAS" className="bg-slate-900">Todas las Semanas</option>
              {semanas.map(s => (
                <option key={s} value={s} className="bg-slate-900">{s}</option>
              ))}
            </select>
          </div>

          {/* Búsqueda rápida */}
          <input
            type="text"
            placeholder="Buscar por cliente o N° transporte..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-xs rounded-lg px-3 py-1.5 text-slate-200 placeholder-slate-500 focus:border-cyan-500 focus:outline-none w-56 transition-all"
          />
        </div>
      </div>

      {/* Tabla de Resumen */}
      <div className="overflow-x-auto mt-4">
        {filteredTransports.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Truck className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            No hay despachos registrados para esta selección.
            <p className="text-xs text-slate-600 mt-1">Haz clic en "Conectar SAP" o "Pegar Datos" para agregar uno.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 font-semibold uppercase tracking-wider text-[11px] bg-slate-900/50">
                <th className="py-3 px-3">Semana</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">N° Transporte</th>
                <th className="py-3 px-3 text-center">Cant. Pallets</th>
                <th className="py-3 px-3">Fase Preparado</th>
                <th className="py-3 px-3">Fase Despachado</th>
                <th className="py-3 px-3">Fase Global</th>
                <th className="py-3 px-3 text-center">Cajas (Prep/Ped)</th>
                <th className="py-3 px-3 text-center">Diferencias</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransports.map((t) => {
                const isSelected = t.id === selectedTransportId;
                const hasDifferences = t.skus_con_diferencia > 0;

                return (
                  <tr 
                    key={t.id}
                    className={`transition-colors cursor-pointer group ${
                      isSelected 
                        ? 'bg-cyan-950/20 border-l-4 border-l-cyan-400' 
                        : 'hover:bg-slate-800/40'
                    }`}
                    onClick={() => onSelectTransport(t.id)}
                  >
                    {/* 1. Semana */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <input
                        type="text"
                        value={t.semana}
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => onUpdateSummary(t.id, { semana: e.target.value })}
                        className="bg-slate-900 border border-slate-700/80 rounded px-2 py-1 text-slate-200 text-xs font-semibold focus:border-cyan-400 focus:outline-none w-24"
                      />
                    </td>

                    {/* 2. Cliente */}
                    <td className="py-3.5 px-3 max-w-[200px] truncate font-medium text-slate-200" title={t.cliente}>
                      {t.cliente}
                    </td>

                    {/* 3. Número de transporte */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-900 border border-slate-700 font-mono text-cyan-400 font-bold">
                        {t.numero_transporte}
                      </span>
                    </td>

                    {/* 4. Cantidad Pallet (Editable) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="inline-flex items-center space-x-1">
                        <input
                          type="number"
                          min="0"
                          max="99"
                          value={t.cantidad_pallet}
                          onChange={(e) => onUpdateSummary(t.id, { cantidad_pallet: parseInt(e.target.value) || 0 })}
                          className="w-14 text-center bg-amber-950/40 border border-amber-600/50 text-amber-300 font-bold rounded px-1.5 py-1 text-xs focus:border-amber-400 focus:outline-none"
                        />
                        <span className="text-[10px] text-slate-400 font-semibold">PLT</span>
                      </div>
                    </td>

                    {/* 5. Fase Preparado (Editable) */}
                    <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.preparado}
                        onChange={(e) => onUpdateSummary(t.id, { preparado: e.target.value })}
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 font-medium focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        {PREPARADO_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 6. Fase Despachado (Editable) */}
                    <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.despachado}
                        onChange={(e) => onUpdateSummary(t.id, { despachado: e.target.value })}
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 font-medium focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        {DESPACHADO_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 7. Fase Global (Pipeline) */}
                    <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.fase_global}
                        onChange={(e) => onUpdateSummary(t.id, { fase_global: e.target.value })}
                        className="bg-slate-900 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 font-semibold focus:border-cyan-400 focus:outline-none cursor-pointer"
                      >
                        {FASE_GLOBAL_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value} className="bg-slate-900">
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 8. Cajas (Prep / Ped) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium">
                      <span className="text-emerald-400 font-bold">{t.total_cajas_preparadas}</span>
                      <span className="text-slate-500"> / {t.total_cajas_pedido}</span>
                    </td>

                    {/* 9. Diferencias */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {hasDifferences ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-950/60 border border-rose-700/60 text-rose-300 font-bold text-[11px]">
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                          {t.skus_con_diferencia} SKUs
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-950/60 border border-emerald-700/60 text-emerald-300 font-semibold text-[11px]">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          Sin dif.
                        </span>
                      )}
                    </td>

                    {/* 10. Acciones */}
                    <td className="py-3.5 px-3 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end space-x-1.5">
                        
                        {/* Botón Excel */}
                        <button
                          onClick={() => onExportExcel(t.id)}
                          title="Descargar Excel de este transporte"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-emerald-950/60 hover:text-emerald-300 text-slate-400 border border-slate-700/60 transition-all cursor-pointer"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Ver Detalle */}
                        <button
                          onClick={() => onSelectTransport(t.id)}
                          title="Ver y editar detalle de preparación por SKU"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                            isSelected 
                              ? 'bg-cyan-500 text-black border-cyan-400 font-bold' 
                              : 'bg-slate-800 text-cyan-400 border-slate-700/60 hover:bg-slate-700'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => onDeleteTransport(t.id)}
                          title="Eliminar transporte"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 hover:text-rose-400 text-slate-500 border border-slate-700/60 transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>

                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
};
