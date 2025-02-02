// Design Lab Functionality
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Fabric.js canvas
    const canvasElement = document.createElement('canvas');
    canvasElement.id = 'designCanvas';
    document.getElementById('designOverlay').appendChild(canvasElement);
    const canvas = new fabric.Canvas('designCanvas', {
        width: 300,
        height: 400,
        backgroundColor: 'transparent'
    });

    // Tool Selection
    const toolButtons = document.querySelectorAll('.tool-btn');
    toolButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tool = btn.dataset.tool;
            activateTool(tool);
        });
    });

    // Text Tool
    document.querySelector('[data-tool="text"]').addEventListener('click', function() {
        const text = new fabric.IText('Enter text...', {
            left: 50,
            top: 50,
            fontFamily: 'Arial',
            fontSize: 24,
            fill: '#000000'
        });
        canvas.add(text);
        canvas.setActiveObject(text);
        updateLayersList();
    });

    // Text Properties
    const textInput = document.querySelector('.text-input');
    textInput.addEventListener('input', function() {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set('text', this.value);
            canvas.renderAll();
        }
    });

    const fontFamily = document.querySelector('.font-family');
    fontFamily.addEventListener('change', function() {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set('fontFamily', this.value);
            canvas.renderAll();
        }
    });

    const fontSize = document.querySelector('.font-size-control input[type="number"]');
    fontSize.addEventListener('input', function() {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set('fontSize', parseInt(this.value));
            canvas.renderAll();
        }
    });

    const textColor = document.querySelector('.font-size-control input[type="color"]');
    textColor.addEventListener('input', function() {
        const activeObject = canvas.getActiveObject();
        if (activeObject && activeObject.type === 'i-text') {
            activeObject.set('fill', this.value);
            canvas.renderAll();
        }
    });

    // Text Style Buttons
    document.querySelectorAll('.style-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const style = this.dataset.style;
            const activeObject = canvas.getActiveObject();
            if (activeObject && activeObject.type === 'i-text') {
                switch(style) {
                    case 'bold':
                        activeObject.set('fontWeight', activeObject.fontWeight === 'bold' ? 'normal' : 'bold');
                        break;
                    case 'italic':
                        activeObject.set('fontStyle', activeObject.fontStyle === 'italic' ? 'normal' : 'italic');
                        break;
                    case 'underline':
                        activeObject.set('underline', !activeObject.underline);
                        break;
                }
                canvas.renderAll();
                this.classList.toggle('active');
            }
        });
    });

    // Image Upload
    const imageUpload = document.querySelector('.image-upload');
    imageUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = function(event) {
                fabric.Image.fromURL(event.target.result, function(img) {
                    // Scale image to fit within canvas
                    const maxWidth = canvas.width * 0.8;
                    const maxHeight = canvas.height * 0.8;
                    const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
                    img.scale(scale);
                    
                    img.set({
                        left: (canvas.width - img.width * scale) / 2,
                        top: (canvas.height - img.height * scale) / 2
                    });
                    
                    canvas.add(img);
                    canvas.setActiveObject(img);
                    updateLayersList();
                });
            };
            reader.readAsDataURL(file);
        }
    });

    // Image Adjustments
    const adjustments = document.querySelectorAll('.image-adjustments input[type="range"]');
    adjustments.forEach(adjustment => {
        adjustment.addEventListener('input', function() {
            const activeObject = canvas.getActiveObject();
            if (activeObject && activeObject.type === 'image') {
                const filters = [];
                const brightness = document.querySelector('input[label="Brightness"]').value;
                const contrast = document.querySelector('input[label="Contrast"]').value;
                const saturation = document.querySelector('input[label="Saturation"]').value;

                filters.push(new fabric.Image.filters.Brightness({ brightness: (brightness - 100) / 100 }));
                filters.push(new fabric.Image.filters.Contrast({ contrast: (contrast - 100) / 100 }));
                filters.push(new fabric.Image.filters.Saturation({ saturation: (saturation - 100) / 100 }));

                activeObject.filters = filters;
                activeObject.applyFilters();
                canvas.renderAll();
            }
        });
    });

    // Layer Management
    function updateLayersList() {
        const layersList = document.getElementById('layersList');
        layersList.innerHTML = '';
        
        canvas.getObjects().forEach((obj, index) => {
            const layer = document.createElement('div');
            layer.className = 'layer-item';
            layer.innerHTML = `
                <span>${obj.type === 'i-text' ? 'Text' : 'Image'} ${index + 1}</span>
                <div class="layer-controls">
                    <button class="layer-btn" data-action="up"><i class="fas fa-arrow-up"></i></button>
                    <button class="layer-btn" data-action="down"><i class="fas fa-arrow-down"></i></button>
                    <button class="layer-btn" data-action="delete"><i class="fas fa-trash"></i></button>
                </div>
            `;
            
            // Layer controls event listeners
            layer.querySelectorAll('.layer-btn').forEach(btn => {
                btn.addEventListener('click', function() {
                    const action = this.dataset.action;
                    switch(action) {
                        case 'up':
                            if (index < canvas.getObjects().length - 1) {
                                canvas.moveTo(obj, index + 1);
                                updateLayersList();
                            }
                            break;
                        case 'down':
                            if (index > 0) {
                                canvas.moveTo(obj, index - 1);
                                updateLayersList();
                            }
                            break;
                        case 'delete':
                            canvas.remove(obj);
                            updateLayersList();
                            break;
                    }
                });
            });
            
            layersList.appendChild(layer);
        });
    }

    // Canvas Selection Event
    canvas.on('selection:created', function(e) {
        updateTextControls(e.selected[0]);
    });

    canvas.on('selection:updated', function(e) {
        updateTextControls(e.selected[0]);
    });

    function updateTextControls(object) {
        if (object.type === 'i-text') {
            textInput.value = object.text;
            fontFamily.value = object.fontFamily;
            fontSize.value = object.fontSize;
            textColor.value = object.fill;
            
            document.querySelector('[data-style="bold"]').classList.toggle('active', object.fontWeight === 'bold');
            document.querySelector('[data-style="italic"]').classList.toggle('active', object.fontStyle === 'italic');
            document.querySelector('[data-style="underline"]').classList.toggle('active', object.underline);
        }
    }

    // Product Color Selection
    const colorOptions = document.querySelectorAll('.color-option');
    colorOptions.forEach(option => {
        option.addEventListener('click', function() {
            const color = this.dataset.color;
            document.querySelector('.color-option.selected').classList.remove('selected');
            this.classList.add('selected');
            updateProductColor(color);
        });
    });

    // Size Selection
    const sizeButtons = document.querySelectorAll('.size-btn');
    sizeButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelector('.size-btn.active').classList.remove('active');
            this.classList.add('active');
        });
    });

    // View Controls
    const viewButtons = document.querySelectorAll('.view-btn');
    viewButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const view = this.dataset.view;
            document.querySelector('.view-btn.active').classList.remove('active');
            this.classList.add('active');
            updateProductView(view);
        });
    });

    // Zoom Controls
    const zoomButtons = document.querySelectorAll('.zoom-btn');
    zoomButtons.forEach(btn => {
        btn.addEventListener('click', function() {
            const action = this.dataset.action;
            if (action === 'zoomIn') {
                canvas.setZoom(canvas.getZoom() * 1.1);
            } else {
                canvas.setZoom(canvas.getZoom() / 1.1);
            }
        });
    });

    // Save Design
    document.getElementById('saveDesign').addEventListener('click', function() {
        const design = {
            canvas: canvas.toJSON(),
            product: {
                color: document.querySelector('.color-option.selected').dataset.color,
                size: document.querySelector('.size-btn.active').dataset.size
            }
        };
        localStorage.setItem('savedDesign', JSON.stringify(design));
        showNotification('Design saved successfully!', 'success');
    });

    // Product Selection
    const categoryButtons = document.querySelectorAll('.category-btn');
    const productItems = document.querySelectorAll('.product-item');
    const productData = {
        'gray-crewneck': {
            id: 'gray-crewneck',
            name: 'Gray Crewneck Sweatshirt',
            price: 5000,
            category: 'sweatshirts',
            sizes: ['S', 'M', 'L', 'XL'],
            printArea: { width: 300, height: 400 }
        }
    };

    // Initialize categories and products
    const categories = [
        {
            id: 'sweatshirts',
            name: 'Sweatshirts',
            icon: 'fa-shirt'
        }
    ];

    const products = [
        {
            id: 'gray-crewneck',
            name: 'Gray Crewneck Sweatshirt',
            price: 5000
        }
    ];

    // Initialize with our product
    initializeCategories(categories);
    initializeProducts(products);

    // Category Selection
    function initializeCategories(categories) {
        const categoriesContainer = document.querySelector('.product-categories');
        categoriesContainer.innerHTML = '';
        
        categories.forEach((category, index) => {
            const button = document.createElement('button');
            button.className = `category-btn ${index === 0 ? 'active' : ''}`;
            button.dataset.category = category.id;
            button.innerHTML = `
                <i class="fas ${category.icon}"></i>
                <span>${category.name}</span>
            `;
            categoriesContainer.appendChild(button);
        });

        // Reattach category event listeners
        document.querySelectorAll('.category-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                filterProducts(btn.dataset.category);
            });
        });
    }

    // Initialize Products
    function initializeProducts(products) {
        const productGrid = document.querySelector('.product-grid');
        productGrid.innerHTML = '';
        
        products.forEach((product, index) => {
            const productElement = document.createElement('div');
            productElement.className = `product-item ${index === 0 ? 'active' : ''}`;
            productElement.dataset.product = product.id;
            productElement.innerHTML = `
                <img src="assets/products/${product.id}.jpg" alt="${product.name}" 
                     onerror="this.src='assets/placeholder.jpg'">
                <div class="product-info">
                    <h4>${product.name}</h4>
                    <p>${product.price.toLocaleString()} DA</p>
                </div>
            `;
            productGrid.appendChild(productElement);
        });

        // Update the main preview with the first product
        if (products.length > 0) {
            updateDesignArea(products[0].id);
        }

        // Reattach product event listeners
        document.querySelectorAll('.product-item').forEach(item => {
            item.addEventListener('click', () => {
                document.querySelectorAll('.product-item').forEach(p => p.classList.remove('active'));
                item.classList.add('active');
                updateDesignArea(item.dataset.product);
            });
        });
    }

    function filterProducts(category) {
        const productGrid = document.querySelector('.product-grid');
        const products = productGrid.querySelectorAll('.product-item');
        
        products.forEach(item => {
            const productId = item.dataset.product;
            const productCategory = productData[productId]?.category;
            
            if (category === 'all' || productCategory === category) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    }

    function updateDesignArea(productId) {
        const product = productData[productId];
        if (!product) return;

        // Update canvas size based on print area
        canvas.setWidth(product.printArea.width);
        canvas.setHeight(product.printArea.height);

        // Update product preview
        const productPreview = document.getElementById('productPreview');
        productPreview.src = `assets/products/${productId}.jpg`;
        productPreview.onerror = function() {
            console.error('Failed to load product image');
            this.src = 'assets/placeholder.jpg';
        };

        // Update size options
        updateSizeOptions(product.sizes);

        // Update price display
        updatePriceDisplay(product.price);

        // Reset canvas zoom and position
        canvas.setZoom(1);
        canvas.setViewportTransform([1, 0, 0, 1, 0, 0]);
        canvas.renderAll();
    }

    function updateSizeOptions(sizes) {
        const sizePicker = document.querySelector('.size-picker');
        sizePicker.innerHTML = '';
        
        sizes.forEach(size => {
            const sizeBtn = document.createElement('button');
            sizeBtn.className = 'size-btn';
            sizeBtn.dataset.size = size;
            sizeBtn.textContent = size;
            if (size === 'L') sizeBtn.classList.add('active');
            sizePicker.appendChild(sizeBtn);
        });

        // Reattach size selection event listeners
        attachSizeListeners();
    }

    function attachSizeListeners() {
        const sizeButtons = document.querySelectorAll('.size-btn');
        sizeButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                document.querySelector('.size-btn.active')?.classList.remove('active');
                this.classList.add('active');
            });
        });
    }

    function updatePriceDisplay(price) {
        const priceDisplay = document.querySelector('.product-info p');
        if (priceDisplay) {
            priceDisplay.textContent = `${price.toLocaleString()} DA`;
        }
    }

    function updateProductView(view) {
        const productImg = document.getElementById('productPreview');
        const activeProduct = document.querySelector('.product-item.active');
        const productId = activeProduct?.dataset.product;
        try {
            // First try to load the view-specific image
            productImg.src = `assets/products/${productId}-${view}.jpg`;
            productImg.onerror = () => {
                // If view-specific image fails, fallback to main product image
                productImg.src = `assets/products/${productId}.jpg`;
            };
        } catch (error) {
            // Fallback to main product image
            productImg.src = `assets/products/${productId}.jpg`;
        }
    }

    // Initialize the product preview with the main image
    const productPreview = document.getElementById('productPreview');
    productPreview.src = 'assets/products/gray-crewneck.jpg';
    productPreview.onerror = function() {
        console.error('Failed to load product image');
        this.src = 'assets/placeholder.jpg'; // Fallback to placeholder if image fails to load
    };

    // Update the Add to Cart function
    document.getElementById('addToCart').addEventListener('click', function() {
        const activeProduct = document.querySelector('.product-item.active');
        const productId = activeProduct.dataset.product;
        const product = productData[productId];

        const design = {
            canvas: canvas.toJSON(),
            product: {
                type: productId,
                name: product.name,
                size: document.querySelector('.size-btn.active').dataset.size,
                price: product.price
            }
        };
        
        let cart = JSON.parse(localStorage.getItem('cart')) || [];
        cart.push(design);
        localStorage.setItem('cart', JSON.stringify(cart));
        
        updateCartBadge(cart.length);
        showNotification('Added to cart!', 'success');
    });

    // Utility Functions
    function showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}"></i>
            <p>${message}</p>
        `;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    function updateCartBadge(count) {
        const badge = document.querySelector('.cart-badge');
        badge.textContent = count;
    }

    function updateProductColor(color) {
        const productImg = document.getElementById('productPreview');
        // Update product image based on color
        productImg.src = `assets/tshirt-${color}.jpg`;
    }
}); 