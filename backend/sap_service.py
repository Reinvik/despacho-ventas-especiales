import os
import sys
import subprocess
import tempfile
import psutil
from datetime import datetime
from typing import Dict, Any, Optional
from data_parser import parse_vl06o_raw_text
from models import TransportSummary

def is_sap_gui_running() -> Dict[str, Any]:
    """Verifica si los procesos de SAP GUI o SAP Logon están en ejecución."""
    sap_processes = []
    for proc in psutil.process_iter(['pid', 'name']):
        try:
            pname = proc.info['name'].lower() if proc.info['name'] else ""
            if pname in ["saplogon.exe", "sapgui.exe"]:
                sap_processes.append({"pid": proc.info['pid'], "name": proc.info['name']})
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue
            
    is_running = len(sap_processes) > 0
    return {
        "running": is_running,
        "processes": sap_processes,
        "message": "SAP GUI detectado en ejecución" if is_running else "SAP GUI no está abierto en Windows"
    }

def generate_vbs_script_content(tknum: str, export_file_path: str) -> str:
    """Genera el código VBScript para automatizar VL06O en SAP GUI."""
    export_dir = os.path.dirname(export_file_path).replace("\\", "\\\\")
    export_name = os.path.basename(export_file_path)
    
    # Script VBScript basado en la macro provista por el usuario
    vbs_code = f'''
On Error Resume Next

Dim SapGuiAuto, application, connection, session
Set SapGuiAuto = GetObject("SAPGUI")
If Err.Number <> 0 Or Not IsObject(SapGuiAuto) Then
    WScript.Echo "ERROR: No se pudo conectar con SAPGUI. Asegúrate de que SAP GUI esté abierto con sesión iniciada y Scripting habilitado."
    WScript.Quit 1
End If

Set application = SapGuiAuto.GetScriptingEngine
If Err.Number <> 0 Or Not IsObject(application) Then
    WScript.Echo "ERROR: El motor de Scripting de SAP no está disponible. Verifica las opciones de Scripting en SAP GUI."
    WScript.Quit 2
End If

If application.Children.Count = 0 Then
    WScript.Echo "ERROR: No hay conexiones de SAP activas. Inicia sesión en tu mandante de SAP."
    WScript.Quit 3
End If

Set connection = application.Children(0)
If connection.Children.Count = 0 Then
    WScript.Echo "ERROR: No hay sesiones activas en la conexión de SAP."
    WScript.Quit 4
End If

Set session = connection.Children(0)
If Err.Number <> 0 Or Not IsObject(session) Then
    WScript.Echo "ERROR: No se pudo acceder a la sesión activa de SAP."
    WScript.Quit 5
End If

session.findById("wnd[0]").maximize
session.findById("wnd[0]/tbar[0]/okcd").text = "/nvl06o"
session.findById("wnd[0]").sendVKey 0

WScript.Sleep 800

session.findById("wnd[0]/usr/btnBUTTON6").press
WScript.Sleep 500

session.findById("wnd[0]/usr/ctxtIT_WADAT-LOW").text = ""
session.findById("wnd[0]/usr/ctxtIT_WADAT-HIGH").text = ""
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").text = "{tknum}"
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").setFocus
session.findById("wnd[0]/tbar[1]/btn[8]").press

WScript.Sleep 1500

' Verificar si hay datos o mensaje de no encontrado
Dim statusText
On Error Resume Next
statusText = session.findById("wnd[0]/sbar").Text
If InStr(statusText, "No se han seleccionado") > 0 Or InStr(statusText, "ninguna entrega") > 0 Then
    WScript.Echo "ADVERTENCIA: " & statusText
    WScript.Quit 6
End If

' Adaptar vista / layout
session.findById("wnd[0]/tbar[1]/btn[18]").press
WScript.Sleep 500

' Menú exportar lista
session.findById("wnd[0]/mbar/menu[0]/menu[4]/menu[1]").select
WScript.Sleep 800

' Nombre de archivo exportado
session.findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").text = "{export_name}"
session.findById("wnd[1]/tbar[0]/btn[20]").press
WScript.Sleep 500
session.findById("wnd[1]/tbar[0]/btn[0]").press
WScript.Sleep 1000

WScript.Echo "OK: Extracción completada para transporte {tknum}"
WScript.Quit 0
'''
    return vbs_code

def execute_sap_extraction(
    tknum: str,
    semana: Optional[str] = None,
    cantidad_pallet: int = 1
) -> Dict[str, Any]:
    """
    Ejecuta el script VBScript en Windows conectándose a SAP GUI.
    Si tiene éxito, lee el archivo descargado y devuelve el resumen y detalle.
    """
    # 1. Verificar si SAP GUI está corriendo
    status = is_sap_gui_running()
    if not status["running"]:
        return {
            "success": False,
            "error": "SAP GUI no está abierto en este equipo. Por favor abre SAP Logon, inicia sesión y vuelve a intentar, o pega los datos manualmente.",
            "sap_status": status
        }

    # 2. Preparar archivo de salida temporal
    temp_dir = tempfile.gettempdir()
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    export_filename = f"{timestamp}_{tknum}_vl06o.txt"
    export_filepath = os.path.join(temp_dir, export_filename)
    vbs_path = os.path.join(temp_dir, f"sap_extract_{timestamp}.vbs")

    vbs_content = generate_vbs_script_content(tknum, export_filepath)

    try:
        with open(vbs_path, "w", encoding="latin-1") as f:
            f.write(vbs_content)

        # 3. Ejecutar cscript.exe
        result = subprocess.run(
            ["cscript.exe", "//Nologo", vbs_path],
            capture_output=True,
            text=True,
            timeout=40
        )

        stdout = result.stdout.strip()
        stderr = result.stderr.strip()

        if result.returncode != 0:
            return {
                "success": False,
                "error": stdout or stderr or "Error al ejecutar el script de SAP GUI.",
                "details": f"Código de retorno cscript: {result.returncode}"
            }

        # 4. Buscar archivo generado (en temp_dir o carpeta SAP default de descargas)
        candidates = [
            export_filepath,
            os.path.join(temp_dir, f"{export_filename}.txt"),
            os.path.join(os.path.expanduser("~"), "Documents", "SAP", "SAP GUI", export_filename)
        ]
        
        found_file = None
        for path in candidates:
            if os.path.exists(path):
                found_file = path
                break

        if not found_file:
            return {
                "success": False,
                "error": f"La macro de SAP terminó, pero no se encontró el archivo exportado '{export_filename}'.",
                "details": stdout
            }

        # 5. Leer y parsear el archivo
        with open(found_file, "r", encoding="latin-1", errors="replace") as f:
            raw_data = f.read()

        summary = parse_vl06o_raw_text(
            raw_text=raw_data,
            transport_doc=tknum,
            semana_override=semana,
            cantidad_pallet=cantidad_pallet
        )

        # Limpiar archivo temporal si se desea
        try:
            os.remove(found_file)
            os.remove(vbs_path)
        except Exception:
            pass

        return {
            "success": True,
            "data": summary.dict(),
            "message": f"Transporte {tknum} extraído con éxito desde SAP ({len(summary.items)} ítems)"
        }

    except subprocess.TimeoutExpired:
        return {
            "success": False,
            "error": "Tiempo de espera agotado al comunicarse con SAP GUI (más de 40 segundos). Verifica si hay ventanas modales o advertencias abiertas en SAP."
        }
    except Exception as e:
        return {
            "success": False,
            "error": f"Error inesperado durante la extracción de SAP: {str(e)}"
        }
    finally:
        if os.path.exists(vbs_path):
            try:
                os.remove(vbs_path)
            except Exception:
                pass

def get_macro_code_for_excel(tknum: str = "3417089") -> str:
    """Devuelve el código VBA completo listo para ser pegado en una macro de Excel."""
    return f'''Attribute VB_Name = "Modulo_SAP_VL06O"
' Macro para extraer Transporte {tknum} desde SAP GUI
Sub Extraer_Despacho_SAP()
    Dim SapGuiAuto As Object
    Dim application As Object
    Dim connection As Object
    Dim session As Object
    
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
    session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").Text = "{tknum}"
    session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").setFocus
    session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").caretPosition = 7
    session.findById("wnd[0]/tbar[1]/btn[8]").press
    session.findById("wnd[0]/tbar[1]/btn[18]").press
    session.findById("wnd[0]/mbar/menu[0]/menu[4]/menu[1]").Select
    
    Dim nombreArchivo As String
    nombreArchivo = Format(Now, "yyyymmdd_hhnnss") & " vl06o"
    session.findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").Text = nombreArchivo
    session.findById("wnd[1]/tbar[0]/btn[20]").press
    session.findById("wnd[1]/tbar[0]/btn[0]").press
    
    MsgBox "Extracción finalizada exitosamente.", vbInformation, "Despacho Ventas Especiales"
End Sub
'''
