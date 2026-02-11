/**
 * ========================================
 * API Adapter for Google Apps Script
 * ========================================
 */

const API_URL = 'https://script.google.com/macros/s/AKfycbzrBDvAr9FUAk1gnPwial5N2hrgTa0p0WBAOZUGM9M577rPSYEDu9m3BzFS-dKLKC20/exec';

/**
 * Generic fetch wrapper
 * @param {string} action
 * @param {Object} [params={}]
 */
export async function fetchFromApi(action, params = {}) {
    const query = new URLSearchParams({ action, ...params }).toString();
    const response = await fetch(`${API_URL}?${query}`);
    const json = await response.json();

    if (json.result === 'error') {
        throw new Error(json.message);
    }
    return json.data;
}

/**
 * Generic post wrapper
 * @param {string} action
 * @param {Object} payload
 */
export async function postToApi(action, payload) {
    // changing content-type to text/plain avoids CORS preflight issues with GAS
    const response = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({ action, payload })
    });

    const json = await response.json();
    if (json.result === 'error') {
        throw new Error(json.message);
    }
    return json.data;
}
