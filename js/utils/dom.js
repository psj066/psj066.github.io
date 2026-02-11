// ========================================
// DOM Helpers
// ========================================

/**
 * querySelector shortcut
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element|null}
 */
export const $ = (selector, parent = document) => parent.querySelector(selector);

/**
 * querySelectorAll shortcut (returns real Array)
 * @param {string} selector
 * @param {Element} [parent=document]
 * @returns {Element[]}
 */
export const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];

/**
 * Create an element with attributes and children
 * @param {string} tag
 * @param {Object} [attrs={}]
 * @param  {...(Element|string)} children
 * @returns {Element}
 */
export function createElement(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);

  const BOOLEAN_ATTRS = ['disabled', 'checked', 'readonly', 'required', 'hidden', 'selected', 'autofocus'];

  for (const [key, value] of Object.entries(attrs)) {
    if (key === 'className') {
      el.className = value;
    } else if (key === 'dataset') {
      Object.assign(el.dataset, value);
    } else if (key.startsWith('on') && typeof value === 'function') {
      el.addEventListener(key.slice(2).toLowerCase(), value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign(el.style, value);
    } else if (key === 'innerHTML') {
      el.innerHTML = value;
    } else if (['checked', 'value', 'disabled', 'required', 'selected'].includes(key)) {
      // Set as property for these boolean/value attributes
      el[key] = value;
      // Optionally set attribute for CSS styling needs
      if (value && typeof value === 'boolean') el.setAttribute(key, '');
    } else {
      el.setAttribute(key, value);
    }
  }

  for (const child of children) {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else if (child instanceof Element) {
      el.appendChild(child);
    }
  }

  return el;
}

/**
 * Remove all children from an element
 * @param {Element} el
 */
export function clearContainer(el) {
  while (el.firstChild) {
    el.removeChild(el.firstChild);
  }
}
