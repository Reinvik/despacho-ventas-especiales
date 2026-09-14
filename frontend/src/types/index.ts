export interface TransportItem {
  sku: string;
  descripcion: string;
  cantidad_pedido: number;
  umv: string;
  cantidad_preparada: number;
  diferencia_preparacion: number;
  cliente: string;
  documento_transporte: string;
  fecha: string;
  tiene_diferencias: "Si" | "No";
  status: string;
  entrega?: string;
  posicion?: string;
  peso_total?: number;
  volumen?: number;
  ruta?: string;
  documento_compras?: string;
}

export interface TransportSummary {
  id: string;
  semana: string;
  cliente: string;
  numero_transporte: string;
  cantidad_pallet: number;
  preparado: "Pendiente" | "En Preparación" | "Listo" | "Con Diferencias" | string;
  despachado: "Pendiente" | "En Andén" | "Despachado" | string;
  fase_global: "Pendiente" | "En Preparación" | "Preparado" | "En Andén" | "Despachado" | string;
  total_cajas_pedido: number;
  total_cajas_preparadas: number;
  total_skus: number;
  skus_con_diferencia: number;
  fecha_creacion?: string;
  fecha_actualizacion?: string;
  items: TransportItem[];
}

export interface SapStatusResponse {
  status: string;
  timestamp: string;
  sap_gui: {
    running: boolean;
    processes: Array<{ pid: number; name: string }>;
    message: string;
  };
  is_local_bridge?: boolean;
}
