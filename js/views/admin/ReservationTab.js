// ========================================
// View: Reservation Tab
// Shows list of all current reservations
// ========================================

import { createElement, clearContainer } from '../../utils/dom.js';
import { getReservations, deleteReservation } from '../../state.js';
import { getSeniorById } from '../../data.js';
import { formatDate } from '../../utils/date.js';
import { showToast } from '../../utils/animation.js';

export function renderReservationsTab(content) {
    const header = createElement('div', { className: 'master-header' });
    header.appendChild(createElement('h2', { className: 'master-title' }, '📋 전체 신청 현황'));
    header.appendChild(createElement('p', { className: 'master-subtitle' }, '지금까지의 모든 신청 내역을 확인하세요'));
    content.appendChild(header);

    const reservations = getReservations();

    if (reservations.length === 0) {
        const empty = createElement('div', { className: 'empty-state' });
        empty.appendChild(createElement('div', { className: 'empty-state__icon' }, '📭'));
        empty.appendChild(createElement('p', { className: 'empty-state__text' }, '아직 신청 내역이 없습니다'));
        content.appendChild(empty);
        return;
    }

    // Group by senior
    const groups = groupReservationsBySenior(reservations);

    Object.entries(groups).forEach(([seniorId, entries]) => {
        const senior = getSeniorById(seniorId);
        if (!senior) return;

        const group = createElement('div', { className: 'reservation-group anim-fade-in-up' });
        group.appendChild(createElement('h3', { className: 'reservation-group__title' },
            `${senior.name} (${senior.role})` // Role preserved in data even if hidden in some UIs
        ));

        const list = createElement('div', { className: 'reservation-list' });

        entries
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach((r) => {
                list.appendChild(renderReservationCard(r, content));
            });

        group.appendChild(list);
        content.appendChild(group);
    });
}

function groupReservationsBySenior(reservations) {
    return reservations.reduce((acc, r) => {
        if (!acc[r.seniorId]) acc[r.seniorId] = [];
        acc[r.seniorId].push(r);
        return acc;
    }, {});
}

function renderReservationCard(reservation, contentContainer) {
    const card = createElement('div', {
        className: 'reservation-card',
        style: { position: 'relative' }
    });

    // Delete Button
    const deleteBtn = createElement('button', {
        className: 'btn-delete-res',
        title: '신청 삭제',
        onClick: async (e) => {
            e.stopPropagation();
            if (confirm('이 신청 내역을 정말 삭제하시겠습니까?')) {
                try {
                    await deleteReservation(reservation);
                    showToast('신청 내역이 삭제되었습니다');
                    // Re-render tab
                    clearContainer(contentContainer);
                    renderReservationsTab(contentContainer);
                } catch (err) {
                    alert('삭제 처리에 실패했습니다. 다시 시도해주세요.');
                    console.error(err);
                }
            }
        }
    }, '🗑️');

    card.appendChild(deleteBtn);

    const dateObj = new Date(reservation.date + 'T00:00:00');
    card.appendChild(createElement('div', { className: 'reservation-card__date' },
        formatDate(dateObj, 'long')
    ));

    card.appendChild(createElement('div', { className: 'reservation-card__time' },
        `🕐 ${reservation.time}`
    ));

    if (reservation.applicant) {
        const applicantInfo = createElement('div', { className: 'reservation-card__applicant' });

        const name = reservation.applicant.name || '(이름 없음)';
        applicantInfo.appendChild(createElement('span', {}, `👤 ${name}`));

        card.appendChild(applicantInfo);

        const detail = `${reservation.applicant.studentId} · ${reservation.applicant.gender} · ${reservation.applicant.age}세`;
        card.appendChild(createElement('div', { className: 'reservation-card__applicant-detail' }, detail));

        if (reservation.applicant.introduction) {
            card.appendChild(createElement('div', {
                className: 'reservation-card__applicant-intro'
            }, `"${reservation.applicant.introduction}"`));
        }
    }

    return card;
}
