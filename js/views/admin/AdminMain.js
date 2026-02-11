// ========================================
// View: Admin Main (Shell)
// Holds the static header, tabs, and content area
// ========================================

import { createElement, clearContainer } from '../../utils/dom.js';
import { loadState } from '../../state.js';
import { loadSeniors } from '../../data.js';
import { showToast } from '../../utils/animation.js';
import { renderReservationsTab } from './ReservationTab.js';
import { renderSeniorsTab } from './SeniorTab.js';

let activeTab = 'reservations'; // Module-level state for persistence

/**
 * Main Entry Point for Admin Dashboard
 * @param {HTMLElement} container - The main view container
 * @param {Function} onBack - Navigation callback
 */
export function renderAdminPage(container, onBack) {
    clearContainer(container);
    container.classList.add('admin-shell'); // CSS class for consistent styling

    // 1. Static Header & Controls
    const controls = renderControls(container, onBack);
    container.appendChild(controls);

    // 2. Tab Bar
    const tabBar = renderTabBar(container, onBack);
    container.appendChild(tabBar);

    // 3. Content Area (The part that changes)
    const contentArea = createElement('div', { className: 'admin-content-area anim-fade-in' });
    container.appendChild(contentArea);

    // Initial Render of active tab
    renderActiveTab(contentArea, container, onBack);
}

function renderControls(container, onBack) {
    const controls = createElement('div', { className: 'admin-controls' });

    // Back button
    const backBtn = createElement('button', {
        className: 'btn-back',
        style: { margin: 0 },
        onClick: onBack,
    }, '← 프로필 목록으로');
    controls.appendChild(backBtn);

    // Refresh button
    const refreshBtn = createElement('button', {
        className: 'btn btn-secondary btn-refresh',
        onClick: async (e) => {
            const btn = e.target.closest('button');
            const icon = btn.querySelector('.icon');

            // Animation
            icon.style.transition = 'transform 0.5s ease';
            icon.style.transform = 'rotate(360deg)';
            btn.disabled = true;

            try {
                // Parallel fetch
                await Promise.all([
                    loadState(),   // Reservations
                    loadSeniors()  // Seniors
                ]);
                showToast('데이터가 갱신되었습니다');

                // Re-render ONLY content, not the whole shell if possible, 
                // but for data integrity, we re-run the renders
                const contentArea = container.querySelector('.admin-content-area');
                if (contentArea) {
                    renderActiveTab(contentArea, container, onBack);
                }
            } catch (err) {
                console.error(err);
                showToast('데이터 갱신 실패');
            } finally {
                btn.disabled = false;
                icon.style.transform = 'none';
            }
        }
    });
    refreshBtn.innerHTML = `<span class="icon"></span> 새로고침`;
    controls.appendChild(refreshBtn);

    return controls;
}

function renderTabBar(container, onBack) {
    const tabBar = createElement('div', { className: 'admin-tabs' });

    const tabs = [
        { id: 'reservations', label: '📋 신청 현황' },
        { id: 'seniors', label: '👥 순장 관리' }
    ];

    tabs.forEach(tab => {
        const btn = createElement('button', {
            className: `admin-tab${activeTab === tab.id ? ' active' : ''}`,
            onClick: () => {
                if (activeTab === tab.id) return; // Ignore same tab click
                activeTab = tab.id;

                // Update Tab UI
                tabBar.querySelectorAll('.admin-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');

                // Update Content
                const contentArea = container.querySelector('.admin-content-area');
                renderActiveTab(contentArea, container, onBack);
            }
        }, tab.label);
        tabBar.appendChild(btn);
    });

    return tabBar;
}

function renderActiveTab(contentArea, container, onBack) {
    clearContainer(contentArea);

    // Add a specific class for background styling if needed
    contentArea.dataset.tab = activeTab;

    if (activeTab === 'reservations') {
        renderReservationsTab(contentArea);
    } else {
        renderSeniorsTab(contentArea, container, onBack);
    }
}
