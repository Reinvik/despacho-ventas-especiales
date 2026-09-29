import React, { useState, useMemo } from 'react';
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
  Filter,
  Plus,
  PackageCheck,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { TransportSummary } from '../types';

interface SummaryTableProps {
  transports: TransportSummary[];
  selectedTransportId: string | null;
  onSelectTransport: (id: string) => void;
  onUpdateSummary: (id: string, updates: Partial<TransportSummary>) => void;
  onDeleteTransport: (id: string) => void;
  onExportExcel: (id: string) => void;
  onExportWeekExcel?: (semana: string) => void;
}

const FASE_GLOBAL_OPTIONS = [
  { value: "Pendiente", label: "🟡 Pendiente", bg: "bg-amber-950/40 text-amber-300 border-amber-800/60" },
  { value: "En Preparación", label: "🟠 En Preparación", bg: "bg-orange-950/40 text-orange-300 border-orange-800/60" },
  { value: "Preparado", label: "🔵 Preparado", bg: "bg-blue-950/40 text-blue-300 border-blue-800/60" },
  { value: "En Andén", label: "🟣 En Andén", bg: "bg-purple-950/40 text-purple-300 border-purple-800/60" },
  { value: "Despachado", label: "🟢 Despachado", bg: "bg-emerald-950/40 text-emerald-300 border-emerald-800/60" }
];

export const SummaryTable: React.FC<SummaryTableProps> = ({
  transports,
  selectedTransportId,
  onSelectTransport,
  onUpdateSummary,
  onDeleteTransport,
  onExportExcel,
  onExportWeekExcel
}) => {
  const [activeSemanaTab, setActiveSemanaTab] = useState<string>("TODAS");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [showAddWeekInput, setShowAddWeekInput] = useState<boolean>(false);
  const [newWeekName, setNewWeekName] = useState<string>("");
  const [customSemanas, setCustomSemanas] = useState<string[]>([]);

  // Obtener lista completa y ordenada de semanas (extraídas de transportes + personalizadas)
  const allSemanas = useMemo(() => {
    const set = new Set([...transports.map(t => t.semana), ...customSemanas]);
    return Array.from(set).filter(Boolean).sort();
  }, [transports, customSemanas]);

  // Manejo de creación rápida de nueva semana
  const handleCreateWeek = (e: React.FormEvent) => {
    e.preventDefault();
    if (newWeekName.trim()) {
      const clean = newWeekName.trim();
      if (!customSemanas.includes(clean)) {
        setCustomSemanas(prev => [...prev, clean]);
      }
      setActiveSemanaTab(clean);
      setNewWeekName("");
      setShowAddWeekInput(false);
    }
  };

  // Filtrado de transportes
  const filteredTransports = useMemo(() => {
    return transports.filter(t => {
      const matchSemana = activeSemanaTab === "TODAS" || t.semana === activeSemanaTab;
      const matchQuery = 
        t.cliente.toLowerCase().includes(searchQuery.toLowerCase()) ||
        t.numero_transporte.includes(searchQuery);
      return matchSemana && matchQuery;
    });
  }, [transports, activeSemanaTab, searchQuery]);

  // Agrupación por semana para vista "TODAS" o vistas agrupadas
  const groupedBySemana = useMemo(() => {
    const groups: Record<string, TransportSummary[]> = {};
    for (const t of filteredTransports) {
      if (!groups[t.semana]) groups[t.semana] = [];
      groups[t.semana].push(t);
    }
    return groups;
  }, [filteredTransports]);

  // Métricas agregadas de la selección actual
  const currentMetrics = useMemo(() => {
    const totalDocs = filteredTransports.length;
    const totalPallets = filteredTransports.reduce((a, b) => a + (b.cantidad_pallet || 0), 0);
    const totalCajasPed = filteredTransports.reduce((a, b) => a + (b.total_cajas_pedido || 0), 0);
    const totalCajasPrep = filteredTransports.reduce((a, b) => a + (b.total_cajas_preparadas || 0), 0);
    const diffCount = filteredTransports.reduce((a, b) => a + (b.skus_con_diferencia || 0), 0);
    const prepPercent = totalCajasPed > 0 ? Math.round((totalCajasPrep / totalCajasPed) * 100) : 0;
    return { totalDocs, totalPallets, totalCajasPed, totalCajasPrep, diffCount, prepPercent };
  }, [filteredTransports]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm mb-8 overflow-hidden">
      
      {/* 1. Barra de Pestañas de Semanas (Tabs Superiores) */}
      <div className="bg-slate-50/80 border-b border-slate-200 px-5 pt-4 pb-0">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div>
            <div className="flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0a5c36]"></span>
              <h2 className="text-sm font-black text-slate-900 tracking-wider uppercase flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#0a5c36]" />
                Segmentación y Control por Semana de Despacho
              </h2>
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
              Organiza y filtra múltiples documentos por semana operativa. Cambia de semana en tiempo real.
            </p>
          </div>

          {/* Buscador de transporte / cliente */}
          <div className="flex items-center space-x-2">
            <input
              type="text"
              placeholder="Buscar por cliente o N° transporte..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border border-slate-200 text-xs rounded-xl px-3 py-1.5 text-slate-800 placeholder-slate-400 focus:border-[#0a5c36] focus:outline-none w-60 transition-all shadow-xs"
            />
          </div>
        </div>

        {/* Pestañas de Navegación por Semana */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-2 scrollbar-thin">
          {/* Tab: TODAS */}
          <button
            onClick={() => setActiveSemanaTab("TODAS")}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer shadow-xs ${
              activeSemanaTab === "TODAS"
                ? "bg-[#0a5c36] text-white shadow-emerald-950/20"
                : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
            }`}
          >
            <span>Todas las Semanas</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
              activeSemanaTab === "TODAS" ? "bg-white/20 text-white" : "bg-slate-100 text-slate-600"
            }`}>
              {transports.length}
            </span>
          </button>

          {/* Tabs: Cada Semana existente */}
          {allSemanas.map((sem) => {
            const count = transports.filter(t => t.semana === sem).length;
            const weekPallets = transports
              .filter(t => t.semana === sem)
              .reduce((a, b) => a + (b.cantidad_pallet || 0), 0);
            const isCurrent = activeSemanaTab === sem;

            return (
              <button
                key={sem}
                onClick={() => setActiveSemanaTab(sem)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-2 shrink-0 cursor-pointer shadow-xs ${
                  isCurrent
                    ? "bg-[#0a5c36] text-white shadow-emerald-950/20"
                    : "bg-white text-slate-700 hover:bg-slate-100 border border-slate-200"
                }`}
              >
                <span>{sem}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-black ${
                  isCurrent ? "bg-white/20 text-white" : "bg-emerald-50 text-[#0a5c36] border border-emerald-200"
                }`}>
                  {count} doc{count !== 1 ? 's' : ''} ({weekPallets} PLT)
                </span>
              </button>
            );
          })}

          {/* Botón para añadir una nueva semana */}
          {showAddWeekInput ? (
            <form onSubmit={handleCreateWeek} className="inline-flex items-center space-x-1 shrink-0">
              <input
                type="text"
                autoFocus
                placeholder="Ej. Semana 38"
                value={newWeekName}
                onChange={(e) => setNewWeekName(e.target.value)}
                className="bg-white border border-[#0a5c36] text-xs rounded-xl px-2.5 py-1.5 text-slate-800 focus:outline-none w-28 shadow-xs"
              />
              <button
                type="submit"
                className="px-2 py-1.5 bg-[#0a5c36] text-white rounded-xl text-xs font-bold hover:bg-[#08482a]"
              >
                OK
              </button>
              <button
                type="button"
                onClick={() => setShowAddWeekInput(false)}
                className="px-2 py-1.5 bg-slate-200 text-slate-600 rounded-xl text-xs font-bold hover:bg-slate-300"
              >
                ✕
              </button>
            </form>
          ) : (
            <button
              onClick={() => setShowAddWeekInput(true)}
              className="px-2.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:text-[#0a5c36] hover:bg-emerald-50 border border-dashed border-slate-300 transition-all flex items-center space-x-1 shrink-0 cursor-pointer"
              title="Añadir una nueva semana de despacho"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nueva Semana</span>
            </button>
          )}
        </div>
      </div>

      {/* 2. Banner de Métricas de la Semana Seleccionada */}
      <div className="bg-slate-50 border-b border-slate-200 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#0a5c36]">
              <Truck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                {activeSemanaTab === "TODAS" ? "Total Despachos" : `Despachos ${activeSemanaTab}`}
              </p>
              <p className="text-sm font-black text-slate-800">
                {currentMetrics.totalDocs} Documentos
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 border border-amber-200 flex items-center justify-center text-amber-800">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Pallets Totales</p>
              <p className="text-sm font-black text-amber-900">
                {currentMetrics.totalPallets} PLT
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 border border-blue-200 flex items-center justify-center text-blue-800">
              <PackageCheck className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Cajas Prep. / Pedido</p>
              <p className="text-sm font-black text-slate-800">
                <span className="text-[#0a5c36]">{currentMetrics.totalCajasPrep}</span>
                <span className="text-slate-400"> / {currentMetrics.totalCajasPed}</span>
                <span className="text-xs text-slate-500 font-semibold ml-1.5">
                  ({currentMetrics.prepPercent}%)
                </span>
              </p>
            </div>
          </div>

          {currentMetrics.diffCount > 0 ? (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-rose-100 border border-rose-200 flex items-center justify-center text-rose-700">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Diferencias</p>
                <p className="text-sm font-black text-rose-700">
                  {currentMetrics.diffCount} SKUs
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 border border-emerald-200 flex items-center justify-center text-[#0a5c36]">
                <CheckCircle2 className="w-4 h-4" />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Estado</p>
                <p className="text-sm font-black text-[#0a5c36]">
                  100% Preparado
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Botón Exportar Semana */}
        {activeSemanaTab !== "TODAS" && (
          <button
            onClick={() => onExportWeekExcel && onExportWeekExcel(activeSemanaTab)}
            className="inline-flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-white hover:bg-emerald-50 text-[#0a5c36] border border-slate-300 hover:border-emerald-300 text-xs font-bold transition-all shadow-xs cursor-pointer"
            title={`Exportar Excel de ${activeSemanaTab}`}
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0a5c36]" />
            <span>Exportar {activeSemanaTab} (.xlsx)</span>
          </button>
        )}
      </div>

      {/* 3. Tabla de Despachos */}
      <div className="overflow-x-auto p-4">
        {filteredTransports.length === 0 ? (
          <div className="text-center py-12 text-slate-500 text-sm">
            <Truck className="w-12 h-12 mx-auto text-slate-300 mb-3" />
            <p className="font-semibold text-slate-700">
              No hay documentos de transporte registrados en {activeSemanaTab === "TODAS" ? "el sistema" : activeSemanaTab}.
            </p>
            <p className="text-xs text-slate-500 mt-1">
              Haz clic en "Conectar SAP" o "Pegar Datos" para cargar despachos en esta semana.
            </p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px] bg-slate-50">
                <th className="py-3 px-3">Semana</th>
                <th className="py-3 px-3">Cliente</th>
                <th className="py-3 px-3">N° Transporte</th>
                <th className="py-3 px-3 text-center">Cant. Pallets</th>
                <th className="py-3 px-3">Fase Global</th>
                <th className="py-3 px-3 text-center">Cajas (Prep/Ped)</th>
                <th className="py-3 px-3 text-center">Diferencias</th>
                <th className="py-3 px-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredTransports.map((t) => {
                const isSelected = t.id === selectedTransportId;
                const hasDifferences = t.skus_con_diferencia > 0;

                return (
                  <tr 
                    key={t.id}
                    className={`transition-colors cursor-pointer group ${
                      isSelected 
                        ? 'bg-emerald-50/70 border-l-4 border-l-[#0a5c36]' 
                        : 'hover:bg-slate-50'
                    }`}
                    onClick={() => onSelectTransport(t.id)}
                  >
                    {/* 1. Selector / Editor de Semana en fila */}
                    <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.semana}
                        onChange={(e) => onUpdateSummary(t.id, { semana: e.target.value })}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-slate-800 text-xs font-bold focus:border-[#0a5c36] focus:outline-none cursor-pointer shadow-xs"
                        title="Cambiar la semana de este transporte"
                      >
                        {allSemanas.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>

                    {/* 2. Cliente */}
                    <td className="py-3.5 px-3 max-w-[200px] truncate font-semibold text-slate-800" title={t.cliente}>
                      {t.cliente}
                    </td>

                    {/* 3. Número de transporte */}
                    <td className="py-3.5 px-3 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md bg-slate-100 border border-slate-200 font-mono text-[#0a5c36] font-black text-xs">
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
                          className="w-14 text-center bg-amber-50 border border-amber-300 text-amber-900 font-black rounded px-1.5 py-1 text-xs focus:border-amber-500 focus:outline-none shadow-xs"
                        />
                        <span className="text-[10px] text-slate-500 font-bold">PLT</span>
                      </div>
                    </td>

                    {/* 5. Fase Global (Pipeline) */}
                    <td className="py-3.5 px-3 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                      <select
                        value={t.fase_global}
                        onChange={(e) => onUpdateSummary(t.id, { fase_global: e.target.value })}
                        className="bg-white border border-slate-200 text-xs rounded-lg px-2 py-1 text-slate-800 font-bold focus:border-[#0a5c36] focus:outline-none cursor-pointer shadow-xs"
                      >
                        {FASE_GLOBAL_OPTIONS.map(opt => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </select>
                    </td>

                    {/* 8. Cajas (Prep / Ped) */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap font-medium">
                      <span className="text-[#0a5c36] font-bold">{t.total_cajas_preparadas}</span>
                      <span className="text-slate-400 font-medium"> / {t.total_cajas_pedido}</span>
                    </td>

                    {/* 9. Diferencias */}
                    <td className="py-3.5 px-3 text-center whitespace-nowrap">
                      {hasDifferences ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[11px] shadow-xs">
                          <AlertTriangle className="w-3 h-3 text-rose-600" />
                          {t.skus_con_diferencia} SKUs
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0a5c36] font-bold text-[11px] shadow-xs">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-[#0a5c36] text-slate-600 border border-slate-200 transition-all cursor-pointer shadow-xs"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Ver Detalle */}
                        <button
                          onClick={() => onSelectTransport(t.id)}
                          title="Ver y editar detalle de preparación por SKU"
                          className={`p-1.5 rounded-lg border transition-all cursor-pointer shadow-xs ${
                            isSelected 
                              ? 'bg-[#0a5c36] text-white border-[#08482a] font-bold' 
                              : 'bg-slate-100 text-[#0a5c36] border-slate-200 hover:bg-emerald-50'
                          }`}
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>

                        {/* Botón Eliminar */}
                        <button
                          onClick={() => onDeleteTransport(t.id)}
                          title="Eliminar transporte"
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-rose-50 hover:text-rose-600 text-slate-400 border border-slate-200 transition-all cursor-pointer shadow-xs"
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
