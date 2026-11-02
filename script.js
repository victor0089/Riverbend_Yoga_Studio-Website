/* Riverbend Yoga Studio | Touchstone 4 | Interactivity and browser storage */
'use strict';

// Course demonstration: no personal details are saved or transmitted.
const classCatalog = [
  { id: 'gentle', label: 'Gentle Yoga', detail: 'A supportive, slower-paced class with optional seated movement.' },
  { id: 'vinyasa', label: 'Vinyasa Flow', detail: 'A flowing class with optional pauses and modifications.' },
  { id: 'restorative', label: 'Restorative Yoga', detail: 'A restful practice with supported poses and calming breath.' },
  { id: 'private', label: 'Private Session', detail: 'A one-to-one conversation about goals and movement preferences.' }
];

const storageKeys = Object.freeze({
  preferredClass: 'riverbend_v1_preferred_class',
  contactMethod: 'riverbend_v1_contact_method'
});

const fields = Object.freeze({
  'full-name': 'name-error',
  email: 'email-error',
  phone: 'phone-error',
  interest: 'interest-error',
  message: 'message-error',
  experience: 'experience-error',
  'contact-method': 'contact-error'
});

function storedValue(key) {
  try { return window.localStorage.getItem(key) || ''; }
  catch (_error) { return ''; } // Browser storage may be disabled.
}
function saveValue(key, value) {
  try { window.localStorage.setItem(key, value); return true; }
  catch (_error) { return false; }
}
function clearValue(key) {
  try { window.localStorage.removeItem(key); } catch (_error) { /* no-op */ }
}
function findClass(id) { return classCatalog.find((item) => item.id === id); }

function updateClassPreference(selectedId, restored = false) {
  const result = document.getElementById('preference-result');
  if (!result) return;
  const selected = findClass(selectedId);
  document.querySelectorAll('.preference-button').forEach((button) => {
    const active = Boolean(selected && button.dataset.classId === selected.id);
    button.setAttribute('aria-pressed', String(active));
    button.textContent = active ? 'Selected preference' : 'Save as my preference';
  });
  const clearButton = document.getElementById('clear-preference');
  if (clearButton) clearButton.disabled = !selected;
  result.replaceChildren();
  const strong = document.createElement('strong');
  strong.textContent = selected ? (restored ? 'Welcome back: ' : 'Saved preference: ') + selected.label : 'No class selected yet.';
  result.append(strong);
  result.append(document.createTextNode(selected
    ? ' — ' + selected.detail + ' Your choice will appear on the request form.'
    : ' Choose a class below to see its details here.'));
}

function initializePreferenceSelector() {
  const result = document.getElementById('preference-result');
  if (!result) return;
  updateClassPreference(storedValue(storageKeys.preferredClass), true);
  document.querySelectorAll('.preference-button').forEach((button) => {
    button.addEventListener('click', () => {
      const id = button.dataset.classId;
      if (!findClass(id)) return;
      const saved = saveValue(storageKeys.preferredClass, id);
      updateClassPreference(id);
      if (!saved) {
        result.append(document.createTextNode(' Your browser could not save this across visits.'));
      }
    });
  });
  document.getElementById('clear-preference').addEventListener('click', () => {
    clearValue(storageKeys.preferredClass);
    updateClassPreference('');
  });
}

function showError(name, message) {
  const node = document.getElementById(fields[name]);
  if (node) node.textContent = message;
  const controls = Array.from(document.querySelectorAll('[name="' + name + '"]'));
  controls.forEach((control) => {
    if (message) control.setAttribute('aria-invalid', 'true');
    else control.removeAttribute('aria-invalid');
  });
}
function checkedValue(form, name) {
  const selected = form.querySelector('input[name="' + name + '"]:checked');
  return selected ? selected.value : '';
}

function validateField(form, name) {
  let error = '';
  const control = form.elements.namedItem(name);
  const value = control && 'value' in control ? control.value.trim() : '';
  switch (name) {
    case 'full-name':
      if (!value) error = 'Please enter your full name.';
      else if (value.length < 2) error = 'Name must contain at least 2 characters.';
      break;
    case 'email':
      if (!value) error = 'Please enter your email address.';
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) error = 'Enter a valid email address, such as name@example.com.';
      break;
    case 'phone': {
      const phoneChoice = checkedValue(form, 'contact-method') === 'phone';
      if (phoneChoice && !value) error = 'Please add a phone number for phone contact.';
      else if (value && (!/^[0-9()+ .-]{7,20}$/.test(value) || (value.match(/\d/g) || []).length < 7))
        error = 'Enter a phone number with at least 7 digits.';
      break;
    }
    case 'interest':
      if (!value) error = 'Please choose a class or workshop.';
      break;
    case 'experience':
      if (!checkedValue(form, 'experience')) error = 'Please select your experience level.';
      break;
    case 'contact-method':
      if (!checkedValue(form, 'contact-method')) error = 'Please choose a contact method.';
      break;
    case 'message':
      if (!value) error = 'Please add your question or request.';
      else if (value.length < 10) error = 'Please write at least 10 characters.';
      break;
  }
  showError(name, error);
  return !error;
}

function validateForm(form) {
  const order = ['full-name', 'email', 'phone', 'interest', 'experience', 'contact-method', 'message'];
  let firstInvalid = null;
  for (const fieldName of order) {
    if (!validateField(form, fieldName) && !firstInvalid) {
      firstInvalid = form.querySelector('[name="' + fieldName + '"]');
    }
  }
  if (firstInvalid) firstInvalid.focus();
  return !firstInvalid;
}

function updateRememberedNote(form, restored = false) {
  const note = document.getElementById('remembered-note');
  if (!note) return;
  const classChoice = findClass(form.elements.namedItem('interest').value);
  const method = checkedValue(form, 'contact-method');
  const parts = [];
  if (classChoice) parts.push((restored ? 'Restored class preference: ' : 'Class preference: ') + classChoice.label + '.');
  if (method) parts.push((restored ? 'Restored contact preference: ' : 'Contact preference: ') + (method === 'email' ? 'Email' : 'Phone') + '.');
  note.textContent = parts.length ? parts.join(' ') + ' Preferences are saved on this device only.'
    : 'Choose a class and contact method to personalize this form.';
}

function initializeInterestForm() {
  const form = document.getElementById('interest-form');
  if (!form) return;
  const savedClass = storedValue(storageKeys.preferredClass);
  const savedMethod = storedValue(storageKeys.contactMethod);
  if (findClass(savedClass)) form.elements.namedItem('interest').value = savedClass;
  if (savedMethod === 'email' || savedMethod === 'phone') {
    const option = form.querySelector('[name="contact-method"][value="' + savedMethod + '"]');
    if (option) option.checked = true;
  }
  updateRememberedNote(form, true);
  // Only class and contact preferences are stored; no names, email addresses, or messages.
  form.elements.namedItem('interest').addEventListener('change', (event) => {
    if (findClass(event.target.value)) saveValue(storageKeys.preferredClass, event.target.value);
    else clearValue(storageKeys.preferredClass);
    showError('interest', '');
    updateRememberedNote(form);
  });
  form.querySelectorAll('[name="contact-method"]').forEach((radio) => radio.addEventListener('change', () => {
    saveValue(storageKeys.contactMethod, checkedValue(form, 'contact-method'));
    validateField(form, 'contact-method');
    validateField(form, 'phone');
    updateRememberedNote(form);
  }));
  form.querySelectorAll('input, select, textarea').forEach((control) => {
    const eventName = (control.type === 'radio' || control.tagName === 'SELECT') ? 'change' : 'input';
    control.addEventListener(eventName, () => {
      if (control.name !== 'contact-method' && control.name !== 'interest') validateField(form, control.name);
    });
  });
  form.addEventListener('submit', (event) => {
    event.preventDefault(); // Demo: never posts personal information to a real server.
    const feedback = document.getElementById('submission-feedback');
    if (!validateForm(form)) {
      feedback.hidden = false;
      feedback.textContent = 'Please review the highlighted fields. Your answers are still here so you can correct them.';
      feedback.classList.add('feedback-error');
      return;
    }
    feedback.hidden = false;
    feedback.classList.remove('feedback-error');
    const interest = form.elements.namedItem('interest');
    feedback.textContent = 'Your interest in ' + interest.options[interest.selectedIndex].text +
      ' is ready to share. This is a course demonstration: your request has NOT been sent to Riverbend Yoga Studio.';
    feedback.focus();
  });
}

function initializeSite() {
  initializePreferenceSelector();
  initializeInterestForm();
}
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeSite, { once: true });
} else {
  initializeSite();
}
