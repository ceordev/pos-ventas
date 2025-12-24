export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface Database {
    public: {
        Tables: {
            caja: {
                Row: {
                    descripcion: string
                    estado: string
                    fecha_creacion: string | null
                    id: number
                    id_empresa: number
                    id_sucursal: number | null
                    monto_actual: number | null
                }
                Insert: {
                    descripcion: string
                    estado?: string
                    fecha_creacion?: string | null
                    id?: number
                    id_empresa: number
                    id_sucursal?: number | null
                    monto_actual?: number | null
                }
                Update: {
                    descripcion?: string
                    estado?: string
                    fecha_creacion?: string | null
                    id?: number
                    id_empresa?: number
                    id_sucursal?: number | null
                    monto_actual?: number | null
                }
                Relationships: [
                    {
                        foreignKeyName: "caja_id_empresa_fkey"
                        columns: ["id_empresa"]
                        isOneToOne: false
                        referencedRelation: "empresa"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "caja_id_sucursal_fkey"
                        columns: ["id_sucursal"]
                        isOneToOne: false
                        referencedRelation: "sucursales"
                        referencedColumns: ["id"]
                    }
                ]
            }
            categorias: {
                Row: {
                    color: string | null
                    estado: string | null
                    fecha_creacion: string | null
                    id: number
                    id_empresa: number
                    nombre: string
                }
                Insert: {
                    color?: string | null
                    estado?: string | null
                    fecha_creacion?: string | null
                    id?: number
                    id_empresa: number
                    nombre: string
                }
                Update: {
                    color?: string | null
                    estado?: string | null
                    fecha_creacion?: string | null
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
                    }
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
                    monto_apertura_inicial: number
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
                    monto_apertura_inicial: number
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
                    monto_apertura_inicial?: number
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
                        referencedRelation: "usuarios"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "cierrecaja_id_usuario_cierre_fkey"
                        columns: ["id_usuario_cierre"]
                        isOneToOne: false
                        referencedRelation: "usuarios"
                        referencedColumns: ["id"]
                    }
                ]
            }
            detalle_venta: {
                Row: {
                    cantidad: number
                    descuento_aplicado: number | null
                    id: number
                    id_producto: number
                    id_venta: number
                    observacion: string | null
                    porcentaje_descuento: number | null
                    precio_compra_unitario: number
                    precio_original: number | null
                    precio_venta_unitario: number
                    total: number
                }
                Insert: {
                    cantidad: number
                    descuento_aplicado?: number | null
                    id?: number
                    id_producto: number
                    id_venta: number
                    observacion?: string | null
                    porcentaje_descuento?: number | null
                    precio_compra_unitario: number
                    precio_original?: number | null
                    precio_venta_unitario: number
                    total: number
                }
                Update: {
                    cantidad?: number
                    descuento_aplicado?: number | null
                    id?: number
                    id_producto?: number
                    id_venta?: number
                    observacion?: string | null
                    porcentaje_descuento?: number | null
                    precio_compra_unitario?: number
                    precio_original?: number | null
                    precio_venta_unitario?: number
                    total?: number
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
                    }
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
                    activo: boolean | null
                    descripcion: string | null
                    id: number
                    nombre: string
                }
                Insert: {
                    activo?: boolean | null
                    descripcion?: string | null
                    id?: number
                    nombre: string
                }
                Update: {
                    activo?: boolean | null
                    descripcion?: string | null
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
                        referencedRelation: "usuarios"
                        referencedColumns: ["id"]
                    }
                ]
            }
            productos: {
                Row: {
                    codigo_barras: string | null
                    descripcion: string | null
                    estado: string | null
                    fecha_creacion: string | null
                    id: number
                    id_categoria: number | null
                    id_empresa: number
                    imagen_url: string | null
                    nombre: string
                    precio_compra: number | null
                    precio_venta: number
                    stock: number
                }
                Insert: {
                    codigo_barras?: string | null
                    descripcion?: string | null
                    estado?: string | null
                    fecha_creacion?: string | null
                    id?: number
                    id_categoria?: number | null
                    id_empresa: number
                    imagen_url?: string | null
                    nombre: string
                    precio_compra?: number | null
                    precio_venta: number
                    stock?: number
                }
                Update: {
                    codigo_barras?: string | null
                    descripcion?: string | null
                    estado?: string | null
                    fecha_creacion?: string | null
                    id?: number
                    id_categoria?: number | null
                    id_empresa?: number
                    imagen_url?: string | null
                    nombre?: string
                    precio_compra?: number | null
                    precio_venta?: number
                    stock?: number
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
                    }
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

            sucursales: {
                Row: {
                    direccion: string | null
                    estado: string | null
                    id: number
                    id_empresa: number
                    nombre: string
                    telefono: string | null
                }
                Insert: {
                    direccion?: string | null
                    estado?: string | null
                    id?: number
                    id_empresa: number
                    nombre: string
                    telefono?: string | null
                }
                Update: {
                    direccion?: string | null
                    estado?: string | null
                    id?: number
                    id_empresa?: number
                    nombre?: string
                    telefono?: string | null
                }
                Relationships: [
                    {
                        foreignKeyName: "sucursales_id_empresa_fkey"
                        columns: ["id_empresa"]
                        isOneToOne: false
                        referencedRelation: "empresa"
                        referencedColumns: ["id"]
                    }
                ]
            }
            usuarios: {
                Row: {
                    direccion: string | null
                    estado: string | null
                    fecharegistro: string | null
                    id: number
                    id_auth: string
                    id_empresa: number | null
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
                    id_auth: string
                    id_empresa?: number | null
                    id_rol: number
                    nombres: string
                    telefono?: string | null
                    usuario: string
                }
                Update: {
                    direccion?: string | null
                    estado?: string | null
                    fecharegistro?: string | null
                    id?: number
                    id_auth?: string
                    id_empresa?: number | null
                    id_rol?: number
                    nombres?: string
                    telefono?: string | null
                    usuario?: string
                }
                Relationships: [
                    {
                        foreignKeyName: "usuarios_id_empresa_fkey"
                        columns: ["id_empresa"]
                        isOneToOne: false
                        referencedRelation: "empresa"
                        referencedColumns: ["id"]
                    },
                    {
                        foreignKeyName: "usuarios_id_rol_fkey"
                        columns: ["id_rol"]
                        isOneToOne: false
                        referencedRelation: "roles"
                        referencedColumns: ["id"]
                    }
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
                    monto_total: number
                }
                Insert: {
                    fecha?: string | null
                    id?: number
                    id_cierre_caja: number
                    id_usuario: number
                    monto_pagado_efectivo?: number | null
                    monto_pagado_qr?: number | null
                    monto_total: number
                }
                Update: {
                    fecha?: string | null
                    id?: number
                    id_cierre_caja?: number
                    id_usuario?: number
                    monto_pagado_efectivo?: number | null
                    monto_pagado_qr?: number | null
                    monto_total?: number
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
                        referencedRelation: "usuarios"
                        referencedColumns: ["id"]
                    }
                ]
            }
            movimientos_inventario: {
                Row: {
                    id: number
                    id_producto: number
                    id_usuario: number | null
                    tipo_movimiento: string
                    cantidad: number
                    stock_anterior: number
                    stock_nuevo: number
                    motivo: string | null
                    fecha: string | null
                }
                Insert: {
                    id?: number
                    id_producto: number
                    id_usuario?: number | null
                    tipo_movimiento: string
                    cantidad: number
                    stock_anterior: number
                    stock_nuevo: number
                    motivo?: string | null
                    fecha?: string | null
                }
                Update: {
                    id?: number
                    id_producto?: number
                    id_usuario?: number | null
                    tipo_movimiento?: string
                    cantidad?: number
                    stock_anterior?: number
                    stock_nuevo?: number
                    motivo?: string | null
                    fecha?: string | null
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
                        referencedRelation: "usuarios"
                        referencedColumns: ["id"]
                    }
                ]
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            actualizar_stock: {
                Args: {
                    _id_producto: number
                    _cantidad: number
                    _tipo_movimiento: string
                    _motivo: string
                    _id_usuario: number
                }
                Returns: undefined
            }
            delete_venta_and_restore_stock: {
                Args: {
                    p_venta_id: number
                }
                Returns: Json
            }
            abrir_caja: {
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
            abrir_caja_simple: {
                Args: {
                    _monto_apertura: number
                }
                Returns: {
                    id_cierre_caja: number
                    mensaje: string
                }[]
            }
            cerrar_caja: {
                Args: {
                    _id_cierre_caja: number
                    _id_usuario_cierre: number
                    _monto_real_contado_efectivo: number
                    _total_gastos_caja_chica: number
                    _monto_para_apertura_siguiente: number
                }
                Returns: string
            }
            create_cajero_user: {
                Args: {
                    nombres: string
                    email: string
                    password: string
                    direccion: string
                    telefono: string
                }
                Returns: Json
            }

            get_dashboard_stats: {
                Args: {
                    _fecha_inicio: string
                    _fecha_fin: string
                }
                Returns: Json
            }
            get_cierre_caja_details: {
                Args: {
                    p_cierre_id: number
                }
                Returns: Json
            }
            get_open_cierre_caja: {
                Args: Record<PropertyKey, never>
                Returns: {
                    id_cierre_caja: number
                    id_caja: number
                    fecha_inicio: string
                    descripcion_caja: string
                }[]
            }
            get_sales_history: {
                Args: {
                    _fecha_inicio: string
                    _fecha_fin: string
                }
                Returns: {
                    id_venta: number
                    fecha: string
                    cajero: string
                    monto_total: number
                    tipo_pago: string
                    monto_efectivo: number
                    monto_qr: number
                    detalles: Json
                }[]
            }
            get_sales_history_totals: {
                Args: {
                    _fecha_inicio: string
                    _fecha_fin: string
                }
                Returns: {
                    total_vendido: number
                    total_ganancia: number
                    ventas_count: number
                }[]
            }
            get_user_sales_history_with_discounts: {
                Args: {
                    _id_usuario: number
                    _dias_atras: number
                }
                Returns: {
                    id_venta: number
                    fecha: string
                    monto_total: number
                    monto_efectivo: number
                    monto_qr: number
                    tipo_pago: string
                    descuento_total: number
                    detalles: Json
                }[]
            }
            registrar_producto_con_stock_inicial: {
                Args: {
                    p_nombre: string
                    p_descripcion: string
                    p_codigo_barras: string
                    p_precio_compra: number
                    p_precio_venta: number
                    p_categoria_id: number
                    p_imagen_url: string
                    p_stock_inicial: number
                }
                Returns: {
                    producto_id: number
                    mensaje: string
                }[]
            }
            registrar_venta: {
                Args: {
                    _id_cierre_caja: number
                    _id_usuario: number
                    _monto_total: number
                    _monto_efectivo: number
                    _monto_qr: number
                    _detalles: Json
                }
                Returns: {
                    id_venta: number
                    mensaje: string
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
