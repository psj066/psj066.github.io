// ========================================
// View: Profile Grid
// ========================================

import { createElement, clearContainer } from '../utils/dom.js';
import { getState, getReservations } from '../state.js';


/**
 * Render profile cards in a grid
 * @param {HTMLElement} container
 * @param {Object[]} profiles - SENIOR_PROFILES array
 * @param {Function} onCardSelect - callback(seniorId, cardElement)
 */
export function renderProfileGrid(container, profiles, onCardSelect) {
    clearContainer(container);

    // Header
    const header = createElement('div', { className: 'anim-fade-in' },
        createElement('h2', { className: 'view-title' }, '순모임 신청'),
        createElement('p', { className: 'view-subtitle' }, '만나고 싶은 순장님을 선택해주세요!')
    );
    container.appendChild(header);

    // Filter by Gender
    const applicantGender = getState().applicant?.gender || '남'; // Default to Male if unknown
    const filteredProfiles = profiles.filter(p => {
        const seniorGender = p.gender || '남';
        return seniorGender === applicantGender;
    });

    if (filteredProfiles.length === 0) {
        const empty = createElement('div', { className: 'empty-state anim-fade-in' });
        empty.appendChild(createElement('div', { className: 'empty-state__icon' }, '🧐'));
        empty.appendChild(createElement('p', { className: 'empty-state__text' }, `조건에 맞는 순장님이 없습니다 (${applicantGender})`));
        container.appendChild(empty);
        return;
    }

    // Grid
    const grid = createElement('div', { className: 'profile-grid stagger-children' });

    // Calculate reservation counts
    const allReservations = getReservations();
    const reservationCounts = {};
    allReservations.forEach(r => {
        const sid = r.seniorId;
        reservationCounts[sid] = (reservationCounts[sid] || 0) + 1;
    });

    filteredProfiles.forEach((senior) => {
        const count = reservationCounts[senior.id] || 0;
        const isFull = count >= 3;

        const card = createProfileCard(senior, isFull, count);

        if (!isFull) {
            card.addEventListener('click', () => {
                onCardSelect(senior.id, card);
            });
        }
        grid.appendChild(card);
    });


    container.appendChild(grid);
}


/**
 * Create a single profile card element
 * @param {Object} senior
 * @param {boolean} isFull
 * @param {number} count
 * @returns {HTMLElement}
 */
export function createProfileCard(senior, isFull = false, count = 0) {

    const card = createElement('div', {
        className: `profile-card ${isFull ? 'disabled' : ''}`,
        dataset: { seniorId: senior.id },
        style: isFull ? { opacity: '0.6', cursor: 'not-allowed', filter: 'grayscale(1)' } : {}
    });


    // Image
    const imgWrapper = createElement('div', { className: 'profile-card__image-wrapper' });
    const img = createElement('img', {
        className: 'profile-card__image',
        src: senior.photo,
        alt: senior.name,
    });
    // Fallback for missing images
    img.onerror = function () {
        this.style.display = 'none';
        imgWrapper.style.background = '#ffffff'; // Simple White
        imgWrapper.style.display = 'flex';
        imgWrapper.style.alignItems = 'center';
        imgWrapper.style.justifyContent = 'center';
        const initial = createElement('span', {
            style: { fontSize: '3rem', color: 'var(--color-primary-dark)', fontWeight: '700' }, // Dark text
        }, senior.name.charAt(0));
        imgWrapper.appendChild(initial);
    };
    imgWrapper.appendChild(img);
    // Overlay for Full
    if (isFull) {
        const overlay = createElement('div', {
            style: {
                position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', borderRadius: 'inherit',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontSize: '1.2rem', fontWeight: 'bold', zIndex: 10
            }
        }, '마감됨');
        imgWrapper.appendChild(overlay);
    }

    card.appendChild(imgWrapper);


    // Info
    const info = createElement('div', { className: 'profile-card__info' });
    info.appendChild(createElement('div', { className: 'profile-card__name' }, senior.name));
    // Role removed as per request
    // info.appendChild(createElement('div', { className: 'profile-card__role' }, senior.role));
    info.appendChild(createElement('p', { className: 'profile-card__intro' }, senior.introduction));
    card.appendChild(info);

    return card;
}
