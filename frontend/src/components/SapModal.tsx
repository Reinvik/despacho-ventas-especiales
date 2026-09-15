import React, { useState } from 'react';
import { Zap, X, AlertCircle, CheckCircle2, Loader2, Info, Download } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        
        {/* Header CIAL */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#08482a] bg-[#0a5c36] text-white">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-amber-300">
              <Zap className="w-5 h-5 fill-amber-300" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white uppercase tracking-wider">
                Conectar a SAP GUI (VL06O)
              </h3>
              <p className="text-[11px] text-emerald-200 font-medium">
                Extracción automática vía SAP Scripting Engine (COM)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Status Alert */}
        <div className="px-6 pt-4 space-y-3">
          <div className={`p-3.5 rounded-xl border flex items-start space-x-2.5 text-xs ${
            isSapRunning 
              ? 'bg-emerald-50 border-emerald-200 text-[#0a5c36]' 
              : sapStatus?.is_local_bridge
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : 'bg-slate-50 border-slate-200 text-slate-700'
          }`}>
            {isSapRunning ? (
              <CheckCircle2 className="w-4 h-4 text-[#0a5c36] shrink-0 mt-0.5" />
            ) : sapStatus?.is_local_bridge ? (
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            ) : (
              <Info className="w-4 h-4 text-[#0a5c36] shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-bold">
                {isSapRunning 
                  ? 'SAP GUI detectado en tu equipo (Sesión Activa)' 
                  : sapStatus?.is_local_bridge
                  ? 'Agente Local Activo • Falta abrir SAP Logon'
                  : 'Modo Web (dve.nexusnetwork.cl)'}
              </p>
              <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">
                {isSapRunning
                  ? 'Listo para conectar a la sesión activa mediante GetObject("SAPGUI") y ejecutar VL06O automáticamente.'
                  : sapStatus?.is_local_bridge
                  ? 'Abre SAP Logon e inicia sesión en tu mandante para que la app se conecte automáticamente.'
                  : 'Para conectar con SAP GUI sin Python, descarga el Script SAP (.vbs) o usa "Pegar Datos".'}
              </p>
            </div>
          </div>

          {/* Descargas directas de scripts */}
          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap gap-2 items-center justify-between text-xs">
            <span className="text-slate-600 font-bold text-[11px]">📥 Utilidades Windows:</span>
            <div className="flex gap-2">
              <a
                href="/Extraer_SAP_y_Enviar_a_la_Web.vbs"
                download="Extraer_SAP_y_Enviar_a_la_Web.vbs"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#0a5c36] hover:bg-[#08482a] text-white text-[11px] font-bold shadow-xs transition-all"
                title="Descargar script Windows de 1 clic (No requiere Python)"
              >
                <Download className="w-3 h-3" />
                <span>Script SAP (.vbs)</span>
              </a>
              <a
                href="/iniciar_app.bat"
                download="iniciar_app.bat"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-[11px] font-semibold transition-all"
                title="Descargar lanzador local para Windows"
              >
                <Download className="w-3 h-3" />
                <span>iniciar_app.bat</span>
              </a>
            </div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Documento de Transporte (IT_TKNUM-LOW) *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. 3417089"
              value={tknum}
              onChange={(e) => setTknum(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-slate-900 font-mono text-sm focus:border-[#0a5c36] focus:bg-white focus:outline-none transition-all shadow-xs font-bold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Semana
              </label>
              <input
                type="text"
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                placeholder="Ej. Semana 36"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-[#0a5c36] focus:bg-white focus:outline-none shadow-xs font-medium"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Cantidad Pallets (Inicial)
              </label>
              <input
                type="number"
                min="0"
                max="50"
                value={pallets}
                onChange={(e) => setPallets(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-slate-800 text-xs focus:border-[#0a5c36] focus:bg-white focus:outline-none shadow-xs font-bold"
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px] text-slate-600 space-y-1">
            <p className="font-bold text-slate-800 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-[#0a5c36]" />
              Flujo de automatización SAP:
            </p>
            <p>1. Ingresa a transacción <span className="font-mono text-[#0a5c36] font-bold">/nvl06o</span></p>
            <p>2. Presiona botón 6 ("Para picking") y limpia fechas de salida</p>
            <p>3. Asigna el número de transporte <span className="font-mono text-[#0a5c36] font-bold">{tknum || '...'}</span> y ejecuta (F8)</p>
            <p>4. Exporta la lista y la ingesta directamente a la aplicación</p>
          </div>

          <div className="flex items-center justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black shadow-md shadow-amber-500/20 disabled:opacity-50 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Extrayendo de SAP...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 fill-slate-950" />
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
