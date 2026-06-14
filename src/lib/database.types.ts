export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      caja: {
        Row: {
          descripcion: string
          id: number
          id_empresa: number
        }
        Insert: {
          descripcion: string
          id?: number
          id_empresa: number
        }
        Update: {
          descripcion?: string
          id?: number
          id_empresa?: number
        }
        Relationships: [
          {
            foreignKeyName: "caja_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      categorias: {
        Row: {
          color: string | null
          id: number
          id_empresa: number
          nombre: string
        }
        Insert: {
          color?: string | null
          id?: number
          id_empresa: number
          nombre: string
        }
        Update: {
          color?: string | null
          id?: number
          id_empresa?: number
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "categorias_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      cierrecaja: {
        Row: {
          diferencia_efectivo: number | null
          estado: number | null
          fecha_cierre: string | null
          fecha_inicio: string | null
          gastos_caja_chica: number | null
          id: number
          id_caja: number
          id_usuario_apertura: number
          id_usuario_cierre: number | null
          monto_apertura_inicial: number | null
          monto_apertura_siguiente: number | null
          monto_cierre_real_efectivo: number | null
          total_capital_generado: number | null
          total_ganancia_generada: number | null
        }
        Insert: {
          diferencia_efectivo?: number | null
          estado?: number | null
          fecha_cierre?: string | null
          fecha_inicio?: string | null
          gastos_caja_chica?: number | null
          id?: number
          id_caja: number
          id_usuario_apertura: number
          id_usuario_cierre?: number | null
          monto_apertura_inicial?: number | null
          monto_apertura_siguiente?: number | null
          monto_cierre_real_efectivo?: number | null
          total_capital_generado?: number | null
          total_ganancia_generada?: number | null
        }
        Update: {
          diferencia_efectivo?: number | null
          estado?: number | null
          fecha_cierre?: string | null
          fecha_inicio?: string | null
          gastos_caja_chica?: number | null
          id?: number
          id_caja?: number
          id_usuario_apertura?: number
          id_usuario_cierre?: number | null
          monto_apertura_inicial?: number | null
          monto_apertura_siguiente?: number | null
          monto_cierre_real_efectivo?: number | null
          total_capital_generado?: number | null
          total_ganancia_generada?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cierrecaja_id_caja_fkey"
            columns: ["id_caja"]
            isOneToOne: false
            referencedRelation: "caja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierrecaja_id_usuario_apertura_fkey"
            columns: ["id_usuario_apertura"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierrecaja_id_usuario_apertura_fkey"
            columns: ["id_usuario_apertura"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierrecaja_id_usuario_cierre_fkey"
            columns: ["id_usuario_cierre"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cierrecaja_id_usuario_cierre_fkey"
            columns: ["id_usuario_cierre"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      detalle_venta: {
        Row: {
          cantidad: number | null
          descuento_aplicado: number | null
          id: number
          id_producto: number
          id_venta: number
          observacion: string | null
          porcentaje_descuento: number | null
          precio_compra_unitario: number | null
          precio_original: number | null
          precio_venta_unitario: number | null
          talla: string | null
          total: number | null
        }
        Insert: {
          cantidad?: number | null
          descuento_aplicado?: number | null
          id?: number
          id_producto: number
          id_venta: number
          observacion?: string | null
          porcentaje_descuento?: number | null
          precio_compra_unitario?: number | null
          precio_original?: number | null
          precio_venta_unitario?: number | null
          talla?: string | null
          total?: number | null
        }
        Update: {
          cantidad?: number | null
          descuento_aplicado?: number | null
          id?: number
          id_producto?: number
          id_venta?: number
          observacion?: string | null
          porcentaje_descuento?: number | null
          precio_compra_unitario?: number | null
          precio_original?: number | null
          precio_venta_unitario?: number | null
          talla?: string | null
          total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "detalle_venta_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "detalle_venta_id_venta_fkey"
            columns: ["id_venta"]
            isOneToOne: false
            referencedRelation: "ventas"
            referencedColumns: ["id"]
          },
        ]
      }
      empresa: {
        Row: {
          direccion_fiscal: string | null
          id: number
          id_auth: string
          id_usuario_propietario: number | null
          logo: string | null
          nombre: string
          porcentaje_capital: number | null
          porcentaje_ganancia: number | null
          simbolo_moneda: string
        }
        Insert: {
          direccion_fiscal?: string | null
          id?: number
          id_auth: string
          id_usuario_propietario?: number | null
          logo?: string | null
          nombre?: string
          porcentaje_capital?: number | null
          porcentaje_ganancia?: number | null
          simbolo_moneda?: string
        }
        Update: {
          direccion_fiscal?: string | null
          id?: number
          id_auth?: string
          id_usuario_propietario?: number | null
          logo?: string | null
          nombre?: string
          porcentaje_capital?: number | null
          porcentaje_ganancia?: number | null
          simbolo_moneda?: string
        }
        Relationships: []
      }
      metodos_pago: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      movimientos_caja: {
        Row: {
          descripcion: string | null
          fecha_movimiento: string | null
          id: number
          id_cierre_caja: number
          id_metodo_pago: number | null
          id_usuario: number
          monto: number | null
          tipo_movimiento: string | null
        }
        Insert: {
          descripcion?: string | null
          fecha_movimiento?: string | null
          id?: number
          id_cierre_caja: number
          id_metodo_pago?: number | null
          id_usuario: number
          monto?: number | null
          tipo_movimiento?: string | null
        }
        Update: {
          descripcion?: string | null
          fecha_movimiento?: string | null
          id?: number
          id_cierre_caja?: number
          id_metodo_pago?: number | null
          id_usuario?: number
          monto?: number | null
          tipo_movimiento?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_caja_id_cierre_caja_fkey"
            columns: ["id_cierre_caja"]
            isOneToOne: false
            referencedRelation: "cierrecaja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_id_metodo_pago_fkey"
            columns: ["id_metodo_pago"]
            isOneToOne: false
            referencedRelation: "metodos_pago"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_caja_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos_inventario: {
        Row: {
          cantidad: number
          fecha: string | null
          id: number
          id_producto: number
          id_usuario: number | null
          motivo: string | null
          stock_anterior: number
          stock_nuevo: number
          talla: string | null
          tipo_movimiento: string
        }
        Insert: {
          cantidad: number
          fecha?: string | null
          id?: number
          id_producto: number
          id_usuario?: number | null
          motivo?: string | null
          stock_anterior: number
          stock_nuevo: number
          talla?: string | null
          tipo_movimiento: string
        }
        Update: {
          cantidad?: number
          fecha?: string | null
          id?: number
          id_producto?: number
          id_usuario?: number | null
          motivo?: string | null
          stock_anterior?: number
          stock_nuevo?: number
          talla?: string | null
          tipo_movimiento?: string
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_inventario_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_inventario_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
      producto_tallas: {
        Row: {
          codigo_barras: string | null
          id: number
          id_producto: number
          stock: number
          talla: string
        }
        Insert: {
          codigo_barras?: string | null
          id?: number
          id_producto: number
          stock?: number
          talla: string
        }
        Update: {
          codigo_barras?: string | null
          id?: number
          id_producto?: number
          stock?: number
          talla?: string
        }
        Relationships: [
          {
            foreignKeyName: "producto_tallas_id_producto_fkey"
            columns: ["id_producto"]
            isOneToOne: false
            referencedRelation: "productos"
            referencedColumns: ["id"]
          },
        ]
      }
      productos: {
        Row: {
          activo: boolean | null
          codigo_barras: string | null
          descripcion: string | null
          id: number
          id_categoria: number | null
          id_empresa: number
          imagen_url: string | null
          nombre: string
          precio_compra: number | null
          precio_venta: number | null
          stock: number | null
        }
        Insert: {
          activo?: boolean | null
          codigo_barras?: string | null
          descripcion?: string | null
          id?: number
          id_categoria?: number | null
          id_empresa: number
          imagen_url?: string | null
          nombre: string
          precio_compra?: number | null
          precio_venta?: number | null
          stock?: number | null
        }
        Update: {
          activo?: boolean | null
          codigo_barras?: string | null
          descripcion?: string | null
          id?: number
          id_categoria?: number | null
          id_empresa?: number
          imagen_url?: string | null
          nombre?: string
          precio_compra?: number | null
          precio_venta?: number | null
          stock?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "productos_id_categoria_fkey"
            columns: ["id_categoria"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "productos_id_empresa_fkey"
            columns: ["id_empresa"]
            isOneToOne: false
            referencedRelation: "empresa"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          id: number
          nombre: string
        }
        Insert: {
          id?: number
          nombre: string
        }
        Update: {
          id?: number
          nombre?: string
        }
        Relationships: []
      }
      usuarios: {
        Row: {
          direccion: string | null
          estado: string | null
          fecharegistro: string | null
          id: number
          id_auth: string | null
          id_rol: number
          nombres: string
          telefono: string | null
          usuario: string
        }
        Insert: {
          direccion?: string | null
          estado?: string | null
          fecharegistro?: string | null
          id?: number
          id_auth?: string | null
          id_rol: number
          nombres?: string
          telefono?: string | null
          usuario: string
        }
        Update: {
          direccion?: string | null
          estado?: string | null
          fecharegistro?: string | null
          id?: number
          id_auth?: string | null
          id_rol?: number
          nombres?: string
          telefono?: string | null
          usuario?: string
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_rol_fkey"
            columns: ["id_rol"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      ventas: {
        Row: {
          fecha: string | null
          id: number
          id_cierre_caja: number
          id_usuario: number
          monto_pagado_efectivo: number | null
          monto_pagado_qr: number | null
          monto_total: number | null
        }
        Insert: {
          fecha?: string | null
          id?: number
          id_cierre_caja: number
          id_usuario: number
          monto_pagado_efectivo?: number | null
          monto_pagado_qr?: number | null
          monto_total?: number | null
        }
        Update: {
          fecha?: string | null
          id?: number
          id_cierre_caja?: number
          id_usuario?: number
          monto_pagado_efectivo?: number | null
          monto_pagado_qr?: number | null
          monto_total?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ventas_id_cierre_caja_fkey"
            columns: ["id_cierre_caja"]
            isOneToOne: false
            referencedRelation: "cierrecaja"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "user_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ventas_id_usuario_fkey"
            columns: ["id_usuario"]
            isOneToOne: false
            referencedRelation: "usuarios"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      estadisticas_descuentos: {
        Row: {
          descuento_total_dia: number | null
          fecha: string | null
          porcentaje_promedio: number | null
          ventas_con_descuento: number | null
          ventas_netas_dia: number | null
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          id: number | null
          id_auth: string | null
          id_rol: number | null
          role: string | null
        }
        Relationships: [
          {
            foreignKeyName: "usuarios_id_rol_fkey"
            columns: ["id_rol"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      abrir_caja:
        | {
            Args: {
              _id_caja: number
              _id_usuario_apertura: number
              _monto_apertura: number
            }
            Returns: {
              id_cierre_caja: number
              mensaje: string
            }[]
          }
        | {
            Args: { _id_caja: number; _monto_apertura: number }
            Returns: {
              id: number
              message: string
            }[]
          }
      abrir_caja_simple: {
        Args: { _monto_apertura: number }
        Returns: {
          id_cierre_caja: number
          mensaje: string
        }[]
      }
      actualizar_categoria: {
        Args: { p_color?: string; p_id: number; p_nombre: string }
        Returns: {
          exito: boolean
          mensaje: string
        }[]
      }
      actualizar_stock:
        | {
            Args: {
              _cantidad: number
              _id_producto: number
              _id_usuario: number
              _motivo: string
              _tipo_movimiento: string
            }
            Returns: undefined
          }
        | {
            Args: {
              _cantidad: number
              _id_producto: number
              _id_usuario: number
              _motivo: string
              _talla?: string
              _tipo_movimiento: string
            }
            Returns: undefined
          }
      aplicar_descuento_producto: {
        Args: {
          _cantidad: number
          _descuento: number
          _precio_original: number
        }
        Returns: {
          descuento_unitario: number
          porcentaje_descuento: number
          precio_con_descuento: number
          total_linea: number
        }[]
      }
      calcular_cierre_caja: {
        Args: { p_id_cierre_caja: number }
        Returns: Json
      }
      cerrar_caja:
        | {
            Args: {
              _id_cierre_caja: number
              _id_usuario_cierre: number
              _monto_para_apertura_siguiente: number
              _monto_real_contado_efectivo: number
              _total_gastos_caja_chica: number
            }
            Returns: string
          }
        | {
            Args: {
              _id_cierre_caja: number
              _monto_final_real: number
              _total_efectivo_esperado: number
              _total_gastos_caja_chica?: number
              _total_ventas_calculado: number
            }
            Returns: undefined
          }
      crear_categoria: {
        Args: { p_color?: string; p_nombre: string }
        Returns: {
          categoria_id: number
          mensaje: string
        }[]
      }
      crear_empresa: {
        Args: {
          _direccion_fiscal: string
          _nombre: string
          _simbolo_moneda: string
        }
        Returns: number
      }
      create_app_user: {
        Args: {
          p_direccion: string
          p_email: string
          p_nombres: string
          p_password: string
          p_rol_id: number
          p_telefono: string
        }
        Returns: Json
      }
      create_cajero_user: {
        Args: {
          direccion: string
          email: string
          nombres: string
          password: string
          telefono: string
        }
        Returns: Json
      }
      delete_venta_and_restore_stock: {
        Args: { p_venta_id: number }
        Returns: Json
      }
      eliminar_categoria: {
        Args: { p_id: number }
        Returns: {
          exito: boolean
          mensaje: string
        }[]
      }
      forzar_cierre_caja: { Args: { _id_cierre_caja: number }; Returns: string }
      get_categorias_empresa: {
        Args: never
        Returns: {
          color: string
          id: number
          nombre: string
        }[]
      }
      get_cierre_caja_details: { Args: { p_cierre_id: number }; Returns: Json }
      get_cierre_data_enhanced: {
        Args: { _id_cierre_caja: number }
        Returns: Json
      }
      get_dashboard_stats: {
        Args: { _fecha_fin: string; _fecha_inicio: string }
        Returns: Json
      }
      get_default_caja_id: { Args: never; Returns: number }
      get_detalle_cierre: { Args: { _id_cierre_caja: number }; Returns: Json }
      get_my_company_id: { Args: never; Returns: number }
      get_my_role: { Args: never; Returns: string }
      get_open_cierre_caja: {
        Args: never
        Returns: {
          descripcion_caja: string
          fecha_inicio: string
          id_caja: number
          id_cierre_caja: number
          monto_inicial: number
          usuario_apertura: string
        }[]
      }
      get_sales_history: {
        Args: { _fecha_fin: string; _fecha_inicio: string }
        Returns: {
          cajero: string
          detalles: Json
          fecha: string
          id_venta: number
          monto_efectivo: number
          monto_qr: number
          monto_total: number
          tipo_pago: string
        }[]
      }
      get_sales_history_totals: {
        Args: { _fecha_fin: string; _fecha_inicio: string }
        Returns: {
          total_ganancia: number
          total_vendido: number
          ventas_count: number
        }[]
      }
      get_sales_history_with_discounts: {
        Args: { _fecha_fin: string; _fecha_inicio: string }
        Returns: {
          cajero: string
          detalles: Json
          fecha: string
          id_venta: number
          monto_efectivo: number
          monto_qr: number
          monto_total: number
          tipo_pago: string
        }[]
      }
      get_user_sales_history: {
        Args: { _dias_atras?: number; _id_usuario: number }
        Returns: {
          detalles: Json
          fecha: string
          ganancia_bruta: number
          id_venta: number
          monto_efectivo: number
          monto_qr: number
          monto_total: number
          tipo_pago: string
        }[]
      }
      get_user_sales_history_with_discounts: {
        Args: { _dias_atras?: number; _id_usuario: number }
        Returns: {
          descuento_total: number
          detalles: Json
          fecha: string
          id_venta: number
          monto_efectivo: number
          monto_qr: number
          monto_total: number
          tipo_pago: string
        }[]
      }
      get_user_sales_stats: {
        Args: { _dias_atras?: number; _id_usuario: number }
        Returns: {
          promedio_por_venta: number
          total_ganancia: number
          total_vendido: number
          total_ventas: number
        }[]
      }
      registrar_producto_con_stock_inicial:
        | {
            Args: {
              _cantidad_inicial: number
              _codigo_barras: string
              _id_categoria: number
              _id_empresa: number
              _imagen_url: string
              _nombre: string
              _precio_compra: number
              _precio_venta: number
            }
            Returns: number
          }
        | {
            Args: {
              p_categoria_id: number
              p_codigo_barras: string
              p_imagen_url: string
              p_nombre: string
              p_precio_compra: number
              p_precio_venta: number
              p_stock_inicial?: number
            }
            Returns: {
              id_producto: number
              mensaje: string
            }[]
          }
        | {
            Args: {
              p_categoria_id: number
              p_codigo_barras: string
              p_descripcion: string
              p_imagen_url: string
              p_nombre: string
              p_precio_compra: number
              p_precio_venta: number
              p_stock_inicial: number
            }
            Returns: {
              mensaje: string
              producto_id: number
            }[]
          }
      registrar_venta:
        | {
            Args: {
              _detalles: Json
              _id_cierre_caja: number
              _id_usuario: number
              _monto_efectivo: number
              _monto_qr: number
              _monto_total: number
            }
            Returns: {
              id_venta: number
              mensaje: string
            }[]
          }
        | {
            Args: {
              _detalles: Json
              _id_cierre_caja: number
              _id_usuario: number
              _monto_efectivo: number
              _monto_qr: number
              _monto_total: number
            }
            Returns: {
              id_venta: number
              mensaje: string
            }[]
          }
      return_sale_product: { Args: { p_detalle_id: number }; Returns: Json }
      validar_descuento: {
        Args: { _descuento: number; _precio_original: number }
        Returns: boolean
      }
      verificar_cierre_exitoso: {
        Args: { _id_cierre_caja: number }
        Returns: Json
      }
      verificar_descuadres_inventario: {
        Args: never
        Returns: {
          diferencia: number
          id_producto: number
          nombre: string
          stock_actual: number
        }[]
      }
      verificar_estado_cajas: {
        Args: never
        Returns: {
          descripcion_caja: string
          estado: string
          fecha_cierre: string
          fecha_inicio: string
          id_caja: number
          id_cierre: number
          id_empresa: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
