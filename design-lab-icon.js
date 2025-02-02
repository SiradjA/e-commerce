// Design Lab Icon Animation
function createParticles(containerId) {
    const particlesContainer = document.getElementById(containerId);
    if (!particlesContainer) return;

    const particleCount = 10;

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        
        // Random position and size
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.width = particle.style.height = 
            `${Math.random() * 3 + 1}px`;
        
        // Random animation delay and duration
        particle.style.animationDelay = `${Math.random() * 2}s`;
        particle.style.animationDuration = `${Math.random() * 2 + 2}s`;
        
        particlesContainer.appendChild(particle);
    }
}

// Initialize particle effects for design lab icons
function initDesignLabIcons() {
    const icons = document.querySelectorAll('.design-lab-icon');
    
    icons.forEach((icon, index) => {
        const particlesId = `design-lab-particles-${index}`;
        const particlesContainer = icon.querySelector('.particles');
        if (particlesContainer) {
            particlesContainer.id = particlesId;

            // Create particles on mouse enter
            icon.addEventListener('mouseenter', () => {
                createParticles(particlesId);
            });

            // Remove particles after animation
            icon.addEventListener('mouseleave', () => {
                const particles = particlesContainer.querySelectorAll('.particle');
                particles.forEach(particle => {
                    particle.remove();
                });
            });

            // Add random sparkle effect
            setInterval(() => {
                if (icon.matches(':hover')) {
                    const sparkle = document.createElement('div');
                    sparkle.className = 'particle';
                    sparkle.style.animation = 'sparkle 1s ease';
                    sparkle.style.left = `${Math.random() * 100}%`;
                    sparkle.style.top = `${Math.random() * 100}%`;
                    particlesContainer.appendChild(sparkle);
                    
                    setTimeout(() => sparkle.remove(), 1000);
                }
            }, 500);
        }
    });
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', initDesignLabIcons); 