// ========================================
// Animation Utilities
// ========================================

/**
 * FLIP animation: move a card element from its current position
 * to a target rectangle (top-left corner mini profile).
 *
 * @param {Element} cardEl   - The card DOM element to animate
 * @param {DOMRect} targetRect - Target position { top, left, width, height }
 * @param {number} [duration=400]
 * @returns {Promise<void>} resolves when animation completes
 */
export function animateCardToCorner(cardEl, targetRect, duration = 400) {
    return new Promise((resolve) => {
        // First: capture current position
        const firstRect = cardEl.getBoundingClientRect();

        // Apply fixed positioning at current location
        cardEl.classList.add('card-animating');
        cardEl.style.top = `${firstRect.top}px`;
        cardEl.style.left = `${firstRect.left}px`;
        cardEl.style.width = `${firstRect.width}px`;
        cardEl.style.height = `${firstRect.height}px`;

        // Force layout
        cardEl.offsetHeight;

        // Last: animate to target
        cardEl.style.transition = `all ${duration}ms cubic-bezier(0.16, 1, 0.3, 1)`;
        cardEl.style.top = `${targetRect.top}px`;
        cardEl.style.left = `${targetRect.left}px`;
        cardEl.style.width = `${targetRect.width}px`;
        cardEl.style.height = `${targetRect.height}px`;
        cardEl.style.borderRadius = '12px';

        const onEnd = () => {
            cardEl.removeEventListener('transitionend', onEnd);
            cardEl.classList.remove('card-animating');
            // Reset inline styles
            cardEl.style.cssText = '';
            resolve();
        };

        cardEl.addEventListener('transitionend', onEnd, { once: true });

        // Fallback timeout
        setTimeout(() => {
            onEnd();
        }, duration + 50);
    });
}

/**
 * Fade in an element
 * @param {Element} el
 * @param {number} [duration=300]
 * @returns {Promise<void>}
 */
export function fadeIn(el, duration = 300) {
    return new Promise((resolve) => {
        el.style.opacity = '0';
        el.style.display = '';
        el.style.transition = `opacity ${duration}ms ease`;
        // Force reflow
        el.offsetHeight;
        el.style.opacity = '1';
        setTimeout(() => {
            el.style.transition = '';
            resolve();
        }, duration);
    });
}

/**
 * Fade out an element
 * @param {Element} el
 * @param {number} [duration=300]
 * @returns {Promise<void>}
 */
export function fadeOut(el, duration = 300) {
    return new Promise((resolve) => {
        el.style.transition = `opacity ${duration}ms ease`;
        el.style.opacity = '0';
        setTimeout(() => {
            el.style.display = 'none';
            el.style.transition = '';
            el.style.opacity = '';
            resolve();
        }, duration);
    });
}

/**
 * Show a toast message
 * @param {string} message
 * @param {number} [duration=2500]
 */
export function showToast(message, duration = 2500) {
    // Remove existing toast
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);

    // Trigger animation
    requestAnimationFrame(() => {
        toast.classList.add('visible');
    });

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}
