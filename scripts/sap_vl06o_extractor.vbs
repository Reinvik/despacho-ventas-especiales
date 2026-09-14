' ==============================================================================
' Extractor Autónomo SAP GUI - Transacción VL06O (Despacho Ventas Especiales)
' Uso: cscript //Nologo sap_vl06o_extractor.vbs [TKNUM] [RutaArchivoSalida]
' ==============================================================================

Dim tknum, exportFile
If WScript.Arguments.Count > 0 Then
    tknum = WScript.Arguments(0)
Else
    tknum = InputBox("Ingrese el Documento de Transporte SAP (TKNUM):", "Despacho Ventas Especiales", "3417089")
    If Trim(tknum) = "" Then WScript.Quit 0
End If

If WScript.Arguments.Count > 1 Then
    exportFile = WScript.Arguments(1)
Else
    exportFile = "despacho_" & tknum & ".txt"
End If

On Error Resume Next

Dim SapGuiAuto, application, connection, session
Set SapGuiAuto = GetObject("SAPGUI")
If Err.Number <> 0 Or Not IsObject(SapGuiAuto) Then
    MsgBox "No se pudo conectar con SAP GUI. Asegúrate de tener SAP Logon abierto con sesión iniciada.", vbCritical, "Error SAP GUI"
    WScript.Quit 1
End If

Set application = SapGuiAuto.GetScriptingEngine
If Err.Number <> 0 Or Not IsObject(application) Then
    MsgBox "El motor de scripting de SAP no está activo.", vbCritical, "Error Scripting"
    WScript.Quit 2
End If

If application.Children.Count = 0 Then
    MsgBox "No hay conexiones de SAP activas.", vbExclamation, "Atención"
    WScript.Quit 3
End If

Set connection = application.Children(0)
Set session = connection.Children(0)

session.findById("wnd[0]").maximize
session.findById("wnd[0]/tbar[0]/okcd").text = "/nvl06o"
session.findById("wnd[0]").sendVKey 0
WScript.Sleep 600

session.findById("wnd[0]/usr/btnBUTTON6").press
WScript.Sleep 400

session.findById("wnd[0]/usr/ctxtIT_WADAT-LOW").text = ""
session.findById("wnd[0]/usr/ctxtIT_WADAT-HIGH").text = ""
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").text = tknum
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").setFocus
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").caretPosition = 7
session.findById("wnd[0]/tbar[1]/btn[8]").press
WScript.Sleep 1200

session.findById("wnd[0]/tbar[1]/btn[18]").press
WScript.Sleep 400

session.findById("wnd[0]/mbar/menu[0]/menu[4]/menu[1]").select
WScript.Sleep 600

session.findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").text = exportFile
session.findById("wnd[1]/tbar[0]/btn[20]").press
session.findById("wnd[1]/tbar[0]/btn[0]").press
WScript.Sleep 800

WScript.Echo "Extracción completada exitosamente para transporte " & tknum
