' ==============================================================================
' EXTRACTOR NATIVO SAP GUI VL06O PARA WINDOWS (SIN NECESIDAD DE PYTHON)
' Conecta a SAP GUI, extrae el transporte y lo carga en https://dve.nexusnetwork.cl
' ==============================================================================

Dim tknum
tknum = InputBox("Ingrese el Documento de Transporte SAP (TKNUM):" & vbCrLf & vbCrLf & "Se extraerá desde SAP GUI y se cargará en https://dve.nexusnetwork.cl", "Despacho Ventas Especiales (VL06O)", "3417089")

If Trim(tknum) = "" Then WScript.Quit

Dim fso, tempFolder, exportFile, exportPath, shell
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")
tempFolder = fso.GetSpecialFolder(2)
exportFile = "dve_vl06o_" & tknum & ".txt"
exportPath = fso.BuildPath(tempFolder, exportFile)

If fso.FileExists(exportPath) Then
    On Error Resume Next
    fso.DeleteFile exportPath
    On Error Goto 0
End If

' 1. Conectar con SAP GUI
On Error Resume Next
Dim SapGuiAuto, application, connection, session
Set SapGuiAuto = GetObject("SAPGUI")
If Err.Number <> 0 Or Not IsObject(SapGuiAuto) Then
    MsgBox "No se pudo conectar a SAP GUI." & vbCrLf & vbCrLf & _
           "1. Asegúrate de tener SAP Logon abierto con sesión iniciada." & vbCrLf & _
           "2. Verifica que el Scripting esté habilitado en Opciones de SAP GUI.", vbCritical, "SAP GUI No Detectado"
    WScript.Quit 1
End If

Set application = SapGuiAuto.GetScriptingEngine
If Err.Number <> 0 Or Not IsObject(application) Then
    MsgBox "El motor de Scripting de SAP GUI no está disponible.", vbCritical, "Error Scripting"
    WScript.Quit 2
End If

If application.Children.Count = 0 Then
    MsgBox "No hay conexiones de SAP activas. Inicia sesión en tu mandante.", vbExclamation, "Atención"
    WScript.Quit 3
End If

Set connection = application.Children(0)
If connection.Children.Count = 0 Then
    MsgBox "No hay sesiones activas en la conexión de SAP.", vbExclamation, "Atención"
    WScript.Quit 4
End If

Set session = connection.Children(0)

' 2. Ejecutar Transacción VL06O
session.findById("wnd[0]").maximize
session.findById("wnd[0]/tbar[0]/okcd").Text = "/nvl06o"
session.findById("wnd[0]").sendVKey 0
WScript.Sleep 600

session.findById("wnd[0]/usr/btnBUTTON6").press
WScript.Sleep 400

session.findById("wnd[0]/usr/ctxtIT_WADAT-LOW").Text = ""
session.findById("wnd[0]/usr/ctxtIT_WADAT-HIGH").Text = ""
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").Text = tknum
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").setFocus
session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").caretPosition = 7
session.findById("wnd[0]/tbar[1]/btn[8]").press
WScript.Sleep 1500

' 3. Exportar lista
session.findById("wnd[0]/tbar[1]/btn[18]").press
WScript.Sleep 400

session.findById("wnd[0]/mbar/menu[0]/menu[4]/menu[1]").Select
WScript.Sleep 600

session.findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").Text = exportFile
session.findById("wnd[1]/tbar[0]/btn[20]").press
WScript.Sleep 400
session.findById("wnd[1]/tbar[0]/btn[0]").press
WScript.Sleep 1000

' 4. Buscar archivo exportado
Dim fullExportPath
fullExportPath = exportPath

If Not fso.FileExists(fullExportPath) Then
    Dim sapDocFolder
    sapDocFolder = shell.SpecialFolders("MyDocuments") & "\SAP\SAP GUI\" & exportFile
    If fso.FileExists(sapDocFolder) Then fullExportPath = sapDocFolder
End If

If Not fso.FileExists(fullExportPath) Then
    MsgBox "La transacción se ejecutó en SAP, pero no se encontró el archivo exportado en disco." & vbCrLf & _
           "Puedes copiar la tabla en SAP y pegarla en la web usando el botón 'Pegar Datos'.", vbInformation, "Exportación SAP"
    shell.Run "https://dve.nexusnetwork.cl"
    WScript.Quit 0
End If

' 5. Leer contenido
Dim fileStream, rawData
Set fileStream = fso.OpenTextFile(fullExportPath, 1)
rawData = fileStream.ReadAll
fileStream.Close

' 6. Enviar a https://dve.nexusnetwork.cl
Dim cleanData
cleanData = Replace(rawData, "\", "\\")
cleanData = Replace(cleanData, """", "\""")
cleanData = Replace(cleanData, vbCrLf, "\n")
cleanData = Replace(cleanData, vbCr, "\n")
cleanData = Replace(cleanData, vbLf, "\n")
cleanData = Replace(cleanData, vbTab, "\t")

Dim http, payload
Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
http.Open "POST", "https://dve.nexusnetwork.cl/api/transports/parse-raw", False
http.setRequestHeader "Content-Type", "application/json"

payload = "{""raw_text"": """ & cleanData & """, ""documento_transporte"": """ & tknum & """}"
http.Send payload

If http.Status = 200 Then
    MsgBox "¡Transporte " & tknum & " extraído con éxito desde SAP!" & vbCrLf & vbCrLf & _
           "Se abrirá la aplicación web en tu navegador.", vbInformation, "Extracción Exitosa"
    shell.Run "https://dve.nexusnetwork.cl"
Else
    MsgBox "Extracción finalizada. Abriendo la aplicación web para visualizar.", vbInformation, "Despacho Ventas Especiales"
    shell.Run "https://dve.nexusnetwork.cl"
End If
