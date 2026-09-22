' ==============================================================================
' CIAL ALIMENTOS - NEXUS DESPACHO VENTAS ESPECIALES
' EXTRACTOR AUTOMÁTICO SAP GUI VL06O (100% NATIVO WINDOWS - SIN PYTHON)
' Conecta a SAP GUI, extrae el reporte VL06O y lo sincroniza con dve.nexusnetwork.cl
' ==============================================================================

Option Explicit

Dim rawInput
rawInput = InputBox("CIAL ALIMENTOS — CONTROL DESPACHO" & vbCrLf & vbCrLf & _
                    "Ingrese el o los Documentos de Transporte SAP (TKNUM):" & vbCrLf & _
                    "(Puede ingresar varios separados por coma o espacio, ej: 3417089, 3417090)" & vbCrLf & vbCrLf & _
                    "Se conectará a SAP GUI, extraerá el picking VL06O de cada uno y los cargará en la web.", _
                    "Nexus Despacho CIAL", "3417089")

If Trim(rawInput) = "" Then WScript.Quit

Dim fso, shell, tempFolder, userDocs, userDesktop, userDownloads, sapDocFolder
Set fso = CreateObject("Scripting.FileSystemObject")
Set shell = CreateObject("WScript.Shell")

tempFolder = fso.GetSpecialFolder(2)
userDocs = shell.SpecialFolders("MyDocuments")
userDesktop = shell.SpecialFolders("Desktop")
userDownloads = shell.ExpandEnvironmentStrings("%USERPROFILE%") & "\Downloads"
sapDocFolder = userDocs & "\SAP\SAP GUI"

' 1. Conectar con SAP GUI
On Error Resume Next
Dim SapGuiAuto, application, connection, session
Set SapGuiAuto = GetObject("SAPGUI")
If Err.Number <> 0 Or Not IsObject(SapGuiAuto) Then
    MsgBox "No se pudo conectar a SAP GUI." & vbCrLf & vbCrLf & _
           "1. Abre SAP Logon e inicia sesión en tu mandante (San Jorge / CIAL)." & vbCrLf & _
           "2. Asegúrate de tener la ventana principal de SAP abierta." & vbCrLf & _
           "3. Vuelve a ejecutar este script.", vbCritical, "CIAL — SAP GUI No Detectado"
    WScript.Quit 1
End If

Set application = SapGuiAuto.GetScriptingEngine
If Err.Number <> 0 Or Not IsObject(application) Then
    MsgBox "El motor de Scripting de SAP GUI no está habilitado." & vbCrLf & _
           "Verifica en Opciones de SAP GUI > Scripting que esté activo.", vbCritical, "Error Scripting"
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
On Error Goto 0

' Normalizar lista de transportes
Dim cleanTkInput, tkArr, i, tknum, successCount, totalCount
cleanTkInput = Replace(rawInput, ",", " ")
cleanTkInput = Replace(cleanTkInput, ";", " ")
cleanTkInput = Replace(cleanTkInput, vbTab, " ")
Do While InStr(cleanTkInput, "  ") > 0
    cleanTkInput = Replace(cleanTkInput, "  ", " ")
Loop
cleanTkInput = Trim(cleanTkInput)

tkArr = Split(cleanTkInput, " ")
successCount = 0
totalCount = UBound(tkArr) - LBound(tkArr) + 1

For i = LBound(tkArr) To UBound(tkArr)
    tknum = Trim(tkArr(i))
    If tknum <> "" Then
        Dim exportFileName, scriptStartTime
        exportFileName = "dve_vl06o_" & tknum
        scriptStartTime = Now

        ' 2. Ejecutar Transacción VL06O para este transporte
        session.findById("wnd[0]").maximize
        session.findById("wnd[0]/tbar[0]/okcd").Text = "/nvl06o"
        session.findById("wnd[0]").sendVKey 0
        WScript.Sleep 600

        ' Presionar botón 6 (Para picking)
        session.findById("wnd[0]/usr/btnBUTTON6").press
        WScript.Sleep 400

        ' Limpiar fechas y asignar transporte
        session.findById("wnd[0]/usr/ctxtIT_WADAT-LOW").Text = ""
        session.findById("wnd[0]/usr/ctxtIT_WADAT-HIGH").Text = ""
        session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").Text = tknum
        session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").setFocus
        session.findById("wnd[0]/usr/ctxtIT_TKNUM-LOW").caretPosition = Len(tknum)
        session.findById("wnd[0]/tbar[1]/btn[8]").press
        WScript.Sleep 1500

        ' 3. Exportar lista
        session.findById("wnd[0]/tbar[1]/btn[18]").press
        WScript.Sleep 400

        session.findById("wnd[0]/mbar/menu[0]/menu[4]/menu[1]").Select
        WScript.Sleep 600

        ' Asignar nombre de exportación
        On Error Resume Next
        session.findById("wnd[1]/usr/ssubSUB_CONFIGURATION:SAPLSALV_GUI_CUL_EXPORT_AS:0512/txtGS_EXPORT-FILE_NAME").Text = exportFileName & ".txt"
        session.findById("wnd[1]/tbar[0]/btn[20]").press
        WScript.Sleep 400
        session.findById("wnd[1]/tbar[0]/btn[0]").press
        WScript.Sleep 400
        On Error Goto 0

        ' 4. Espera del Archivo Descargado
        Dim foundPath, rawData
        foundPath = WaitForExportedFile(exportFileName, scriptStartTime, 25)

        If foundPath <> "" Then
            rawData = ReadFileSafely(foundPath, 12)
            If Trim(rawData) <> "" Then
                Dim cleanData, http, payload
                cleanData = Replace(rawData, "\", "\\")
                cleanData = Replace(cleanData, """", "\""")
                cleanData = Replace(cleanData, vbCrLf, "\n")
                cleanData = Replace(cleanData, vbCr, "\n")
                cleanData = Replace(cleanData, vbLf, "\n")
                cleanData = Replace(cleanData, vbTab, "\t")

                Set http = CreateObject("MSXML2.ServerXMLHTTP.6.0")
                http.Open "POST", "https://dve.nexusnetwork.cl/api/transports/parse-raw", False
                http.setRequestHeader "Content-Type", "application/json"
                payload = "{""raw_text"": """ & cleanData & """, ""documento_transporte"": """ & tknum & """}"
                http.Send payload

                If http.Status = 200 Then
                    successCount = successCount + 1
                End If
            End If
        End If
    End If
Next

If successCount > 0 Then
    MsgBox "CIAL ALIMENTOS — NEXUS DESPACHO" & vbCrLf & vbCrLf & _
           "¡Extracción finalizada con éxito!" & vbCrLf & _
           "Transportes procesados: " & successCount & " de " & totalCount & vbCrLf & vbCrLf & _
           "Se abrirá la aplicación web en tu navegador.", vbInformation, "Extracción Exitosa"
    shell.Run "https://dve.nexusnetwork.cl"
Else
    MsgBox "Se ejecutó la consulta en SAP. Abriendo Nexus Despacho...", vbInformation, "Nexus Despacho CIAL"
    shell.Run "https://dve.nexusnetwork.cl"
End If

' ==============================================================================
' FUNCIONES AUXILIARES DE ESPERA Y LECTURA ROBUSTA
' ==============================================================================

Function WaitForExportedFile(baseName, startTime, maxSeconds)
    Dim elapsed, found, targetExts, ext, folder, folders(4)
    folders(0) = sapDocFolder
    folders(1) = tempFolder
    folders(2) = userDocs
    folders(3) = userDownloads
    folders(4) = userDesktop

    targetExts = Array(".txt", "", ".tsv", ".csv", ".xlsx", ".xls")

    elapsed = 0
    found = ""

    Do While elapsed < maxSeconds
        ' 1. Buscar coincidencias por nombre exacto en todas las carpetas
        Dim i, j, testPath
        For i = 0 To UBound(folders)
            folder = folders(i)
            If fso.FolderExists(folder) Then
                For j = 0 To UBound(targetExts)
                    ext = targetExts(j)
                    testPath = folder & "\" & baseName & ext
                    If fso.FileExists(testPath) Then
                        If fso.GetFile(testPath).DateLastModified >= DateAdd("s", -20, startTime) Then
                            found = testPath
                            Exit Do
                        End If
                    End If
                    ' Probar también con doble extensión (dve_...txt.txt)
                    testPath = folder & "\" & baseName & ".txt" & ext
                    If fso.FileExists(testPath) Then
                        If fso.GetFile(testPath).DateLastModified >= DateAdd("s", -20, startTime) Then
                            found = testPath
                            Exit Do
                        End If
                    End If
                Next
            End If
        Next

        ' 2. Buscar cualquier archivo reciente en la carpeta de SAP GUI creado tras startTime
        If fso.FolderExists(sapDocFolder) Then
            Dim fList, fileObj
            Set fList = fso.GetFolder(sapDocFolder).Files
            For Each fileObj In fList
                If fileObj.DateLastModified >= DateAdd("s", -10, startTime) Then
                    If LCase(Right(fileObj.Name, 4)) = ".txt" Or LCase(Right(fileObj.Name, 4)) = ".tsv" Or InStr(LCase(fileObj.Name), "vl06o") > 0 Then
                        found = fileObj.Path
                        Exit Do
                    End If
                End If
            Next
        End If

        WScript.Sleep 600
        elapsed = elapsed + 1
    Loop

    WaitForExportedFile = found
End Function

Function ReadFileSafely(filePath, maxAttempts)
    Dim attempts, content, fStream
    content = ""
    For attempts = 1 To maxAttempts
        On Error Resume Next
        Err.Clear
        Set fStream = fso.OpenTextFile(filePath, 1, False, 0)
        If Err.Number = 0 And Not fStream Is Nothing Then
            content = fStream.ReadAll
            fStream.Close
            If Len(Trim(content)) > 10 Then
                On Error Goto 0
                Exit For
            End If
        End If
        On Error Goto 0
        WScript.Sleep 500
    Next
    ReadFileSafely = content
End Function
