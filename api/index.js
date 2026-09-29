// Vercel Serverless Function para Despacho Ventas Especiales API
// Maneja todas las rutas /api/* en Vercel con persistencia en Supabase PostgreSQL

let memoryTransports = {};
const deletedTransports = new Set();

const SUPABASE_URL = "https://qtzpzgwyjptbnipvyjdu.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF0enB6Z3d5anB0Ym5pcHZ5amR1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU4NDY4MDAsImV4cCI6MjA4MTQyMjgwMH0.An72d0glXpf6RZR5nwQ9OnLeU00loVqkZkNjUJhICA4";

async function supaGetTransports() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/dve_transports?select=*&order=created_at.desc`, {
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (e) {
    console.error("Supabase GET error:", e);
  }
  return null;
}

async function supaUpsertTransports(transports) {
  try {
    const list = Array.isArray(transports) ? transports : [transports];
    if (list.length === 0) return true;
    const res = await fetch(`${SUPABASE_URL}/rest/v1/dve_transports?on_conflict=id`, {
      method: "POST",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        "Prefer": "resolution=merge-duplicates,return=representation"
      },
      body: JSON.stringify(list)
    });
    return res.ok;
  } catch (e) {
    console.error("Supabase upsert error:", e);
    return false;
  }
}

async function supaDeleteTransport(id) {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/dve_transports?id=eq.${encodeURIComponent(id)}`, {
      method: "DELETE",
      headers: {
        "apikey": SUPABASE_KEY,
        "Authorization": `Bearer ${SUPABASE_KEY}`
      }
    });
    return res.ok;
  } catch (e) {
    console.error("Supabase delete error:", e);
    return false;
  }
}

const SAMPLE_RAW_DATA = `Entrega\tPosición\tDestinatario mcía.\tMaterial\tMuelle p.núm.almacén\tCantidad entrega\tUn.medida venta\tFecha puesta dis.Mat\tPeso total\tUnidad de peso\tVolumen\tUnidad de volumen\tDescripción posición\tRuta\tCanal distribución\tDocumento compras\tFecha salida mcías.\tNombre solicitante\tSolicitante\tEstado de picking\tClase de entrega\tAutor
507102148\t10\t52847\t3071\t\t3\tCJ\t02-09-2026\t5,190\tKG\t9.967,770\tCM3\tPATE TERNERA 160 Gr.(x10)\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t20\t52847\t3976\t\t3\tCJ\t02-09-2026\t1,950\tKG\t11.898\tCM3\tBOLSA SNACKIN SALAME LP 50GR\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t30\t52847\t916\t\t3\tCJ\t02-09-2026\t25,200\tKG\t39.114\tCM3\tVIENESA SUREÑA 8X1 KG SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t40\t52847\t8451\t\t3\tCJ\t02-09-2026\t25,200\tKG\t36.000\tCM3\tSALCHICHA SUREÑA WINTER 1 KG\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t50\t52847\t1436\t\t3\tCJ\t02-09-2026\t9,540\tKG\t19.404\tCM3\tCHORIZO PARRILLERO SJ 200 GR\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t60\t52847\t1421\t\t3\tCJ\t02-09-2026\t4,920\tKG\t19.386\tCM3\tCHORIZO SUREÑO PREMIUM 400 GRS.SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t70\t52847\t1019\t\t2\tCJ\t02-09-2026\t16,800\tKG\t26.076\tCM3\tVIENESA DE POLLO 8X1 KG SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t80\t52847\t3638\t\t2\tCJ\t02-09-2026\t6\tKG\t13.276\tCM3\tLONGANICILLA SUREÑA LP 280 G.\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t90\t52847\t421\t\t2\tCJ\t02-09-2026\t2,432\tKG\t4.140\tCM3\tPATE TERNERA 8x125 GRS.SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t100\t52847\t102\t\t2\tCJ\t02-09-2026\t4,030\tKG\t12.820\tCM3\tARROLLADO LOMO CON AJI 12x150 GR SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t110\t52847\t3852\t\t1\tCJ\t02-09-2026\t5,235\tKG\t9.692\tCM3\tCHORIZO ANGUS 1000 LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t120\t52847\t430\t\t1\tCJ\t02-09-2026\t2,070\tKG\t3.815\tCM3\tPATE TERNERA 16X125 GR SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t130\t52847\t3054\t\t1\tCJ\t02-09-2026\t3,320\tKG\t5.249,300\tCM3\tSALCHICHA SUREÑA 12x250 GR LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t140\t52847\t3660\t\t1\tCJ\t02-09-2026\t4,160\tKG\t7.722\tCM3\tSALCHICHA SUREÑA REDUCIDA EN SODIO 500 G\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t150\t52847\t915\t\t1\tCJ\t02-09-2026\t3,200\tKG\t5.100\tCM3\tVIENESA SUREÑA 12x250 GR SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t160\t52847\t604\t\t1\tCJ\t02-09-2026\t1,575\tKG\t6.735\tCM3\tSALAME ITALIANO 15x100 GRS.SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t170\t52847\t403\t\t1\tCJ\t02-09-2026\t3,500\tKG\t5.040\tCM3\tMORTADELA LISA MINI PZA 8X400 GR SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t180\t52847\t1039\t\t1\tCJ\t02-09-2026\t3,186\tKG\t5.331,080\tCM3\tVIENESA POLLO 12x250 GR SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t190\t52847\t1388\t\t1\tCJ\t02-09-2026\t2,615\tKG\t6.410\tCM3\tJAMON ARTESANAL 12X200 GR SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t200\t52847\t3854\t\t1\tCJ\t02-09-2026\t4,165\tKG\t9.692\tCM3\tLONGANIZA ANGUS 8x500 GR LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t210\t52847\t3639\t\t1\tCJ\t02-09-2026\t3\tKG\t8.168\tCM3\tLONGANICILLA DE CAMPO LP 280 GRS.\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t220\t52847\t3986\t\t1\tCJ\t02-09-2026\t4,260\tKG\t9.692\tCM3\tCHORIZO ARTESANAL CENTENARIO LP 10X400 G\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t230\t52847\t921\t\t1\tCJ\t02-09-2026\t3,920\tKG\t8.126\tCM3\tSALCHICHA BRONTO 475 GRS.SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t240\t52847\t3987\t\t1\tCJ\t02-09-2026\t3,450\tKG\t9.692\tCM3\tLONGANIZA ARTESANAL CENTENARIO LP 8X400G\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t250\t52847\t3982\t\t1\tCJ\t02-09-2026\t2,190\tKG\t6.534\tCM3\tPEPPERONI HORECA LP BOLSA 4 X 500G.\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t260\t52847\t555\t\t1\tCJ\t02-09-2026\t2,050\tKG\t6.588\tCM3\tMORTADELA JAMONADA 12x150 G.SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t270\t52847\t3113\t\t1\tCJ\t02-09-2026\t0,880\tKG\t4.898\tCM3\tSALAME LP 10x65 G.\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t280\t52847\t3979\t\t1\tCJ\t02-09-2026\t5,260\tKG\t9.692\tCM3\tMIX PARRILLERO 500 GR LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t290\t52847\t3853\t\t1\tCJ\t02-09-2026\t5,260\tKG\t9.692\tCM3\tCHORIZO ANGUS MERKEN 10x500GR LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t300\t52847\t620\t\t1\tCJ\t02-09-2026\t1,324\tKG\t6.735\tCM3\tSALAME AHUMADO 15x70 G SJ.\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t310\t52847\t6783\t\t1\tCJ\t02-09-2026\t1,090\tKG\t1.466\tCM3\tMANTEQUILLA 125 GRS x8 LOS NOGALES\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t320\t52847\t3058\t\t1\tCJ\t02-09-2026\t4,031\tKG\t7.565,610\tCM3\tVIENESA SIN PIEL 10x380 GR LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t330\t52847\t3288\t\t1\tCJ\t02-09-2026\t1,980\tKG\t8.071,290\tCM3\tTOCINO CORTADO 10x180 GR LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t340\t52847\t621\t\t1\tCJ\t02-09-2026\t1,324\tKG\t6.735\tCM3\tSALAME ITALIANO 15x70 G.SJ\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB
507102148\t350\t52847\t3034\t\t1\tCJ\t02-09-2026\t1,150\tKG\t4.898\tCM3\tSALAME 10x100 GR LP\tSTIAGO\tMY\t5045828999\t01-09-2026\tCOMERCIAL DOLLINCO S.A.\t52847\tC\tZSTD\tSLARAB`;

function parseNumberNode(val) {
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

function formatDateShort(dateStr) {
  const MONTHS = { 1: "ene", 2: "feb", 3: "mar", 4: "abr", 5: "may", 6: "jun", 7: "jul", 8: "ago", 9: "sept", 10: "oct", 11: "nov", 12: "dic" };
  if (!dateStr) return "02-sept";
  const m = String(dateStr).trim().match(/^(\d{1,2})[-/](\d{1,2})/);
  if (m) {
    const day = parseInt(m[1], 10);
    const month = parseInt(m[2], 10);
    return `${String(day).padStart(2, '0')}-${MONTHS[month] || month}`;
  }
  return dateStr;
}

function getCurrentWeek(d = new Date()) {
  try {
    const date = new Date(d.getTime());
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
    const week1 = new Date(date.getFullYear(), 0, 4);
    const weekNum = 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + (week1.getDay() + 6) % 7) / 7);
    return `Semana ${weekNum}`;
  } catch {
    return "Semana 40";
  }
}

function calculateIsoWeek(dateStr) {
  if (!dateStr || !String(dateStr).trim()) return getCurrentWeek();
  try {
    const match = String(dateStr).trim().match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
    if (match) {
      const d = new Date(parseInt(match[3]), parseInt(match[2]) - 1, parseInt(match[1]));
      return getCurrentWeek(d);
    }
    const d2 = new Date(dateStr);
    if (!isNaN(d2.getTime())) {
      return getCurrentWeek(d2);
    }
  } catch (e) {}
  return getCurrentWeek();
}

function parseVl06oNode(rawText, transportDoc = "3417089", clienteOverride, semanaOverride, cantidadPallet = 2) {
  const lines = rawText.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  if (lines.length === 0) throw new Error("Texto vacío");

  const headerLine = lines[0];
  let delimiter = "\t";
  if (headerLine.includes("\t")) delimiter = "\t";
  else if (headerLine.includes(";")) delimiter = ";";
  else if (headerLine.includes("|")) delimiter = "|";
  else if (headerLine.includes(",")) delimiter = ",";

  const rawHeaders = headerLine.split(delimiter).map(h => h.trim());
  const isHeader = rawHeaders.some(h => {
    const hl = h.toLowerCase();
    return hl.includes("material") || hl.includes("entrega") || hl === "sku";
  });

  const colMap = {};
  const dataLines = isHeader ? lines.slice(1) : lines;

  if (isHeader) {
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
      else if (c.includes("transporte") || c.includes("tknum") || c.includes("doc. trans") || c.includes("n° trans")) {
        colMap["transporte"] = idx;
      }
    });
  } else {
    Object.assign(colMap, { entrega: 0, posicion: 1, sku: 3, cantidad: 5, umv: 6, fecha: 7, descripcion: 12, cliente: 17 });
  }

  const inputTknums = String(transportDoc || "")
    .split(/[,;\s]+/)
    .map(s => s.trim())
    .filter(Boolean);
  const defaultTknum = inputTknums[0] || "3417089";

  const items = [];
  let detectedClient = clienteOverride || "";

  for (const line of dataLines) {
    const parts = line.split(delimiter).map(p => p.trim());
    if (parts.length < 4) continue;
    const getCol = (name, def = "") => (colMap[name] !== undefined && colMap[name] < parts.length) ? parts[colMap[name]] : def;

    const sku = getCol("sku");
    if (!sku) continue;

    const desc = getCol("descripcion") || `Material ${sku}`;
    const qtyPed = parseNumberNode(getCol("cantidad", "1"));
    const umv = getCol("umv", "CJ");
    const cliRow = getCol("cliente") || detectedClient || "COMERCIAL DOLLINCO S.A.";
    if (!detectedClient && cliRow) detectedClient = cliRow;

    const fechaFmt = formatDateShort(getCol("fecha"));
    const qtyPrep = qtyPed;
    const diff = qtyPed - qtyPrep;

    let rowTknum = getCol("transporte") || defaultTknum;
    if (rowTknum.length < 3 && defaultTknum) {
      rowTknum = defaultTknum;
    }

    items.push({
      sku,
      descripcion: desc,
      cantidad_pedido: qtyPed,
      umv,
      cantidad_preparada: qtyPrep,
      diferencia_preparacion: diff,
      cliente: cliRow,
      documento_transporte: rowTknum,
      fecha: fechaFmt,
      tiene_diferencias: diff !== 0 ? "Si" : "No",
      status: diff === 0 ? "Listo" : "Pendiente",
      entrega: getCol("entrega"),
      posicion: getCol("posicion")
    });
  }

  if (items.length === 0) {
    throw new Error("No se encontraron productos válidos en el texto ingresado.");
  }

  // Agrupar items por número de transporte
  const groupedByTknum = {};
  for (const item of items) {
    const doc = item.documento_transporte || defaultTknum;
    if (!groupedByTknum[doc]) groupedByTknum[doc] = [];
    groupedByTknum[doc].push(item);
  }

  const summaries = Object.entries(groupedByTknum).map(([doc, docItems]) => {
    const totalPed = docItems.reduce((a, b) => a + b.cantidad_pedido, 0);
    const totalPrep = docItems.reduce((a, b) => a + b.cantidad_preparada, 0);
    const diffCount = docItems.filter(i => i.tiene_diferencias === "Si").length;
    const clientForDoc = docItems.find(i => i.cliente)?.cliente || clienteOverride || detectedClient || "COMERCIAL DOLLINCO S.A.";

    const detectedDate = docItems.find(i => i.fecha)?.fecha;
    return {
      id: doc,
      semana: semanaOverride || calculateIsoWeek(detectedDate),
      cliente: clientForDoc,
      numero_transporte: doc,
      cantidad_pallet: cantidadPallet,
      preparado: diffCount === 0 ? "Listo" : "Con Diferencias",
      despachado: "Pendiente",
      fase_global: "En Preparación",
      total_cajas_pedido: totalPed,
      total_cajas_preparadas: totalPrep,
      total_skus: docItems.length,
      skus_con_diferencia: diffCount,
      items: docItems
    };
  });

  return summaries;
}

function initMemoryWithSample(force = false) {
  if (deletedTransports.has("3417089") && !force) {
    return null;
  }
  const s = parseVl06oNode(SAMPLE_RAW_DATA, "3417089", "COMERCIAL DOLLINCO S.A.", "Semana 36", 3);
  s.items.forEach(item => {
    if (item.sku === "3976") {
      item.cantidad_preparada = 0;
      item.diferencia_preparacion = 3;
      item.tiene_diferencias = "Si";
      item.status = "Pendiente";
    } else if (item.sku === "1436") {
      item.cantidad_preparada = 1;
      item.diferencia_preparacion = 2;
      item.tiene_diferencias = "Si";
      item.status = "Parcial";
    }
  });
  s.total_cajas_preparadas = s.items.reduce((a, b) => a + b.cantidad_preparada, 0);
  s.skus_con_diferencia = s.items.filter(i => i.tiene_diferencias === "Si").length;
  memoryTransports["3417089"] = s;
  if (force) {
    deletedTransports.delete("3417089");
  }
  return s;
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS, HEAD');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  res.setHeader('Access-Control-Allow-Private-Network', 'true');

  if (req.method === 'OPTIONS' || req.method === 'HEAD') {
    return res.status(200).end();
  }

  const url = new URL(req.url, `https://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;
  // Normalizar ruta quitando /api si viene incluido
  const route = pathname.startsWith('/api') ? pathname.slice(4) : pathname;

  // Parsear body si viene como string
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (e) {
      body = {};
    }
  }
  if (!body) body = {};

  // 1. GET /status o /api/status
  if ((route === '/status' || route === '') && req.method === 'GET') {
    return res.status(200).json({
      status: "online",
      mode: "cloud-vercel",
      timestamp: new Date().toISOString(),
      sap_gui: {
        running: false,
        processes: [],
        message: "Servidor en la Nube (Vercel): SAP GUI Scripting requiere acceso a la sesión activa en Windows. Ejecuta 'iniciar_app.bat' en tu PC para automatización nativa, o usa 'Pegar Datos' para carga inmediata."
      }
    });
  }

  // 2. GET /transports o /api/transports
  if (route === '/transports' && req.method === 'GET') {
    const supaData = await supaGetTransports();
    if (supaData && supaData.length > 0) {
      supaData.forEach(t => { memoryTransports[t.id] = t; });
      return res.status(200).json(supaData.filter(t => !deletedTransports.has(t.id)));
    }
    return res.status(200).json(Object.values(memoryTransports).filter(t => !deletedTransports.has(t.id)));
  }

  // 3. POST /transports/sync
  if ((route === '/transports/sync' || route.includes('transports/sync')) && req.method === 'POST') {
    const list = Array.isArray(body) ? body : (body.transports || [body]);
    for (const t of list) {
      if (t && t.id) {
        deletedTransports.delete(t.id);
        memoryTransports[t.id] = t;
      }
    }
    await supaUpsertTransports(list);
    return res.status(200).json({ success: true, count: list.length });
  }

  // 4. POST /transports/seed-sample
  if (route === '/transports/seed-sample' && req.method === 'POST') {
    const sample = initMemoryWithSample(true);
    await supaUpsertTransports([sample]);
    return res.status(200).json(sample);
  }

  // 5. POST /transports/parse-raw
  if ((route === '/transports/parse-raw' || route.includes('parse-raw')) && req.method === 'POST') {
    try {
      const summaries = parseVl06oNode(
        body.raw_text || "",
        body.documento_transporte || "3417089",
        body.cliente_override,
        body.semana_override,
        body.cantidad_pallet || 1
      );
      for (const summary of summaries) {
        deletedTransports.delete(summary.id);
        memoryTransports[summary.id] = summary;
      }
      await supaUpsertTransports(summaries);
      return res.status(200).json(summaries.length === 1 ? summaries[0] : summaries);
    } catch (e) {
      return res.status(400).json({ detail: e.message || "Error al procesar datos crudos" });
    }
  }

  // 6. POST /sap/extract
  if ((route === '/sap/extract' || route.includes('sap/extract')) && req.method === 'POST') {
    return res.status(400).json({
      detail: "La automatización directa con SAP GUI (GetObject('SAPGUI')) requiere ejecutarse en tu equipo Windows local donde está instalado SAP Logon. Abre la app localmente con 'iniciar_app.bat' en tu PC, o copia el reporte en SAP y usa la opción 'Pegar Datos'."
    });
  }

  // 7. PATCH /transports/:id/items
  const itemsMatch = route.match(/\/transports\/([^/]+)\/items$/);
  if (itemsMatch && req.method === 'PATCH') {
    const id = itemsMatch[1];
    let trans = memoryTransports[id];
    if (!trans) {
      const supaList = await supaGetTransports();
      if (supaList) trans = supaList.find(t => t.id === id);
    }
    if (!trans) return res.status(404).json({ detail: "Transporte no encontrado" });

    const { sku, cantidad_preparada, posicion } = body;
    const item = trans.items.find(i => i.sku === sku && (posicion === undefined || i.posicion === posicion));
    if (item) {
      item.cantidad_preparada = Math.max(0, cantidad_preparada);
      item.diferencia_preparacion = Math.max(0, item.cantidad_pedido - item.cantidad_preparada);
      item.tiene_diferencias = item.diferencia_preparacion !== 0 ? "Si" : "No";
      item.status = item.diferencia_preparacion === 0 ? "Listo" : (item.cantidad_preparada === 0 ? "Pendiente" : "Parcial");
    }
    trans.total_cajas_preparadas = trans.items.reduce((a, b) => a + b.cantidad_preparada, 0);
    trans.skus_con_diferencia = trans.items.filter(i => i.tiene_diferencias === "Si").length;
    if (trans.total_cajas_preparadas === 0) trans.preparado = "Pendiente";
    else if (trans.skus_con_diferencia === 0) trans.preparado = "Listo";
    else trans.preparado = "Con Diferencias";

    memoryTransports[id] = trans;
    await supaUpsertTransports([trans]);
    return res.status(200).json(trans);
  }

  // 8. POST /transports/:id/prepare-all
  const prepareAllMatch = route.match(/\/transports\/([^/]+)\/prepare-all$/);
  if (prepareAllMatch && req.method === 'POST') {
    const id = prepareAllMatch[1];
    const prepareAll = url.searchParams.get('prepare_all') !== 'false';
    let trans = memoryTransports[id];
    if (!trans) {
      const supaList = await supaGetTransports();
      if (supaList) trans = supaList.find(t => t.id === id);
    }
    if (!trans) return res.status(404).json({ detail: "Transporte no encontrado" });

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

    memoryTransports[id] = trans;
    await supaUpsertTransports([trans]);
    return res.status(200).json(trans);
  }

  // 9. PATCH /transports/:id
  const idMatch = route.match(/\/transports\/([^/]+)$/);
  if (idMatch && req.method === 'PATCH') {
    const id = idMatch[1];
    let trans = memoryTransports[id];
    if (!trans) {
      const supaList = await supaGetTransports();
      if (supaList) trans = supaList.find(t => t.id === id);
    }
    if (!trans) return res.status(404).json({ detail: "Transporte no encontrado" });
    Object.assign(trans, body);
    memoryTransports[id] = trans;
    await supaUpsertTransports([trans]);
    return res.status(200).json(trans);
  }

  // 10. GET /transports/:id
  if (idMatch && req.method === 'GET') {
    const id = idMatch[1];
    let trans = memoryTransports[id];
    if (!trans) {
      const supaList = await supaGetTransports();
      if (supaList) trans = supaList.find(t => t.id === id);
    }
    if (!trans) return res.status(404).json({ detail: "Transporte no encontrado" });
    return res.status(200).json(trans);
  }

  // 11. DELETE /transports/:id
  if (idMatch && req.method === 'DELETE') {
    const id = idMatch[1];
    deletedTransports.add(id);
    delete memoryTransports[id];
    await supaDeleteTransport(id);
    return res.status(200).json({ success: true, message: `Transporte ${id} eliminado` });
  }

  // 12. GET /sap/macro-code
  if ((route === '/sap/macro-code' || route.includes('macro-code')) && req.method === 'GET') {
    const tknum = url.searchParams.get('tknum') || "3417089";
    return res.status(200).json({
      tknum,
      vba_macro: `' Macro SAP VL06O para Transporte ${tknum}\nSub Extraer_SAP()\n    Set SapGuiAuto = GetObject("SAPGUI")\n    Set application = SapGuiAuto.GetScriptingEngine\n    Set connection = application.Children(0)\n    Set session = connection.Children(0)\n    session.findById("wnd[0]").maximize\n    session.findById("wnd[0]/tbar[0]/okcd").Text = "/nvl06o"\n    session.findById("wnd[0]").sendVKey 0\n    session.findById("wnd[0]/usr/btnBUTTON6").press\n    session.findById("wnd[0]/usr/ctxtIT_WADAT-LOW").Text = ""\n    session.findById("wnd[0]/usr/ctxtIT_WADAT-HIGH").Text = ""\n    session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").Text = "${tknum}"\n    session.findById("wnd[0]/tbar[1]/btn[8]").press\nEnd Sub`,
      vbs_script: `Dim SapGuiAuto: Set SapGuiAuto = GetObject("SAPGUI")\nSet app = SapGuiAuto.GetScriptingEngine\nSet session = app.Children(0).Children(0)\nsession.findById("wnd[0]/tbar[0]/okcd").text = "/nvl06o"\nsession.findById("wnd[0]").sendVKey 0\nsession.findById("wnd[0]/usr/btnBUTTON6").press\nsession.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").text = "${tknum}"\nsession.findById("wnd[0]/tbar[1]/btn[8]").press`
    });
  }

  return res.status(404).json({ error: "Ruta API no encontrada", pathname });
}
