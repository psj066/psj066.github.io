// ========================================
// State Management — API & localStorage mixed
// ========================================

import { fetchFromApi, postToApi } from './utils/api.js';

const STORAGE_KEY = 'ccc_sun_profile';

let state = {
    applicant: null,       // { studentId, age, gender, introduction } -> Kept in localStorage
    reservations: [],      // [{ applicant, seniorId, date, time, createdAt }] -> Fetched from API
    currentView: 'applicantForm',
};

/**
 * Load state
 * - Applicant info: from localStorage (so user doesn't re-enter)
 * - Reservations: from API (to see global slots taken)
 */
export async function loadState() {
    // 1. Load local preferences (Applicant info)
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const parsed = JSON.parse(saved);
            // Only restore applicant info and current view
            if (parsed.applicant) state.applicant = parsed.applicant;
            if (parsed.currentView) state.currentView = parsed.currentView;
        }
    } catch (e) {
        console.warn('Failed to load local state:', e);
    }

    // 2. Load globally synced data (Reservations)
    try {
        const data = await fetchFromApi('getReservations');
        console.log('Loaded reservations:', data); // DEBUG
        if (Array.isArray(data)) {
            state.reservations = data;
        }
    } catch (e) {
        console.warn('Failed to load reservations from API:', e);
        // state.reservations remains []
    }
}

/**
 * Save current state to localStorage (Only local parts)
 */
export function saveState() {
    try {
        // Ensure photo is not saved for applicant
        const cleanApplicant = state.applicant ? {
            name: state.applicant.name,
            studentId: state.applicant.studentId,
            age: state.applicant.age,
            gender: state.applicant.gender,
            introduction: state.applicant.introduction
        } : null;

        const toSave = {
            applicant: cleanApplicant,
            currentView: state.currentView
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
        console.warn('Failed to save state:', e);
    }
}

/**
 * Get current state (read-only copy)
 * @returns {Object}
 */
export function getState() {
    return { ...state };
}

/**
 * Update a state key and auto-persist
 * @param {string} key
 * @param {*} value
 */
export function setState(key, value) {
    state[key] = value;
    saveState();
}

/**
 * Add a reservation and persist to API
 * @param {{ seniorId: string, date: string, time: string }} reservation
 */
export async function addReservation(reservation) {
    const entry = {
        ...reservation,
        applicant: { ...state.applicant },
        createdAt: new Date().toISOString(),
    };

    // Optimistic update
    state.reservations.push(entry);

    try {
        await postToApi('addReservation', entry);
        // Success
        return entry;
    } catch (e) {
        console.error('Failed to add reservation:', e);
        if (idx > -1) state.reservations.splice(idx, 1);
        throw e;
    }
}

/**
 * Delete a reservation
 * @param {{ seniorId: string, date: string, time: string }} reservation
 */
export async function deleteReservation(reservation) {
    // Optimistic remove
    const idx = state.reservations.findIndex(
        r => r.seniorId === reservation.seniorId && r.date === reservation.date && r.time === reservation.time
    );

    let removedItem = null;
    if (idx > -1) {
        removedItem = state.reservations[idx];
        state.reservations.splice(idx, 1);
    }

    try {
        await postToApi('deleteReservation', {
            seniorId: reservation.seniorId,
            date: reservation.date,
            time: reservation.time
        });
    } catch (e) {
        console.error('Failed to delete reservation:', e);
        // Rollback
        if (removedItem) state.reservations.splice(idx, 0, removedItem);
        throw e;
    }
}

/**
 * Get all reservations
 * @returns {Array}
 */
export function getReservations() {
    return [...state.reservations];
}

/**
 * Check if a specific slot is already booked
 * @param {string} seniorId
 * @param {string} date
 * @param {string} time
 * @returns {boolean}
 */
export function isSlotBooked(seniorId, date, time) {
    return state.reservations.some(
        (r) => r.seniorId === seniorId && r.date === date && r.time === time
    );
}

/**
 * Clear all state (for debugging)
 */
export function clearState() {
    state = { applicant: null, reservations: [], currentView: 'applicantForm' };
    localStorage.removeItem(STORAGE_KEY);
}
