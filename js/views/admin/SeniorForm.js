// ========================================
// View: Senior Form (Add/Edit)
// Handles photo upload, inputs, and time slot accordion
// ========================================

import { $, createElement, clearContainer } from '../../utils/dom.js';
import { addSenior, updateSenior } from '../../data.js';
import { readImage, resizeImage } from '../../utils/file.js';
import { showToast } from '../../utils/animation.js';
import { renderAdminPage } from './AdminMain.js';

// Configuration
const CALENDAR_START = '2026-02-22';
const CALENDAR_END = '2026-03-07';
const TIME_START = '09:30';
const TIME_END = '23:00';
const TIME_INTERVAL = 30;
const WEEKDAY_KR = ['일', '월', '화', '수', '목', '금', '토'];

export function renderSeniorForm(content, senior, pageContainer, onBack) {
    clearContainer(content);

    const isEdit = !!senior;
    const title = isEdit ? `✏️ ${senior.name} 순장 수정` : '➕ 새 순장 추가';

    content.appendChild(createElement('h2', { className: 'master-title', style: { marginBottom: '24px' } }, title));

    const form = createElement('div', { className: 'senior-form anim-fade-in-up' });

    // 1. Photo Section
    renderPhotoSection(form, senior);

    // 2. Info Section
    form.appendChild(createFormField('이름 *', 'text', 'senior-name', senior?.name || '', '순장 이름'));
    renderGenderSection(form, senior);

    // Introduction
    const introGroup = createElement('div', { className: 'form-group' });
    introGroup.appendChild(createElement('label', { className: 'form-label' }, '소개'));
    const introArea = createElement('textarea', {
        className: 'form-textarea', id: 'senior-intro', placeholder: '간단한 자기소개를 입력하세요', rows: '3',
    });
    introArea.value = senior?.introduction || '';
    introGroup.appendChild(introArea);
    form.appendChild(introGroup);

    // 3. Time Slots Section (Accordion)
    renderTimeSlotSection(form, senior);

    // 4. Buttons
    const btnRow = createElement('div', { style: { display: 'flex', gap: '12px', marginTop: '32px' } });
    const cancelBtn = createElement('button', {
        className: 'btn btn-secondary',
        onClick: () => renderAdminPage(pageContainer, onBack), // Go back to tabs
    }, '취소');

    const saveBtn = createElement('button', {
        className: 'btn btn-primary',
        onClick: () => handleSeniorFormSubmit(senior, pageContainer, onBack),
    }, isEdit ? '수정 완료' : '순장 추가');

    btnRow.appendChild(cancelBtn);
    btnRow.appendChild(saveBtn);
    form.appendChild(btnRow);

    content.appendChild(form);
}

// --- Sub-renderers ---

function renderPhotoSection(form, senior) {
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
        type: 'file', id: 'senior-photo-input', accept: 'image/*', style: { display: 'none' }
    });

    const hiddenInput = createElement('input', {
        type: 'hidden', id: 'senior-photo-data', value: senior?.photo || ''
    });

    photoGroup.appendChild(photoContainer);
    photoGroup.appendChild(uploadLabel);
    photoGroup.appendChild(fileInput);
    photoGroup.appendChild(hiddenInput);
    form.appendChild(photoGroup);

    // Listeners
    photoContainer.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        try {
            const rawBase64 = await readImage(file);
            const resizedBase64 = await resizeImage(rawBase64, 800, 0.9);
            hiddenInput.value = resizedBase64;
            photoContainer.innerHTML = `<img src="${resizedBase64}" style="width: 100%; height: 100%; object-fit: cover;">`;
        } catch (err) {
            console.error(err); alert('이미지 처리 중 오류가 발생했습니다.');
        }
    });
}

function renderGenderSection(form, senior) {
    const genderGroup = createElement('div', { className: 'form-group' });
    genderGroup.appendChild(createElement('label', { className: 'form-label' }, '성별 *'));

    const radioContainer = createElement('div', { className: 'radio-group' });

    ['남', '여'].forEach(g => {
        const option = createElement('div', { className: 'radio-option' });
        const input = createElement('input', {
            type: 'radio', name: 'senior-gender', id: `senior-${g}`, value: g
        });

        // Logic: if senior exists, match gender. if new, default to '남'
        if ((!senior && g === '남') || (senior && senior.gender === g)) {
            input.checked = true;
        }

        option.appendChild(input);
        option.appendChild(createElement('label', { htmlFor: `senior-${g}` }, g));
        radioContainer.appendChild(option);
    });

    genderGroup.appendChild(radioContainer);
    form.appendChild(genderGroup);
}

function renderTimeSlotSection(form, senior) {
    form.appendChild(createElement('h3', {
        className: 'form-label', style: { fontSize: '16px', fontWeight: '600', marginTop: '24px', marginBottom: '4px' },
    }, '📅 가능한 시간대'));
    form.appendChild(createElement('p', {
        style: { fontSize: '13px', color: '#9090B0', marginBottom: '16px' },
    }, '각 날짜를 펼쳐서 가능한 시간을 클릭하세요 (09:30 ~ 23:00, 30분 단위)'));

    const existingMap = {};
    if (senior?.availableSlots) {
        senior.availableSlots.forEach((s) => {
            existingMap[s.date] = new Set(s.times);
        });
    }

    const accordion = createElement('div', { className: 'slot-accordion', id: 'slot-accordion' });

    const dates = generateDateRange(CALENDAR_START, CALENDAR_END);
    const times = generateTimeSlots(TIME_START, TIME_END, TIME_INTERVAL);

    dates.forEach((dateStr) => {
        const selected = existingMap[dateStr] || new Set();
        accordion.appendChild(createDayAccordion(dateStr, selected, times));
    });
    form.appendChild(accordion);
}

function createDayAccordion(dateStr, selectedTimes, allTimes) {
    const { short, day, isWeekend } = formatDateLabel(dateStr);
    const hasSlots = selectedTimes.size > 0;

    const section = createElement('div', {
        className: `slot-day${hasSlots ? '' : ' collapsed'}`,
        dataset: { date: dateStr },
    });

    // Header Construction
    const header = createElement('div', { className: 'slot-day__header' });
    const labelArea = createElement('div', { className: 'slot-day__label-area' });
    labelArea.appendChild(createElement('span', { className: `slot-day__date${isWeekend ? ' weekend' : ''}` }, `${short} (${day})`));
    labelArea.appendChild(createElement('span', { className: `slot-day__badge${hasSlots ? ' has-slots' : ''}` }, `${selectedTimes.size}개`));

    const actionsArea = createElement('div', { className: 'slot-day__actions' });
    actionsArea.appendChild(createActionButton('전체', (e) => {
        e.stopPropagation();
        section.querySelectorAll('.slot-chip').forEach(c => c.classList.add('selected'));
        updateDayBadge(section);
    }));
    actionsArea.appendChild(createActionButton('초기화', (e) => {
        e.stopPropagation();
        section.querySelectorAll('.slot-chip').forEach(c => c.classList.remove('selected'));
        updateDayBadge(section);
    }));
    actionsArea.appendChild(createElement('span', { className: 'slot-day__arrow' }, '▼'));

    header.appendChild(labelArea);
    header.appendChild(actionsArea);
    header.addEventListener('click', () => section.classList.toggle('collapsed'));
    section.appendChild(header);

    // Grid Construction
    const grid = createElement('div', { className: 'slot-day__grid' });
    allTimes.forEach((time) => {
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

function createActionButton(text, onClick) {
    return createElement('button', {
        className: 'slot-day__action-btn',
        onClick: onClick
    }, text);
}

function updateDayBadge(section) {
    const count = section.querySelectorAll('.slot-chip.selected').length;
    const badge = section.querySelector('.slot-day__badge');
    if (badge) {
        badge.textContent = `${count}개`;
        if (count > 0) badge.classList.add('has-slots');
        else badge.classList.remove('has-slots');
    }
}

// --- Helpers ---

function createFormField(label, type, id, value, placeholder) {
    const group = createElement('div', { className: 'form-group' });
    group.appendChild(createElement('label', { className: 'form-label' }, label));
    group.appendChild(createElement('input', { className: 'form-input', type, id, placeholder, value }));
    return group;
}

function handleSeniorFormSubmit(existingSenior, pageContainer, onBack) {
    const name = $('#senior-name')?.value.trim();
    const role = '순장';
    const introduction = $('#senior-intro')?.value.trim();
    const photo = $('#senior-photo-data')?.value;
    const gender = document.querySelector('.senior-form input[name="senior-gender"]:checked')?.value || '남';

    if (!name) {
        alert('이름을 입력해주세요.');
        return;
    }

    // Collect Slots
    const availableSlots = [];
    document.querySelectorAll('.slot-day').forEach((section) => {
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

    renderAdminPage(pageContainer, onBack);
}

// Date/Time Generators
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
