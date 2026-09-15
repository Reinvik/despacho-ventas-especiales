import { TransportSummary, TransportItem } from '../types';

const MONTH_NAMES_ES: Record<number, string> = {
  1: "ene", 2: "feb", 3: "mar", 4: "abr", 5: "may", 6: "jun",
  7: "jul", 8: "ago", 9: "sept", 10: "oct", 11: "nov", 12: "dic"
};

export function formatDateToShortEs(dateStr: string): string {
  if (!dateStr || !dateStr.trim()) {
    const now = new Date();
    return `${String(now.getDate()).padStart(2, '0')}-${MONTH_NAMES_ES[now.getMonth() + 1]}`;
  }
  const cleaned = dateStr.trim();
  // DD-MM-YYYY o DD/MM/YYYY
  const matchDmy = cleaned.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})/);
  if (matchDmy) {
    const day = parseInt(matchDmy[1], 10);
    const month = parseInt(matchDmy[2], 10);
    return `${String(day).padStart(2, '0')}-${MONTH_NAMES_ES[month] || String(month).padStart(2, '0')}`;
  }
  // YYYY-MM-DD
  const matchYmd = cleaned.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (matchYmd) {
    const month = parseInt(matchYmd[2], 10);
    const day = parseInt(matchYmd[3], 10);
    return `${String(day).padStart(2, '0')}-${MONTH_NAMES_ES[month] || String(month).padStart(2, '0')}`;
  }
  return cleaned;
}

export function calculateIsoWeek(dateStr: string): string {
  try {
    const match = dateStr.trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      const d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      const date = new Date(d.getTime());
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
      const week1 = new Date(date.getFullYear(), 0, 4);
      const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
      return `Semana ${weekNum}`;
    }
  } catch (e) {}
  return "Semana 36";
}

export function parseNumberClient(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  let s = String(val).trim().replace(/\s+/g, '');
  if (!s) return 0;

  // Manejo de miles y decimales en SAP Chile / Latinoamérica
  if (s.includes('.') && s.includes(',')) {
    if (s.lastIndexOf('.') < s.lastIndexOf(',')) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes('.')) {
    // Solo puntos: ej. '1.271', '36.000', '1.271.000'
    // En SAP Chile, punto es separador de miles si tiene 3 dígitos por bloque o múltiples puntos
    const dotParts = s.split('.');
    const isThousands = dotParts.length > 2 || (dotParts.length === 2 && dotParts[1].length === 3);
    if (isThousands) {
      s = s.replace(/\./g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }

  const n = parseFloat(s);
  return isNaN(n) ? 0 : n;
}

export function parseVl06oClient(
  rawText: string,
  transportDoc = "3417089",
  clienteOverride?: string,
  semanaOverride?: string,
  cantidadPallet = 1
): TransportSummary {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) {
    throw new Error("El texto está vacío.");
  }

  const headerLine = lines[0];
  let delimiter = "\t";
  if (headerLine.includes("\t")) delimiter = "\t";
  else if (headerLine.includes(";")) delimiter = ";";
  else if (headerLine.includes("|")) delimiter = "|";
  else if (headerLine.includes(",") && headerLine.toLowerCase().includes("material")) delimiter = ",";

  const rawHeaders = headerLine.split(delimiter).map(h => h.trim());
  const isFirstLineHeader = rawHeaders.some(h => {
    const hl = h.toLowerCase();
    return hl.includes("material") || hl.includes("entrega") || hl === "sku";
  });

  const colMap: Record<string, number> = {};
  const dataLines = isFirstLineHeader ? lines.slice(1) : lines;

  if (isFirstLineHeader) {
    rawHeaders.forEach((col, idx) => {
      const c = col.toLowerCase();
      if (c.includes("material") || c === "sku") colMap["sku"] = idx;
      else if (c.includes("descripción") || c.includes("descripcion")) colMap["descripcion"] = idx;
      else if (c.includes("cantidad")) colMap["cantidad"] = idx;
      else if (c.includes("un.medida") || c.includes("umv") || c.includes("un.")) colMap["umv"] = idx;
      else if (c.includes("solicitante") || c.includes("cliente") || c.includes("destinatario")) {
        if (c.includes("nombre")) colMap["cliente"] = idx;
        else if (!("cliente" in colMap) && !c.includes("núm") && !c.includes("num")) colMap["cliente"] = idx;
      } else if (c.includes("fecha")) {
        if (!("fecha" in colMap)) colMap["fecha"] = idx;
      } else if (c.includes("entrega")) colMap["entrega"] = idx;
      else if (c.includes("posición") || c.includes("posicion")) colMap["posicion"] = idx;
      else if (c.includes("peso")) colMap["peso"] = idx;
      else if (c.includes("volumen")) colMap["volumen"] = idx;
      else if (c.includes("ruta")) colMap["ruta"] = idx;
      else if (c.includes("compras")) colMap["documento_compras"] = idx;
    });
  } else {
    Object.assign(colMap, {
      entrega: 0, posicion: 1, destinatario: 2, sku: 3,
      cantidad: 5, umv: 6, fecha: 7, peso: 8, volumen: 10,
      descripcion: 12, ruta: 13, documento_compras: 15,
      cliente: 17
    });
  }

  const items: TransportItem[] = [];
  let detectedClient = clienteOverride || "";
  let detectedDateRaw = "";

  for (const line of dataLines) {
    const parts = line.split(delimiter).map(p => p.trim());
    if (parts.length < 4) continue;

    const getCol = (name: string, def = "") => {
      const idx = colMap[name];
      return (idx !== undefined && idx < parts.length) ? parts[idx] : def;
    };

    const sku = getCol("sku");
    if (!sku) continue;

    const desc = getCol("descripcion") || `Material ${sku}`;
    const qtyPed = parseNumberClient(getCol("cantidad", "1"));
    const umv = getCol("umv", "CJ");
    const cliRow = getCol("cliente") || detectedClient || "CLIENTE ESPECIAL";
    if (!detectedClient && cliRow) detectedClient = cliRow;

    const dateRaw = getCol("fecha");
    if (!detectedDateRaw && dateRaw) detectedDateRaw = dateRaw;

    const fechaFmt = formatDateToShortEs(dateRaw);
    const qtyPrep = qtyPed; // Default al 100%
    const diff = qtyPed - qtyPrep;

    items.push({
      sku,
      descripcion: desc,
      cantidad_pedido: qtyPed,
      umv,
      cantidad_preparada: qtyPrep,
      diferencia_preparacion: diff,
      cliente: cliRow,
      documento_transporte: transportDoc,
      fecha: fechaFmt,
      tiene_diferencias: diff !== 0 ? "Si" : "No",
      status: diff === 0 ? "Listo" : "Pendiente",
      entrega: getCol("entrega"),
      posicion: getCol("posicion"),
      peso_total: parseNumberClient(getCol("peso")),
      volumen: parseNumberClient(getCol("volumen")),
      ruta: getCol("ruta"),
      documento_compras: getCol("documento_compras")
    });
  }

  if (items.length === 0) {
    throw new Error("No se encontraron productos válidos en el texto ingresado.");
  }

  const totalPed = items.reduce((a, b) => a + b.cantidad_pedido, 0);
  const totalPrep = items.reduce((a, b) => a + b.cantidad_preparada, 0);
  const diffCount = items.filter(i => i.tiene_diferencias === "Si").length;
  const finalClient = clienteOverride || detectedClient || "COMERCIAL DOLLINCO S.A.";
  const finalSemana = semanaOverride || calculateIsoWeek(detectedDateRaw);

  const nowStr = new Date().toLocaleDateString('es-CL');

  return {
    id: transportDoc,
    semana: finalSemana,
    cliente: finalClient,
    numero_transporte: transportDoc,
    cantidad_pallet: cantidadPallet,
    preparado: diffCount === 0 ? "Listo" : "Con Diferencias",
    despachado: "Pendiente",
    fase_global: "En Preparación",
    total_cajas_pedido: totalPed,
    total_cajas_preparadas: totalPrep,
    total_skus: items.length,
    skus_con_diferencia: diffCount,
    fecha_creacion: nowStr,
    fecha_actualizacion: nowStr,
    items
  };
}
