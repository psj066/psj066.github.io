// ========================================
// Senior Profile Data — Google Apps Script API backed
// ========================================

import { fetchFromApi, postToApi } from './utils/api.js';

/**
 * Live senior profiles list — cached in memory
 */
let SENIOR_PROFILES = [];

/**
 * Load seniors from API
 */
export async function loadSeniors() {
    try {
        const data = await fetchFromApi('getSeniors');
        if (Array.isArray(data)) {
            SENIOR_PROFILES = data;
        }
    } catch (e) {
        console.warn('Failed to load seniors from API:', e);
        // Fallback or empty? For now, empty if API fails
        SENIOR_PROFILES = [];
    }
}

/**
 * Get all senior profiles (read-only copy of the array reference)
 * Note: This is synchronous, so ensure loadSeniors() is awaited before calling this on init.
 */
export function getSeniorProfiles() {
    return SENIOR_PROFILES;
}

/**
 * Get a senior profile by ID
 */
export function getSeniorById(id) {
    return SENIOR_PROFILES.find((s) => s.id === id);
}

/**
 * Get available time slots for a senior on a specific date
 */
export function getAvailableSlots(seniorId, dateStr) {
    const senior = getSeniorById(seniorId);
    if (!senior) return [];

    // Safety check for malformed data
    if (!senior.availableSlots || !Array.isArray(senior.availableSlots)) return [];

    const slot = senior.availableSlots.find((s) => s.date === dateStr);
    return slot ? slot.times : [];
}

/**
 * Add a new senior profile
 */
export async function addSenior(seniorData) {
    // Optimistic update
    const tempId = 'senior_temp_' + Date.now();
    const newSenior = {
        id: tempId,
        ...seniorData
    };
    SENIOR_PROFILES.push(newSenior);

    try {
        const res = await postToApi('addSenior', seniorData);
        // Update with real ID/PhotoURL from server
        const index = SENIOR_PROFILES.findIndex(s => s.id === tempId);
        if (index !== -1) {
            SENIOR_PROFILES[index] = { ...newSenior, id: res.id, photo: res.photo };
        }
        return SENIOR_PROFILES[index];
    } catch (e) {
        console.error('Failed to add senior:', e);
        // Rollback
        const idx = SENIOR_PROFILES.findIndex(s => s.id === tempId);
        if (idx !== -1) SENIOR_PROFILES.splice(idx, 1);
        throw e;
    }
}

/**
 * Update an existing senior profile
 */
export async function updateSenior(id, updates) {
    const index = SENIOR_PROFILES.findIndex((s) => s.id === id);
    if (index === -1) return null;

    const original = { ...SENIOR_PROFILES[index] };

    // Optimistic update
    SENIOR_PROFILES[index] = { ...original, ...updates };

    try {
        const res = await postToApi('updateSenior', { id, ...updates });
        // Update photo if changed by server (e.g. upload)
        if (res.photo) {
            SENIOR_PROFILES[index].photo = res.photo;
        }
        return SENIOR_PROFILES[index];
    } catch (e) {
        console.error('Failed to update senior:', e);
        // Rollback
        SENIOR_PROFILES[index] = original;
        throw e;
    }
}

/**
 * Delete a senior profile
 */
export async function deleteSenior(id) {
    const index = SENIOR_PROFILES.findIndex((s) => s.id === id);
    if (index === -1) return false;

    const original = SENIOR_PROFILES[index];

    // Optimistic update
    SENIOR_PROFILES.splice(index, 1);

    try {
        await postToApi('deleteSenior', { id });
        return true;
    } catch (e) {
        console.error('Failed to delete senior:', e);
        // Rollback
        SENIOR_PROFILES.splice(index, 0, original);
        throw e;
    }
}
