# Despacho Ventas Especiales — SAP VL06O Control Center

Aplicación de control operativo y preparación de pedidos para **Despacho Ventas Especiales**, con integración nativa a **SAP GUI** (transacción `VL06O` mediante scripting COM/VBA) y exportación a Excel.

---

## 🚀 Inicio Rápido en Windows

1. Haz doble clic en el archivo:
   ```cmd
   iniciar_app.bat
   ```
2. El sistema arrancará automáticamente:
   - Backend FastAPI en: `http://127.0.0.1:3115`
   - Frontend React en: `http://localhost:3015`
3. Se abrirá automáticamente tu navegador predeterminado.

---

## 🌟 Características Principales

### 1. Conexión Directa a SAP GUI (VL06O)
- Se conecta a la sesión activa de SAP en tu equipo (`GetObject("SAPGUI")`).
- Ejecuta la transacción `/nvl06o`, ingresa el documento de transporte (`IT_TKNUM-LOW`), limpia fechas y extrae las entregas de picking automáticamente.
- **Modos alternativos**:
  - **Pegar Datos**: Pega directamente la tabla de SAP o Excel en el cuadro de texto.
  - **Cargar Archivo**: Sube archivos `.txt`, `.tsv` o `.csv` exportados.
  - **Ver Macro Excel**: Genera el código VBA listo para pegar en un módulo de Excel si prefieres ejecutar la macro externamente.

### 2. Resumen Operativo por Semana y Transporte
- **Semana**: Agrupación automática por semana de entrega (ej. `Semana 36`).
- **Cliente**: Nombre del solicitante (ej. `COMERCIAL DOLLINCO S.A.`).
- **N° Transporte**: Código de transporte TKNUM.
- **Cantidad de Pallets**: Modificable en vivo con un input directo en la tabla.
- **Fase de Preparado**: `Pendiente`, `En Preparación`, `Listo`, `Con Diferencias`.
- **Fase de Despacho**: `No Despachado`, `En Andén / Carga`, `Despachado (Camión)`.
- **Fase Global**: Selector de pipeline en un clic (`🟡 Pendiente` ➔ `🟠 En Preparación` ➔ `🔵 Preparado` ➔ `🟣 En Andén` ➔ `🟢 Despachado`).

### 3. Matriz de Preparación por SKU (Nivel Detalle)
Muestra las 11 columnas exactas solicitadas:
`SKU` | `descripción` | `Cantidad pedido` | `UMV` | `Cantidad preparada` | `Diferencia preparación` | `Cliente` | `Documento transporte` | `Fecha` | `Tiene diferencias` | `Status`

- **Edición en tiempo real**: Modifica la cantidad preparada de cada producto y la aplicación recalculará al instante la diferencia y el indicador de faltantes (`Si` / `No`).
- Botón **"Preparar 100%"** y **"Reiniciar a 0"** para agilizar la operación de bodega.
- Filtro rápido para aislar únicamente los ítems con diferencias de stock.

### 4. Exportación a Excel (.xlsx)
Genera libros de Excel formateados profesionalmente con:
- **Pestaña 1 ("Resumen Despacho")**: Vista gerencial con semana, cliente, transporte, pallets, fases y totales.
- **Pestaña 2 ("Detalle Preparación")**: Tabla completa con formato condicional para diferencias resaltadas.

---

## 🛠️ Estructura Técnica

- **Backend**: Python 3.12 + FastAPI + Uvicorn + Openpyxl + PyWin32 (puerto 3115).
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS + Lucide Icons (puerto 3015).
- **Persistencia**: Base de datos local JSON en `data/despachos.json`.
- **Automatización**: `cscript.exe` / COM Scripting Engine nativo de Windows.
