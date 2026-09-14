import { TransportSummary, SapStatusResponse } from '../types';
import { localDb } from './localStorageDb';
import { parseVl06oClient } from './clientParser';
import { getClientSampleSummary } from './sampleData';
import { exportTransportToExcelClient } from './excelClient';

const LOCAL_BASE = 'http://127.0.0.1:3115/api';
const CLOUD_BASE = '/api';

// Verificar si el agente local de Windows está activo
async function checkLocalAgent(): Promise<boolean> {
  try {
    const res = await fetch(`${LOCAL_BASE}/status`, { signal: AbortSignal.timeout(800) });
    return res.ok;
  } catch {
    return false;
  }
}

export const api = {
  async getStatus(): Promise<SapStatusResponse> {
    // 1. Intentar agente local de Windows
    const hasLocal = await checkLocalAgent();
    if (hasLocal) {
      try {
        const res = await fetch(`${LOCAL_BASE}/status`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) {
          const data = await res.json();
          return {
            ...data,
            is_local_bridge: true,
            sap_gui: {
              ...data.sap_gui,
              message: data.sap_gui.running 
                ? "SAP GUI Conectado en Windows (Sesión Activa)"
                : "Agente Windows Activo • Abre SAP Logon para extracción automática"
            }
          };
        }
      } catch {}
    }

    // 2. Intentar Vercel Serverless
    try {
      const res = await fetch(`${CLOUD_BASE}/status`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) {
        const data = await res.json();
        return {
          ...data,
          is_local_bridge: false
        };
      }
    } catch {}

    // 3. Fallback Nube
    return {
      status: "cloud",
      timestamp: new Date().toISOString(),
      is_local_bridge: false,
      sap_gui: {
        running: false,
        processes: [],
        message: "Modo Nube: Para automatizar SAP GUI directamente con 1-clic, ejecuta 'iniciar_app.bat' en tu PC, o usa el botón 'Pegar Datos'."
      }
    };
  },

  async listTransports(): Promise<TransportSummary[]> {
    // Intentar agente local primero si está activo
    const hasLocal = await checkLocalAgent();
    if (hasLocal) {
      try {
        const res = await fetch(`${LOCAL_BASE}/transports`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) return await res.json();
      } catch {}
    }

    // Intentar Vercel
    try {
      const res = await fetch(`${CLOUD_BASE}/transports`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    // Fallback localStorage
    return localDb.list();
  },

  async getTransport(id: string): Promise<TransportSummary> {
    const hasLocal = await checkLocalAgent();
    if (hasLocal) {
      try {
        const res = await fetch(`${LOCAL_BASE}/transports/${id}`, { signal: AbortSignal.timeout(1000) });
        if (res.ok) return await res.json();
      } catch {}
    }

    try {
      const res = await fetch(`${CLOUD_BASE}/transports/${id}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

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
    const hasLocal = await checkLocalAgent();
    const endpoint = hasLocal ? `${LOCAL_BASE}/transports/parse-raw` : `${CLOUD_BASE}/transports/parse-raw`;

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: AbortSignal.timeout(3000)
      });
      if (res.ok) return await res.json();
    } catch {}

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
    // 1. Si el agente local en Windows está corriendo, conectar directamente
    const hasLocal = await checkLocalAgent();
    if (hasLocal) {
      const res = await fetch(`${LOCAL_BASE}/sap/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || json.error || 'Error al conectar con SAP GUI en Windows');
      }
      return json;
    }

    // 2. Si estamos en la nube sin agente local:
    try {
      const res = await fetch(`${CLOUD_BASE}/sap/extract`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.detail || 'SAP GUI no está disponible en este modo');
      }
      return json;
    } catch (e: any) {
      throw new Error(
        e.message || "SAP GUI requiere sesión activa en Windows. Ejecuta 'iniciar_app.bat' en tu PC para conectar automáticamente, o usa 'Pegar Datos'."
      );
    }
  },

  async updateTransportSummary(
    id: string,
    updates: Partial<TransportSummary>
  ): Promise<TransportSummary> {
    const hasLocal = await checkLocalAgent();
    const endpoint = hasLocal ? `${LOCAL_BASE}/transports/${id}` : `${CLOUD_BASE}/transports/${id}`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    return localDb.updateSummary(id, updates);
  },

  async updateItemQuantity(
    transportId: string,
    sku: string,
    cantidad_preparada: number,
    posicion?: string
  ): Promise<TransportSummary> {
    const hasLocal = await checkLocalAgent();
    const endpoint = hasLocal ? `${LOCAL_BASE}/transports/${transportId}/items` : `${CLOUD_BASE}/transports/${transportId}/items`;

    try {
      const res = await fetch(endpoint, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sku, cantidad_preparada, posicion }),
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    return localDb.updateItemQuantity(transportId, sku, cantidad_preparada, posicion);
  },

  async prepareAll(transportId: string, prepareAll: boolean): Promise<TransportSummary> {
    const hasLocal = await checkLocalAgent();
    const endpoint = hasLocal ? `${LOCAL_BASE}/transports/${transportId}/prepare-all` : `${CLOUD_BASE}/transports/${transportId}/prepare-all`;

    try {
      const res = await fetch(`${endpoint}?prepare_all=${prepareAll}`, {
        method: 'POST',
        signal: AbortSignal.timeout(1500)
      });
      if (res.ok) return await res.json();
    } catch {}

    return localDb.prepareAll(transportId, prepareAll);
  },

  async deleteTransport(id: string): Promise<void> {
    const hasLocal = await checkLocalAgent();
    const endpoint = hasLocal ? `${LOCAL_BASE}/transports/${id}` : `${CLOUD_BASE}/transports/${id}`;

    try {
      await fetch(endpoint, { method: 'DELETE', signal: AbortSignal.timeout(1500) });
    } catch {}
    localDb.delete(id);
  },

  async seedSample(): Promise<TransportSummary> {
    const hasLocal = await checkLocalAgent();
    const endpoint = hasLocal ? `${LOCAL_BASE}/transports/seed-sample` : `${CLOUD_BASE}/transports/seed-sample`;

    try {
      const res = await fetch(endpoint, { method: 'POST', signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

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
      const res = await fetch(`${CLOUD_BASE}/sap/macro-code?tknum=${tknum}`, { signal: AbortSignal.timeout(1500) });
      if (res.ok) return await res.json();
    } catch {}

    const vba_macro = `' Macro SAP VL06O para Transporte ${tknum}
Sub Extraer_Despacho_SAP()
    Dim SapGuiAuto As Object, application As Object, connection As Object, session As Object
    If Not IsObject(application) Then
       Set SapGuiAuto = GetObject("SAPGUI")
       Set application = SapGuiAuto.GetScriptingEngine
    End If
    If Not IsObject(connection) Then
       Set connection = application.Children(0)
    End If
    If Not IsObject(session) Then
       Set session = connection.Children(0)
    End If
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
