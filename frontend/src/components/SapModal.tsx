import React, { useState } from 'react';
import { Zap, X, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';
import { SapStatusResponse } from '../types';

interface SapModalProps {
  isOpen: boolean;
  onClose: () => void;
  sapStatus: SapStatusResponse | null;
  onExtract: (data: { documento_transporte: string; semana?: string; cantidad_pallet?: number }) => Promise<void>;
}

export const SapModal: React.FC<SapModalProps> = ({
  isOpen,
  onClose,
  sapStatus,
  onExtract
}) => {
  const [tknum, setTknum] = useState<string>("3417089");
  const [semana, setSemana] = useState<string>("Semana 36");
  const [pallets, setPallets] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const isSapRunning = sapStatus?.sap_gui.running ?? false;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tknum.trim()) {
      setErrorMsg("Debes ingresar el número de transporte");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await onExtract({
        documento_transporte: tknum.trim(),
        semana: semana.trim() || undefined,
        cantidad_pallet: pallets
      });
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al conectar con SAP GUI");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-950 border border-cyan-800 flex items-center justify-center text-cyan-400">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Conectar a SAP GUI (VL06O)
              </h3>
              <p className="text-[11px] text-slate-400">
                Extracción automática vía SAP Scripting Engine (COM)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alert */}
        <div className="px-6 pt-4">
          <div className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
            isSapRunning 
              ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300' 
              : sapStatus?.is_local_bridge
              ? 'bg-amber-950/40 border-amber-800/60 text-amber-300'
              : 'bg-blue-950/40 border-blue-800/60 text-cyan-300'
          }`}>
            {isSapRunning ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : sapStatus?.is_local_bridge ? (
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {isSapRunning 
                  ? 'SAP GUI detectado en tu equipo (Sesión Activa)' 
                  : sapStatus?.is_local_bridge
                  ? 'Agente Local Activo • Falta abrir SAP Logon'
                  : 'Modo Web (dve.nexusnetwork.cl)'}
              </p>
              <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                {isSapRunning
                  ? 'Listo para conectar a la sesión activa mediante GetObject("SAPGUI") y ejecutar VL06O automáticamente.'
                  : sapStatus?.is_local_bridge
                  ? 'Abre SAP Logon e inicia sesión en tu mandante para que la app se conecte automáticamente.'
                  : 'Para conectar a SAP GUI por Scripting COM en Windows, inicia la app con iniciar_app.bat en tu PC, o usa el botón "Pegar Datos" para ingresar el reporte copiado de SAP.'}
              </p>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              Documento de Transporte (IT_TKNUM-LOW) *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 3417089"
              value={tknum}
              onChange={(e) => setTknum(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-slate-100 font-mono text-sm focus:border-cyan-400 focus:outline-none transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Semana
              </label>
              <input
                type="text"
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                placeholder="Ej. Semana 36"
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cantidad Pallets (Inicial)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={pallets}
                onChange={(e) => setPallets(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div className="bg-slate-900/60 p-3 rounded-xl border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-semibold text-slate-300 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              Flujo de automatización SAP:
            </p>
            <p>1. Ingresa a transacción <span className="font-mono text-cyan-300">/nvl06o</span></p>
            <p>2. Presiona botón 6 ("Para picking") y limpia fechas de salida</p>
            <p>3. Asigna el número de transporte <span className="font-mono text-cyan-300">{tknum || '...'}</span> y ejecuta (F8)</p>
            <p>4. Exporta la lista y la ingesta directamente a la aplicación</p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-cyan-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extrayendo de SAP...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Conectar y Extraer</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
