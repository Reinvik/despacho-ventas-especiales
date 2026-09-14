import React, { useState } from 'react';
import { ClipboardPaste, X, FileText, Loader2, Sparkles } from 'lucide-react';

interface PasteDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  onParse: (data: {
    raw_text: string;
    documento_transporte?: string;
    cliente_override?: string;
    semana_override?: string;
    cantidad_pallet?: number;
  }) => Promise<void>;
}

export const PasteDataModal: React.FC<PasteDataModalProps> = ({
  isOpen,
  onClose,
  onParse
}) => {
  const [rawText, setRawText] = useState<string>("");
  const [tknum, setTknum] = useState<string>("3417089");
  const [semana, setSemana] = useState<string>("Semana 36");
  const [pallets, setPallets] = useState<number>(2);
  const [loading, setLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rawText.trim()) {
      setErrorMsg("Debes pegar los datos tabulados de SAP o Excel");
      return;
    }
    setErrorMsg(null);
    setLoading(true);
    try {
      await onParse({
        raw_text: rawText.trim(),
        documento_transporte: tknum.trim() || undefined,
        semana_override: semana.trim() || undefined,
        cantidad_pallet: pallets
      });
      setRawText("");
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || "Error al procesar los datos");
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        setRawText(content);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#111827] border border-slate-800 rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-950 border border-blue-800 flex items-center justify-center text-cyan-400">
              <ClipboardPaste className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                Ingresar Datos de SAP VL06O
              </h3>
              <p className="text-[11px] text-slate-400">
                Pega directamente la tabla exportada o selecciona un archivo .txt / .tsv
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

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
              {errorMsg}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Documento Transporte (TKNUM)
              </label>
              <input
                type="text"
                placeholder="3417089"
                value={tknum}
                onChange={(e) => setTknum(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 font-mono text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Semana
              </label>
              <input
                type="text"
                placeholder="Semana 36"
                value={semana}
                onChange={(e) => setSemana(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Cantidad Pallets
              </label>
              <input
                type="number"
                min="0"
                value={pallets}
                onChange={(e) => setPallets(parseInt(e.target.value) || 0)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Pega la tabla copiada de SAP (Entrega, Posición, Material, etc.) *
              </label>
              <label className="text-xs text-cyan-400 hover:text-cyan-300 cursor-pointer font-medium flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>Cargar archivo</span>
                <input
                  type="file"
                  accept=".txt,.tsv,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>
            <textarea
              rows={8}
              required
              placeholder="Entrega&#9;Posición&#9;Destinatario mcía.&#9;Material&#9;Cantidad entrega&#9;Un.medida venta...&#10;507102148&#9;10&#9;52847&#9;3071&#9;3&#9;CJ..."
              value={rawText}
              onChange={(e) => setRawText(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-slate-200 font-mono text-xs focus:border-cyan-400 focus:outline-none leading-relaxed resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500">
              Detecta automáticamente delimitadores tabulados, puntos y comas.
            </span>

            <div className="flex items-center space-x-2">
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
                className="flex items-center space-x-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-bold shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Procesando...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Procesar e Ingestar</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
