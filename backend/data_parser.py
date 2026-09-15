import re
from datetime import datetime
from typing import List, Tuple, Optional
from models import TransportItem, TransportSummary

MONTH_NAMES_ES = {
    1: "ene", 2: "feb", 3: "mar", 4: "abr", 5: "may", 6: "jun",
    7: "jul", 8: "ago", 9: "sept", 10: "oct", 11: "nov", 12: "dic"
}

def format_date_to_short_es(date_str: str) -> str:
    """Convierte fechas tipo '02-09-2026', '2026-09-02', '02/09/2026' a formato '02-sept'."""
    if not date_str or not date_str.strip():
        now = datetime.now()
        return f"{now.day:02d}-{MONTH_NAMES_ES[now.month]}"
    
    cleaned = date_str.strip()
    
    # Intento DD-MM-YYYY o DD/MM/YYYY
    match_dmy = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})", cleaned)
    if match_dmy:
        day = int(match_dmy.group(1))
        month = int(match_dmy.group(2))
        return f"{day:02d}-{MONTH_NAMES_ES.get(month, f'{month:02d}')}"
    
    # Intento YYYY-MM-DD
    match_ymd = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})", cleaned)
    if match_ymd:
        month = int(match_ymd.group(2))
        day = int(match_ymd.group(3))
        return f"{day:02d}-{MONTH_NAMES_ES.get(month, f'{month:02d}')}"
        
    return cleaned

def calculate_iso_week(date_str: str) -> str:
    """Calcula la semana de despacho (ej. 'Semana 36') a partir de la fecha."""
    try:
        cleaned = date_str.strip()
        match_dmy = re.match(r"^(\d{1,2})[-/](\d{1,2})[-/](\d{4})", cleaned)
        if match_dmy:
            day, month, year = int(match_dmy.group(1)), int(match_dmy.group(2)), int(match_dmy.group(3))
            dt = datetime(year, month, day)
            week_num = dt.isocalendar()[1]
            return f"Semana {week_num}"
    except Exception:
        pass
    now = datetime.now()
    return f"Semana {now.isocalendar()[1]}"

def parse_number(val: str) -> float:
    """Convierte cadenas numéricas chilenas/SAP (ej. '1.271', '5.190', '9.967,770', '3') a float."""
    if val is None:
        return 0.0
    s = str(val).strip().replace(" ", "")
    if not s:
        return 0.0

    # Manejo de miles y decimales en SAP Chile / Latinoamérica
    if "." in s and "," in s:
        # Estándar SAP Chile: 1.234,56 (punto miles, coma decimal)
        if s.rfind(".") < s.rfind(","):
            s = s.replace(".", "").replace(",", ".")
        else:
            # Estándar US: 1,234.56
            s = s.replace(",", "")
    elif "." in s:
        # Solo puntos: ej. '1.271', '36.000', '1.271.000'
        # En SAP Chile, punto es separador de miles si tiene 3 dígitos por bloque o múltiples puntos
        dot_parts = s.split(".")
        is_thousands = len(dot_parts) > 2 or (len(dot_parts) == 2 and len(dot_parts[1]) == 3)
        if is_thousands:
            s = s.replace(".", "")
    elif "," in s:
        # En SAP Chile, la coma es el separador decimal: ej. '5,190' -> 5.190
        s = s.replace(",", ".")

    try:
        return float(s)
    except ValueError:
        digits = re.findall(r"[-+]?\d*\.?\d+", s)
        if digits:
            try:
                return float(digits[0])
            except ValueError:
                return 0.0
        return 0.0

def parse_vl06o_raw_text(
    raw_text: str,
    transport_doc: str = "3417089",
    cliente_override: Optional[str] = None,
    semana_override: Optional[str] = None,
    cantidad_pallet: int = 1,
    default_preparada_full: bool = True
) -> TransportSummary:
    """
    Parsea la salida tabular cruda de SAP VL06O y construye el resumen y detalle.
    """
    lines = [line.strip() for line in raw_text.strip().splitlines() if line.strip()]
    if not lines:
        raise ValueError("El texto proporcionado está vacío.")

    # Detectar delimitador de la cabecera (tabulador, punto y coma, tubería)
    header_line = lines[0]
    delimiter = "\t"
    if "\t" in header_line:
        delimiter = "\t"
    elif ";" in header_line:
        delimiter = ";"
    elif "|" in header_line:
        delimiter = "|"
    elif "," in header_line and "Material" in header_line:
        delimiter = ","

    raw_headers = [h.strip() for h in header_line.split(delimiter)]
    
    # Si la primera línea contiene 'Entrega' o 'Material', es cabecera
    data_lines = lines[1:]
    is_first_line_header = any("material" in h.lower() or "entrega" in h.lower() or "sku" in h.lower() for h in raw_headers)
    
    col_map = {}
    if is_first_line_header:
        for idx, col in enumerate(raw_headers):
            c_low = col.lower()
            if "material" in c_low or c_low == "sku":
                col_map["sku"] = idx
            elif "descripción" in c_low or "descripcion" in c_low:
                col_map["descripcion"] = idx
            elif "cantidad" in c_low:
                col_map["cantidad"] = idx
            elif "un.medida" in c_low or "umv" in c_low or "un." in c_low:
                col_map["umv"] = idx
            elif "solicitante" in c_low or "cliente" in c_low or "destinatario" in c_low:
                # 'Nombre solicitante' tiene máxima prioridad (nombre de empresa)
                if "nombre" in c_low:
                    col_map["cliente"] = idx
                elif "cliente" not in col_map and "núm" not in c_low and "num" not in c_low:
                    col_map["cliente"] = idx
            elif "fecha puesta" in c_low or "fecha salida" in c_low or "fecha" in c_low:
                if "fecha" not in col_map:
                    col_map["fecha"] = idx
            elif "entrega" in c_low:
                col_map["entrega"] = idx
            elif "posición" in c_low or "posicion" in c_low:
                col_map["posicion"] = idx
            elif "peso" in c_low:
                col_map["peso"] = idx
            elif "volumen" in c_low:
                col_map["volumen"] = idx
            elif "compras" in c_low or "pedido" in c_low:
                col_map["documento_compras"] = idx
            elif "ruta" in c_low:
                col_map["ruta"] = idx
    else:
        # Fallback sin cabecera: asumir orden estándar de VL06O
        data_lines = lines
        col_map = {
            "entrega": 0, "posicion": 1, "destinatario": 2, "sku": 3,
            "cantidad": 5, "umv": 6, "fecha": 7, "peso": 8, "volumen": 10,
            "descripcion": 12, "ruta": 13, "documento_compras": 15,
            "fecha_salida": 16, "cliente": 17
        }

    items: List[TransportItem] = []
    detected_client = cliente_override or ""
    detected_date_raw = ""

    for line in data_lines:
        parts = [p.strip() for p in line.split(delimiter)]
        if not parts or len(parts) < 4:
            continue
        
        # Extraer campos
        def get_col(name: str, default: str = "") -> str:
            idx = col_map.get(name)
            if idx is not None and idx < len(parts):
                return parts[idx]
            return default

        sku = get_col("sku")
        if not sku:
            continue
            
        desc = get_col("descripcion") or f"Material {sku}"
        qty_ped = parse_number(get_col("cantidad", "1"))
        umv = get_col("umv", "CJ")
        cliente_row = get_col("cliente") or detected_client or "CLIENTE ESPECIAL"
        if not detected_client and cliente_row:
            detected_client = cliente_row
            
        date_raw = get_col("fecha")
        if not detected_date_raw and date_raw:
            detected_date_raw = date_raw

        fecha_fmt = format_date_to_short_es(date_raw)
        
        # Cantidad preparada por defecto
        # Si default_preparada_full es True, iniciamos igual a pedido
        qty_prep = qty_ped if default_preparada_full else 0.0
        diff = qty_ped - qty_prep
        has_diff = "Si" if diff != 0 else "No"
        status = "Listo" if diff == 0 else ("Pendiente" if qty_prep == 0 else "Parcial")

        item = TransportItem(
            sku=sku,
            descripcion=desc,
            cantidad_pedido=qty_ped,
            umv=umv,
            cantidad_preparada=qty_prep,
            diferencia_preparacion=diff,
            cliente=cliente_row,
            documento_transporte=transport_doc,
            fecha=fecha_fmt,
            tiene_diferencias=has_diff,
            status=status,
            entrega=get_col("entrega"),
            posicion=get_col("posicion"),
            peso_total=parse_number(get_col("peso")),
            volumen=parse_number(get_col("volumen")),
            ruta=get_col("ruta"),
            documento_compras=get_col("documento_compras")
        )
        items.append(item)

    if not items:
        raise ValueError("No se pudieron extraer ítems válidos del reporte.")

    # Calcular totales
    total_ped = sum(i.cantidad_pedido for i in items)
    total_prep = sum(i.cantidad_preparada for i in items)
    skus_diff = sum(1 for i in items if i.tiene_diferencias == "Si")
    
    final_client = cliente_override or detected_client or "COMERCIAL DOLLINCO S.A."
    final_semana = semana_override or calculate_iso_week(detected_date_raw)
    
    summary = TransportSummary(
        id=transport_doc,
        semana=final_semana,
        cliente=final_client,
        numero_transporte=transport_doc,
        cantidad_pallet=cantidad_pallet,
        preparado="Pendiente" if total_prep == 0 else ("Listo" if skus_diff == 0 else "Con Diferencias"),
        despachado="Pendiente",
        fase_global="En Preparación" if total_prep > 0 else "Pendiente",
        total_cajas_pedido=total_ped,
        total_cajas_preparadas=total_prep,
        total_skus=len(items),
        skus_con_diferencia=skus_diff,
        fecha_creacion=datetime.now().strftime("%d-%m-%Y %H:%M"),
        fecha_actualizacion=datetime.now().strftime("%d-%m-%Y %H:%M"),
        items=items
    )
    return summary
