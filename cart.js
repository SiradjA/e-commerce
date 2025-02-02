// Cart functionality
class ShoppingCart {
    constructor() {
        this.items = JSON.parse(localStorage.getItem('cartItems')) || [];
        this.discounts = {
            'WELCOME10': { type: 'percentage', value: 10 },
            'FREESHIP': { type: 'shipping', value: 'free' },
            'SAVE500': { type: 'fixed', value: 500 }
        };
        this.appliedDiscount = null;
        this.isLoading = false;
        this.init();
    }

    init() {
        console.log('Initializing cart...');
        this.updateCartCount();
        this.setupEventListeners();
        this.renderCart();
        this.setupQuantityValidation();
        this.setupAutoSave();
        
        // Add debug logging
        console.log('Cart initialized with items:', this.items);
    }

    setupAutoSave() {
        // Auto-save cart when window is closed
        window.addEventListener('beforeunload', () => {
            this.saveCart();
        });
    }

    setupQuantityValidation() {
        document.addEventListener('input', (e) => {
            if (e.target.matches('.item-quantity input')) {
                const value = e.target.value;
                if (value === '') return; // Allow empty for typing
                
                const numValue = parseInt(value);
                if (isNaN(numValue) || numValue < 1) {
                    e.target.value = 1;
                } else if (numValue > 10) {
                    e.target.value = 10;
                    this.showNotification('Maximum quantity is 10', 'warning');
                }
            }
        });
    }

    setupEventListeners() {
        // Quantity controls
        document.addEventListener('click', (e) => {
            const qtyBtn = e.target.closest('.qty-btn');
            if (qtyBtn) {
                const input = qtyBtn.parentElement.querySelector('input');
                const itemCard = qtyBtn.closest('.cart-item-card');
                const itemId = itemCard?.dataset.itemId;
                
                // Get current value
                let currentValue = parseInt(input.value) || 1;
                let newValue;

                if (qtyBtn.querySelector('.icon-plus')) {
                    newValue = Math.min(currentValue + 1, 10);
                    if (newValue === 10) {
                        this.showNotification('Maximum quantity is 10', 'warning');
                    }
                } else {
                    newValue = Math.max(currentValue - 1, 1);
                    if (newValue === 1) {
                        this.showNotification('Minimum quantity is 1', 'warning');
                    }
                }

                // Only update if value has changed
                if (newValue !== currentValue) {
                    input.value = newValue;
                    if (itemId) {
                        this.updateItemQuantity(itemId, newValue);
                        // Show feedback
                        const priceEl = itemCard.querySelector('.price-tag');
                        const itemPrice = parseFloat(this.items.find(item => item.id === itemId).price);
                        priceEl.textContent = `${(itemPrice * newValue).toLocaleString()} DA`;
                        
                        // Add visual feedback
                        priceEl.classList.add('price-updated');
                        setTimeout(() => priceEl.classList.remove('price-updated'), 300);
                    }
                }

                // Add click feedback
                qtyBtn.classList.add('clicked');
                setTimeout(() => qtyBtn.classList.remove('clicked'), 150);
            }
        });

        // Direct input of quantity
        document.addEventListener('change', (e) => {
            if (e.target.matches('.quantity-controls input')) {
                const input = e.target;
                const itemCard = input.closest('.cart-item-card');
                const itemId = itemCard?.dataset.itemId;
                
                let value = parseInt(input.value) || 1;
                value = Math.max(1, Math.min(value, 10));
                input.value = value;
                
                if (itemId) {
                    this.updateItemQuantity(itemId, value);
                    // Update price display
                    const priceEl = itemCard.querySelector('.price-tag');
                    const itemPrice = parseFloat(this.items.find(item => item.id === itemId).price);
                    priceEl.textContent = `${(itemPrice * value).toLocaleString()} DA`;
                }
            }
        });

        // Remove buttons
        document.addEventListener('click', (e) => {
            const removeBtn = e.target.closest('.remove-btn');
            if (removeBtn) {
                const itemCard = removeBtn.closest('.cart-item-card');
                const itemId = itemCard?.dataset.itemId;
                if (itemId) this.removeItem(itemId);
            }
        });

        // Edit design buttons
        document.addEventListener('click', (e) => {
            const editBtn = e.target.closest('.edit-btn');
            if (editBtn) {
                const itemCard = editBtn.closest('.cart-item-card');
                const itemId = itemCard?.dataset.itemId;
                if (itemId) {
                    window.location.href = `design-lab.html?edit=${itemId}`;
                }
            }
        });

        // Promo code
        const applyBtn = document.querySelector('.apply-btn');
        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                const promoInput = document.querySelector('.promo-input input');
                this.applyPromoCode(promoInput.value);
            });
        }

        // Checkout button
        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', () => {
                this.proceedToCheckout();
            });
        }

        // Add to cart buttons (for product pages)
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const productCard = e.target.closest('.product-card');
                if (productCard) {
                    const product = {
                        id: productCard.dataset.productId,
                        name: productCard.querySelector('h3').textContent,
                        price: productCard.querySelector('.price').dataset.price,
                        image: productCard.querySelector('img').src,
                        size: productCard.querySelector('.size.selected')?.textContent || 'M'
                    };
                    this.addItem(product);
                    this.showNotification('Item added to cart successfully!');
                }
            });
        });

        // Design Lab Add to Cart
        const designLabAddToCart = document.querySelector('#addToCart');
        if (designLabAddToCart) {
            designLabAddToCart.addEventListener('click', () => {
                const productPreview = document.querySelector('#productPreview');
                const selectedSize = document.querySelector('.size-btn.active')?.dataset.size || 'M';
                
                const product = {
                    id: 'design-' + Date.now(), // Unique ID for custom design
                    name: 'Custom Design Product',
                    price: '5000', // Base price for custom design
                    image: productPreview.src,
                    size: selectedSize,
                    isCustomDesign: true,
                    designData: window.canvas ? window.canvas.toJSON() : null // Save design data if available
                };

                this.addItem(product);
                this.showNotification('Custom design added to cart successfully!');
            });
        }
    }

    addItem(product) {
        // For custom designs, always add as new item
        if (product.isCustomDesign) {
            this.items.push({
                ...product,
                quantity: 1
            });
        } else {
            const existingItem = this.items.find(item => 
                item.id === product.id && item.size === product.size
            );

            if (existingItem) {
                existingItem.quantity = Math.min(existingItem.quantity + 1, 10);
            } else {
                this.items.push({
                    ...product,
                    quantity: 1
                });
            }
        }

        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }

    removeItem(itemId) {
        this.items = this.items.filter(item => item.id !== itemId);
        this.saveCart();
        this.updateCartCount();
        this.renderCart();
    }

    updateItemQuantity(itemId, quantity) {
        const item = this.items.find(item => item.id === itemId);
        if (item) {
            item.quantity = quantity;
            this.saveCart();
            this.updateCartCount();
            this.updateTotals();
        }
    }

    saveCart() {
        localStorage.setItem('cartItems', JSON.stringify(this.items));
    }

    updateCartCount() {
        const count = this.items.reduce((total, item) => total + item.quantity, 0);
        document.querySelectorAll('.cart-badge').forEach(badge => {
            badge.textContent = count;
        });
        
        // Update cart page header if we're on the cart page
        const itemCount = document.querySelector('.item-count');
        if (itemCount) {
            itemCount.textContent = `(${count} ${count === 1 ? 'item' : 'items'})`;
        }
    }

    updateTotals() {
        const subtotal = this.items.reduce((total, item) => 
            total + (parseFloat(item.price) * item.quantity), 0
        );
        const shipping = subtotal > 0 ? 500 : 0; // 500 DA shipping
        const total = subtotal + shipping;

        // Update summary section if we're on the cart page
        const summaryContent = document.querySelector('.summary-content');
        if (summaryContent) {
            summaryContent.querySelector('.summary-row:first-child span:last-child')
                .textContent = `${subtotal.toLocaleString()} DA`;
            summaryContent.querySelector('.summary-total span:last-child')
                .textContent = `${total.toLocaleString()} DA`;
        }
    }

    renderCart() {
        const cartItemsSection = document.querySelector('.cart-items-section');
        if (!cartItemsSection) return;

        if (this.items.length === 0) {
            cartItemsSection.innerHTML = `
                <div class="empty-cart">
                    <span class="icon-cart icon-xl"></span>
                    <h2>Your cart is empty</h2>
                    <p>Looks like you haven't added any items to your cart yet.</p>
                    <a href="products.html" class="continue-shopping">
                        <span class="icon-arrow-left"></span>
                        Continue Shopping
                    </a>
                </div>
            `;
        } else {
            cartItemsSection.innerHTML = this.items.map(item => `
                <div class="cart-item-card" data-item-id="${item.id}">
                    <div class="item-image">
                        <img src="${item.image}" alt="${item.name}" />
                    </div>
                    <div class="item-content">
                        <div class="item-info">
                            <h3>${item.isCustomDesign ? 'Custom Design Product' : item.name}</h3>
                            <p class="item-details">Size: ${item.size}${item.isCustomDesign ? ' • Custom Design' : ''}</p>
                            <div class="price-tag">${parseFloat(item.price).toLocaleString()} DA</div>
                        </div>
                        <div class="item-actions">
                            <div class="quantity-controls">
                                <button class="qty-btn" aria-label="Decrease quantity">
                                    <span class="icon-minus"></span>
                                </button>
                                <input type="number" value="${item.quantity}" min="1" max="10" aria-label="Quantity" />
                                <button class="qty-btn" aria-label="Increase quantity">
                                    <span class="icon-plus"></span>
                                </button>
                            </div>
                            <div class="action-buttons">
                                ${item.isCustomDesign ? `
                                    <button class="edit-btn">
                                        <span class="icon-palette"></span>
                                        Edit Design
                                    </button>
                                ` : ''}
                                <button class="remove-btn">
                                    <span class="icon-trash"></span>
                                    Remove
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            `).join('') + `
                <a href="products.html" class="continue-shopping">
                    <span class="icon-arrow-left"></span>
                    Continue Shopping
                </a>
            `;
        }

        this.updateTotals();
        this.setupEventListeners();
    }

    showNotification(message, type = 'success') {
        const notification = document.querySelector('.notification');
        if (notification) {
            notification.textContent = message;
            notification.className = `notification ${type}`;
            notification.classList.add('show');
            
            setTimeout(() => {
                notification.classList.remove('show');
            }, 3000);
        }
    }

    applyPromoCode(code) {
        // Example promo code logic
        if (code.toUpperCase() === 'WELCOME10') {
            this.showNotification('Promo code applied successfully!');
            // Apply 10% discount logic here
        } else {
            this.showNotification('Invalid promo code', 'error');
        }
    }

    proceedToCheckout() {
        if (this.items.length === 0) {
            this.showNotification('Your cart is empty', 'error');
            return;
        }
        // Implement checkout logic or redirect to checkout page
        window.location.href = 'checkout.html';
    }
}

// Initialize cart when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('Initializing cart...');
    window.cart = new ShoppingCart();
}); 