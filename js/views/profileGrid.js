// ========================================
// View: Profile Grid
// ========================================

import { createElement, clearContainer } from '../utils/dom.js';
import { getState } from '../state.js';

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
        createElement('h2', { className: 'view-title' }, '순장 프로필'),
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

    filteredProfiles.forEach((senior) => {
        const card = createProfileCard(senior);
        card.addEventListener('click', () => {
            onCardSelect(senior.id, card);
        });
        grid.appendChild(card);
    });

    container.appendChild(grid);
}

/**
 * Create a single profile card element
 * @param {Object} senior
 * @returns {HTMLElement}
 */
export function createProfileCard(senior) {
    const card = createElement('div', {
        className: 'profile-card',
        dataset: { seniorId: senior.id },
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
        imgWrapper.style.background = `linear-gradient(135deg, #FFB900, #FFD460)`;
        imgWrapper.style.display = 'flex';
        imgWrapper.style.alignItems = 'center';
        imgWrapper.style.justifyContent = 'center';
        const initial = createElement('span', {
            style: { fontSize: '3rem', color: '#fff', fontWeight: '700' },
        }, senior.name.charAt(0));
        imgWrapper.appendChild(initial);
    };
    imgWrapper.appendChild(img);
    card.appendChild(imgWrapper);

    // Info
    const info = createElement('div', { className: 'profile-card__info' });
    info.appendChild(createElement('div', { className: 'profile-card__role' }, senior.role));
    info.appendChild(createElement('div', { className: 'profile-card__name' }, senior.name));
    info.appendChild(createElement('p', { className: 'profile-card__intro' }, senior.introduction));
    card.appendChild(info);

    return card;
}
