// ========================================
// View: Applicant Form
// ========================================

import { $, createElement, clearContainer } from '../utils/dom.js';
import { setState, getState, findApplicantHistory } from '../state.js';

/**
 * Render the applicant information form
 * Refactored to 2-Step Flow:
 * 1. Enter Student ID (Lookup)
 * 2. Enter/Confirm Details
 */
export function renderApplicantForm(container, onComplete) {
  clearContainer(container);

  // Step 1: Check for cached Student ID
  const lastStudentId = localStorage.getItem('ccc_last_student_id') || '';

  // Initial View: Step 1
  renderStep1(container, lastStudentId, onComplete);
}

function renderStep1(container, defaultId, onComplete) {
  clearContainer(container);

  const html = `
    <div class="form-container anim-fade-in-up">
      <h1 class="form-title">CCC 순 신청</h1>
      <p class="form-subtitle">본인 확인을 위해 학번을 먼저 입력해주세요.</p>

      <form id="step1-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="input-check-studentId">학번</label>
          <input class="form-input" type="text" id="input-check-studentId" placeholder="예: 20260001" value="${defaultId}" required>
          <div class="form-error" id="error-check-studentId">학번을 입력해주세요.</div>
        </div>
        <button type="submit" class="btn btn-primary btn-full">다음 →</button>
      </form>
    </div>
    `;

  container.innerHTML = html;

  $('#step1-form', container).addEventListener('submit', (e) => {
    e.preventDefault();
    const studentId = $('#input-check-studentId', container).value.trim();
    if (!studentId || studentId.length < 2) {
      const err = $('#error-check-studentId', container);
      err.style.display = 'block';
      return;
    }

    // Cache ID
    localStorage.setItem('ccc_last_student_id', studentId);

    // Lookup
    const history = findApplicantHistory(studentId);

    // Go to Step 2
    renderStep2(container, studentId, history, onComplete);
  });
}

function renderStep2(container, studentId, existingData, onComplete) {
  clearContainer(container);

  const isExisting = !!existingData;

  const formHTML = `
    <div class="form-container anim-fade-in-right">
      <h1 class="form-title">${isExisting ? '정보 확인' : '정보 입력'}</h1>
      <p class="form-subtitle">${isExisting ? '기존 정보를 불러왔습니다. 맞다면 신청하러 가기를 눌러주세요.' : '처음 오셨군요! 간단한 정보를 알려주세요.'}</p>

      <form id="applicant-form" novalidate>
        <div class="form-group">
          <label class="form-label" for="input-studentId">학번</label>
          <!-- Readonly Student ID -->
          <input class="form-input" type="text" id="input-studentId" value="${studentId}" readonly style="background: var(--color-bg-elevated); cursor: not-allowed;">
        </div>

        <div class="form-group">
          <label class="form-label" for="input-name">이름 *</label>
          <input class="form-input" type="text" id="input-name" placeholder="예: 홍길동" value="${existingData?.name || ''}" required>
          <div class="form-error" id="error-name">이름을 입력해주세요.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-age">나이 *</label>
          <input class="form-input" type="number" id="input-age" placeholder="예: 20" min="15" max="30" value="${existingData?.age || ''}" required>
          <div class="form-error" id="error-age">올바른 나이를 입력해주세요.</div>
        </div>

        <div class="form-group">
          <label class="form-label">성별 *</label>
          <div class="radio-group">
            <div class="radio-option">
              <input type="radio" name="gender" id="gender-male" value="남" ${existingData?.gender === '남' ? 'checked' : ''}>
              <label for="gender-male">남</label>
            </div>
            <div class="radio-option">
              <input type="radio" name="gender" id="gender-female" value="여" ${existingData?.gender === '여' ? 'checked' : ''}>
              <label for="gender-female">여</label>
            </div>
          </div>
          <div class="form-error" id="error-gender">성별을 선택해주세요.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-intro">간단한 소개</label>
          <textarea class="form-textarea" id="input-intro" placeholder="MBTI, 관심사 등 간단한 소개를 적어주세요!" rows="3">${existingData?.introduction || ''}</textarea>
        </div>

        <div style="display:flex; gap:10px;">
            <button type="button" class="btn btn-secondary" id="btn-back-step1">← 다시 입력</button>
            <button type="submit" class="btn btn-primary btn-full">
            ${isExisting ? '정보 확인 / 신청하러 가기' : '입력 완료 / 순장 프로필 보기'}
            </button>
        </div>
      </form>
    </div>
  `;

  container.innerHTML = formHTML;

  // Bind events
  const form = $('#applicant-form', container);
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(container, onComplete);
  });

  $('#btn-back-step1', container).addEventListener('click', () => {
    renderStep1(container, studentId, onComplete);
  });
}

/**
 * Handle form submission
 */
function handleSubmit(container, onComplete) {
  const formData = {
    name: $('#input-name', container).value.trim(),
    studentId: $('#input-studentId', container).value.trim(),
    age: parseInt($('#input-age', container).value, 10),
    gender: container.querySelector('input[name="gender"]:checked')?.value || '',
    introduction: $('#input-intro', container).value.trim(),
  };

  const validation = validateForm(formData);

  // Clear all errors
  ['name', 'studentId', 'age', 'gender'].forEach((field) => {
    const input = $(`#input-${field}`, container) || $(`#error-${field}`, container)?.previousElementSibling;
    const error = $(`#error-${field}`, container);
    if (input && input.classList) input.classList.remove('error');
    if (error) error.classList.remove('visible');
  });

  if (!validation.valid) {
    // Show errors
    for (const field of validation.errors) {
      const input = $(`#input-${field}`, container);
      const error = $(`#error-${field}`, container);
      if (input) input.classList.add('error');
      if (error) error.classList.add('visible');
    }
    return;
  }

  // Save and navigate
  setState('applicant', formData);
  onComplete(formData);
}

/**
 * Validate form data
 * @param {Object} formData
 * @returns {{ valid: boolean, errors: string[] }}
 */
export function validateForm(formData) {
  const errors = [];

  if (!formData.name || formData.name.length < 1) {
    errors.push('name');
  }

  if (!formData.studentId || formData.studentId.length < 2) {
    errors.push('studentId');
  }

  if (!formData.age || formData.age < 15 || formData.age > 30) {
    errors.push('age');
  }

  if (!formData.gender) {
    errors.push('gender');
  }

  return { valid: errors.length === 0, errors };
}
