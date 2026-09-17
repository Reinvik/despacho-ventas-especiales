import { TransportSummary, TransportItem } from '../types';
import { getClientSampleSummary } from './sampleData';

const STORAGE_KEY = 'dve_transports_v1';
const DELETED_KEY = 'dve_deleted_ids_v1';

export const localDb = {
  getDeletedIds(): string[] {
    try {
      const data = localStorage.getItem(DELETED_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {}
    // Por defecto marcar 3417089 como eliminado para asegurar que no reaparezca
    return ['3417089'];
  },

  markDeleted(id: string) {
    const deleted = localDb.getDeletedIds();
    if (!deleted.includes(id)) {
      deleted.push(id);
    }
    try {
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    } catch (e) {}
  },

  unmarkDeleted(id: string) {
    const deleted = localDb.getDeletedIds().filter(d => d !== id);
    try {
      localStorage.setItem(DELETED_KEY, JSON.stringify(deleted));
    } catch (e) {}
  },

  list(): TransportSummary[] {
    const deletedIds = localDb.getDeletedIds();
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        const parsed: TransportSummary[] = JSON.parse(data);
        return parsed.filter(t => !deletedIds.includes(t.id));
      }
    } catch (e) {}
    // Si está eliminado 3417089, no sembrar y devolver lista vacía
    if (deletedIds.includes('3417089')) {
      localDb.saveAll([]);
      return [];
    }
    const initial = [getClientSampleSummary()];
    localDb.saveAll(initial);
    return initial;
  },

  get(id: string): TransportSummary | undefined {
    const list = localDb.list();
    return list.find(t => t.id === id);
  },

  save(summary: TransportSummary) {
    localDb.unmarkDeleted(summary.id);
    const list = localDb.list();
    const idx = list.findIndex(t => t.id === summary.id);
    if (idx >= 0) {
      list[idx] = summary;
    } else {
      list.unshift(summary);
    }
    localDb.saveAll(list);
  },

  saveAll(list: TransportSummary[]) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
    } catch (e) {}
  },

  delete(id: string) {
    localDb.markDeleted(id);
    const list = localDb.list().filter(t => t.id !== id);
    localDb.saveAll(list);
  },

  updateSummary(id: string, updates: Partial<TransportSummary>): TransportSummary {
    const list = localDb.list();
    const item = list.find(t => t.id === id);
    if (!item) throw new Error("Transporte no encontrado");
    Object.assign(item, updates);
    item.fecha_actualizacion = new Date().toLocaleDateString('es-CL');
    localDb.saveAll(list);
    return item;
  },

  updateItemQuantity(transportId: string, sku: string, qty: number, posicion?: string): TransportSummary {
    const list = localDb.list();
    const trans = list.find(t => t.id === transportId);
    if (!trans) throw new Error("Transporte no encontrado");

    const item = trans.items.find(i => i.sku === sku && (posicion === undefined || i.posicion === posicion));
    if (item) {
      item.cantidad_preparada = Math.max(0, qty);
      item.diferencia_preparacion = Math.max(0, item.cantidad_pedido - item.cantidad_preparada);
      item.tiene_diferencias = item.diferencia_preparacion !== 0 ? "Si" : "No";
      item.status = item.diferencia_preparacion === 0 ? "Listo" : (item.cantidad_preparada === 0 ? "Pendiente" : "Parcial");
    }

    trans.total_cajas_preparadas = trans.items.reduce((a, b) => a + b.cantidad_preparada, 0);
    trans.skus_con_diferencia = trans.items.filter(i => i.tiene_diferencias === "Si").length;
    if (trans.total_cajas_preparadas === 0) trans.preparado = "Pendiente";
    else if (trans.skus_con_diferencia === 0) trans.preparado = "Listo";
    else trans.preparado = "Con Diferencias";

    localDb.saveAll(list);
    return trans;
  },

  prepareAll(transportId: string, prepareAll: boolean): TransportSummary {
    const list = localDb.list();
    const trans = list.find(t => t.id === transportId);
    if (!trans) throw new Error("Transporte no encontrado");

    trans.items.forEach(item => {
      item.cantidad_preparada = prepareAll ? item.cantidad_pedido : 0;
      item.diferencia_preparacion = prepareAll ? 0 : item.cantidad_pedido;
      item.tiene_diferencias = prepareAll ? "No" : "Si";
      item.status = prepareAll ? "Listo" : "Pendiente";
    });

    trans.total_cajas_preparadas = trans.items.reduce((a, b) => a + b.cantidad_preparada, 0);
    trans.skus_con_diferencia = prepareAll ? 0 : trans.items.length;
    trans.preparado = prepareAll ? "Listo" : "Pendiente";
    if (prepareAll && ["Creado", "Pendiente", "En Preparación"].includes(trans.fase_global)) {
      trans.fase_global = "Preparado";
    }

    localDb.saveAll(list);
    return trans;
  }
};
