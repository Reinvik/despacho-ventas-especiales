import os
import io
from typing import List, Union
from openpyxl import Workbook
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from models import TransportSummary, TransportItem

# Colores de estilo corporativo
COLOR_HEADER_BG = "1E293B"      # Slate 800
COLOR_HEADER_TXT = "FFFFFF"     # Blanco
COLOR_ROW_ALT = "F8FAFC"        # Slate 50
COLOR_DIFF_BG = "FEE2E2"        # Rojo suave para diferencias
COLOR_DIFF_TXT = "991B1B"       # Rojo texto
COLOR_OK_BG = "DCFCE7"          # Verde suave
COLOR_OK_TXT = "166534"         # Verde texto
COLOR_BORDER = "CBD5E1"         # Slate 300

def create_excel_report(summary_list: Union[TransportSummary, List[TransportSummary]]) -> io.BytesIO:
    """
    Genera un archivo Excel (.xlsx) con dos pestañas:
    1. 'Resumen de Despacho': Resumen operativo (Semana, Cliente, Transporte, Pallets, Fases, etc.)
    2. 'Detalle Preparación': Matriz exacta de SKU solicitada por el usuario.
    """
    if isinstance(summary_list, TransportSummary):
        summaries = [summary_list]
    else:
        summaries = summary_list

    wb = Workbook()
    
    # Fuentes y estilos
    font_title = Font(name="Calibri", size=14, bold=True, color="0F172A")
    font_subtitle = Font(name="Calibri", size=10, italic=True, color="64748B")
    font_header = Font(name="Calibri", size=11, bold=True, color=COLOR_HEADER_TXT)
    font_body = Font(name="Calibri", size=10, color="1E293B")
    font_diff = Font(name="Calibri", size=10, bold=True, color=COLOR_DIFF_TXT)
    font_ok = Font(name="Calibri", size=10, bold=True, color=COLOR_OK_TXT)

    fill_header = PatternFill(start_color=COLOR_HEADER_BG, end_color=COLOR_HEADER_BG, fill_type="solid")
    fill_alt = PatternFill(start_color=COLOR_ROW_ALT, end_color=COLOR_ROW_ALT, fill_type="solid")
    fill_diff = PatternFill(start_color=COLOR_DIFF_BG, end_color=COLOR_DIFF_BG, fill_type="solid")
    fill_ok = PatternFill(start_color=COLOR_OK_BG, end_color=COLOR_OK_BG, fill_type="solid")

    thin_border = Border(
        left=Side(style='thin', color=COLOR_BORDER),
        right=Side(style='thin', color=COLOR_BORDER),
        top=Side(style='thin', color=COLOR_BORDER),
        bottom=Side(style='thin', color=COLOR_BORDER)
    )

    align_center = Alignment(horizontal="center", vertical="center")
    align_left = Alignment(horizontal="left", vertical="center")
    align_right = Alignment(horizontal="right", vertical="center")

    # ==========================================================
    # HOJA 1: RESUMEN OPERATIVO
    # ==========================================================
    ws_resumen = wb.active
    ws_resumen.title = "Resumen Despacho"
    ws_resumen.views.sheetView[0].showGridLines = True

    # Título
    ws_resumen["A1"] = "DESPACHO VENTAS ESPECIALES — RESUMEN OPERATIVO"
    ws_resumen["A1"].font = font_title
    ws_resumen["A2"] = "Monitoreo semanal de transportes, pallets y fases de preparación"
    ws_resumen["A2"].font = font_subtitle

    headers_resumen = [
        "Semana", "Cliente", "Número transporte", "Cantidad pallet",
        "Preparado", "Despachado", "Fase global", "Total cajas pedido",
        "Total cajas preparadas", "SKUs con diferencia"
    ]

    row_idx = 4
    for col_idx, header in enumerate(headers_resumen, start=1):
        cell = ws_resumen.cell(row=row_idx, column=col_idx, value=header)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = thin_border
    ws_resumen.row_dimensions[row_idx].height = 26

    for s in summaries:
        row_idx += 1
        values = [
            s.semana,
            s.cliente,
            s.numero_transporte,
            s.cantidad_pallet,
            s.preparado,
            s.despachado,
            s.fase_global,
            s.total_cajas_pedido,
            s.total_cajas_preparadas,
            s.skus_con_diferencia
        ]
        for col_idx, val in enumerate(values, start=1):
            cell = ws_resumen.cell(row=row_idx, column=col_idx, value=val)
            cell.font = font_body
            cell.border = thin_border
            if col_idx in [3, 4, 8, 9, 10]:
                cell.alignment = align_right
            elif col_idx in [1, 5, 6, 7]:
                cell.alignment = align_center
            else:
                cell.alignment = align_left
        ws_resumen.row_dimensions[row_idx].height = 20

    # Autoajustar ancho de columnas de Resumen
    for col in ws_resumen.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws_resumen.column_dimensions[col_letter].width = max(max_len + 3, 12)

    # ==========================================================
    # HOJA 2: DETALLE DE PREPARACIÓN POR SKU (Formato exacto usuario)
    # ==========================================================
    ws_detalle = wb.create_sheet(title="Detalle Preparación")
    ws_detalle.views.sheetView[0].showGridLines = True

    # Cabecera exacta pedida por el usuario
    headers_detalle = [
        "SKU", "descripción", "Cantidad pedido", "UMV", "Cantidad preparada",
        "Diferencia preparación", "Cliente", "Documento transporte", "Fecha",
        "Tiene diferencias", "Status"
    ]

    row_idx = 1
    for col_idx, header in enumerate(headers_detalle, start=1):
        cell = ws_detalle.cell(row=row_idx, column=col_idx, value=header)
        cell.font = font_header
        cell.fill = fill_header
        cell.alignment = align_center
        cell.border = thin_border
    ws_detalle.row_dimensions[row_idx].height = 26

    # Llenar ítems de todos los resúmenes seleccionados
    for s in summaries:
        for item in s.items:
            row_idx += 1
            diff_display = " - " if item.diferencia_preparacion == 0 else item.diferencia_preparacion
            
            row_vals = [
                item.sku,
                item.descripcion,
                item.cantidad_pedido,
                item.umv,
                item.cantidad_preparada,
                diff_display,
                item.cliente,
                item.documento_transporte,
                item.fecha,
                item.tiene_diferencias,
                item.status
            ]

            is_diff = item.tiene_diferencias == "Si"

            for col_idx, val in enumerate(row_vals, start=1):
                cell = ws_detalle.cell(row=row_idx, column=col_idx, value=val)
                cell.font = font_body
                cell.border = thin_border

                # Formato de alineación
                if col_idx in [1, 4, 8, 9, 10, 11]:
                    cell.alignment = align_center
                elif col_idx in [3, 5, 6]:
                    cell.alignment = align_right
                else:
                    cell.alignment = align_left

                # Estilos condicionales para diferencias
                if col_idx == 6 and is_diff:
                    cell.fill = fill_diff
                    cell.font = font_diff
                elif col_idx == 10:
                    if is_diff:
                        cell.fill = fill_diff
                        cell.font = font_diff
                    else:
                        cell.fill = fill_ok
                        cell.font = font_ok
            
            ws_detalle.row_dimensions[row_idx].height = 19

    # Autoajustar columnas de Detalle
    for col in ws_detalle.columns:
        max_len = max(len(str(cell.value or '')) for cell in col)
        col_letter = get_column_letter(col[0].column)
        ws_detalle.column_dimensions[col_letter].width = max(max_len + 3, 11)

    # Retornar como buffer en memoria
    output = io.BytesIO()
    wb.save(output)
    output.seek(0)
    return output
