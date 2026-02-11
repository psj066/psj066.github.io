// ========================================
// View: Senior Tab
// List of seniors with Edit/Delete actions
// ========================================

import { createElement } from '../../utils/dom.js';
import { getSeniorProfiles, deleteSenior } from '../../data.js';
import { showToast } from '../../utils/animation.js';
import { renderAdminPage } from './AdminMain.js'; // To re-render whole page after delete
import { renderSeniorForm } from './SeniorForm.js';

export function renderSeniorsTab(content, pageContainer, onBack) {
    const header = createElement('div', { className: 'master-header' });
    header.appendChild(createElement('h2', { className: 'master-title' }, '👥 순장 관리'));
    header.appendChild(createElement('p', { className: 'master-subtitle' }, '순장 프로필을 추가하거나 수정할 수 있습니다'));
    content.appendChild(header);

    // Add button
    const addBtn = createElement('button', {
        className: 'btn btn-primary',
        style: { marginBottom: '24px' },
        onClick: () => renderSeniorForm(content, null, pageContainer, onBack),
    }, '➕ 새 순장 추가');
    content.appendChild(addBtn);

    // Senior list
    const seniors = getSeniorProfiles();

    if (seniors.length === 0) {
        const empty = createElement('div', { className: 'empty-state' });
        empty.appendChild(createElement('div', { className: 'empty-state__icon' }, '👤'));
        empty.appendChild(createElement('p', { className: 'empty-state__text' }, '등록된 순장이 없습니다'));
        content.appendChild(empty);
        return;
    }

    const list = createElement('div', { className: 'senior-admin-list' });
    seniors.forEach((senior, index) => {
        list.appendChild(renderSeniorAdminCard(senior, content, pageContainer, onBack, index));
    });
    content.appendChild(list);
}

function renderSeniorAdminCard(senior, content, pageContainer, onBack, index) {
    const card = createElement('div', {
        className: 'senior-admin-card anim-fade-in-up',
        style: { animationDelay: `${index * 50}ms` },
    });

    // Left: info
    const info = createElement('div', { className: 'senior-admin-card__info' });
    const nameRow = createElement('div', { className: 'senior-admin-card__name-row' });

    // Senior photo thumbnail
    if (senior.photo && senior.photo.startsWith('data:')) {
        const photo = createElement('img', {
            src: senior.photo,
            style: { width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', marginRight: '8px', border: '1px solid var(--color-border)' }
        });
        nameRow.appendChild(photo);
    }

    const genderBadge = senior.gender === '여' ? '👩' : '👨';
    nameRow.appendChild(createElement('strong', {}, `${senior.name} ${genderBadge}`));
    info.appendChild(nameRow);

    if (senior.introduction) {
        info.appendChild(createElement('p', { className: 'senior-admin-card__intro' }, senior.introduction));
    }

    // Slot count
    const totalSlots = senior.availableSlots.reduce((sum, s) => sum + s.times.length, 0);
    const totalDays = senior.availableSlots.length;
    info.appendChild(createElement('span', { className: 'senior-admin-card__stats' },
        `📅 ${totalDays}일 · 🕐 ${totalSlots}개 시간대`
    ));

    card.appendChild(info);

    // Right: actions
    const actions = createElement('div', { className: 'senior-admin-card__actions' });

    const editBtn = createElement('button', {
        className: 'btn btn-secondary',
        style: { fontSize: '13px', padding: '6px 14px' },
        onClick: (e) => {
            e.stopPropagation();
            renderSeniorForm(content, senior, pageContainer, onBack);
        },
    }, '✏️ 수정');

    const deleteBtn = createElement('button', {
        className: 'btn btn-danger',
        style: { fontSize: '13px', padding: '6px 14px' },
        onClick: (e) => {
            e.stopPropagation();
            if (confirm(`"${senior.name}" 순장을 삭제하시겠습니까?`)) {
                deleteSenior(senior.id);
                showToast('순장이 삭제되었습니다');
                // Re-render Main Page to refresh list
                renderAdminPage(pageContainer, onBack);
            }
        },
    }, '🗑️ 삭제');

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    return card;
}
