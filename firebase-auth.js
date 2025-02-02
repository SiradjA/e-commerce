// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut, GoogleAuthProvider, signInWithPopup, FacebookAuthProvider, onAuthStateChanged, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-analytics.js";
import { getFirestore, doc, setDoc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyDUgWZQiKd-BVK0ZWhWfYZLoK2N5ugO_5o",
    authDomain: "customizable-apparel.firebaseapp.com",
    projectId: "customizable-apparel",
    storageBucket: "customizable-apparel.firebasestorage.app",
    messagingSenderId: "559446540234",
    appId: "1:559446540234:web:0188fb3cac7e1898605933",
    measurementId: "G-43PW8BB1TS"
};

// Initialize Firebase services
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);
const analytics = getAnalytics(app);

// Auth providers
const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

// Override the existing handleLogin function
window.handleLogin = async function(form) {
    const email = form.querySelector('#loginEmail').value;
    const password = form.querySelector('#loginPassword').value;
    const rememberMe = form.querySelector('#rememberMe').checked;

    try {
        showLoadingState(true);
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get additional user data from Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() || {};

        // Store user data
        const userToStore = {
            id: user.uid,
            email: user.email,
            name: userData.name || email.split('@')[0],
            avatar: userData.avatar || null
        };

        if (rememberMe) {
            localStorage.setItem('rememberMe', 'true');
            localStorage.setItem('rememberedEmail', email);
        }

        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        currentUser = userToStore;

        // Update UI
        updateAuthUI();
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
        showNotification('Successfully logged in!', 'success');
        
    } catch (error) {
        console.error('Login error:', error);
        showNotification(getErrorMessage(error), 'error');
    } finally {
        showLoadingState(false);
    }
};

// Override the existing handleSignup function
window.handleSignup = async function(form) {
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
        showLoadingState(true);
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Store additional user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name,
            email,
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString()
        });

        const userToStore = {
            id: user.uid,
            email: user.email,
            name: name
        };

        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        currentUser = userToStore;

        // Update UI
        updateAuthUI();
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
        showNotification('Successfully signed up!', 'success');
        
    } catch (error) {
        console.error('Signup error:', error);
        showNotification(getErrorMessage(error), 'error');
    } finally {
        showLoadingState(false);
    }
};

// Override the existing handleSocialLogin function
window.handleSocialLogin = async function(provider) {
    try {
        showLoadingState(true);
        const authProvider = provider === 'google' ? googleProvider : facebookProvider;
        const result = await signInWithPopup(auth, authProvider);
        const user = result.user;

        // Check if user exists in Firestore
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        
        if (!userDoc.exists()) {
            // Create new user document if first time
            await setDoc(doc(db, 'users', user.uid), {
                name: user.displayName,
                email: user.email,
                avatar: user.photoURL,
                createdAt: new Date().toISOString(),
                lastLogin: new Date().toISOString(),
                provider
            });
        } else {
            // Update last login
            await updateDoc(doc(db, 'users', user.uid), {
                lastLogin: new Date().toISOString()
            });
        }

        const userToStore = {
            id: user.uid,
            email: user.email,
            name: user.displayName,
            avatar: user.photoURL
        };

        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        currentUser = userToStore;

        // Update UI
        updateAuthUI();
        
        showNotification(`Successfully logged in with ${provider}!`, 'success');
        
    } catch (error) {
        console.error('Social login error:', error);
        showNotification(getErrorMessage(error), 'error');
    } finally {
        showLoadingState(false);
    }
};

// Override the existing handlePasswordRecovery function
window.handlePasswordRecovery = async function(form) {
    const email = form.querySelector('#recoveryEmail').value;
    
    try {
        showLoadingState(true);
        await sendPasswordResetEmail(auth, email);
        showNotification('Recovery email sent! Please check your inbox.', 'success');
        
        // Close modal
        const modal = document.querySelector('.auth-modal');
        if (modal) modal.remove();
        
    } catch (error) {
        console.error('Password recovery error:', error);
        showNotification(getErrorMessage(error), 'error');
    } finally {
        showLoadingState(false);
    }
};

// Override the existing handleLogout function
window.handleLogout = async function(event) {
    if (event) event.stopPropagation();
    
    try {
        await signOut(auth);
        localStorage.removeItem('currentUser');
        currentUser = null;
        updateAuthUI();
        showNotification('Successfully logged out!', 'success');
    } catch (error) {
        console.error('Logout error:', error);
        showNotification(getErrorMessage(error), 'error');
    }
};

// Override the existing handleProfileUpdate function
window.handleProfileUpdate = async function(form) {
    if (!currentUser?.id) return;

    const name = form.querySelector('#profileName').value;
    const email = form.querySelector('#profileEmail').value;
    
    try {
        showLoadingState(true);
        
        // Update in Firestore
        await updateDoc(doc(db, 'users', currentUser.id), {
            name,
            email,
            updatedAt: new Date().toISOString()
        });

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
        console.error('Profile update error:', error);
        showNotification(getErrorMessage(error), 'error');
    } finally {
        showLoadingState(false);
    }
};

// Override the existing handleAvatarChange function
window.handleAvatarChange = async function(event) {
    if (!currentUser?.id) return;
    
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        showLoadingState(true);
        
        // Upload to Firebase Storage
        const storageRef = ref(storage, `avatars/${currentUser.id}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        // Update in Firestore
        await updateDoc(doc(db, 'users', currentUser.id), {
            avatar: downloadURL,
            updatedAt: new Date().toISOString()
        });

        const updatedUser = { ...currentUser, avatar: downloadURL };
        localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        currentUser = updatedUser;
        
        // Update avatar in modal
        const avatarImg = document.querySelector('.profile-avatar img');
        if (avatarImg) avatarImg.src = downloadURL;
        
        showNotification('Profile photo updated!', 'success');
        
    } catch (error) {
        console.error('Avatar update error:', error);
        showNotification(getErrorMessage(error), 'error');
    } finally {
        showLoadingState(false);
    }
};

// Helper function to get user-friendly error messages
function getErrorMessage(error) {
    switch (error.code) {
        case 'auth/email-already-in-use':
            return 'This email is already registered. Please login instead.';
        case 'auth/invalid-email':
            return 'Please enter a valid email address.';
        case 'auth/operation-not-allowed':
            return 'This operation is not allowed.';
        case 'auth/weak-password':
            return 'Please choose a stronger password.';
        case 'auth/user-disabled':
            return 'This account has been disabled.';
        case 'auth/user-not-found':
            return 'No account found with this email.';
        case 'auth/wrong-password':
            return 'Incorrect password.';
        case 'auth/popup-closed-by-user':
            return 'Login popup was closed. Please try again.';
        default:
            return 'An error occurred. Please try again.';
    }
}

// Listen for auth state changes
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data() || {};
        
        const userToStore = {
            id: user.uid,
            email: user.email,
            name: userData.name || user.displayName || user.email.split('@')[0],
            avatar: userData.avatar || user.photoURL
        };
        
        localStorage.setItem('currentUser', JSON.stringify(userToStore));
        currentUser = userToStore;
        updateAuthUI();
    } else {
        localStorage.removeItem('currentUser');
        currentUser = null;
        updateAuthUI();
    }
}); 