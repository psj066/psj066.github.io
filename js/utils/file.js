/**
 * Read a file as Data URL
 * @param {File} file
 * @returns {Promise<string>}
 */
export function readImage(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target.result);
        reader.onerror = (e) => reject(e);
        reader.readAsDataURL(file);
    });
}

/**
 * Resize an image to a maximum width/height (maintains aspect ratio)
 * @param {string} dataUrl - original base64 image
 * @param {number} maxWidth - max width in pixels (default: 300)
 * @param {number} quality - jpeg quality 0-1 (default: 0.7)
 * @returns {Promise<string>} - resized base64 image
 */
export function resizeImage(dataUrl, maxWidth = 300, quality = 0.7) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height = Math.round((height * maxWidth) / width);
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            resolve(canvas.toDataURL('image/jpeg', quality));
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}
