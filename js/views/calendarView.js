// ========================================
// View: Calendar — booking time slots
// ========================================

import { $, createElement, clearContainer } from '../utils/dom.js';
import { getDateRange, formatDate, isWeekend, toDateString } from '../utils/date.js';
import { showToast } from '../utils/animation.js';
import { getAvailableSlots, getSeniorById } from '../data.js';
import { addReservation, isSlotBooked } from '../state.js';

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

    // Header container (Nav + Mini Profile)
    // We inject the back button into the mini profile for a unified sticky header
    const sidebar = buildMiniProfile(senior, backBtn);
    container.appendChild(sidebar);

    // Calendar
    const calendar = buildCalendar(senior);
    container.appendChild(calendar);

    // Bind time slot clicks
    bindTimeSlotEvents(container, senior, onReserved);
}

/**
 * Build the mini profile sidebar (Sticky Header)
 */
function buildMiniProfile(senior, backBtn) {
    const wrapper = createElement('div', { className: 'mini-profile' });

    const leftGroup = createElement('div', { style: { display: 'flex', alignItems: 'center' } });
    leftGroup.appendChild(backBtn);

    const info = createElement('div', { className: 'mini-profile__info' });
    info.appendChild(createElement('div', { className: 'mini-profile__name' }, senior.name));
    info.appendChild(createElement('div', { className: 'mini-profile__role' }, senior.role));
    leftGroup.appendChild(info);

    wrapper.appendChild(leftGroup);
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
    container.addEventListener('click', (e) => {
        const chip = e.target.closest('.time-chip');
        if (!chip || chip.classList.contains('booked')) return;

        const { date, time, seniorId } = chip.dataset;

        // Deselect any previously selected
        const prevSelected = container.querySelector('.time-chip.selected');
        if (prevSelected && prevSelected !== chip) {
            prevSelected.classList.remove('selected');
        }

        // Toggle selection
        chip.classList.toggle('selected');

        if (chip.classList.contains('selected')) {
            showConfirmBar(container, senior, date, time, onReserved);
        } else {
            hideConfirmBar();
        }
    });
}

/**
 * Show the confirmation bar at bottom
 */
function showConfirmBar(container, senior, date, time, onReserved) {
    // Remove existing
    hideConfirmBar();

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
 */
function hideConfirmBar() {
    const bar = $('#confirm-bar');
    if (bar) {
        bar.classList.remove('active');
        setTimeout(() => bar.remove(), 400);
    }
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
