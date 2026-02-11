// ========================================
// App — Main entry point & router
// ========================================

import { $, $$, createElement } from './utils/dom.js';
import { loadState, getState, setState } from './state.js';
import { loadSeniors, getSeniorProfiles, getSeniorById } from './data.js';
import { animateCardToCorner, fadeIn, fadeOut } from './utils/animation.js';
import { renderApplicantForm } from './views/applicantForm.js';
import { renderProfileGrid } from './views/profileGrid.js';
import { renderCalendarView } from './views/calendarView.js';
import { renderMasterPage } from './views/masterPage.js';

import { APP_VERSION } from './config.js';

// ---- App State ----
let currentView = 'applicantForm';

// ---- Initialize ----
document.addEventListener('DOMContentLoaded', initApp);

async function initApp() {
    console.log(`%c CCC Soon Profile v${APP_VERSION} `, 'background: #FFB900; color: #fff; font-size: 12px; font-weight: bold; padding: 4px; border-radius: 4px;');
    // Show simple loading state
    const app = $('#app');
    const loading = createElement('div', {
        className: 'app-loading',
        style: {
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'var(--color-bg)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-primary)'
        }
    }, '로딩 중...');
    document.body.appendChild(loading);

    try {
        await Promise.all([
            loadState(),
            loadSeniors()
        ]);
    } catch (e) {
        console.error('Initialization failed:', e);
        alert('데이터를 불러오는데 실패했습니다. 새로고침 해주세요.');
    } finally {
        loading.remove();
    }

    const state = getState();

    // If applicant already filled in, go to grid
    if (state.applicant) {
        currentView = 'profileGrid';
    }

    // Master page button (password-protected)
    const masterBtn = $('#btn-master-page');
    masterBtn.addEventListener('click', () => {
        const password = prompt('관리자 비밀번호를 입력하세요:');
        if (password === '1984') {
            navigateTo('masterPage');
        } else if (password !== null) {
            alert('비밀번호가 올바르지 않습니다.');
        }
    });

    // My Info button
    const myInfoBtn = $('#btn-my-info');
    myInfoBtn.addEventListener('click', openMyInfoModal);

    // Navigate to initial view
    navigateTo(currentView);
}

/**
 * Navigate to a view
 * @param {string} viewName
 * @param {Object} [params={}]
 */
async function navigateTo(viewName, params = {}) {
    // Hide all views
    $$('.view').forEach((v) => v.classList.remove('active'));

    const masterBtn = $('#btn-master-page');
    const navBtns = $('#nav-buttons');

    switch (viewName) {
        case 'applicantForm': {
            const container = $('#view-applicant-form');
            container.classList.add('active');
            navBtns.style.display = 'none';
            renderApplicantForm(container, (applicantData) => {
                navigateTo('profileGrid');
            });
            break;
        }

        case 'profileGrid': {
            const container = $('#view-profile-grid');
            container.classList.add('active');
            navBtns.style.display = 'flex';
            renderProfileGrid(container, getSeniorProfiles(), async (seniorId, cardEl) => {
                await handleCardSelection(seniorId, cardEl);
            });
            break;
        }

        case 'calendarView': {
            const container = $('#view-calendar');
            container.classList.add('active');
            navBtns.style.display = 'flex';
            renderCalendarView(
                container,
                params.seniorId,
                () => navigateTo('profileGrid'),
                () => { }
            );
            break;
        }

        case 'masterPage': {
            const container = $('#view-master-page');
            container.classList.add('active');
            navBtns.style.display = 'none';
            renderMasterPage(container, () => navigateTo('profileGrid'));
            break;
        }
    }

    currentView = viewName;
    setState('currentView', viewName);
}

/**
 * Handle profile card click with FLIP animation
 */
async function handleCardSelection(seniorId, cardEl) {
    // Calculate target position for mini profile
    const targetRect = {
        top: 80,   // below nav
        left: 24,
        width: 280,
        height: 380,
    };

    try {
        // Clone card for animation (so grid doesn't break)
        const clone = cardEl.cloneNode(true);
        const rect = cardEl.getBoundingClientRect();
        clone.style.position = 'fixed';
        clone.style.top = `${rect.top}px`;
        clone.style.left = `${rect.left}px`;
        clone.style.width = `${rect.width}px`;
        clone.style.height = `${rect.height}px`;
        clone.style.zIndex = '2000';
        clone.style.margin = '0';
        clone.style.transition = 'none';
        document.body.appendChild(clone);

        // Fade out the grid
        const gridView = $('#view-profile-grid');
        gridView.style.opacity = '0';
        gridView.style.transition = 'opacity 200ms ease';

        // Animate clone to corner
        await new Promise((resolve) => {
            requestAnimationFrame(() => {
                clone.style.transition = 'all 400ms cubic-bezier(0.16, 1, 0.3, 1)';
                clone.style.top = `${targetRect.top}px`;
                clone.style.left = `${targetRect.left}px`;
                clone.style.width = `${targetRect.width}px`;
                clone.style.borderRadius = '12px';
                clone.style.opacity = '0';

                setTimeout(() => {
                    clone.remove();
                    gridView.style.opacity = '';
                    gridView.style.transition = '';
                    resolve();
                }, 420);
            });
        });

    } catch (e) {
        console.warn('Animation failed, navigating directly:', e);
    }

    // Navigate to calendar
    navigateTo('calendarView', { seniorId });
}

/**
 * Show Master Page (exposed for nav button)
 */
export function showMasterPage() {
    navigateTo('masterPage');
}

// ========================================
// My Info Modal
// ========================================

/**
 * Open the My Info Modal
 */
function openMyInfoModal() {
    const state = getState();
    const applicant = state.applicant;

    if (!applicant) {
        alert('등록된 정보가 없습니다.');
        return;
    }

    const overlay = $('#modal-overlay');
    overlay.innerHTML = ''; // Clear previous

    const modal = createElement('div', { className: 'my-info-modal' });

    // Close Button
    const closeBtn = createElement('button', {
        className: 'my-info-modal__close',
        onClick: () => overlay.classList.remove('active'),
    }, '✕');
    modal.appendChild(closeBtn);

    // Photo
    if (applicant.photo) {
        const photoWrapper = createElement('div', { className: 'my-info-modal__photo-wrapper' });
        photoWrapper.innerHTML = `<img src="${applicant.photo}" class="my-info-modal__photo" alt="Profile">`;
        modal.appendChild(photoWrapper);
    } else {
        // Fallback or placeholder?
        const photoWrapper = createElement('div', { className: 'my-info-modal__photo-wrapper', style: { display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--color-bg-elevated)' } });
        photoWrapper.innerHTML = `<span style="font-size: 2rem;">👤</span>`;
        modal.appendChild(photoWrapper);
    }

    // Name
    modal.appendChild(createElement('div', { className: 'my-info-modal__name' }, applicant.name));

    // Details
    const detailText = `${applicant.studentId} · ${applicant.gender} · ${applicant.age}세`;
    modal.appendChild(createElement('div', { className: 'my-info-modal__detail' }, detailText));

    // Intro
    if (applicant.introduction) {
        modal.appendChild(createElement('div', { className: 'my-info-modal__intro' }, applicant.introduction));
    }

    // Actions
    const actions = createElement('div', { className: 'my-info-modal__actions' });

    const editBtn = createElement('button', {
        className: 'btn btn-primary btn-full',
        onClick: () => {
            overlay.classList.remove('active');
            navigateTo('applicantForm');
        }
    }, '✏️ 정보 수정하기');

    actions.appendChild(editBtn);
    modal.appendChild(actions);

    overlay.appendChild(modal);
    overlay.classList.add('active');

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    };
}

