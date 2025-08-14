import { createClient } from '@supabase/supabase-js';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabaseUrl = PUBLIC_SUPABASE_URL;
const supabaseAnonKey = PUBLIC_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos para la base de datos
export interface Database {
  public: {
    Tables: {
      empresa: {
        Row: {
          id: number;
          nombre: string;
          direccion_fiscal: string;
          simbolo_moneda: string;
          logo: string;
          id_auth: string;
          id_usuario_propietario: number;
          porcentaje_capital: number;
          porcentaje_ganancia: number;
        };
        Insert: {
          nombre: string;
          direccion_fiscal?: string;
          simbolo_moneda?: string;
          logo?: string;
          id_auth: string;
          porcentaje_capital?: number;
          porcentaje_ganancia?: number;
        };
        Update: Partial<Database['public']['Tables']['empresa']['Insert']>;
      };
      usuarios: {
        Row: {
          id: number;
          nombres: string;
          usuario: string;
          direccion: string;
          telefono: string;
          id_rol: number;
          id_auth: string;
          estado: string;
          fecharegistro: string;
        };
        Insert: {
          nombres: string;
          usuario: string;
          direccion?: string;
          telefono?: string;
          id_rol: number;
          id_auth: string;
          estado?: string;
        };
        Update: Partial<Database['public']['Tables']['usuarios']['Insert']>;
      };
      productos: {
        Row: {
          id: number;
          id_empresa: number;
          id_categoria: number;
          nombre: string;
          precio_venta: number;
          precio_compra: number;
          codigo_barras: string;
          imagen_url: string;
        };
        Insert: {
          id_empresa: number;
          id_categoria?: number;
          nombre: string;
          precio_venta?: number;
          precio_compra?: number;
          codigo_barras?: string;
          imagen_url?: string;
        };
        Update: Partial<Database['public']['Tables']['productos']['Insert']>;
      };
      categorias: {
        Row: {
          id: number;
          id_empresa: number;
          nombre: string;
          color: string;
        };
        Insert: {
          id_empresa: number;
          nombre: string;
          color?: string;
        };
        Update: Partial<Database['public']['Tables']['categorias']['Insert']>;
      };
      stock: {
        Row: {
          id: number;
          id_almacen: number;
          id_producto: number;
          cantidad: number;
        };
      };
      ventas: {
        Row: {
          id: number;
          id_cierre_caja: number;
          id_usuario: number;
          fecha: string;
          monto_total: number;
          monto_pagado_efectivo: number;
          monto_pagado_qr: number;
        };
      };
      cierrecaja: {
        Row: {
          id: number;
          id_caja: number;
          id_usuario_apertura: number;
          id_usuario_cierre: number;
          fecha_inicio: string;
          fecha_cierre: string;
          monto_apertura_inicial: number;
          monto_cierre_real_efectivo: number;
          monto_apertura_siguiente: number;
          gastos_caja_chica: number;
          total_capital_generado: number;
          total_ganancia_generada: number;
          diferencia_efectivo: number;
          estado: number;
        };
      };
    };
    Functions: {
      abrir_caja: {
        Args: {
          _id_caja: number;
          _id_usuario_apertura: number;
          _monto_apertura: number;
        };
        Returns: {
          id_cierre_caja: number;
          mensaje: string;
        }[];
      };
      abrir_caja_simple: {
        Args: {
          _monto_apertura: number;
        };
        Returns: {
          id_cierre_caja: number;
          mensaje: string;
        }[];
      };
      registrar_venta: {
        Args: {
          _id_cierre_caja: number;
          _id_usuario: number;
          _monto_total: number;
          _monto_efectivo: number;
          _monto_qr: number;
          _detalles: any;
        };
        Returns: {
          id_venta: number;
          mensaje: string;
        }[];
      };
      cerrar_caja: {
        Args: {
          _id_cierre_caja: number;
          _id_usuario_cierre: number;
          _monto_real_contado_efectivo: number;
          _total_gastos_caja_chica: number;
          _monto_para_apertura_siguiente: number;
        };
        Returns: string;
      };
      registrar_producto_con_stock_inicial: {
        Args: {
          p_nombre: string;
          p_descripcion?: string;
          p_codigo_barras?: string;
          p_precio_compra?: number;
          p_precio_venta: number;
          p_categoria_id: number;
          p_imagen_url?: string;
          p_stock_inicial?: number;
        };
        Returns: {
          producto_id: number;
          mensaje: string;
        }[];
      };
      create_cajero_user: {
        Args: {
          nombres: string;
          email: string;
          password: string;
          direccion: string;
          telefono: string;
        };
        Returns: any;
      };
      get_open_cierre_caja: {
        Args: {};
        Returns: {
          id_cierre_caja: number;
          id_caja: number;
          fecha_inicio: string;
          descripcion_caja: string;
        }[];
      };
      get_dashboard_stats: {
        Args: {
          _fecha_inicio: string;
          _fecha_fin: string;
        };
        Returns: any;
      };
      get_sales_history: {
        Args: {
          _fecha_inicio: string;
          _fecha_fin: string;
        };
        Returns: {
          id_venta: number;
          fecha: string;
          cajero: string;
          monto_total: number;
          tipo_pago: string;
          monto_efectivo: number;
          monto_qr: number;
          detalles: any;
        }[];
      };
      get_sales_history_totals: {
        Args: {
          _fecha_inicio: string;
          _fecha_fin: string;
        };
        Returns: {
          total_vendido: number;
          total_ganancia: number;
          ventas_count: number;
        }[];
      };
    };
  };
}