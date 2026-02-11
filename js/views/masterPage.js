// ========================================
// View: Master Page — Admin Dashboard
// Tabs: 신청현황 (Reservations) + 선배관리 (Senior Mgmt)
// ========================================

import { $, createElement, clearContainer } from '../utils/dom.js';
import { getReservations, deleteReservation } from '../state.js';
import { getSeniorById, getSeniorProfiles, addSenior, updateSenior, deleteSenior } from '../data.js';
import { formatDate } from '../utils/date.js';
import { showToast } from '../utils/animation.js';
import { readImage, resizeImage } from '../utils/file.js';

let activeTab = 'reservations';

/**
 * Render the master page with tabs
 */
export function renderMasterPage(container, onBack) {
    clearContainer(container);

    // Back button
    const backBtn = createElement('button', {
        className: 'btn-back',
        onClick: onBack,
    }, '← 프로필 목록으로');
    container.appendChild(backBtn);

    // Tab bar
    const tabBar = createElement('div', { className: 'admin-tabs' });

    const tabRes = createElement('button', {
        className: `admin-tab${activeTab === 'reservations' ? ' active' : ''}`,
        onClick: () => { activeTab = 'reservations'; renderMasterPage(container, onBack); },
    }, '📋 신청 현황');

    const tabSeniors = createElement('button', {
        className: `admin-tab${activeTab === 'seniors' ? ' active' : ''}`,
        onClick: () => { activeTab = 'seniors'; renderMasterPage(container, onBack); },
    }, '👥 순장 관리');

    tabBar.appendChild(tabRes);
    tabBar.appendChild(tabSeniors);
    container.appendChild(tabBar);

    // Tab content
    const content = createElement('div', { className: 'admin-content anim-fade-in' });
    container.appendChild(content);

    if (activeTab === 'reservations') {
        renderReservationsTab(content);
    } else {
        renderSeniorsTab(content, container, onBack);
    }
}

// ========================================
// Tab 1: 신청 현황
// ========================================

function renderReservationsTab(content) {
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
            `${senior.name} (${senior.role})`
        ));

        const list = createElement('div', { className: 'reservation-list' });

        entries
            .sort((a, b) => new Date(a.date) - new Date(b.date))
            .forEach((r) => {
                list.appendChild(renderReservationCard(r));
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

function renderReservationCard(reservation) {
    const card = createElement('div', {
        className: 'reservation-card',
        style: { position: 'relative' } // Needed for absolute positioning of delete button
    });

    // Delete Button
    const deleteBtn = createElement('button', {
        className: 'btn-delete-res',
        style: {
            position: 'absolute',
            top: '0px',
            right: '0px',
            padding: '10px',
            background: 'transparent',
            border: 'none',
            fontSize: '1.1rem',
            cursor: 'pointer',
            opacity: '0.4',
            transition: 'opacity 0.2s',
            zIndex: '2'
        },
        title: '신청 삭제',
        onClick: async (e) => {
            e.stopPropagation();
            if (confirm('이 신청 내역을 정말 삭제하시겠습니까?')) {
                try {
                    await deleteReservation(reservation);
                    showToast('신청 내역이 삭제되었습니다');
                    // Re-render tab to reflect changes
                    const content = document.querySelector('.admin-content');
                    if (content) {
                        clearContainer(content);
                        renderReservationsTab(content);
                    }
                } catch (err) {
                    alert('삭제 처리에 실패했습니다. 다시 시도해주세요.');
                    console.error(err);
                }
            }
        },
        onMouseEnter: (e) => e.target.style.opacity = '1',
        onMouseLeave: (e) => e.target.style.opacity = '0.4'
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
        const applicantInfo = createElement('div', { className: 'reservation-card__applicant', style: 'display: flex; align-items: center; gap: 10px;' });

        // Applicant photo removed
        // if (reservation.applicant.photo) { ... }

        const name = reservation.applicant.name || '(이름 없음)';
        applicantInfo.appendChild(createElement('span', {}, `👤 ${name}`));

        card.appendChild(applicantInfo);

        const detail = `${reservation.applicant.studentId} · ${reservation.applicant.gender} · ${reservation.applicant.age}세`;
        card.appendChild(createElement('div', { className: 'reservation-card__applicant-detail' }, detail));

        // Display Applicant Intro
        if (reservation.applicant.introduction) {
            card.appendChild(createElement('div', {
                className: 'reservation-card__applicant-intro',
                style: {
                    fontSize: '13px', color: 'var(--color-text-secondary)', marginTop: '8px',
                    padding: '8px', background: 'var(--color-bg-elevated)', borderRadius: '4px',
                    fontStyle: 'italic', lineHeight: '1.4'
                }
            }, `"${reservation.applicant.introduction}"`));
        }
    }

    return card;
}

// ========================================
// Tab 2: 순장 관리
// ========================================

function renderSeniorsTab(content, pageContainer, onBack) {
    const header = createElement('div', { className: 'master-header' });
    header.appendChild(createElement('h2', { className: 'master-title' }, '👥 순장 관리'));
    header.appendChild(createElement('p', { className: 'master-subtitle' }, '순장 프로필을 추가하거나 수정할 수 있습니다'));
    content.appendChild(header);

    // Add button
    const addBtn = createElement('button', {
        className: 'btn btn-primary',
        style: { marginBottom: '24px' },
        onClick: () => showSeniorForm(content, null, pageContainer, onBack),
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
    // Role removed from UI
    // nameRow.appendChild(createElement('span', { className: 'senior-admin-card__role' }, senior.role));
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
            showSeniorForm(content, senior, pageContainer, onBack);
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
                renderMasterPage(pageContainer, onBack);
            }
        },
    }, '🗑️ 삭제');

    actions.appendChild(editBtn);
    actions.appendChild(deleteBtn);
    card.appendChild(actions);

    return card;
}

// ========================================
// Senior Add/Edit Form — Accordion Time Grid
// ========================================

// Generate all dates from Feb 22 to Mar 7, 2026
const ALL_DATES = generateDateRange('2026-02-22', '2026-03-07');

// Generate 30-min time slots from 09:30 to 23:00
const ALL_TIMES = generateTimeSlots('09:30', '23:00', 30);

const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

function generateDateRange(startStr, endStr) {
    const dates = [];
    const start = new Date(startStr + 'T00:00:00');
    const end = new Date(endStr + 'T00:00:00');
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        dates.push(`${y}-${m}-${day}`);
    }
    return dates;
}

function generateTimeSlots(startTime, endTime, intervalMin) {
    const slots = [];
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    let mins = sh * 60 + sm;
    const endMins = eh * 60 + em;
    while (mins <= endMins) {
        const h = String(Math.floor(mins / 60)).padStart(2, '0');
        const m = String(mins % 60).padStart(2, '0');
        slots.push(`${h}:${m}`);
        mins += intervalMin;
    }
    return slots;
}

function formatDateLabel(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    const mm = d.getMonth() + 1;
    const dd = d.getDate();
    const day = WEEKDAY_KR[d.getDay()];
    return { short: `${mm}/${dd}`, day, isWeekend: d.getDay() === 0 || d.getDay() === 6 };
}

function showSeniorForm(content, senior, pageContainer, onBack) {
    clearContainer(content);

    const isEdit = !!senior;
    const title = isEdit ? `✏️ ${senior.name} 순장 수정` : '➕ 새 순장 추가';

    content.appendChild(createElement('h2', { className: 'master-title', style: { marginBottom: '24px' } }, title));

    const form = createElement('div', { className: 'senior-form anim-fade-in-up' });

    // Photo Upload (remains same)
    const photoGroup = createElement('div', { className: 'form-group', style: 'text-align: center;' });

    const photoPreviewHTML = senior?.photo
        ? `<img src="${senior.photo}" style="width: 100%; height: 100%; object-fit: cover;">`
        : `<span style="font-size: 2rem; color: var(--color-text-muted);">📷</span>`;

    const photoContainer = createElement('div', {
        id: 'senior-photo-preview',
        style: {
            width: '100px', height: '100px', margin: '0 auto var(--spacing-sm)', borderRadius: '50%',
            overflow: 'hidden', backgroundColor: 'var(--color-bg-input)', border: '2px solid var(--color-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', position: 'relative'
        },
        innerHTML: photoPreviewHTML
    });

    const uploadLabel = createElement('label', {
        className: 'btn btn-secondary', style: { fontSize: '0.8rem', padding: '4px 12px' }, htmlFor: 'senior-photo-input'
    }, senior?.photo ? '사진 변경' : '사진 추가');

    const fileInput = createElement('input', {
        type: 'file',
        id: 'senior-photo-input',
        accept: 'image/*',
        style: { display: 'none' }
    });

    const hiddenInput = createElement('input', {
        type: 'hidden',
        id: 'senior-photo-data',
        value: senior?.photo || ''
    });

    photoGroup.appendChild(photoContainer);
    photoGroup.appendChild(uploadLabel);
    photoGroup.appendChild(fileInput);
    photoGroup.appendChild(hiddenInput);
    form.appendChild(photoGroup);

    // Event Listeners for Photo
    photoContainer.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const rawBase64 = await readImage(file);
            // Increased quality: 300px -> 800px, 0.8 -> 0.9
            const resizedBase64 = await resizeImage(rawBase64, 800, 0.9);
            hiddenInput.value = resizedBase64;
            photoContainer.innerHTML = `<img src="${resizedBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } catch (err) {
            console.error(err); alert('이미지 처리 중 오류가 발생했습니다.');
        }
    });

    // Name
    form.appendChild(createFormField('이름 *', 'text', 'senior-name', senior?.name || '', '순장 이름'));

    // Gender Radio
    const genderGroup = createElement('div', { className: 'form-group' });
    genderGroup.appendChild(createElement('label', { className: 'form-label' }, '성별 *'));
    const radioContainer = createElement('div', { className: 'radio-group' });

    const maleOption = createElement('div', { className: 'radio-option' });
    const maleInput = createElement('input', { type: 'radio', name: 'senior-gender', id: 'senior-male', value: '남' });
    if (!senior || senior.gender === '남') maleInput.checked = true; // Default Male
    maleOption.appendChild(maleInput);
    maleOption.appendChild(createElement('label', { htmlFor: 'senior-male' }, '남'));

    const femaleOption = createElement('div', { className: 'radio-option' });
    const femaleInput = createElement('input', { type: 'radio', name: 'senior-gender', id: 'senior-female', value: '여' });
    if (senior && senior.gender === '여') femaleInput.checked = true;
    femaleOption.appendChild(femaleInput);
    femaleOption.appendChild(createElement('label', { htmlFor: 'senior-female' }, '여'));

    radioContainer.appendChild(maleOption);
    radioContainer.appendChild(femaleOption);
    genderGroup.appendChild(radioContainer);
    form.appendChild(genderGroup);

    // Role
    // Role input removed from UI
    // form.appendChild(createFormField('역할', 'text', 'senior-role', senior?.role || '', '예: 대표순장, 순원'));
    // Introduction
    const introGroup = createElement('div', { className: 'form-group' });
    introGroup.appendChild(createElement('label', { className: 'form-label' }, '소개'));
    const introArea = createElement('textarea', {
        className: 'form-textarea', id: 'senior-intro', placeholder: '간단한 자기소개를 입력하세요', rows: '3',
    });
    introArea.value = senior?.introduction || '';
    introGroup.appendChild(introArea);
    form.appendChild(introGroup);

    // ... (Accordion logic remains same)
    form.appendChild(createElement('h3', {
        className: 'form-label', style: { fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '4px' },
    }, '📅 가능한 시간대'));
    form.appendChild(createElement('p', {
        style: { fontSize: '13px', color: '#9090B0', marginBottom: '16px' },
    }, '각 날짜를 펼쳐서 가능한 시간을 클릭하세요 (09:30 ~ 23:00, 30분 단위)'));

    // Build a lookup for existing data
    const existingMap = {};
    if (senior?.availableSlots) {
        senior.availableSlots.forEach((s) => {
            existingMap[s.date] = new Set(s.times);
        });
    }

    const accordion = createElement('div', { className: 'slot-accordion', id: 'slot-accordion' });
    ALL_DATES.forEach((dateStr) => {
        const selected = existingMap[dateStr] || new Set();
        accordion.appendChild(createDayAccordion(dateStr, selected));
    });
    form.appendChild(accordion);

    // Action buttons
    const btnRow = createElement('div', { style: { display: 'flex', gap: '12px', marginTop: '32px' } });
    const cancelBtn = createElement('button', {
        className: 'btn btn-secondary', onClick: () => renderMasterPage(pageContainer, onBack),
    }, '취소');
    const saveBtn = createElement('button', {
        className: 'btn btn-primary', onClick: () => handleSeniorFormSubmit(senior, pageContainer, onBack),
    }, isEdit ? '수정 완료' : '순장 추가');

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    form.appendChild(btnRow);

    content.appendChild(form);
}

function createDayAccordion(dateStr, selectedTimes) {
    const { short, day, isWeekend } = formatDateLabel(dateStr);
    const hasSlots = selectedTimes.size > 0;

    const section = createElement('div', {
        className: `slot-day${hasSlots ? '' : ' collapsed'}`,
        dataset: { date: dateStr },
    });

    // Header
    const header = createElement('div', { className: 'slot-day__header' });

    const labelArea = createElement('div', { className: 'slot-day__label-area' });
    const dateLabel = createElement('span', {
        className: `slot-day__date${isWeekend ? ' weekend' : ''}`,
    }, `${short} (${day})`);
    const badge = createElement('span', {
        className: `slot-day__badge${hasSlots ? ' has-slots' : ''}`,
    }, `${selectedTimes.size}개`);
    labelArea.appendChild(dateLabel);
    labelArea.appendChild(badge);

    const actionsArea = createElement('div', { className: 'slot-day__actions' });

    const selectAllBtn = createElement('button', {
        className: 'slot-day__action-btn',
        onClick: (e) => {
            e.stopPropagation();
            const grid = section.querySelector('.slot-day__grid');
            grid.querySelectorAll('.slot-chip').forEach((c) => c.classList.add('selected'));
            updateDayBadge(section);
        },
    }, '전체');

    const clearBtn = createElement('button', {
        className: 'slot-day__action-btn',
        onClick: (e) => {
            e.stopPropagation();
            const grid = section.querySelector('.slot-day__grid');
            grid.querySelectorAll('.slot-chip').forEach((c) => c.classList.remove('selected'));
            updateDayBadge(section);
        },
    }, '초기화');

    const toggleArrow = createElement('span', { className: 'slot-day__arrow' }, '▼');

    actionsArea.appendChild(selectAllBtn);
    actionsArea.appendChild(clearBtn);
    actionsArea.appendChild(toggleArrow);

    header.appendChild(labelArea);
    header.appendChild(actionsArea);

    // Click header to toggle
    header.addEventListener('click', () => {
        section.classList.toggle('collapsed');
    });

    section.appendChild(header);

    // Grid
    const grid = createElement('div', { className: 'slot-day__grid' });

    ALL_TIMES.forEach((time) => {
        const isSelected = selectedTimes.has(time);
        const chip = createElement('button', {
            className: `slot-chip${isSelected ? ' selected' : ''}`,
            dataset: { time },
            onClick: (e) => {
                e.stopPropagation();
                chip.classList.toggle('selected');
                updateDayBadge(section);
            },
        }, time);
        grid.appendChild(chip);
    });

    section.appendChild(grid);

    return section;
}

function updateDayBadge(section) {
    const count = section.querySelectorAll('.slot-chip.selected').length;
    const badge = section.querySelector('.slot-day__badge');
    if (badge) badge.textContent = `${count}개`;
    // Highlight badge if count > 0
    if (count > 0) {
        badge.classList.add('has-slots');
    } else {
        badge.classList.remove('has-slots');
    }
}

function createFormField(label, type, id, value, placeholder) {
    const group = createElement('div', { className: 'form-group' });
    group.appendChild(createElement('label', { className: 'form-label' }, label));
    const input = createElement('input', {
        className: 'form-input',
        type,
        id,
        placeholder,
        value,
    });
    group.appendChild(input);
    return group;
}

function handleSeniorFormSubmit(existingSenior, pageContainer, onBack) {
    const name = $('#senior-name')?.value.trim();
    const role = '순장'; // Dummy data for DB compatibility
    const introduction = $('#senior-intro')?.value.trim();
    const photo = $('#senior-photo-data')?.value;
    const gender = document.querySelector('.senior-form input[name="senior-gender"]:checked')?.value || '남';

    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }

    // Collect selected slots
    const availableSlots = [];
    const daySections = document.querySelectorAll('.slot-day');
    daySections.forEach((section) => {
        const dateStr = section.dataset.date;
        const selectedChips = section.querySelectorAll('.slot-chip.selected');
        if (selectedChips.length > 0) {
            const times = Array.from(selectedChips).map((c) => c.dataset.time);
            availableSlots.push({ date: dateStr, times });
        }
    });

    const data = { name, role, introduction, availableSlots, photo, gender };

    if (existingSenior) {
        updateSenior(existingSenior.id, data);
        showToast(`${name} 순장 정보가 수정되었습니다`);
    } else {
        addSenior(data);
        showToast(`${name} 순장이 추가되었습니다`);
    }

    renderMasterPage(pageContainer, onBack);
}
