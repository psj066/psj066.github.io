// ========================================
// Date Utilities
// ========================================

const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];

/**
 * Generate an array of Date objects from start to end (inclusive)
 * @param {string} startStr - "YYYY-MM-DD"
 * @param {string} endStr   - "YYYY-MM-DD"
 * @returns {Date[]}
 */
export function getDateRange(startStr, endStr) {
    const dates = [];
    const current = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');

    while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
    }

    return dates;
}

/**
 * Format a Date to a localized string
 * @param {Date} date
 * @param {'short'|'long'} [style='short']
 * @returns {string}  e.g. "2/22 (토)" or "2월 22일 (토)"
 */
export function formatDate(date, style = 'short') {
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = DAY_NAMES[date.getDay()];

    if (style === 'long') {
        return `${month}월 ${day}일 (${weekday})`;
    }
    return `${month}/${day} (${weekday})`;
}

/**
 * Get Korean weekday name
 * @param {Date} date
 * @returns {string}
 */
export function getDayOfWeek(date) {
    return DAY_NAMES[date.getDay()];
}

/**
 * Check if a day is weekend (Saturday or Sunday)
 * @param {Date} date
 * @returns {boolean}
 */
export function isWeekend(date) {
    const day = date.getDay();
    return day === 0 || day === 6;
}

/**
 * Compare two dates (date-only, ignoring time)
 * @param {Date} a
 * @param {Date} b
 * @returns {boolean}
 */
export function isSameDate(a, b) {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

/**
 * Convert Date to YYYY-MM-DD string
 * @param {Date} date
 * @returns {string}
 */
export function toDateString(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
