import os
import json
from typing import List, Optional, Dict
from models import TransportSummary, TransportItem

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
DB_FILE = os.path.join(DATA_DIR, "despachos.json")

def ensure_db_exists():
    os.makedirs(DATA_DIR, exist_ok=True)
    if not os.path.exists(DB_FILE):
        with open(DB_FILE, "w", encoding="utf-8") as f:
            json.dump({}, f, ensure_ascii=False, indent=2)

def load_all_transports() -> Dict[str, dict]:
    ensure_db_exists()
    try:
        with open(DB_FILE, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return {}

def save_all_transports(data: Dict[str, dict]):
    ensure_db_exists()
    with open(DB_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def get_transport(transport_id: str) -> Optional[TransportSummary]:
    all_data = load_all_transports()
    item_dict = all_data.get(str(transport_id))
    if item_dict:
        return TransportSummary(**item_dict)
    return None

def list_transports() -> List[TransportSummary]:
    all_data = load_all_transports()
    return [TransportSummary(**val) for val in all_data.values()]

def save_transport(summary: TransportSummary):
    all_data = load_all_transports()
    all_data[str(summary.id)] = summary.dict()
    save_all_transports(all_data)

def delete_transport(transport_id: str) -> bool:
    all_data = load_all_transports()
    if str(transport_id) in all_data:
        del all_data[str(transport_id)]
        save_all_transports(all_data)
        return True
    return False

def update_item_quantity(transport_id: str, sku: str, cantidad_preparada: float, posicion: Optional[str] = None) -> Optional[TransportSummary]:
    """Actualiza la cantidad preparada de un SKU y recalcula diferencias y totales."""
    summary = get_transport(transport_id)
    if not summary:
        return None

    updated = False
    for item in summary.items:
        match_sku = (item.sku == sku)
        match_pos = (posicion is None or item.posicion == posicion)
        if match_sku and match_pos:
            item.cantidad_preparada = max(0.0, cantidad_preparada)
            item.diferencia_preparacion = max(0.0, item.cantidad_pedido - item.cantidad_preparada)
            item.tiene_diferencias = "Si" if item.diferencia_preparacion != 0 else "No"
            
            if item.diferencia_preparacion == 0:
                item.status = "Listo"
            elif item.cantidad_preparada == 0:
                item.status = "Pendiente"
            else:
                item.status = "Parcial"
            updated = True
            break

    if updated:
        # Recalcular métricas de cabecera
        total_prep = sum(i.cantidad_preparada for i in summary.items)
        skus_diff = sum(1 for i in summary.items if i.tiene_diferencias == "Si")
        summary.total_cajas_preparadas = total_prep
        summary.skus_con_diferencia = skus_diff
        
        # Ajustar fase sugerida de preparado si corresponde
        if total_prep == 0:
            summary.preparado = "Pendiente"
        elif skus_diff == 0:
            summary.preparado = "Listo"
        else:
            summary.preparado = "Con Diferencias"
            
        save_transport(summary)
        return summary
    return None

def set_all_items_prepared(transport_id: str, prepare_all: bool = True) -> Optional[TransportSummary]:
    """Marca todos los ítems como 100% preparados o resetea a 0."""
    summary = get_transport(transport_id)
    if not summary:
        return None

    for item in summary.items:
        qty = item.cantidad_pedido if prepare_all else 0.0
        item.cantidad_preparada = qty
        item.diferencia_preparacion = 0.0 if prepare_all else item.cantidad_pedido
        item.tiene_diferencias = "No" if prepare_all else "Si"
        item.status = "Listo" if prepare_all else "Pendiente"

    summary.total_cajas_preparadas = sum(i.cantidad_preparada for i in summary.items)
    summary.skus_con_diferencia = 0 if prepare_all else len(summary.items)
    summary.preparado = "Listo" if prepare_all else "Pendiente"
    if prepare_all and summary.fase_global in ["Creado", "Pendiente", "En Preparación"]:
        summary.fase_global = "Preparado"

    save_transport(summary)
    return summary
