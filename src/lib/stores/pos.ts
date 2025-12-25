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
export const totalProducts = writable<number>(0);
export const currentPage = writable<number>(1);
export const isLoadingProducts = writable<boolean>(false);

// Derived stores
// Deprecated: Now just returns products as they are already filtered by server
export const filteredProducts = derived(products, ($products) => $products);

export const cartTotal = derived(cart, ($cart) => {
    return $cart.reduce((total, item) => total + item.subtotal, 0);
});

export const cartItemCount = derived(cart, ($cart) => {
    return $cart.reduce((total, item) => total + item.quantity, 0);
});

// Actions
class POSService {
    private PAGE_SIZE = 10;

    async searchProducts(term: string = '', categoryId: number | null = null, page: number = 1, append: boolean = false) {
        isLoadingProducts.set(true);
        try {
            let query = supabase
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
          stock
        `, { count: 'exact' })
                .eq('activo', true);

            // Apply filters
            if (categoryId) {
                query = query.eq('id_categoria', categoryId);
            }

            if (term.trim()) {
                const searchTerm = `%${term.trim()}%`;
                // Search in nombre OR codigo_barras
                query = query.or(`nombre.ilike.${searchTerm},codigo_barras.ilike.${searchTerm}`);
            }

            // Pagination
            const from = (page - 1) * this.PAGE_SIZE;
            const to = from + this.PAGE_SIZE - 1;

            query = query.range(from, to).order('nombre');

            const { data, error, count } = await query;

            if (error) throw error;

            const productsWithStock = data?.map(product => ({
                ...product,
                categoria: (product as any).categorias?.nombre,
                // Stock is now a direct property, no mapping needed
                stock: product.stock || 0
            })) || [];

            if (append) {
                products.update(current => [...current, ...productsWithStock]);
            } else {
                products.set(productsWithStock);
            }

            totalProducts.set(count || 0);
            currentPage.set(page);

        } catch (error) {
            console.error('Error searching products:', error);
            products.set([]);
        } finally {
            isLoadingProducts.set(false);
        }
    }

    // Legacy method wrapper for backward compatibility if needed,
    // but we should prefer using searchProducts directly
    async loadProducts() {
        return this.searchProducts();
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
            const { data, error } = await supabase.rpc('get_open_cierre_caja');


            if (error) throw error;

            if (data && data.length > 0) {
                cajaAbierta.set(data[0]);
            } else {
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
        isLoadingProducts.set(true); // Reusamos el loading state o creamos uno nuevo si necesario
        try {
            const { data, error } = await supabase.rpc('get_cierre_caja_details', {
                p_cierre_id: idCierreCaja
            });

            if (error) throw error;

            // El RPC retorna { success: boolean, data: ... }
            const result = data as any; // Type casting para data json

            if (!result.success) {
                throw new Error(result.message);
            }

            return {
                success: true,
                data: result.data
            };

        } catch (error: any) {
            console.error('Error obteniendo datos del cierre (RPC):', error);
            return { success: false, message: error.message || 'Error al obtener datos del cierre' };
        } finally {
            isLoadingProducts.set(false);
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