const fs = require('fs');

const path = 'src/routes/pos/+page.svelte';
let content = fs.readFileSync(path, 'utf8');

// I need to cleanly replace the broken section with the correct one.
// Let's just restore the file from the last known good state or rewrite the cart section.

const fixedCartItem = `
                    <button
                      class="text-danger-600 hover:text-danger-700 ml-2"
                      on:click={() => removeFromCart(item.cartItemId)}
                    >
                      <X class="h-4 w-4" />
                    </button>
                  </div>
                  
                  <div class="flex flex-col space-y-3 mt-2">
                    <div class="flex items-center justify-between">
                      <div class="flex items-center space-x-2">
                        <button
                          class="w-7 h-7 rounded-full flex-shrink-0 bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          on:click={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        >
                          <Minus class="h-3 w-3" />
                        </button>
                        
                        <input 
                          type="number"
                          min="1"
                          max={item.product.stock || 1}
                          value={item.quantity}
                          on:change={(e) => {
                             const target = e.target as HTMLInputElement;
                             let newQty = parseInt(target.value);
                             if (isNaN(newQty) || newQty < 1) newQty = 1;
                             const maxStock = item.product.stock || 1;
                             if (newQty > maxStock) newQty = maxStock;
                             target.value = newQty.toString();
                             updateQuantity(item.cartItemId, newQty);
                          }}
                          class="w-12 text-center text-sm font-medium border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-primary-500 py-1"
                        />
                        
                        <button
                          class="w-7 h-7 rounded-full flex-shrink-0 bg-gray-200 hover:bg-gray-300 flex items-center justify-center"
                          on:click={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                          disabled={item.quantity >= (item.product.stock || 0)}
                        >
                          <Plus class="h-3 w-3" />
                        </button>
                        
                        <button
                          class="ml-2 p-1 text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded"
                          on:click={() => openDiscountModal(item)}
                          title="Aplicar descuento"
                        >
                          <Tag class="h-4 w-4" />
                        </button>
                      </div>
                      
                      <div class="text-right">
                        <p class="font-bold text-sm">{item.subtotal.toFixed(2)}</p>
                        {#if item.descuento_aplicado > 0}
                          <p class="text-xs text-green-600">Ahorras: {(item.descuento_aplicado * item.quantity).toFixed(2)}</p>
                        {/if}
                      </div>
                    </div>
                    
                    <!-- Campo de observación -->
                    <div class="w-full">
                      <input
                        type="text"
                        placeholder="Observación (ej: talla 6, color azul)"
                        value={item.observacion || ''}
                        on:input={(e) => {
                          const target = e.target as HTMLInputElement;
                          if (target) {
                            posService.updateCartItemObservation(item.cartItemId, target.value);
                          }
                        }}
                        class="w-full text-xs px-3 py-2 bg-white border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary-500 focus:border-primary-500 transition-colors placeholder-gray-400"
                        maxlength="100"
                      />
                    </div>
                  </div>
                </div>
              {/each}
            </div>
          {/if}
        </div>

        <!-- Footer del carrito -->
        {#if $cart.length > 0}
          <div class="p-4 border-t bg-gray-50">
            <div class="flex justify-between items-center mb-4">
              <span class="text-lg font-semibold">Total:</span>
              <span class="text-2xl font-bold text-primary-600">{$cartTotal.toFixed(2)}</span>
            </div>
            
            <button
              class="btn-success w-full py-3 text-lg font-medium"
              on:click={openPagoModal}
            >
              <CreditCard class="h-5 w-5 mr-2" />
              {#if !$cajaAbierta}
                Abrir Caja y Cobrar
              {:else}
                Cobrar
              {/if}
            </button>
          </div>
        {/if}
      </div>
    </div>
  </div>`;

// Check what the file looks like right now
// I will use regex to replace everything from "Precio: {item.precio_original.toFixed(2)} c/u" to the end of that block.
let regex = /<p>Precio: \{item\.precio_original\.toFixed\(2\)\} c\/u<\/p>\s*\{\/if\}\s*<\/div>\s*<\/div>(.|\n)*?<button(.|\n)*?<CreditCard class="h-5 w-5 mr-2" \/>(.|\n)*?<\/div>\s*\{\/if\}\s*<\/div>\s*<\/div>\s*<\/div>/m;

// Actually I know the exact start and end.
const matchStart = "<p>Precio: {item.precio_original.toFixed(2)} c/u</p>\n                        {/if}\n                      </div>\n                    </div>";
const matchEnd = "</div>\n    </div>\n  </div>";

let startIndex = content.indexOf(matchStart);
if (startIndex !== -1) {
    let endIndex = content.indexOf(matchEnd, startIndex);
    if (endIndex !== -1) {
        let replaceWith = matchStart + "\\n" + fixedCartItem;
        content = content.substring(0, startIndex) + replaceWith + "\\n  <!-- Modales -->\\n" + content.substring(content.indexOf("<!-- Modales -->"));
        fs.writeFileSync(path, content, 'utf8');
        console.log('Fixed successfully');
    }
}
`;
