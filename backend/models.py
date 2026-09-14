from pydantic import BaseModel, Field
from typing import List, Optional

class TransportItem(BaseModel):
    sku: str = Field(..., description="Código de material/SKU SAP")
    descripcion: str = Field(..., description="Descripción del producto")
    cantidad_pedido: float = Field(..., description="Cantidad solicitada en el pedido")
    umv: str = Field(default="CJ", description="Unidad de medida de venta")
    cantidad_preparada: float = Field(default=0.0, description="Cantidad efectivamente preparada")
    diferencia_preparacion: float = Field(default=0.0, description="Diferencia (Pedido - Preparado)")
    cliente: str = Field(..., description="Nombre del solicitante / cliente")
    documento_transporte: str = Field(..., description="Número de documento de transporte (TKNUM)")
    fecha: str = Field(..., description="Fecha formateada (ej. 02-sept)")
    tiene_diferencias: str = Field(default="No", description="'Si' o 'No'")
    status: str = Field(default="Pendiente", description="Estado de preparación del ítem")
    entrega: Optional[str] = None
    posicion: Optional[str] = None
    peso_total: Optional[float] = 0.0
    unidad_peso: Optional[str] = "KG"
    volumen: Optional[float] = 0.0
    unidad_volumen: Optional[str] = "CM3"
    ruta: Optional[str] = None
    canal_distribucion: Optional[str] = None
    documento_compras: Optional[str] = None

class TransportSummary(BaseModel):
    id: str = Field(..., description="Identificador único (normalmente el número de transporte)")
    semana: str = Field(default="Semana 36", description="Semana de despacho (ej. Semana 36)")
    cliente: str = Field(..., description="Nombre del cliente")
    numero_transporte: str = Field(..., description="Documento de transporte TKNUM")
    cantidad_pallet: int = Field(default=1, description="Cantidad de pallets asignados (editable)")
    preparado: str = Field(default="Pendiente", description="Fase de preparación: Pendiente, En Preparación, Listo, Con Diferencias")
    despachado: str = Field(default="Pendiente", description="Fase de despacho: Pendiente, En Andén, Despachado")
    fase_global: str = Field(default="En Preparación", description="Fase global del transporte")
    total_cajas_pedido: float = Field(default=0.0)
    total_cajas_preparadas: float = Field(default=0.0)
    total_skus: int = Field(default=0)
    skus_con_diferencia: int = Field(default=0)
    fecha_creacion: Optional[str] = None
    fecha_actualizacion: Optional[str] = None
    items: List[TransportItem] = Field(default_factory=list)

class UpdateSummaryRequest(BaseModel):
    semana: Optional[str] = None
    cliente: Optional[str] = None
    cantidad_pallet: Optional[int] = None
    preparado: Optional[str] = None
    despachado: Optional[str] = None
    fase_global: Optional[str] = None

class UpdateItemPreparedRequest(BaseModel):
    sku: str
    posicion: Optional[str] = None
    cantidad_preparada: float

class RawDataParseRequest(BaseModel):
    raw_text: str
    documento_transporte: Optional[str] = None
    cliente_override: Optional[str] = None
    semana_override: Optional[str] = None
    cantidad_pallet: Optional[int] = 1

class SapExtractRequest(BaseModel):
    documento_transporte: str
    semana: Optional[str] = None
    cantidad_pallet: Optional[int] = 1
