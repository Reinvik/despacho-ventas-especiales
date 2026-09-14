import { TransportSummary, SapStatusResponse } from '../types';
import { localDb } from './localStorageDb';
import { parseVl06oClient } from './clientParser';
import { getClientSampleSummary } from './sampleData';
import { exportTransportToExcelClient } from './excelClient';

const API_BASE = '/api';

async function checkIsBackendAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(1500) });
    return res.ok;
  } catch (e) {
    return false;
  }
}

export const api = {
  async getStatus(): Promise<SapStatusResponse> {
    try {
      const res = await fetch(`${API_BASE}/status`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback cuando se ejecuta en la nube (Vercel)
    return {
      status: "cloud",
      timestamp: new Date().toISOString(),
      sap_gui: {
        running: false,
        processes: [],
        message: "Modo Nube (Vercel): Para extracción SAP directa COM, ejecuta la app localmente con iniciar_app.bat o pega los datos directamente."
      }
    };
  },

  async listTransports(): Promise<TransportSummary[]> {
    try {
      const res = await fetch(`${API_BASE}/transports`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch (e) {}
    // Fallback localStorage
    return localDb.list();
  },

  async getTransport(id: string): Promise<TransportSummary> {
    try {
      const res = await fetch(`${API_BASE}/transports/${id}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch (e) {}
    const found = localDb.get(id);
    if (!found) throw new Error(`Transporte ${id} no encontrado`);
    return found;
  },

  async parseRawData(data: {
    raw_text: string;
    documento_transporte?: string;
    cliente_override?: string;
    semana_override?: string;
    cantidad_pallet?: number;
  }): Promise<TransportSummary> {
    try {
      const res = await fetch(`${API_BASE}/transports/parse-raw`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    // Fallback parser cliente
    const summary = parseVl06oClient(
      data.raw_text,
      data.documento_transporte || "3417089",
      data.cliente_override,
      data.semana_override,
      data.cantidad_pallet || 1
    );
    localDb.save(summary);
    return summary;
  },

  async extractFromSap(data: {
    documento_transporte: string;
    semana?: string;
    cantidad_pallet?: number;
  }): Promise<{ success: boolean; message: string; data: TransportSummary }> {
    const res = await fetch(`${API_BASE}/sap/extract`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || 'Error al conectar y extraer desde SAP GUI');
    }
    return res.json();
  },

  async updateTransportSummary(
    id: string,
    updates: Partial<TransportSummary>
  ): Promise<TransportSummary> {
    try {
      const res = await fetch(`${API_BASE}/transports/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return localDb.updateSummary(id, updates);
  },

  async updateItemQuantity(
    transportId: string,
    sku: string,
    cantidad_preparada: number,
    posicion?: string
  ): Promise<TransportSummary> {
    try {
      const res = await fetch(`${API_BASE}/transports/${transportId}/items`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, cantidad_preparada, posicion }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return localDb.updateItemQuantity(transportId, sku, cantidad_preparada, posicion);
  },

  async prepareAll(transportId: string, prepareAll: boolean): Promise<TransportSummary> {
    try {
      const res = await fetch(`${API_BASE}/transports/${transportId}/prepare-all?prepare_all=${prepareAll}`, {
        method: 'POST',
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch (e) {}

    return localDb.prepareAll(transportId, prepareAll);
  },

  async deleteTransport(id: string): Promise<void> {
    try {
      await fetch(`${API_BASE}/transports/${id}`, { method: 'DELETE', signal: AbortSignal.timeout(1500) });
    } catch (e) {}
    localDb.delete(id);
  },

  async seedSample(): Promise<TransportSummary> {
    try {
      const res = await fetch(`${API_BASE}/transports/seed-sample`, { method: 'POST', signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch (e) {}

    const sample = getClientSampleSummary();
    localDb.save(sample);
    return sample;
  },

  exportExcelSingle(summary: TransportSummary) {
    exportTransportToExcelClient(summary);
  },

  exportExcelAll(summaries: TransportSummary[]) {
    exportTransportToExcelClient(summaries);
  },

  async getMacroCode(tknum: string): Promise<{ tknum: string; vba_macro: string; vbs_script: string }> {
    try {
      const res = await fetch(`${API_BASE}/sap/macro-code?tknum=${tknum}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch (e) {}

    const vba_macro = `Attribute VB_Name = "Modulo_SAP_VL06O"
' Macro para extraer Transporte ${tknum} desde SAP GUI
Sub Extraer_Despacho_SAP()
    Dim SapGuiAuto As Object, application As Object, connection As Object, session As Object
    If Not IsObject(application) Then
       Set SapGuiAuto = GetObject("SAPGUI")
       Set application = SapGuiAuto.GetScriptingEngine
    End If
    Set connection = application.Children(0)
    Set session = connection.Children(0)
    session.findById("wnd[0]").maximize
    session.findById("wnd[0]/tbar[0]/okcd").Text = "/nvl06o"
    session.findById("wnd[0]").sendVKey 0
    session.findById("wnd[0]/usr/btnBUTTON6").press
    session.findById("wnd[0]/usr/ctxtIT_WADAT-LOW").Text = ""
    session.findById("wnd[0]/usr/ctxtIT_WADAT-HIGH").Text = ""
    session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").Text = "${tknum}"
    session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").setFocus
    session.findById("wnd[0]/tbar[1]/btn[8]").press
    session.findById("wnd[0]/tbar[1]/btn[18]").press
    session.findById("wnd[0]/mbar/menu[0]/menu[4]/menu[1]").Select
    session.findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").Text = Format(Now, "yyyymmdd_hhnnss") & " vl06o"
    session.findById("wnd[1]/tbar[0]/btn[20]").press
    session.findById("wnd[1]/tbar[0]/btn[0]").press
    MsgBox "Extracción finalizada exitosamente.", vbInformation, "Despacho Ventas Especiales"
End Sub`;

    const vbs_script = `Dim SapGuiAuto, application, connection, session
Set SapGuiAuto = GetObject("SAPGUI")
Set application = SapGuiAuto.GetScriptingEngine
Set connection = application.Children(0)
Set session = connection.Children(0)
session.findById("wnd[0]").maximize
session.findById("wnd[0]/tbar[0]/okcd").text = "/nvl06o"
session.findById("wnd[0]").sendVKey 0
session.findById("wnd[0]/usr/btnBUTTON6").press
session.findById("wnd[0]/usr/ctxtIT_WADAT-LOW").text = ""
session.findById("wnd[0]/usr/ctxtIT_WADAT-HIGH").text = ""
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").text = "${tknum}"
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").setFocus
session.findById("wnd[0]/tbar[1]/btn[8]").press
session.findById("wnd[0]/tbar[1]/btn[18]").press
session.findById("wnd[0]/mbar/menu[0]/menu[4]/menu[1]").select
session.findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").text = "despacho_${tknum}.txt"
session.findById("wnd[1]/tbar[0]/btn[20]").press
session.findById("wnd[1]/tbar[0]/btn[0]").press
WScript.Echo "Extracción completada para transporte ${tknum}"`;

    return { tknum, vba_macro, vbs_script };
  }
};
