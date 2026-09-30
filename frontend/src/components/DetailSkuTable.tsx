import React, { useState, useMemo } from 'react';
import { 
  CheckCheck, 
  RotateCcw, 
  Filter, 
  FileSpreadsheet, 
  AlertTriangle, 
  CheckCircle2, 
  PackageCheck,
  Search,
  ChevronDown,
  ChevronUp,
  ArrowUpDown,
  Lock
} from 'lucide-react';
import { TransportSummary, TransportItem } from '../types';

export type DetailSortField = 
  | 'sku'
  | 'descripcion'
  | 'cantidad_pedido'
  | 'umv'
  | 'cantidad_preparada'
  | 'diferencia_preparacion'
  | 'cliente'
  | 'documento_transporte'
  | 'fecha'
  | 'tiene_diferencias'
  | 'status';

export type SortDirection = 'asc' | 'desc';

interface DetailSkuTableProps {
  transport: TransportSummary;
  onUpdateItemQuantity: (sku: string, qty: number, posicion?: string) => void;
  onPrepareAll: (prepareAll: boolean) => void;
  onExportExcel: () => void;
  isReadOnly?: boolean;
  onOpenLogin?: () => void;
}

export const DetailSkuTable: React.FC<DetailSkuTableProps> = ({
  transport,
  onUpdateItemQuantity,
  onPrepareAll,
  onExportExcel,
  isReadOnly = false,
  onOpenLogin
}) => {
  const [onlyDifferences, setOnlyDifferences] = useState<boolean>(false);
  const [skuSearch, setSkuSearch] = useState<string>("");
  const [sortField, setSortField] = useState<DetailSortField | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  const handleSort = (field: DetailSortField) => {
    if (sortField === field) {
      setSortDirection(prev => (prev === 'desc' ? 'asc' : 'desc'));
    } else {
      setSortField(field);
      setSortDirection('desc'); // Por defecto de Mayor a Menor en el primer clic
    }
  };

  const renderSortIcon = (field: DetailSortField) => {
    if (sortField !== field) {
      return (
        <ArrowUpDown className="w-3 h-3 text-slate-400 opacity-50 group-hover:opacity-100 transition-opacity shrink-0 ml-1 inline" />
      );
    }
    return sortDirection === 'desc' ? (
      <ChevronDown className="w-3.5 h-3.5 text-[#0a5c36] shrink-0 ml-1 inline" />
    ) : (
      <ChevronUp className="w-3.5 h-3.5 text-[#0a5c36] shrink-0 ml-1 inline" />
    );
  };

  const filteredItems = useMemo(() => {
    return transport.items.filter(item => {
      const matchDiff = !onlyDifferences || item.tiene_diferencias === "Si";
      const matchSearch = 
        item.sku.toLowerCase().includes(skuSearch.toLowerCase()) ||
        item.descripcion.toLowerCase().includes(skuSearch.toLowerCase()) ||
        item.cliente.toLowerCase().includes(skuSearch.toLowerCase()) ||
        String(item.documento_transporte).includes(skuSearch);
      return matchDiff && matchSearch;
    });
  }, [transport.items, onlyDifferences, skuSearch]);

  const sortedItems = useMemo(() => {
    if (!sortField) return filteredItems;

    return [...filteredItems].sort((a, b) => {
      let valA: any = a[sortField];
      let valB: any = b[sortField];

      // Campos numéricos
      if (['cantidad_pedido', 'cantidad_preparada', 'diferencia_preparacion'].includes(sortField)) {
        valA = Number(valA) || 0;
        valB = Number(valB) || 0;
        return sortDirection === 'desc' ? valB - valA : valA - valB;
      }

      // Campos de texto / alfanuméricos
      const strA = String(valA ?? '').toLowerCase();
      const strB = String(valB ?? '').toLowerCase();
      const cmp = strA.localeCompare(strB, 'es', { numeric: true });
      return sortDirection === 'desc' ? -cmp : cmp;
    });
  }, [filteredItems, sortField, sortDirection]);

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
      
      {/* Cabecera del Detalle */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-slate-200">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#0a5c36] font-black shadow-xs">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                <h3 className="text-base font-black text-slate-900 tracking-wide">
                  Matriz de Preparación por SKU
                </h3>
                <span className="px-2 py-0.5 rounded bg-emerald-50 border border-emerald-200 font-mono text-xs text-[#0a5c36] font-bold shadow-xs">
                  TKNUM: {transport.numero_transporte}
                </span>
                <span className="text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                  {transport.cliente}
                </span>
                {isReadOnly && (
                  <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold">
                    <Lock className="w-3 h-3 text-amber-600" />
                    Solo Lectura
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                {transport.semana} • {transport.cantidad_pallet} Pallets • {transport.total_skus} SKUs en lista
                {sortField && (
                  <span className="ml-2 text-[#0a5c36] font-bold">
                    (Ordenado por {sortField} de {sortDirection === 'desc' ? 'Mayor a Menor' : 'Menor a Mayor'})
                  </span>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Acciones y Filtros */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Búsqueda de SKU o descripción */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar SKU o descripción..."
              value={skuSearch}
              onChange={(e) => setSkuSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 text-xs rounded-lg pl-8 pr-3 py-1.5 text-slate-800 placeholder-slate-400 focus:border-[#0a5c36] focus:bg-white focus:outline-none w-48 transition-all shadow-xs"
            />
          </div>

          {/* Toggle Solo Diferencias */}
          <button
            onClick={() => setOnlyDifferences(!onlyDifferences)}
            className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all cursor-pointer shadow-xs ${
              onlyDifferences 
                ? 'bg-rose-50 border-rose-300 text-rose-700 font-bold' 
                : 'bg-slate-100 border-slate-200 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Solo Faltantes ({transport.skus_con_diferencia})</span>
          </button>

          {/* Preparar 100% (Solo para usuarios autenticados) */}
          {!isReadOnly ? (
            <button
              onClick={() => onPrepareAll(true)}
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-[#0a5c36] hover:bg-[#08482a] text-white text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-xs"
            >
              <CheckCheck className="w-3.5 h-3.5 text-emerald-300" />
              <span className="hidden sm:inline">Preparar 100%</span>
            </button>
          ) : (
            <button
              onClick={onOpenLogin}
              title="Inicia sesión para editar cantidades"
              className="flex items-center space-x-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-500 text-xs font-bold transition-all cursor-pointer border border-slate-200 shadow-xs"
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Preparar 100%</span>
            </button>
          )}

          {/* Resetear a 0 */}
          {!isReadOnly ? (
            <button
              onClick={() => onPrepareAll(false)}
              className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 border border-slate-200 text-xs transition-all active:scale-95 cursor-pointer shadow-xs"
              title="Reiniciar cantidades preparadas a 0"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          ) : null}

          {/* Exportar Excel (Siempre habilitado para todos los usuarios) */}
          <button
            onClick={onExportExcel}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-xs transition-all active:scale-95 cursor-pointer"
            title="Descargar Excel de este transporte (Sin límite de acceso)"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Descargar Excel</span>
          </button>

        </div>
      </div>

      {/* Tabla con las 11 columnas exactas y ordenamiento interactivo */}
      <div className="overflow-x-auto mt-4 max-h-[580px] overflow-y-auto border border-slate-200 rounded-xl">
        <table className="w-full text-left border-collapse text-xs">
          <thead className="sticky top-0 z-10 bg-slate-50 shadow-xs">
            <tr className="border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              
              {/* 1. SKU */}
              <th 
                onClick={() => handleSort('sku')}
                className="py-2.5 px-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por SKU (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center space-x-1">
                  <span>SKU</span>
                  {renderSortIcon('sku')}
                </div>
              </th>

              {/* 2. Descripción */}
              <th 
                onClick={() => handleSort('descripcion')}
                className="py-2.5 px-3 min-w-[220px] cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Descripción (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center space-x-1">
                  <span>Descripción</span>
                  {renderSortIcon('descripcion')}
                </div>
              </th>

              {/* 3. Cantidad Pedido */}
              <th 
                onClick={() => handleSort('cantidad_pedido')}
                className="py-2.5 px-3 text-right cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Cantidad Pedido (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-end space-x-1">
                  <span>Cant. Pedido</span>
                  {renderSortIcon('cantidad_pedido')}
                </div>
              </th>

              {/* 4. UMV */}
              <th 
                onClick={() => handleSort('umv')}
                className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por UMV (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>UMV</span>
                  {renderSortIcon('umv')}
                </div>
              </th>

              {/* 5. Cantidad Preparada */}
              <th 
                onClick={() => handleSort('cantidad_preparada')}
                className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Cantidad Preparada (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Cant. Preparada</span>
                  {renderSortIcon('cantidad_preparada')}
                </div>
              </th>

              {/* 6. Diferencia Preparación */}
              <th 
                onClick={() => handleSort('diferencia_preparacion')}
                className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Diferencia (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Diferencia</span>
                  {renderSortIcon('diferencia_preparacion')}
                </div>
              </th>

              {/* 7. Cliente */}
              <th 
                onClick={() => handleSort('cliente')}
                className="py-2.5 px-3 cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Cliente (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center space-x-1">
                  <span>Cliente</span>
                  {renderSortIcon('cliente')}
                </div>
              </th>

              {/* 8. Documento Transporte */}
              <th 
                onClick={() => handleSort('documento_transporte')}
                className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Doc Transporte (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Doc. Transporte</span>
                  {renderSortIcon('documento_transporte')}
                </div>
              </th>

              {/* 9. Fecha */}
              <th 
                onClick={() => handleSort('fecha')}
                className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Fecha (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Fecha</span>
                  {renderSortIcon('fecha')}
                </div>
              </th>

              {/* 10. Tiene Diferencias */}
              <th 
                onClick={() => handleSort('tiene_diferencias')}
                className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Diferencias (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Diferencias?</span>
                  {renderSortIcon('tiene_diferencias')}
                </div>
              </th>

              {/* 11. Status */}
              <th 
                onClick={() => handleSort('status')}
                className="py-2.5 px-3 text-center cursor-pointer select-none hover:bg-slate-100 transition-colors group"
                title="Ordenar por Status (clic para ordenar de Mayor a Menor)"
              >
                <div className="flex items-center justify-center space-x-1">
                  <span>Status</span>
                  {renderSortIcon('status')}
                </div>
              </th>

            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 font-medium">
            {sortedItems.length === 0 ? (
              <tr>
                <td colSpan={11} className="py-8 text-center text-slate-400">
                  No se encontraron registros con los filtros actuales
                </td>
              </tr>
            ) : (
              sortedItems.map((item, index) => {
                const hasDiff = item.tiene_diferencias === "Si";
                return (
                  <tr 
                    key={`${item.sku}-${item.posicion || index}`}
                    className={`transition-colors ${
                      hasDiff 
                        ? 'bg-rose-50/50 hover:bg-rose-50' 
                        : index % 2 === 0 ? 'bg-white hover:bg-slate-50' : 'bg-slate-50/40 hover:bg-slate-50'
                    }`}
                  >
                    {/* 1. SKU */}
                    <td className="py-2.5 px-3 font-mono text-[#0a5c36] font-black whitespace-nowrap">
                      {item.sku}
                    </td>

                    {/* 2. Descripción */}
                    <td className="py-2.5 px-3 text-slate-800 font-semibold" title={item.descripcion}>
                      {item.descripcion}
                    </td>

                    {/* 3. Cantidad pedido */}
                    <td className="py-2.5 px-3 text-right font-black text-slate-900">
                      {item.cantidad_pedido}
                    </td>

                    {/* 4. UMV */}
                    <td className="py-2.5 px-3 text-center text-slate-500 font-mono font-bold">
                      {item.umv}
                    </td>

                    {/* 5. Cantidad preparada (Editable o Solo Lectura) */}
                    <td className="py-2.5 px-3 text-center">
                      {isReadOnly ? (
                        <span className={`inline-block px-2.5 py-1 rounded-md text-xs font-black ${
                          hasDiff 
                            ? 'bg-rose-50 text-rose-800 border border-rose-200' 
                            : 'bg-emerald-50 text-[#0a5c36] border border-emerald-200'
                        }`}>
                          {item.cantidad_preparada}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          max={item.cantidad_pedido * 2}
                          value={item.cantidad_preparada}
                          onChange={(e) => onUpdateItemQuantity(item.sku, parseFloat(e.target.value) || 0, item.posicion)}
                          className={`w-20 text-center rounded-lg px-2 py-1 font-black text-xs border focus:outline-none transition-all shadow-xs ${
                            hasDiff
                              ? 'bg-rose-50 border-rose-300 text-rose-800 focus:border-rose-500'
                              : 'bg-emerald-50 border-emerald-300 text-[#0a5c36] focus:border-[#0a5c36]'
                          }`}
                        />
                      )}
                    </td>

                    {/* 6. Diferencia preparación */}
                    <td className="py-2.5 px-3 text-center font-bold">
                      {hasDiff ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200 font-mono text-xs font-black shadow-xs">
                          {item.diferencia_preparacion}
                        </span>
                      ) : (
                        <span className="text-slate-400 font-mono text-sm">
                          -
                        </span>
                      )}
                    </td>

                    {/* 7. Cliente */}
                    <td className="py-2.5 px-3 text-slate-700 whitespace-nowrap max-w-[180px] truncate font-medium" title={item.cliente}>
                      {item.cliente}
                    </td>

                    {/* 8. Documento transporte */}
                    <td className="py-2.5 px-3 text-center font-mono text-slate-600 font-bold">
                      {item.documento_transporte}
                    </td>

                    {/* 9. Fecha */}
                    <td className="py-2.5 px-3 text-center font-medium text-slate-600 whitespace-nowrap">
                      {item.fecha}
                    </td>

                    {/* 10. Tiene diferencias */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      {hasDiff ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-[10px] shadow-xs">
                          <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />
                          Si
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 border border-emerald-200 text-[#0a5c36] font-bold text-[10px] shadow-xs">
                          <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />
                          No
                        </span>
                      )}
                    </td>

                    {/* 11. Status */}
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-xs ${
                        item.status === 'Listo'
                          ? 'bg-emerald-50 border-emerald-200 text-[#0a5c36]'
                          : item.status === 'Parcial'
                          ? 'bg-amber-50 border-amber-200 text-amber-800'
                          : 'bg-slate-100 border-slate-200 text-slate-600'
                      }`}>
                        {item.status}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
};
