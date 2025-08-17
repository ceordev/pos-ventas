import { writable, derived } from 'svelte/store';
import { supabase } from '$lib/supabase';

export interface Product {
  id: number;
  nombre: string;
  precio_venta: number;
  precio_compra: number;
  codigo_barras?: string;
  imagen_url?: string;
  id_categoria?: number;
  categoria?: string;
  stock?: number;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
  precio_original: number;
  descuento_aplicado: number;
  porcentaje_descuento: number;
  observacion?: string;
}

export interface Category {
  id: number;
  nombre: string;
  color?: string;
}

export interface CajaAbierta {
  id_cierre_caja: number;
  id_caja: number;
  fecha_inicio: string;
  descripcion_caja: string;
}

// Stores
export const products = writable<Product[]>([]);
export const categories = writable<Category[]>([]);
export const cart = writable<CartItem[]>([]);
export const selectedCategory = writable<number | null>(null);
export const searchTerm = writable<string>('');
export const cajaAbierta = writable<CajaAbierta | null>(null);

// Derived stores
export const filteredProducts = derived(
  [products, selectedCategory, searchTerm],
  ([$products, $selectedCategory, $searchTerm]) => {
    let filtered = $products;

    // Filtrar por categoría
    if ($selectedCategory) {
      filtered = filtered.filter(p => p.id_categoria === $selectedCategory);
    }

    // Filtrar por término de búsqueda
    if ($searchTerm.trim()) {
      const term = $searchTerm.toLowerCase();
      filtered = filtered.filter(p => 
        p.nombre.toLowerCase().includes(term) ||
        (p.codigo_barras && p.codigo_barras.toLowerCase().includes(term))
      );
    }

    return filtered;
  }
);

export const cartTotal = derived(cart, ($cart) => {
  return $cart.reduce((total, item) => total + item.subtotal, 0);
});

export const cartItemCount = derived(cart, ($cart) => {
  return $cart.reduce((total, item) => total + item.quantity, 0);
});

// Actions
class POSService {
  async loadProducts() {
    try {
      const { data, error } = await supabase
        .from('productos')
        .select(`
          id,
          nombre,
          precio_venta,
          precio_compra,
          codigo_barras,
          imagen_url,
          id_categoria,
          categorias(nombre),
          stock(cantidad)
        `);

      if (error) throw error;

      const productsWithStock = data.map(product => ({
        ...product,
        categoria: (product as any).categorias?.nombre,
        stock: (product as any).stock?.[0]?.cantidad || 0
      }));

      products.set(productsWithStock);
    } catch (error) {
      console.error('Error loading products:', error);
    }
  }

  async loadCategories() {
    try {
      const { data, error } = await supabase
        .from('categorias')
        .select('*')
        .order('nombre');

      if (error) throw error;
      categories.set(data || []);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  }

  async checkCajaAbierta() {
    try {
      console.log('Verificando estado de caja abierta...');
      const { data, error } = await supabase.rpc('get_open_cierre_caja');
      
      console.log('Respuesta de get_open_cierre_caja:', { data, error });
      
      if (error) throw error;
      
      if (data && data.length > 0) {
        console.log('Caja abierta encontrada:', data[0]);
        cajaAbierta.set(data[0]);
      } else {
        console.log('No hay caja abierta');
        cajaAbierta.set(null);
      }
    } catch (error) {
      console.error('Error checking caja abierta:', error);
      cajaAbierta.set(null);
    }
  }

  async abrirCaja(montoApertura: number) {
    try {
      // Usar la función simplificada que obtiene automáticamente caja y usuario
      console.log(await supabase.rpc('get_my_company_id'))
      const { data, error } = await supabase.rpc('abrir_caja_simple', {
        _monto_apertura: montoApertura
      });

      if (error) {
        console.error('Error en abrir_caja_simple:', error);
        throw new Error(error.message || 'Error al abrir la caja');
      }
      
      if (data && data.length > 0) {
        const result = data[0];
        if (result.id_cierre_caja) {
          // Recargar estado de caja
          await this.checkCajaAbierta();
          return { success: true, message: result.mensaje };
        } else {
          return { success: false, message: result.mensaje };
        }
      }
      
      return { success: false, message: 'Error desconocido al abrir la caja' };
    } catch (error) {
      console.error('Error opening caja:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Error al abrir la caja' };
    }
  }

  addToCart(product: Product, quantity: number = 1) {
    cart.update(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id);
      
      if (existingItem) {
        existingItem.quantity += quantity;
        existingItem.subtotal = existingItem.quantity * (existingItem.precio_original - existingItem.descuento_aplicado);
      } else {
        currentCart.push({
          product,
          quantity,
          subtotal: quantity * product.precio_venta,
          precio_original: product.precio_venta,
          descuento_aplicado: 0,
          porcentaje_descuento: 0,
          observacion: ''
        });
      }
      
      return currentCart;
    });
  }

  removeFromCart(productId: number) {
    cart.update(currentCart => {
      return currentCart.filter(item => item.product.id !== productId);
    });
  }

  updateCartItemQuantity(productId: number, quantity: number) {
    if (quantity <= 0) {
      this.removeFromCart(productId);
      return;
    }

    cart.update(currentCart => {
      const item = currentCart.find(item => item.product.id === productId);
      if (item) {
        item.quantity = quantity;
        item.subtotal = quantity * (item.precio_original - item.descuento_aplicado);
      }
      return currentCart;
    });
  }

  applyDiscount(productId: number, descuento: number) {
    cart.update(currentCart => {
      const item = currentCart.find(item => item.product.id === productId);
      if (item) {
        // Validar que el descuento no sea mayor al precio original
        const descuentoValidado = Math.min(Math.max(0, descuento), item.precio_original);
        
        item.descuento_aplicado = descuentoValidado;
        item.porcentaje_descuento = item.precio_original > 0 ? 
          Math.round((descuentoValidado * 100) / item.precio_original * 100) / 100 : 0;
        item.subtotal = item.quantity * (item.precio_original - item.descuento_aplicado);
      }
      return currentCart;
    });
  }

  updateCartItemObservation(productId: number, observacion: string) {
    cart.update(currentCart => {
      const item = currentCart.find(item => item.product.id === productId);
      if (item) {
        item.observacion = observacion;
      }
      return currentCart;
    });
  }

  clearCart() {
    cart.set([]);
  }

  async processSale(
    idCierreCaja: number,
    idUsuario: number,
    montoTotal: number,
    montoEfectivo: number,
    montoQR: number,
    cartItems: CartItem[]
  ) {
    try {
      const detalles = cartItems.map(item => ({
        id_producto: item.product.id,
        cantidad: item.quantity,
        precio_venta: item.precio_original - item.descuento_aplicado,
        precio_compra: item.product.precio_compra,
        precio_original: item.precio_original,
        descuento_aplicado: item.descuento_aplicado,
        porcentaje_descuento: item.porcentaje_descuento,
        observacion: item.observacion || null
      }));

      const { data, error } = await supabase.rpc('registrar_venta', {
        _id_cierre_caja: idCierreCaja,
        _id_usuario: idUsuario,
        _monto_total: montoTotal,
        _monto_efectivo: montoEfectivo,
        _monto_qr: montoQR,
        _detalles: detalles
      });

      if (error) {
        console.error('Database error:', error);
        return { success: false, message: error.message || 'Error en la base de datos' };
      }

      // La función ahora retorna una tabla, verificar si hay datos
      if (!data || data.length === 0) {
        return { success: false, message: 'No se recibió respuesta de la base de datos' };
      }

      const result = data[0];
      
      // Verificar si la venta fue exitosa
      if (!result.id_venta) {
        return { success: false, message: result.mensaje || 'Error al procesar la venta' };
      }

      // Limpiar carrito después de venta exitosa
      this.clearCart();
      
      // Recargar productos para actualizar stock
      await this.loadProducts();

      return { success: true, ventaId: result.id_venta, message: result.mensaje };
    } catch (error) {
      console.error('Error processing sale:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Error desconocido' };
    }
  }

  async cerrarCaja(
    idCierreCaja: number,
    idUsuarioCierre: number,
    montoRealContadoEfectivo: number,
    totalGastosCajaChica: number = 0,
    montoParaAperturaSiguiente: number = 0
  ) {
    try {
      console.log('Cerrando caja con parámetros:', {
        idCierreCaja,
        idUsuarioCierre,
        montoRealContadoEfectivo,
        totalGastosCajaChica,
        montoParaAperturaSiguiente
      });

      const { data, error } = await supabase.rpc('cerrar_caja', {
        _id_cierre_caja: idCierreCaja,
        _id_usuario_cierre: idUsuarioCierre,
        _monto_real_contado_efectivo: montoRealContadoEfectivo,
        _total_gastos_caja_chica: totalGastosCajaChica,
        _monto_para_apertura_siguiente: montoParaAperturaSiguiente
      });

      console.log('Respuesta de cerrar_caja:', { data, error });

      if (error) {
        console.error('Error cerrando caja:', error);
        throw new Error(error.message || 'Error al cerrar la caja');
      }

      // Verificar que la respuesta indique éxito
      if (data && typeof data === 'string' && data.includes('Error:')) {
        throw new Error(data);
      }

      // Forzar actualización del estado de caja
      console.log('Actualizando estado de caja...');
      await this.checkCajaAbierta();
      
      console.log('Caja cerrada exitosamente');
      return { success: true, message: data || 'Caja cerrada exitosamente' };
    } catch (error) {
      console.error('Error closing caja:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Error al cerrar la caja' };
    }
  }

  async obtenerDatosCierre(idCierreCaja: number) {
    try {
      // Obtener ventas del cierre actual
      const { data: ventasData, error: ventasError } = await supabase
        .from('ventas')
        .select('id, monto_total, monto_pagado_efectivo, monto_pagado_qr')
        .eq('id_cierre_caja', idCierreCaja);

      if (ventasError) throw ventasError;

      // Calcular totales de ventas
      const totalVentas = ventasData?.reduce((sum, venta) => sum + venta.monto_total, 0) || 0;
      const ventasEfectivo = ventasData?.reduce((sum, venta) => sum + venta.monto_pagado_efectivo, 0) || 0;
      const ventasQR = ventasData?.reduce((sum, venta) => sum + venta.monto_pagado_qr, 0) || 0;

      // Obtener detalles de venta para calcular ganancia bruta
      let gananciaBruta = 0;
      if (ventasData && ventasData.length > 0) {
        const ventaIds = ventasData.map(v => v.id);
        const { data: detallesData, error: detallesError } = await supabase
          .from('detalle_venta')
          .select('total, cantidad, precio_compra_unitario')
          .in('id_venta', ventaIds);

        if (detallesError) throw detallesError;

        gananciaBruta = detallesData?.reduce((sum, detalle) => {
          const costoTotal = detalle.cantidad * detalle.precio_compra_unitario;
          return sum + (detalle.total - costoTotal);
        }, 0) || 0;
      }

      // Obtener datos del cierre
      const { data: cierreData, error: cierreError } = await supabase
        .from('cierrecaja')
        .select('monto_apertura_inicial')
        .eq('id', idCierreCaja)
        .single();

      if (cierreError) throw cierreError;

      // Calcular distribución de ganancias (70% empresa, 30% cajero)
      const porcentajeEmpresa = 70;
      const porcentajeCajero = 30;
      const gananciaEmpresa = (gananciaBruta * porcentajeEmpresa) / 100;
      const gananciaCajero = (gananciaBruta * porcentajeCajero) / 100;

      return {
        success: true,
        data: {
          monto_inicial: cierreData.monto_apertura_inicial || 0,
          total_ventas: totalVentas,
          ventas_efectivo: ventasEfectivo,
          ventas_qr: ventasQR,
          monto_esperado: (cierreData.monto_apertura_inicial || 0) + ventasEfectivo,
          ganancia_bruta: gananciaBruta,
          porcentaje_empresa: porcentajeEmpresa,
          porcentaje_cajero: porcentajeCajero,
          ganancia_empresa: gananciaEmpresa,
          ganancia_cajero: gananciaCajero
        }
      };
    } catch (error: any) {
      console.error('Error obteniendo datos del cierre:', error);
      return { success: false, message: error.message || 'Error al obtener datos del cierre' };
    }
  }

  async cerrarCajaSimple(montoFinalEfectivo: number, gastosAdicionales: number = 0) {
    try {
      // Obtener información de la caja abierta actual
      const { data: cajaData, error: cajaError } = await supabase.rpc('get_open_cierre_caja');
      
      if (cajaError) {
        throw new Error(cajaError.message || 'Error al obtener información de la caja');
      }
      
      if (!cajaData || cajaData.length === 0) {
        throw new Error('No hay una caja abierta actualmente');
      }
      
      const cajaAbierta = cajaData[0];
      
      // Obtener información del usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      
      if (userError || !user) {
        throw new Error('Error al obtener información del usuario');
      }
      
      // Obtener el ID del usuario en la base de datos
      const { data: userData, error: userDataError } = await supabase
        .from('usuarios')  // ✅ Cambiar de 'usuario' a 'usuarios'
        .select('id')
        .eq('id_auth', user.id)
        .single();
      
      if (userDataError || !userData) {
        throw new Error('Error al obtener el ID del usuario');
      }
      
      // Llamar a la función de cerrar caja con los parámetros obtenidos
      return await this.cerrarCaja(
        cajaAbierta.id_cierre_caja,
        userData.id,
        montoFinalEfectivo,
        gastosAdicionales, // ✅ Usar el parámetro en lugar de 0
        0  // monto para apertura siguiente por defecto
      );
    } catch (error) {
      console.error('Error in cerrarCajaSimple:', error);
      return { success: false, message: error instanceof Error ? error.message : 'Error al cerrar la caja' };
    }
  }
}

export const posService = new POSService();