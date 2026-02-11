// ========================================
// View: Applicant Form
// ========================================

import { $, createElement, clearContainer } from '../utils/dom.js';
import { setState, getState } from '../state.js';
import { readImage, resizeImage } from '../utils/file.js';

/**
 * Render the applicant information form
 * @param {HTMLElement} container
 * @param {Function} onComplete - called with applicant data when form is valid
 */
export function renderApplicantForm(container, onComplete) {
  clearContainer(container);

  // Check for existing data (editing mode)
  const existing = getState().applicant;

  const formHTML = `
    <div class="form-container anim-fade-in-up">
      <h1 class="form-title">${existing ? '정보 수정' : 'CCC 순 신청'}</h1>
      <p class="form-subtitle">${existing ? '신청자 정보를 수정할 수 있습니다.' : '순장님과의 1:1 만남을 신청하세요. 먼저 간단한 정보를 알려주세요!'}</p>

      <form id="applicant-form" novalidate>
        <!-- Photo section removed -->

        <div class="form-group">
          <label class="form-label" for="input-name">이름 *</label>
          <input class="form-input" type="text" id="input-name" placeholder="예: 홍길동" value="${existing?.name || ''}" required>
          <div class="form-error" id="error-name">이름을 입력해주세요.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-studentId">학번 *</label>
          <input class="form-input" type="text" id="input-studentId" placeholder="예: 20260001" value="${existing?.studentId || ''}" required>
          <div class="form-error" id="error-studentId">학번을 입력해주세요.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-age">나이 *</label>
          <input class="form-input" type="number" id="input-age" placeholder="예: 20" min="15" max="30" value="${existing?.age || ''}" required>
          <div class="form-error" id="error-age">올바른 나이를 입력해주세요.</div>
        </div>

        <div class="form-group">
          <label class="form-label">성별 *</label>
          <div class="radio-group">
            <div class="radio-option">
              <input type="radio" name="gender" id="gender-male" value="남" ${existing?.gender === '남' ? 'checked' : ''}>
              <label for="gender-male">남</label>
            </div>
            <div class="radio-option">
              <input type="radio" name="gender" id="gender-female" value="여" ${existing?.gender === '여' ? 'checked' : ''}>
              <label for="gender-female">여</label>
            </div>
          </div>
          <div class="form-error" id="error-gender">성별을 선택해주세요.</div>
        </div>

        <div class="form-group">
          <label class="form-label" for="input-intro">간단한 소개</label>
          <textarea class="form-textarea" id="input-intro" placeholder="MBTI, 관심사 등 간단한 소개를 적어주세요!" rows="3">${existing?.introduction || ''}</textarea>
        </div>

        <button type="submit" class="btn btn-primary btn-full">
          ${existing ? '수정 완료 →' : '순장 프로필 보기 →'}
        </button>
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
    // photo removed
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
