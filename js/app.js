// ========================================
// App — Main entry point & router
// ========================================

import { $, $$, createElement } from './utils/dom.js';
import { loadState, getState, setState, getUserReservation } from './state.js';
import { loadSeniors, getSeniorProfiles, getSeniorById } from './data.js';
import { animateCardToCorner, fadeIn, fadeOut } from './utils/animation.js';
import { renderApplicantForm } from './views/applicantForm.js';
import { renderProfileGrid } from './views/profileGrid.js';
import { renderCalendarView } from './views/calendarView.js';
import { renderAdminPage } from './views/admin/AdminMain.js';

import { APP_VERSION } from './config.js';
import { initSparkles } from './effects.js'; // Import effects

// ---- App State ----
let currentView = 'applicantForm';

// Initialize App
document.addEventListener('DOMContentLoaded', async () => {
    initSparkles(); // Start background effects
    initApp();
});

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
    }, '로딩 중');
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

    // Master page button (password-protected with persistence)
    const masterBtn = $('#btn-master-page');
    masterBtn.addEventListener('click', () => {
        const isAdmin = localStorage.getItem('ccc_admin_auth') === 'true';

        if (isAdmin) {
            navigateTo('masterPage');
            return;
        }

        const password = prompt('관리자 비밀번호를 입력하세요:');
        if (password === '1984') {
            localStorage.setItem('ccc_admin_auth', 'true');
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
            renderAdminPage(container, () => navigateTo('profileGrid'));
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

    // Reservation Status
    const reserved = getUserReservation();
    const senior = reserved ? getSeniorById(reserved.seniorId) : null;

    // Content Wrapper
    const content = createElement('div', { className: 'my-info-content' });

    // 1. Header (Name, Badge, ID)
    const header = createElement('div', { className: 'my-info-header', style: 'margin-bottom: 24px;' });
    const genderBadge = applicant.gender === '여' ? '👩' : '👨';
    header.appendChild(createElement('div', {
        className: 'my-info-modal__name'
    }, `${applicant.name} ${genderBadge}`));

    header.appendChild(createElement('div', {
        className: 'my-info-modal__detail'
    }, `${applicant.studentId} · ${applicant.age}세`));
    content.appendChild(header);

    // 2. Intro
    if (applicant.introduction) {
        const introBox = createElement('div', { className: 'my-info-modal__intro' }, applicant.introduction);
        content.appendChild(introBox);
    }

    // 3. Reservation Card
    const resSection = createElement('div', {
        className: 'my-info-reservation',
        style: 'background: var(--color-bg); padding: 16px; border-radius: 12px; margin-bottom: 24px; text-align: left; border: 1px solid var(--color-border);'
    });

    resSection.appendChild(createElement('h3', {
        style: 'font-size: 14px; color: var(--color-text-muted); margin-bottom: 12px; font-weight: 600;'
    }, '📅 나의 신청 현황'));

    if (reserved && senior) {
        const resCard = createElement('div', { style: 'display: flex; justify-content: space-between; align-items: center;' });

        const resInfo = createElement('div');
        resInfo.appendChild(createElement('div', {
            style: 'font-size: 16px; font-weight: 700; color: var(--color-text); margin-bottom: 4px;'
        }, `${senior.name} 순장`));
        resInfo.appendChild(createElement('div', {
            style: 'font-size: 14px; color: var(--color-primary-dark);'
        }, `${reserved.date} ${reserved.time}`));

        const cancelBtn = createElement('button', {
            className: 'btn btn-secondary',
            style: 'padding: 6px 12px; font-size: 13px; color: var(--color-danger); border-color: var(--color-danger); background: rgba(255,0,0,0.05);',
            onClick: async () => {
                if (confirm('신청을 취소하시겠습니까?')) {
                    try {
                        const { deleteReservation } = await import('./state.js');
                        await deleteReservation(reserved);
                        alert('신청이 취소되었습니다.');
                        overlay.classList.remove('active');
                        const { currentView } = getState();
                        if (currentView === 'calendarView' || currentView === 'profileGrid') {
                            navigateTo(currentView);
                        }
                    } catch (e) {
                        console.error(e);
                        alert('취소에 실패했습니다.');
                    }
                }
            }
        }, '취소');

        resCard.appendChild(resInfo);
        resCard.appendChild(cancelBtn);
        resSection.appendChild(resCard);
    } else {
        resSection.appendChild(createElement('p', {
            style: 'font-size: 14px; color: var(--color-text-muted); text-align: center; padding: 10px 0;'
        }, '현재 신청한 약속이 없습니다.'));
    }
    content.appendChild(resSection);

    // 4. Edit Button
    const actions = createElement('div', { className: 'my-info-modal__actions' });
    const editBtn = createElement('button', {
        className: 'btn btn-primary btn-full',
        onClick: () => {
            overlay.classList.remove('active');
            navigateTo('applicantForm');
        }
    }, '✏️ 정보 수정하기');
    actions.appendChild(editBtn);
    content.appendChild(actions);

    modal.appendChild(content);

    overlay.appendChild(modal);
    overlay.classList.add('active');

    // Close on overlay click
    overlay.onclick = (e) => {
        if (e.target === overlay) overlay.classList.remove('active');
    };
}

