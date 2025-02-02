// Auth state management
let currentUser = JSON.parse(localStorage.getItem('currentUser'));
const MIN_PASSWORD_LENGTH = 8;
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes
let sessionTimer = null;

// Event listeners for auth buttons
document.addEventListener('DOMContentLoaded', () => {
    const loginBtn = document.querySelector('.login-btn');
    const signupBtn = document.querySelector('.signup-btn');
    
    if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
    if (signupBtn) signupBtn.addEventListener('click', showSignupModal);
    
    // Check if user is already logged in
    checkAuthState();
    
    // Check "Remember Me" status
    checkRememberMe();
    
    // Setup session monitoring
    setupSessionMonitoring();
    
    // Setup activity tracking
    setupActivityTracking();
});

// Setup session monitoring
function setupSessionMonitoring() {
    if (currentUser) {
        startSessionTimer();
        
        // Monitor user activity
        ['click', 'keypress', 'mousemove', 'touchstart'].forEach(event => {
            document.addEventListener(event, resetSessionTimer);
        });
    }
}

// Start session timer
function startSessionTimer() {
    if (sessionTimer) clearTimeout(sessionTimer);
    sessionTimer = setTimeout(handleSessionTimeout, SESSION_TIMEOUT);
}

// Reset session timer
function resetSessionTimer() {
    if (currentUser) {
        startSessionTimer();
    }
}

// Handle session timeout
function handleSessionTimeout() {
    if (currentUser) {
        handleLogout();
        showNotification('Session expired. Please log in again.', 'warning');
    }
}

// Setup activity tracking
function setupActivityTracking() {
    if (currentUser) {
        // Track page views
        logActivity('page_view', { page: window.location.pathname });
        
        // Track user interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('button, a')) {
                logActivity('interaction', {
                    type: 'click',
                    element: e.target.tagName,
                    text: e.target.textContent.trim()
                });
            }
        });
    }
}

// Log user activity
function logActivity(type, data) {
    const activity = {
        type,
        data,
        timestamp: new Date().toISOString(),
        userId: currentUser?.id
    };
    
    // Store activity in local storage for demo
    const activities = JSON.parse(localStorage.getItem('userActivities') || '[]');
    activities.push(activity);
    localStorage.setItem('userActivities', JSON.stringify(activities));
}

// Show login modal with enhanced features
function showLoginModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">
                <span class="icon-close"></span>
            </button>
            <div class="auth-form">
                <h2>Welcome Back</h2>
                <p>Sign in to your account to continue</p>
                <form id="loginForm" onsubmit="handleLogin(this); return false;">
                    <div class="form-group">
                        <label for="loginEmail">Email Address</label>
                        <input type="email" id="loginEmail" required 
                               placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <div class="password-input">
                            <input type="password" id="loginPassword" required
                                   placeholder="Enter your password">
                            <button type="button" class="toggle-password">
                                <span class="icon-eye"></span>
                            </button>
                        </div>
                    </div>
                    <div class="form-group checkbox">
                        <input type="checkbox" id="rememberMe">
                        <label for="rememberMe">Keep me signed in</label>
                    </div>
                    <button type="submit" class="auth-btn primary">
                        <span class="icon-login"></span>
                        Sign In
                    </button>
                </form>
                <div class="social-login">
                    <p>Or continue with</p>
                    <div class="social-buttons">
                        <button onclick="handleSocialLogin('google')" class="social-btn google">
                            <img src="assets/google-icon.png" alt="Google">
                            Google
                        </button>
                        <button onclick="handleSocialLogin('facebook')" class="social-btn facebook">
                            <img src="assets/facebook-icon.png" alt="Facebook">
                            Facebook
                        </button>
                    </div>
                </div>
                <div class="auth-links">
                    <a href="#" onclick="showPasswordRecoveryModal()">Forgot your password?</a>
                    <a href="#" onclick="showSignupModal()">Don't have an account? Create one</a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setupModalClose(modal);
    setupPasswordToggle(modal);
    
    // Add animation classes
    requestAnimationFrame(() => {
        modal.classList.add('show');
        modal.querySelector('.modal-content').classList.add('show');
    });
}

// Handle social login
async function handleSocialLogin(provider) {
    try {
        showLoadingState(true);
        
        // Here you would integrate with the social provider's SDK
        // For demo purposes, we'll simulate a successful login
        const user = {
            id: 'social_' + Math.random().toString(36).substr(2, 9),
            name: 'Social User',
            email: 'social@example.com',
            provider
        };
        
        await handleSuccessfulLogin(user);
        showNotification(`Successfully logged in with ${provider}!`, 'success');
        
    } catch (error) {
        showNotification(`Failed to login with ${provider}. Please try again.`, 'error');
    } finally {
        showLoadingState(false);
    }
}

// Setup form validation
function setupFormValidation(form) {
    const inputs = form.querySelectorAll('input[required]');
    inputs.forEach(input => {
        input.addEventListener('input', () => {
            validateInput(input);
        });
        
        input.addEventListener('blur', () => {
            validateInput(input);
        });
    });
}

// Validate individual input
function validateInput(input) {
    const errorClass = 'input-error';
    const errorMsgClass = 'error-message';
    let isValid = true;
    let errorMessage = '';
    
    // Remove existing error message
    const existingError = input.parentElement.querySelector('.' + errorMsgClass);
    if (existingError) existingError.remove();
    
    // Validate based on input type
    switch (input.type) {
        case 'email':
            isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value);
            errorMessage = 'Please enter a valid email address';
            break;
            
        case 'password':
            if (input.id.includes('signup') || input.id.includes('new')) {
                const strength = checkPasswordStrength(input.value);
                isValid = strength.score >= 2;
                errorMessage = 'Password is too weak';
            }
            break;
            
        default:
            isValid = input.value.trim() !== '';
            errorMessage = 'This field is required';
    }
    
    // Show/hide error
    if (!isValid && input.value !== '') {
        input.classList.add(errorClass);
        const errorDiv = document.createElement('div');
        errorDiv.className = errorMsgClass;
        errorDiv.textContent = errorMessage;
        input.parentElement.appendChild(errorDiv);
    } else {
        input.classList.remove(errorClass);
    }
    
    return isValid;
}

// Validate entire form
function validateForm(form) {
    const inputs = form.querySelectorAll('input[required]');
    let isValid = true;
    
    inputs.forEach(input => {
        if (!validateInput(input)) {
            isValid = false;
        }
    });
    
    // Validate reCAPTCHA if present
    const recaptcha = form.querySelector('.g-recaptcha');
    if (recaptcha && !grecaptcha.getResponse()) {
        showNotification('Please complete the reCAPTCHA', 'error');
        isValid = false;
    }
    
    return isValid;
}

// Show/hide loading state
function showLoadingState(loading) {
    const buttons = document.querySelectorAll('.auth-btn');
    buttons.forEach(btn => {
        btn.disabled = loading;
        btn.innerHTML = loading ? '<span class="icon-spinner"></span> Loading...' : btn.textContent;
    });
}

// Handle successful login
async function handleSuccessfulLogin(user) {
    // Generate session token
    const sessionToken = generateSessionToken();
    
    // Store user data and session
    const sessionData = {
        user,
        token: sessionToken,
        expiresAt: Date.now() + SESSION_TIMEOUT
    };
    
    localStorage.setItem('currentUser', JSON.stringify(sessionData));
    currentUser = user;
    
    // Setup session monitoring
    setupSessionMonitoring();
    
    // Update UI
    updateAuthUI();
    
    // Close modal
    const modal = document.querySelector('.auth-modal');
    if (modal) modal.remove();
}

// Generate session token
function generateSessionToken() {
    return Math.random().toString(36).substr(2) + Date.now().toString(36);
}

// Enhanced password strength check
function checkPasswordStrength(password) {
    let score = 0;
    let level = 'weak';
    const feedback = [];
    
    // Length check
    if (password.length >= MIN_PASSWORD_LENGTH) {
        score++;
    } else {
        feedback.push(`At least ${MIN_PASSWORD_LENGTH} characters`);
    }
    
    // Uppercase and lowercase
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) {
        score++;
    } else {
        feedback.push('Mix of upper and lowercase letters');
    }
    
    // Numbers
    if (password.match(/\d/)) {
        score++;
    } else {
        feedback.push('At least one number');
    }
    
    // Special characters
    if (password.match(/[^a-zA-Z\d]/)) {
        score++;
    } else {
        feedback.push('At least one special character');
    }
    
    // Common patterns check
    const commonPatterns = [
        '123', 'abc', 'qwerty', 'password', 'admin', 'letmein'
    ];
    
    if (commonPatterns.some(pattern => password.toLowerCase().includes(pattern))) {
        score = Math.max(0, score - 1);
        feedback.push('Avoid common patterns');
    }
    
    // Repeated characters
    if (/(.)\1{2,}/.test(password)) {
        score = Math.max(0, score - 1);
        feedback.push('Avoid repeated characters');
    }
    
    // Determine level
    if (score >= 4) level = 'strong';
    else if (score >= 2) level = 'medium';
    
    return { score, level, feedback };
}

// Show enhanced notification
function showNotification(message, type = 'success') {
    // Remove any existing notifications
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }

    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    
    // Add appropriate icon based on type
    const iconMap = {
        success: 'check',
        error: 'error',
        warning: 'warning',
        info: 'info'
    };
    
    notification.innerHTML = `
        <span class="icon-${iconMap[type] || 'info'}"></span>
        <div class="notification-content">
            <p class="notification-message">${message}</p>
            ${type === 'error' ? '<button class="notification-retry">Try Again</button>' : ''}
        </div>
        <button class="notification-close">&times;</button>
    `;
    
    document.body.appendChild(notification);
    
    // Add click handlers
    const closeBtn = notification.querySelector('.notification-close');
    if (closeBtn) {
        closeBtn.onclick = () => notification.remove();
    }
    
    const retryBtn = notification.querySelector('.notification-retry');
    if (retryBtn) {
        retryBtn.onclick = () => {
            notification.remove();
            // Retry the last failed action
            if (window.lastFailedAction) {
                window.lastFailedAction();
            }
        };
    }
    
    // Animate in
    requestAnimationFrame(() => {
        notification.classList.add('show');
    });
    
    // Auto-remove after delay (except for errors)
    if (type !== 'error') {
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
}

// Show signup modal with enhanced features
function showSignupModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">
                <span class="icon-close"></span>
            </button>
            <div class="auth-form">
                <h2>Create Account</h2>
                <p>Join us and start customizing your apparel</p>
                <form id="signupForm" onsubmit="handleSignup(this); return false;">
                    <div class="form-group">
                        <label for="signupName">Full Name</label>
                        <input type="text" id="signupName" required
                               placeholder="Enter your full name">
                    </div>
                    <div class="form-group">
                        <label for="signupEmail">Email Address</label>
                        <input type="email" id="signupEmail" required
                               placeholder="Enter your email">
                    </div>
                    <div class="form-group">
                        <label for="signupPassword">Password</label>
                        <div class="password-input">
                            <input type="password" id="signupPassword" required
                                   placeholder="Choose a strong password">
                            <button type="button" class="toggle-password">
                                <span class="icon-eye"></span>
                            </button>
                        </div>
                        <div class="password-strength"></div>
                    </div>
                    <div class="form-group">
                        <label for="signupConfirmPassword">Confirm Password</label>
                        <div class="password-input">
                            <input type="password" id="signupConfirmPassword" required
                                   placeholder="Confirm your password">
                            <button type="button" class="toggle-password">
                                <span class="icon-eye"></span>
                            </button>
                        </div>
                    </div>
                    <div class="form-group checkbox">
                        <input type="checkbox" id="termsAccept" required>
                        <label for="termsAccept">
                            I agree to the <a href="#" class="terms-link">Terms & Conditions</a>
                        </label>
                    </div>
                    <button type="submit" class="auth-btn primary">
                        <span class="icon-user-plus"></span>
                        Create Account
                    </button>
                </form>
                <div class="social-login">
                    <p>Or sign up with</p>
                    <div class="social-buttons">
                        <button onclick="handleSocialLogin('google')" class="social-btn google">
                            <img src="assets/google-icon.png" alt="Google">
                            Google
                        </button>
                        <button onclick="handleSocialLogin('facebook')" class="social-btn facebook">
                            <img src="assets/facebook-icon.png" alt="Facebook">
                            Facebook
                        </button>
                    </div>
                </div>
                <div class="auth-links">
                    <a href="#" onclick="showLoginModal()">Already have an account? Sign in</a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setupModalClose(modal);
    setupPasswordToggle(modal);
    setupPasswordStrength(modal);
    
    // Add animation classes
    requestAnimationFrame(() => {
        modal.classList.add('show');
        modal.querySelector('.modal-content').classList.add('show');
    });
}

// Show password recovery modal with enhanced features
function showPasswordRecoveryModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="modal-content">
            <button class="modal-close">
                <span class="icon-close"></span>
            </button>
            <div class="auth-form">
                <h2>Reset Password</h2>
                <p>Enter your email address and we'll send you instructions to reset your password</p>
                <form id="recoveryForm" onsubmit="handlePasswordRecovery(this); return false;">
                    <div class="form-group">
                        <label for="recoveryEmail">Email Address</label>
                        <input type="email" id="recoveryEmail" required
                               placeholder="Enter your email">
                    </div>
                    <button type="submit" class="auth-btn primary">
                        <span class="icon-mail"></span>
                        Send Reset Link
                    </button>
                </form>
                <div class="auth-links">
                    <a href="#" onclick="showLoginModal()">Back to Sign In</a>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(modal);
    setupModalClose(modal);
    
    // Add animation classes
    requestAnimationFrame(() => {
        modal.classList.add('show');
        modal.querySelector('.modal-content').classList.add('show');
    });
}

// Show profile modal
function showProfileModal() {
    if (!currentUser) return;
    
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <button class="modal-close">&times;</button>
            <h2>Profile Settings</h2>
            <form id="profileForm">
                <div class="profile-avatar">
                    <img src="${currentUser.avatar || 'assets/default-avatar.png'}" alt="Profile">
                    <button type="button" class="change-avatar-btn">Change Photo</button>
                </div>
                <div class="form-group">
                    <label for="profileName">Full Name</label>
                    <input type="text" id="profileName" value="${currentUser.name}" required>
                </div>
                <div class="form-group">
                    <label for="profileEmail">Email</label>
                    <input type="email" id="profileEmail" value="${currentUser.email}" required>
                </div>
                <div class="form-group">
                    <button type="button" class="change-password-btn" onclick="showChangePasswordModal()">
                        Change Password
                    </button>
                </div>
                <button type="submit" class="auth-submit-btn">Save Changes</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => modal.remove();
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Handle form submission
    const form = modal.querySelector('#profileForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        handleProfileUpdate(form);
    };
    
    // Handle avatar change
    const avatarBtn = modal.querySelector('.change-avatar-btn');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    
    avatarBtn.onclick = () => fileInput.click();
    fileInput.onchange = handleAvatarChange;
}

// Show change password modal
function showChangePasswordModal() {
    const modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML = `
        <div class="auth-modal-content">
            <button class="modal-close">&times;</button>
            <h2>Change Password</h2>
            <form id="changePasswordForm">
                <div class="form-group">
                    <label for="currentPassword">Current Password</label>
                    <div class="password-input-group">
                        <input type="password" id="currentPassword" required>
                        <button type="button" class="toggle-password">
                            <span class="icon-eye"></span>
                        </button>
                    </div>
                </div>
                <div class="form-group">
                    <label for="newPassword">New Password</label>
                    <div class="password-input-group">
                        <input type="password" id="newPassword" required>
                        <button type="button" class="toggle-password">
                            <span class="icon-eye"></span>
                        </button>
                    </div>
                    <div class="password-strength-meter">
                        <div class="strength-bar"></div>
                        <p class="strength-text">Password strength: <span>Weak</span></p>
                    </div>
                </div>
                <div class="form-group">
                    <label for="confirmNewPassword">Confirm New Password</label>
                    <div class="password-input-group">
                        <input type="password" id="confirmNewPassword" required>
                        <button type="button" class="toggle-password">
                            <span class="icon-eye"></span>
                        </button>
                    </div>
                </div>
                <button type="submit" class="auth-submit-btn">Change Password</button>
            </form>
        </div>
    `;
    document.body.appendChild(modal);
    
    // Setup password visibility toggles
    setupPasswordToggle(modal);
    
    // Setup password strength meter
    setupPasswordStrengthMeter(modal);
    
    // Close button functionality
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.onclick = () => modal.remove();
    
    // Close on outside click
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    // Handle form submission
    const form = modal.querySelector('#changePasswordForm');
    form.onsubmit = (e) => {
        e.preventDefault();
        handlePasswordChange(form);
    };
}

// Handle login submission
async function handleLogin(form) {
    const email = form.querySelector('#loginEmail').value;
    const password = form.querySelector('#loginPassword').value;
    const rememberMe = form.querySelector('#rememberMe').checked;
    
    try {
        // Here you would typically make an API call to your backend
        // For demo purposes, we'll simulate a successful login
        const user = { email, name: email.split('@')[0] };
        
        // Store user data
        localStorage.setItem('currentUser', JSON.stringify(user));
        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedEmail', email);
        } else {
            localStorage.removeItem('rememberMe');
            localStorage.removeItem('rememberedEmail');
        }
        
        currentUser = user;
        
        // Update UI
        updateAuthUI();
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
        // Show success notification
        showNotification('Successfully logged in!', 'success');
        
    } catch (error) {
        showNotification('Login failed. Please try again.', 'error');
    }
}

// Handle signup submission
async function handleSignup(form) {
    const name = form.querySelector('#signupName').value;
    const email = form.querySelector('#signupEmail').value;
    const password = form.querySelector('#signupPassword').value;
    const confirmPassword = form.querySelector('#signupConfirmPassword').value;
    const termsAccepted = form.querySelector('#termsAccept').checked;
    
    if (!termsAccepted) {
        showNotification('Please accept the Terms & Conditions', 'error');
        return;
    }
    
    if (password !== confirmPassword) {
        showNotification('Passwords do not match!', 'error');
        return;
    }
    
    if (!isPasswordStrong(password)) {
        showNotification('Please choose a stronger password', 'error');
        return;
    }
    
    try {
        // Here you would typically make an API call to your backend
        // For demo purposes, we'll simulate a successful signup
        const user = { email, name };
        
        // Store user data
        localStorage.setItem('currentUser', JSON.stringify(user));
        currentUser = user;
        
        // Update UI
        updateAuthUI();
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
        // Show success notification
        showNotification('Successfully signed up!', 'success');
        
    } catch (error) {
        showNotification('Signup failed. Please try again.', 'error');
    }
}

// Handle password recovery
async function handlePasswordRecovery(form) {
    const email = form.querySelector('#recoveryEmail').value;
    
    try {
        // Here you would typically make an API call to your backend
        // For demo purposes, we'll just show a success message
        showNotification('Recovery email sent! Please check your inbox.', 'success');
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
    } catch (error) {
        showNotification('Failed to send recovery email. Please try again.', 'error');
    }
}

// Handle profile update
async function handleProfileUpdate(form) {
    const name = form.querySelector('#profileName').value;
    const email = form.querySelector('#profileEmail').value;
    
    try {
        // Here you would typically make an API call to your backend
        // For demo purposes, we'll update the local storage
        const updatedUser = { ...currentUser, name, email };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        currentUser = updatedUser;
        
        // Update UI
        updateAuthUI();
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
        showNotification('Profile updated successfully!', 'success');
        
    } catch (error) {
        showNotification('Failed to update profile. Please try again.', 'error');
    }
}

// Handle password change
async function handlePasswordChange(form) {
    const currentPassword = form.querySelector('#currentPassword').value;
    const newPassword = form.querySelector('#newPassword').value;
    const confirmNewPassword = form.querySelector('#confirmNewPassword').value;
    
    if (newPassword !== confirmNewPassword) {
        showNotification('New passwords do not match!', 'error');
        return;
    }
    
    if (!isPasswordStrong(newPassword)) {
        showNotification('Please choose a stronger password', 'error');
        return;
    }
    
    try {
        // Here you would typically make an API call to your backend
        // For demo purposes, we'll just show a success message
        showNotification('Password changed successfully!', 'success');
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
    } catch (error) {
        showNotification('Failed to change password. Please try again.', 'error');
    }
}

// Handle avatar change
async function handleAvatarChange(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        // Here you would typically upload the file to your backend
        // For demo purposes, we'll use a local URL
        const reader = new FileReader();
        reader.onload = function(e) {
            const updatedUser = { ...currentUser, avatar: e.target.result };
            localStorage.setItem('currentUser', JSON.stringify(updatedUser));
            currentUser = updatedUser;
            
            // Update avatar in modal
            const avatarImg = document.querySelector('.profile-avatar img');
            if (avatarImg) avatarImg.src = e.target.result;
            
            showNotification('Profile photo updated!', 'success');
        };
        reader.readAsDataURL(file);
        
    } catch (error) {
        showNotification('Failed to update profile photo. Please try again.', 'error');
    }
}

// Check authentication state
function checkAuthState() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        currentUser = JSON.parse(storedUser);
        updateAuthUI();
    }
}

// Check remember me status
function checkRememberMe() {
    const rememberMe = localStorage.getItem('rememberMe');
    const rememberedEmail = localStorage.getItem('rememberedEmail');
    
    if (rememberMe && rememberedEmail) {
        const loginEmail = document.querySelector('#loginEmail');
        const rememberMeCheckbox = document.querySelector('#rememberMe');
        
        if (loginEmail) loginEmail.value = rememberedEmail;
        if (rememberMeCheckbox) rememberMeCheckbox.checked = true;
    }
}

// Update UI based on auth state
function updateAuthUI() {
    const authLinks = document.querySelector('.auth-links');
    if (!authLinks) return;
    
    if (currentUser) {
        authLinks.innerHTML = `
            <div class="user-menu">
                <button class="profile-btn">
                    ${currentUser.avatar ? 
                        `<img src="${currentUser.avatar}" alt="Profile">` :
                        `<span class="icon-user"></span>`
                    }
                    <span>${currentUser.name}</span>
                </button>
                <div class="dropdown-menu">
                    <a href="#" onclick="showProfileModal()">
                        <span class="icon-user"></span>
                        Profile
                    </a>
                    <a href="#" onclick="handleLogout(event)">
                        <span class="icon-logout"></span>
                        Logout
                    </a>
                </div>
            </div>
        `;
    } else {
        authLinks.innerHTML = `
            <a href="#" class="login-btn" onclick="showLoginModal()">
                <span class="icon-user"></span>
                <span>Login</span>
            </a>
            <a href="#" class="signup-btn" onclick="showSignupModal()">
                <span>Sign Up</span>
            </a>
        `;
        
        // Reattach event listeners
        const loginBtn = authLinks.querySelector('.login-btn');
        const signupBtn = authLinks.querySelector('.signup-btn');
        if (loginBtn) loginBtn.addEventListener('click', showLoginModal);
        if (signupBtn) signupBtn.addEventListener('click', showSignupModal);
    }
}

// Handle logout
function handleLogout(event) {
    if (event) event.stopPropagation(); // Prevent profile modal from opening
    
    localStorage.removeItem('currentUser');
    currentUser = null;
    updateAuthUI();
    showNotification('Successfully logged out!', 'success');
}

// Setup password visibility toggle
function setupPasswordToggle(modal) {
    const toggleBtns = modal.querySelectorAll('.toggle-password');
    toggleBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const input = btn.parentElement.querySelector('input');
            const icon = btn.querySelector('span');
            
            if (input.type === 'password') {
                input.type = 'text';
                icon.className = 'icon-eye-off';
            } else {
                input.type = 'password';
                icon.className = 'icon-eye';
            }
        });
    });
}

// Setup password strength meter
function setupPasswordStrengthMeter(modal) {
    const passwordInput = modal.querySelector('#signupPassword') || modal.querySelector('#newPassword');
    if (!passwordInput) return;
    
    const strengthBar = modal.querySelector('.strength-bar');
    const strengthText = modal.querySelector('.strength-text span');
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = checkPasswordStrength(password);
        
        strengthBar.style.width = `${strength.score * 25}%`;
        strengthBar.className = `strength-bar ${strength.level}`;
        strengthText.textContent = strength.level;
    });
}

// Check password strength
function checkPasswordStrength(password) {
    let score = 0;
    let level = 'weak';
    
    if (password.length >= MIN_PASSWORD_LENGTH) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/\d/)) score++;
    if (password.match(/[^a-zA-Z\d]/)) score++;
    
    if (score >= 4) level = 'strong';
    else if (score >= 2) level = 'medium';
    
    return { score, level };
}

// Check if password is strong enough
function isPasswordStrong(password) {
    const strength = checkPasswordStrength(password);
    return strength.score >= 2; // Require at least medium strength
}

// Enhanced modal close function with animation
function setupModalClose(modal) {
    const closeBtn = modal.querySelector('.modal-close');
    const modalContent = modal.querySelector('.modal-content');
    
    const closeModal = () => {
        modal.classList.remove('show');
        modalContent.classList.remove('show');
        setTimeout(() => modal.remove(), 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });
    
    // Close on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });
}

function setupPasswordStrength(modal) {
    const passwordInput = modal.querySelector('#signupPassword');
    const strengthDiv = modal.querySelector('.password-strength');
    
    passwordInput.addEventListener('input', () => {
        const password = passwordInput.value;
        const strength = calculatePasswordStrength(password);
        updatePasswordStrengthUI(strengthDiv, strength);
    });
}

function calculatePasswordStrength(password) {
    let score = 0;
    if (password.length >= 8) score++;
    if (password.match(/[a-z]/) && password.match(/[A-Z]/)) score++;
    if (password.match(/\d/)) score++;
    if (password.match(/[^a-zA-Z\d]/)) score++;
    return score;
}

function updatePasswordStrengthUI(element, strength) {
    const messages = ['Weak', 'Fair', 'Good', 'Strong'];
    const colors = ['#ff4444', '#ffbb33', '#00C851', '#007E33'];
    if (strength > 0) {
        element.innerHTML = `
            <div class="strength-bar">
                ${Array(4).fill().map((_, i) => `
                    <div class="bar" style="background: ${i < strength ? colors[strength-1] : '#ddd'}"></div>
                `).join('')}
            </div>
            <span style="color: ${colors[strength-1]}">${messages[strength-1]}</span>
        `;
    } else {
        element.innerHTML = '';
    }
}
