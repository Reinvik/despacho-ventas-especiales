import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { KpiCards } from './components/KpiCards';
import { SummaryTable } from './components/SummaryTable';
import { DetailSkuTable } from './components/DetailSkuTable';
import { SapModal } from './components/SapModal';
import { PasteDataModal } from './components/PasteDataModal';
import { MacroModal } from './components/MacroModal';
import { api } from './services/api';
import { TransportSummary, SapStatusResponse } from './types';
import { Truck, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

export const App: React.FC = () => {
  const [transports, setTransports] = useState<TransportSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [sapStatus, setSapStatus] = useState<SapStatusResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modals
  const [isSapModalOpen, setIsSapModalOpen] = useState<boolean>(false);
  const [isPasteModalOpen, setIsPasteModalOpen] = useState<boolean>(false);
  const [isMacroModalOpen, setIsMacroModalOpen] = useState<boolean>(false);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4000);
  };

  // Cargar estado inicial y transportes
  const refreshData = async () => {
    setLoading(true);
    try {
      const [transList, status] = await Promise.all([
        api.listTransports(),
        api.getStatus()
      ]);
      setTransports(transList);
      setSapStatus(status);
      
      // Si no hay seleccionado o el seleccionado ya no existe, seleccionar el primero
      if (transList.length > 0) {
        if (!selectedId || !transList.some(t => t.id === selectedId)) {
          setSelectedId(transList[0].id);
        }
      } else {
        setSelectedId(null);
      }
    } catch (err: any) {
      console.error(err);
      showNotification(err.message || 'Error al conectar con el servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshData();
    // Sondeo de estado de SAP cada 20 segundos
    const timer = setInterval(() => {
      api.getStatus().then(setSapStatus).catch(() => {});
    }, 20000);
    return () => clearInterval(timer);
  }, []);

  // Handlers
  const handleExtractSap = async (data: { documento_transporte: string; semana?: string; cantidad_pallet?: number }) => {
    const res = await api.extractFromSap(data);
    showNotification(res.message, 'success');
    await refreshData();
    setSelectedId(res.data.id);
  };

  const handleParseRaw = async (data: any) => {
    const res = await api.parseRawData(data);
    showNotification(`Transporte ${res.numero_transporte} cargado exitosamente (${res.total_skus} ítems)`, 'success');
    await refreshData();
    setSelectedId(res.id);
  };

  const handleSeedSample = async () => {
    try {
      setLoading(true);
      const res = await api.seedSample();
      showNotification(`Ejemplo cargado: Transporte ${res.numero_transporte} - ${res.cliente}`, 'success');
      await refreshData();
      setSelectedId(res.id);
    } catch (err: any) {
      showNotification(err.message || 'Error al cargar ejemplo', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSummary = async (id: string, updates: Partial<TransportSummary>) => {
    try {
      const updated = await api.updateTransportSummary(id, updates);
      setTransports(prev => prev.map(t => t.id === id ? updated : t));
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar resumen', 'error');
    }
  };

  const handleUpdateItemQuantity = async (sku: string, qty: number, posicion?: string) => {
    if (!selectedId) return;
    try {
      const updated = await api.updateItemQuantity(selectedId, sku, qty, posicion);
      setTransports(prev => prev.map(t => t.id === selectedId ? updated : t));
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar ítem', 'error');
    }
  };

  const handlePrepareAll = async (prepareAll: boolean) => {
    if (!selectedId) return;
    try {
      const updated = await api.prepareAll(selectedId, prepareAll);
      setTransports(prev => prev.map(t => t.id === selectedId ? updated : t));
      showNotification(prepareAll ? 'Todos los ítems marcados como 100% preparados' : 'Cantidades reiniciadas a 0');
    } catch (err: any) {
      showNotification(err.message || 'Error al actualizar preparación masiva', 'error');
    }
  };

  const handleDeleteTransport = async (id: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar el transporte ${id}?`)) return;
    try {
      await api.deleteTransport(id);
      showNotification(`Transporte ${id} eliminado`, 'success');
      await refreshData();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar transporte', 'error');
    }
  };

  const handleExportSingleExcel = (id: string) => {
    const target = transports.find(t => t.id === id);
    if (!target) {
      showNotification('Transporte no encontrado', 'error');
      return;
    }
    api.exportExcelSingle(target);
    showNotification(`Excel generado para transporte ${target.numero_transporte}`);
  };

  const handleExportAllExcel = () => {
    if (transports.length === 0) {
      showNotification('No hay transportes cargados para exportar', 'error');
      return;
    }
    api.exportExcelAll(transports);
    showNotification('Excel consolidado descargado exitosamente');
  };

  const selectedTransport = transports.find(t => t.id === selectedId);

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans">
      
      {/* Navbar Superior */}
      <Navbar
        sapStatus={sapStatus}
        onOpenSapModal={() => setIsSapModalOpen(true)}
        onOpenPasteModal={() => setIsPasteModalOpen(true)}
        onOpenMacroModal={() => setIsMacroModalOpen(true)}
        onSeedSample={handleSeedSample}
        onExportAll={handleExportAllExcel}
        isLoading={loading}
      />

      {/* Notificación flotante */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center space-x-2.5 px-4 py-3 rounded-xl shadow-2xl border text-xs font-semibold animate-in slide-in-from-bottom-5 duration-300 ${
          notification.type === 'success'
            ? 'bg-emerald-950 border-emerald-700 text-emerald-200'
            : 'bg-rose-950 border-rose-700 text-rose-200'
        }`}>
          {notification.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{notification.message}</span>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* KPI Cards */}
        <KpiCards transports={transports} />

        {/* Resumen por Semana, Cliente, Pallets y Fases */}
        <SummaryTable
          transports={transports}
          selectedTransportId={selectedId}
          onSelectTransport={(id) => setSelectedId(id)}
          onUpdateSummary={handleUpdateSummary}
          onDeleteTransport={handleDeleteTransport}
          onExportExcel={handleExportSingleExcel}
        />

        {/* Matriz Detalle por SKU (Si hay transporte seleccionado) */}
        {selectedTransport ? (
          <DetailSkuTable
            transport={selectedTransport}
            onUpdateItemQuantity={handleUpdateItemQuantity}
            onPrepareAll={handlePrepareAll}
            onExportExcel={() => handleExportSingleExcel(selectedTransport.id)}
          />
        ) : (
          <div className="bg-[#111827] border border-dashed border-slate-800 rounded-2xl p-10 text-center text-slate-500">
            <Truck className="w-12 h-12 mx-auto text-slate-700 mb-3" />
            <p className="text-sm font-medium text-slate-400">Ningún transporte seleccionado</p>
            <p className="text-xs text-slate-500 mt-1">
              Haz clic en una fila del resumen o utiliza "Conectar SAP" / "Cargar Ejemplo" para comenzar.
            </p>
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-[#0A0E17] py-4 text-center text-xs text-slate-500">
        <p>Despacho Ventas Especiales • Integración SAP GUI Scripting & Excel • Smartlean Platform</p>
      </footer>

      {/* Modales */}
      <SapModal
        isOpen={isSapModalOpen}
        onClose={() => setIsSapModalOpen(false)}
        sapStatus={sapStatus}
        onExtract={handleExtractSap}
      />

      <PasteDataModal
        isOpen={isPasteModalOpen}
        onClose={() => setIsPasteModalOpen(false)}
        onParse={handleParseRaw}
      />

      <MacroModal
        isOpen={isMacroModalOpen}
        onClose={() => setIsMacroModalOpen(false)}
        defaultTknum={selectedTransport?.numero_transporte || "3417089"}
      />

    </div>
  );
};

export default App;
