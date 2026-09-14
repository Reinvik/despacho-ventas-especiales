import * as XLSX from 'xlsx';
import { TransportSummary } from '../types';

export const exportTransportToExcelClient = (summaryList: TransportSummary | TransportSummary[]) => {
  const summaries = Array.isArray(summaryList) ? summaryList : [summaryList];

  const wb = XLSX.utils.book_new();

  // 1. Hoja Resumen
  const resumenRows = summaries.map(s => ({
    "Semana": s.semana,
    "Cliente": s.cliente,
    "Número transporte": s.numero_transporte,
    "Cantidad pallet": s.cantidad_pallet,
    "Preparado": s.preparado,
    "Despachado": s.despachado,
    "Fase global": s.fase_global,
    "Total cajas pedido": s.total_cajas_pedido,
    "Total cajas preparadas": s.total_cajas_preparadas,
    "SKUs con diferencia": s.skus_con_diferencia
  }));

  const wsResumen = XLSX.utils.json_to_sheet(resumenRows);
  XLSX.utils.book_append_sheet(wb, wsResumen, "Resumen Despacho");

  // 2. Hoja Detalle (Formato exacto solicitado por el usuario)
  const detalleRows: any[] = [];
  summaries.forEach(s => {
    s.items.forEach(item => {
      detalleRows.push({
        "SKU": item.sku,
        "descripción": item.descripcion,
        "Cantidad pedido": item.cantidad_pedido,
        "UMV": item.umv,
        "Cantidad preparada": item.cantidad_preparada,
        "Diferencia preparación": item.diferencia_preparacion === 0 ? " - " : item.diferencia_preparacion,
        "Cliente": item.cliente,
        "Documento transporte": item.documento_transporte,
        "Fecha": item.fecha,
        "Tiene diferencias": item.tiene_diferencias,
        "Status": item.status
      });
    });
  });

  const wsDetalle = XLSX.utils.json_to_sheet(detalleRows);
  XLSX.utils.book_append_sheet(wb, wsDetalle, "Detalle Preparación");

  const filename = summaries.length === 1 
    ? `Despacho_${summaries[0].semana.replace(/\s+/g, '_')}_${summaries[0].numero_transporte}.xlsx`
    : `Despacho_Ventas_Especiales_Consolidado.xlsx`;

  XLSX.writeFile(wb, filename);
};
