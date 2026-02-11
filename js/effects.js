/**
 * Sparkle/Bubble Effects
 * Generates random floating elements for the "Summer Refresh" theme.
 */

export function initSparkles() {
    const container = document.createElement('div');
    container.id = 'effects-container';
    container.style.position = 'fixed';
    container.style.top = '0';
    container.style.left = '0';
    container.style.width = '100%';
    container.style.height = '100%';
    container.style.pointerEvents = 'none';
    container.style.zIndex = '0'; // Behind everything
    container.style.overflow = 'hidden';
    document.body.prepend(container);

    // Create initial batch
    for (let i = 0; i < 15; i++) {
        createSparkle(container);
    }

    // Add more periodically
    setInterval(() => {
        if (container.children.length < 30) {
            createSparkle(container);
        }
    }, 2000);
}

function createSparkle(container) {
    const el = document.createElement('div');
    el.classList.add('sparkle');

    // Random Properties
    const size = Math.random() * 60 + 20; // 20px - 80px
    const left = Math.random() * 100; // 0% - 100%
    const duration = Math.random() * 10 + 10; // 10s - 20s
    const delay = Math.random() * 5;
    const opacity = Math.random() * 0.3 + 0.1;

    el.style.width = `${size}px`;
    el.style.height = `${size}px`;
    el.style.left = `${left}%`;
    el.style.bottom = `-${size}px`; // Start below screen
    el.style.opacity = opacity;
    el.style.animationDuration = `${duration}s`;
    el.style.animationDelay = `${delay}s`;

    // Randomize shape slightly (bubbles)
    el.style.background = 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1))';
    el.style.borderRadius = '50%';
    el.style.position = 'absolute';
    el.style.filter = 'blur(2px)';

    // Cleanup after animation
    el.addEventListener('animationend', () => {
        el.remove();
    });

    container.appendChild(el);
}
