import os
from datetime import datetime
from typing import List, Optional
from fastapi import FastAPI, HTTPException, Response, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

from models import (
    TransportSummary,
    TransportItem,
    UpdateSummaryRequest,
    UpdateItemPreparedRequest,
    RawDataParseRequest,
    SapExtractRequest
)
from data_parser import parse_vl06o_raw_text
import sap_service
import excel_service
import db

app = FastAPI(
    title="Despacho Ventas Especiales API",
    description="API para conexión SAP GUI VL06O, control de pallets, fases y detalle SKU.",
    version="1.0.0"
)

# CORS para comunicación con el frontend de Vite y producción en Vercel
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.middleware("http")
async def add_private_network_header(request, call_next):
    response = await call_next(request)
    response.headers["Access-Control-Allow-Private-Network"] = "true"
    return response

@app.get("/api/status")
def get_system_status():
    """Retorna el estado de salud del backend y la detección de SAP GUI."""
    sap_status = sap_service.is_sap_gui_running()
    return {
        "status": "online",
        "timestamp": datetime.now().isoformat(),
        "sap_gui": sap_status
    }

@app.get("/api/transports", response_model=List[TransportSummary])
def get_all_transports():
    """Lista todos los transportes registrados."""
    return db.list_transports()

@app.get("/api/transports/{transport_id}", response_model=TransportSummary)
def get_transport_by_id(transport_id: str):
    """Obtiene los datos completos de un transporte específico."""
    trans = db.get_transport(transport_id)
    if not trans:
        raise HTTPException(status_code=404, detail=f"Transporte {transport_id} no encontrado")
    return trans

@app.post("/api/transports/parse-raw", response_model=TransportSummary)
def parse_and_save_raw_data(req: RawDataParseRequest):
    """Parsea texto crudo copiado desde SAP VL06O o archivo tabulado."""
    try:
        tknum = req.documento_transporte or "3417089"
        summary = parse_vl06o_raw_text(
            raw_text=req.raw_text,
            transport_doc=tknum,
            cliente_override=req.cliente_override,
            semana_override=req.semana_override,
            cantidad_pallet=req.cantidad_pallet or 1
        )
        db.save_transport(summary)
        return summary
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error al procesar los datos de SAP: {str(e)}")

@app.post("/api/sap/extract")
def extract_from_sap(req: SapExtractRequest):
    """Ejecuta la macro de automatización en SAP GUI para extraer el transporte."""
    res = sap_service.execute_sap_extraction(
        tknum=req.documento_transporte,
        semana=req.semana,
        cantidad_pallet=req.cantidad_pallet or 1
    )
    if not res.get("success"):
        raise HTTPException(status_code=400, detail=res.get("error", "Error en la conexión a SAP"))
    
    # Guardar en base de datos
    summary = TransportSummary(**res["data"])
    db.save_transport(summary)
    return {
        "success": True,
        "message": res["message"],
        "data": summary
    }

@app.patch("/api/transports/{transport_id}", response_model=TransportSummary)
def update_transport_summary(transport_id: str, req: UpdateSummaryRequest):
    """Actualiza campos del resumen (pallets, fases de preparación/despacho, semana, cliente)."""
    trans = db.get_transport(transport_id)
    if not trans:
        raise HTTPException(status_code=404, detail=f"Transporte {transport_id} no encontrado")

    if req.semana is not None:
        trans.semana = req.semana
    if req.cliente is not None:
        trans.cliente = req.cliente
    if req.cantidad_pallet is not None:
        trans.cantidad_pallet = max(0, req.cantidad_pallet)
    if req.preparado is not None:
        trans.preparado = req.preparado
    if req.despachado is not None:
        trans.despachado = req.despachado
    if req.fase_global is not None:
        trans.fase_global = req.fase_global

    trans.fecha_actualizacion = datetime.now().strftime("%d-%m-%Y %H:%M")
    db.save_transport(trans)
    return trans

@app.patch("/api/transports/{transport_id}/items", response_model=TransportSummary)
def update_item_quantity_endpoint(transport_id: str, req: UpdateItemPreparedRequest):
    """Actualiza la cantidad preparada de un SKU en el transporte."""
    updated = db.update_item_quantity(
        transport_id=transport_id,
        sku=req.sku,
        cantidad_preparada=req.cantidad_preparada,
        posicion=req.posicion
    )
    if not updated:
        raise HTTPException(status_code=404, detail="No se pudo actualizar el ítem (transporte o SKU inexistente)")
    return updated

@app.post("/api/transports/{transport_id}/prepare-all", response_model=TransportSummary)
def set_all_prepared_endpoint(transport_id: str, prepare_all: bool = Query(True)):
    """Marca todos los ítems como 100% preparados o resetea a 0."""
    updated = db.set_all_items_prepared(transport_id, prepare_all=prepare_all)
    if not updated:
        raise HTTPException(status_code=404, detail=f"Transporte {transport_id} no encontrado")
    return updated

@app.delete("/api/transports/{transport_id}")
def delete_transport_endpoint(transport_id: str):
    """Elimina un transporte del sistema."""
    ok = db.delete_transport(transport_id)
    if not ok:
        raise HTTPException(status_code=404, detail=f"Transporte {transport_id} no encontrado")
    return {"success": True, "message": f"Transporte {transport_id} eliminado"}

@app.get("/api/transports/{transport_id}/export-excel")
def export_excel_single(transport_id: str):
    """Descarga el reporte Excel formateado con el resumen y el detalle del transporte."""
    trans = db.get_transport(transport_id)
    if not trans:
        raise HTTPException(status_code=404, detail=f"Transporte {transport_id} no encontrado")

    excel_buffer = excel_service.create_excel_report(trans)
    filename = f"Despacho_{trans.semana.replace(' ', '_')}_{trans.numero_transporte}_{trans.cliente[:15].strip()}.xlsx"
    
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/transports/export-excel/all")
def export_excel_all():
    """Descarga un reporte consolidado con todos los transportes registrados."""
    trans_list = db.list_transports()
    if not trans_list:
        raise HTTPException(status_code=400, detail="No hay transportes cargados para exportar.")

    excel_buffer = excel_service.create_excel_report(trans_list)
    filename = f"Despacho_Ventas_Especiales_Consolidado_{datetime.now().strftime('%Y%m%d_%H%M')}.xlsx"
    
    return StreamingResponse(
        excel_buffer,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'}
    )

@app.get("/api/sap/macro-code")
def get_macro_code(tknum: str = "3417089"):
    """Devuelve el código VBA o VBScript parametrizado para ejecutar la macro."""
    return {
        "tknum": tknum,
        "vba_macro": sap_service.get_macro_code_for_excel(tknum),
        "vbs_script": sap_service.generate_vbs_script_content(tknum, f"C:\\TEMP\\{tknum}_vl06o.txt")
    }

@app.post("/api/transports/seed-sample", response_model=TransportSummary)
def seed_sample_data():
    """Carga los datos de ejemplo exactos provistos por el usuario en el prompt."""
    import test_parser
    summary = parse_vl06o_raw_text(
        raw_text=test_parser.SAMPLE_DATA,
        transport_doc="3417089",
        cliente_override="COMERCIAL DOLLINCO S.A.",
        semana_override="Semana 36",
        cantidad_pallet=3
    )
    # Aplicar las diferencias específicas que el usuario mostró en su ejemplo:
    # 3976 -> preparada 0, dif 3
    # 1436 -> preparada 1, dif 2
    for item in summary.items:
        if item.sku == "3976":
            item.cantidad_preparada = 0
            item.diferencia_preparacion = 3
            item.tiene_diferencias = "Si"
            item.status = "Pendiente"
        elif item.sku == "1436":
            item.cantidad_preparada = 1
            item.diferencia_preparacion = 2
            item.tiene_diferencias = "Si"
            item.status = "Parcial"
        else:
            item.cantidad_preparada = item.cantidad_pedido
            item.diferencia_preparacion = 0
            item.tiene_diferencias = "No"
            item.status = "Listo"
            
    summary.total_cajas_preparadas = sum(i.cantidad_preparada for i in summary.items)
    summary.skus_con_diferencia = sum(1 for i in summary.items if i.tiene_diferencias == "Si")
    summary.preparado = "Con Diferencias"
    summary.despachado = "Pendiente"
    summary.fase_global = "En Preparación"
    
    db.save_transport(summary)
    return summary

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=3115)
