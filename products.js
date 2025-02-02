// Products Data
const products = [
    {
        id: 'gray-crewneck',
        name: 'Gray Crewneck Sweatshirt',
        price: 5000,
        category: 'Sweatshirts',
        sizes: ['S', 'M', 'L', 'XL'],
        image: 'assets/products/gray-crewneck.jpg'
    },
    {
        id: 'custom-tshirt',
        name: 'Custom T-Shirt Design',
        price: 2000,
        category: 'T-Shirts',
        sizes: ['S', 'M', 'L'],
        image: 'assets/products/design-lab.jpg'
    }
];

document.addEventListener('DOMContentLoaded', function() {
    // Cart icon sparkle effect
    document.querySelector('.cart-icon').addEventListener('mouseenter', function() {
        for(let i = 0; i < 3; i++) {
            const sparkle = document.createElement('div');
            sparkle.className = 'sparkle';
            sparkle.style.width = Math.random() * 3 + 2 + 'px';
            sparkle.style.height = sparkle.style.width;
            sparkle.style.left = Math.random() * 80 + '%';
            sparkle.style.top = Math.random() * 60 + '%';
            this.appendChild(sparkle);
            
            setTimeout(() => sparkle.remove(), 600);
        }
    });

    console.log('Initial products array:', products);
    
    // Search Functionality
    const searchInput = document.querySelector('.search-box input');
    searchInput.addEventListener('input', filterProducts);

    // Category Filter
    const categorySelect = document.querySelector('.filter-options select:first-child');
    categorySelect.addEventListener('change', filterProducts);

    // Sort Products
    const sortSelect = document.querySelector('.filter-options select:last-child');
    sortSelect.addEventListener('change', sortProducts);

    // Cart Functionality
    function updateCartCount() {
        const cartCount = document.querySelector('.cart-count');
        const cart = JSON.parse(localStorage.getItem('cart')) || [];
        cartCount.textContent = cart.length;
    }

    // Initialize cart count
    updateCartCount();

    function filterProducts() {
        const searchTerm = searchInput.value.toLowerCase();
        const selectedCategory = categorySelect.value;
        
        const filteredProducts = products.filter(product => {
            const matchesSearch = product.name.toLowerCase().includes(searchTerm);
            const matchesCategory = selectedCategory === 'All Categories' || product.category === selectedCategory;
            return matchesSearch && matchesCategory;
        });
        
        displayProducts(filteredProducts);
    }

    function sortProducts() {
        const sortBy = sortSelect.value;
        const productsList = [...products];
        
        switch(sortBy) {
            case 'Price: Low to High':
                productsList.sort((a, b) => a.price - b.price);
                break;
            case 'Price: High to Low':
                productsList.sort((a, b) => b.price - a.price);
                break;
            case 'Newest First':
                // If you add timestamp to products later
                break;
            default:
                // Featured - keep original order
                break;
        }
        
        displayProducts(productsList);
    }

    function displayProducts(productsToShow) {
        const productsWrapper = document.querySelector('.products-grid');
        if (!productsWrapper) return;
        
        productsWrapper.innerHTML = '';
        
        productsToShow.forEach(product => {
            const productCard = document.createElement('div');
            productCard.className = 'product-card';
            productCard.setAttribute('data-aos', 'fade-up');
            productCard.setAttribute('data-product-id', product.id);
            
            productCard.innerHTML = `
                <div class="product-image">
                    <img src="${product.image}" alt="${product.name}">
                    <div class="product-overlay">
                        <div class="overlay-content">
                            <h3>${product.name}</h3>
                            <p>Premium quality product perfect for customization</p>
                            <a href="design-lab.html" class="customize-btn">
                                <span class="icon-palette icon-hover-scale"></span>
                                Customize Now
                            </a>
                        </div>
                    </div>
                    <button class="wishlist-btn">
                        <span class="icon-heart icon-hover-scale"></span>
                    </button>
                </div>
                <div class="product-info">
                    <div class="product-details">
                        <h3>${product.name}</h3>
                        <div class="product-meta">
                            <span class="price" data-price="${product.price}">${product.price.toLocaleString()} DA</span>
                            <div class="sizes">
                                <span class="size-label">Sizes:</span>
                                ${product.sizes.map(size => `<span class="size">${size}</span>`).join('')}
                            </div>
                        </div>
                    </div>
                    <div class="product-actions">
                        <a href="design-lab.html" class="action-btn primary">
                            <span class="icon-palette icon-hover-scale"></span>
                            Customize
                        </a>
                        <button class="action-btn secondary add-to-cart-btn">
                            <span class="icon-cart icon-hover-scale"></span>
                            Add to Cart
                        </button>
                    </div>
                </div>
            `;
            
            productsWrapper.appendChild(productCard);
        });
    }

    // Initialize the display
    displayProducts(products);

    // Add to Cart functionality via event delegation on the products grid
    const productsGrid = document.querySelector('.products-grid');
    if (productsGrid) {
        productsGrid.addEventListener('click', function(event) {
            // Find the add to cart button or its icon that was clicked
            const addToCartBtn = event.target.closest('.add-to-cart-btn');
            if (!addToCartBtn) return; // Not an add to cart button click
            
            event.preventDefault();
            
            // Get the product card
            const productCard = addToCartBtn.closest('.product-card');
            if (!productCard) return;
            
            // Get product ID
            const productId = productCard.getAttribute('data-product-id');
            if (!productId) return;
            
            // Find the product
            const product = products.find(p => p.id === productId);
            if (!product) {
                console.error('Product not found:', productId);
                return;
            }
            
            try {
                // Get current cart
                let cartItems = JSON.parse(localStorage.getItem('cartItems')) || [];
                
                // Check if product already exists in cart
                const existingItem = cartItems.find(item => 
                    item.id === product.id && item.size === 'M'  // Default size M
                );
                
                if (existingItem) {
                    // Update quantity if item exists (max 10)
                    existingItem.quantity = Math.min(existingItem.quantity + 1, 10);
                } else {
                    // Add new item
                    cartItems.push({
                        id: product.id,
                        name: product.name,
                        price: product.price,
                        image: product.image,
                        size: 'M',  // Default size
                        quantity: 1
                    });
                }
                
                // Save cart
                localStorage.setItem('cartItems', JSON.stringify(cartItems));
                
                // Update cart count
                const count = cartItems.reduce((total, item) => total + item.quantity, 0);
                document.querySelectorAll('.cart-badge').forEach(badge => {
                    badge.textContent = count;
                });
                
                // Show success message using the existing notification system
                const notification = document.querySelector('.notification.success');
                if (notification) {
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                    }, 2000);
                }
                
            } catch (error) {
                console.error('Error updating cart:', error);
                alert('Sorry, there was an error adding the item to cart. Please try again.');
            }
        });
    }
}); 