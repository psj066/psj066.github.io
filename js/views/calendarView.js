// ========================================
// View: Calendar — booking time slots
// ========================================

import { $, createElement, clearContainer } from '../utils/dom.js';
import { getDateRange, formatDate, isWeekend, toDateString } from '../utils/date.js';
import { showToast } from '../utils/animation.js';
import { getAvailableSlots, getSeniorById } from '../data.js';
import { addReservation, isSlotBooked, getUserReservation, deleteReservation } from '../state.js';

const CALENDAR_START = '2026-02-22';
const CALENDAR_END = '2026-03-07';

/**
 * Render the calendar view for a specific senior
 * @param {HTMLElement} container
 * @param {string} seniorId
 * @param {Function} onBack - called when user clicks back
 * @param {Function} onReserved - called after a reservation is made
 */
export function renderCalendarView(container, seniorId, onBack, onReserved) {
    clearContainer(container);

    const senior = getSeniorById(seniorId);
    if (!senior) return;

    // Back button (Icon)
    const backBtn = createElement('button', {
        className: 'btn-back-icon',
        style: {
            background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer',
            padding: '8px', marginRight: '8px'
        },
        onClick: onBack,
    }, '←');

    // Header container (Nav + Full Profile)
    // Replaced sticky mini-profile with static full profile
    const profileSection = buildFullProfile(senior, backBtn);
    container.appendChild(profileSection);

    // Calendar
    const calendar = buildCalendar(senior);
    container.appendChild(calendar);

    // Bind time slot clicks
    bindTimeSlotEvents(container, senior, onReserved);
}

/**
 * Build the Full Profile (Static at top)
 * Shows full intro unlike the grid view.
 */
function buildFullProfile(senior, backBtn) {
    const wrapper = createElement('div', {
        className: 'calendar-profile-header',
        style: {
            marginBottom: 'var(--spacing-lg)',
            padding: 'var(--spacing-md)',
            background: 'var(--gradient-card)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--color-border)'
        }
    });

    const topRow = createElement('div', { style: { display: 'flex', alignItems: 'center', marginBottom: '12px' } });

    // Back Button (Integrated)
    topRow.appendChild(backBtn);

    // Photo
    // Photo with Fallback
    const photoContainer = createElement('div', {
        style: {
            width: '60px', height: '60px', borderRadius: '50%',
            marginRight: '12px', border: '2px solid var(--color-border)',
            flexShrink: 0, overflow: 'hidden',
            background: '#ffffff', display: 'flex', alignItems: 'center', justifyContent: 'center'
        }
    });

    if (senior.photo) {
        const photo = createElement('img', {
            src: senior.photo,
            style: { width: '100%', height: '100%', objectFit: 'cover' }
        });
        photo.onerror = function () {
            this.style.display = 'none';
            const initial = createElement('span', {
                style: { fontSize: '1.5rem', color: 'var(--color-primary-dark)', fontWeight: '700' },
            }, senior.name.charAt(0));
            photoContainer.appendChild(initial);
        };
        photoContainer.appendChild(photo);
    } else {
        const initial = createElement('span', {
            style: { fontSize: '1.5rem', color: 'var(--color-primary-dark)', fontWeight: '700' },
        }, senior.name.charAt(0));
        photoContainer.appendChild(initial);
    }
    topRow.appendChild(photoContainer);

    // Name & Role
    const info = createElement('div');
    info.appendChild(createElement('div', {
        style: { fontSize: '1.2rem', fontWeight: '700', color: 'var(--color-text)' }
    }, senior.name));
    // info.appendChild(createElement('div', { className: 'mini-profile__role' }, senior.role)); // Role Hidden
    topRow.appendChild(info);

    wrapper.appendChild(topRow);

    // Full Introduction
    if (senior.introduction) {
        const intro = createElement('div', {
            style: {
                fontSize: '0.95rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.6',
                whiteSpace: 'pre-wrap', // Preserve line breaks
                padding: 'var(--spacing-sm)',
                background: 'var(--color-bg-elevated)',
                borderRadius: 'var(--radius-sm)'
            }
        }, senior.introduction);
        wrapper.appendChild(intro);
    }

    return wrapper;
}

/**
 * Build the calendar with available time slots
 */
function buildCalendar(senior) {
    const calendarEl = createElement('div', { className: 'calendar-container' });

    // Date rows
    const dates = getDateRange(CALENDAR_START, CALENDAR_END);

    dates.forEach((date) => {
        const dateStr = toDateString(date);
        const availableTimes = getAvailableSlots(senior.id, dateStr);

        // Only show dates with available slots
        if (availableTimes.length === 0) return;

        const row = renderDateRow(date, dateStr, availableTimes, senior.id);
        calendarEl.appendChild(row);
    });

    return calendarEl;
}

/**
 * Render a single date row with time chips
 */
function renderDateRow(date, dateStr, availableTimes, seniorId) {
    const row = createElement('div', { className: 'date-row' });

    // Date label
    const label = createElement('div', { className: 'date-label' });
    label.appendChild(createElement('div', { className: 'date-label__day' }, formatDate(date, 'short')));
    const weekdayClass = isWeekend(date) ? 'date-label__weekday weekend' : 'date-label__weekday';
    const dayNames = ['일', '월', '화', '수', '목', '금', '토'];
    label.appendChild(createElement('div', { className: weekdayClass }, dayNames[date.getDay()] + '요일'));
    row.appendChild(label);

    // Time chips
    const slotsContainer = createElement('div', { className: 'time-slots' });

    availableTimes.forEach((time) => {
        const booked = isSlotBooked(seniorId, dateStr, time);
        const chip = createElement('button', {
            className: `time-chip${booked ? ' booked' : ''}`,
            dataset: { date: dateStr, time: time, seniorId: seniorId },
            disabled: booked,
        }, time);

        if (booked) {
            chip.title = '이미 예약됨';
        }

        slotsContainer.appendChild(chip);
    });

    row.appendChild(slotsContainer);
    return row;
}

/**
 * Bind click events on time chips
 */
function bindTimeSlotEvents(container, senior, onReserved) {
    let isProcessing = false;

    container.addEventListener('click', async (e) => {
        if (isProcessing) return;

        const chip = e.target.closest('.time-chip');
        if (!chip || chip.classList.contains('booked')) return;

        const { date, time } = chip.dataset;

        isProcessing = true; // Lock

        try {
            // Constraint Check: Single Reservation
            const { getUserReservation, deleteReservation } = await import('../state.js');
            const existingRes = getUserReservation();

            // If user selects a *new* slot (and it's not the one they already have)
            if (existingRes) {
                // Check if clicking their OWN reservation
                if (existingRes.seniorId === senior.id && existingRes.date === date && existingRes.time === time) {
                    return;
                }

                // Only trigger if this is a NEW selection (toggle ON)
                if (!chip.classList.contains('selected')) {
                    document.body.style.cursor = 'wait';

                    try {
                        // Simple confirmation as requested
                        if (confirm('기존 신청을 취소하겠습니까?')) {
                            await deleteReservation(existingRes);
                            showToast('기존 신청이 취소되었습니다.');

                            // Re-enable the OLD slot visually if it's on the current screen
                            if (existingRes.seniorId === senior.id) {
                                const oldChip = container.querySelector(`.time-chip[data-date="${existingRes.date}"][data-time="${existingRes.time}"]`);
                                if (oldChip) {
                                    oldChip.classList.remove('booked');
                                    oldChip.disabled = false;
                                    oldChip.title = '';
                                }
                            }

                            // Revert: Stop here. User must click again. (Intended inconvenience)
                            return;

                        } else {
                            // User Cancelled the interaction
                            return;
                        }
                    } catch (err) {
                        console.error(err);
                        alert('취소에 실패했습니다.');
                        return;
                    }
                }
            }

            // Normal Selection Logic

            // 1. Deselect any previously selected
            const prevSelected = container.querySelector('.time-chip.selected');
            if (prevSelected && prevSelected !== chip) {
                prevSelected.classList.remove('selected');
            }

            // 2. Toggle the clicked chip
            chip.classList.toggle('selected');

            // 3. Show/Hide Confirm Bar
            if (chip.classList.contains('selected')) {
                showConfirmBar(container, senior, date, time, onReserved);
            } else {
                hideConfirmBar();
            }

        } catch (err) {
            console.error('Error in time slot click:', err);
        } finally {
            isProcessing = false; // Unlock
            document.body.style.cursor = 'default';
        }
    });
}

/**
 * Show the confirmation bar at bottom
 */
function showConfirmBar(container, senior, date, time, onReserved) {
    // Remove existing strictly to prevent ID collisions
    hideConfirmBar(true);

    const bar = createElement('div', { className: 'confirm-bar', id: 'confirm-bar' });

    const dateObj = new Date(date + 'T00:00:00');
    const displayDate = formatDate(dateObj, 'long');

    // 2-line info
    const infoDiv = createElement('div', { className: 'confirm-bar__info' });
    infoDiv.innerHTML = `
        <div style="font-weight:bold; color:var(--color-text); font-size:16px;">${senior.name} 순장</div>
        <div style="color:var(--color-primary-dark); font-size:14px; margin-top:2px;">${displayDate} ${time}</div>
    `;
    bar.appendChild(infoDiv);

    const btnGroup = createElement('div', { className: 'confirm-bar__actions' });

    const cancelBtn = createElement('button', {
        className: 'btn btn-secondary',
        onClick: () => {
            const selected = container.querySelector('.time-chip.selected');
            if (selected) selected.classList.remove('selected');
            hideConfirmBar();
        },
    }, '취소');

    const confirmBtn = createElement('button', {
        className: 'btn btn-primary',
        onClick: () => {
            confirmReservation(senior, date, time, container, onReserved);
        },
    }, '신청하기');

    btnGroup.appendChild(cancelBtn);
    btnGroup.appendChild(confirmBtn);
    bar.appendChild(btnGroup);

    document.body.appendChild(bar);

    // Animate in
    requestAnimationFrame(() => {
        bar.classList.add('active');
    });
}

/**
 * Hide the confirmation bar
 * @param {boolean} immediate - if true, remove immediately without animation
 */
function hideConfirmBar(immediate = false) {
    const bars = document.querySelectorAll('.confirm-bar'); // Select ALL
    bars.forEach(bar => {
        if (immediate) {
            bar.remove();
        } else {
            bar.classList.remove('active');
            setTimeout(() => bar.remove(), 400);
        }
    });
}

/**
 * Process reservation
 */
function confirmReservation(senior, date, time, container, onReserved) {
    const reservation = addReservation({
        seniorId: senior.id,
        date,
        time,
    });

    hideConfirmBar();

    // Mark chip as booked
    const chip = container.querySelector(`.time-chip[data-date="${date}"][data-time="${time}"]`);
    if (chip) {
        chip.classList.remove('selected');
        chip.classList.add('booked');
        chip.disabled = true;
        chip.title = '이미 예약됨';
    }

    showToast(`✅ ${senior.name} 선배 · ${formatDate(new Date(date + 'T00:00:00'), 'long')} ${time} 신청 완료!`);

    if (onReserved) {
        onReserved(reservation);
    }
}
