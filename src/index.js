import 'bootstrap/dist/css/bootstrap.min.css';
import onChange from 'on-change';
import validation from './validation.js';

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.link = formData.get('link');
  state.phase = 'validating';
};

const render = (elements, state) => {
  switch (state.phase) {
    case 'validating':
      elements.submit.setAttribute('disabled', true);
      break;
    case 'error':
      elements.submit.removeAttribute('disabled');
      elements.input.setCustomValidity(state.errors[0]);
      elements.error.textContent = elements.input.validationMessage;
      elements.form.classList.add('was-validated');
      state.errors = [];
      break;
    case 'loading':
      elements.form.setCustomValidity('');
      break;
    default:
      state.errors.push('Unknown phase');
  }
};

const runner = () => {
  const elements = {
    form: document.querySelector('.rss-input'),
    input: document.querySelector('.rss-link'),
    submit: document.querySelector('.submit'),
    posts: document.querySelector('.posts'),
    feeds: document.querySelector('.feeds'),
    error: document.querySelector('.invalid-feedback'),
  };

  const state = {
    feeds: [],
    errors: [],
    phase: 'idle',
    isValid: true,
    link: '',
  };

  const watchedState = onChange(state, (path, value) => {
    if (value === 'validating') {
      validation(watchedState);
      render(elements, watchedState);
    } else if (value === 'error') {
      render(elements, watchedState);
    }
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(e, watchedState);
  });
};

runner();
