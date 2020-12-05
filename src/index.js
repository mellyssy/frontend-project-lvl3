import 'bootstrap/dist/css/bootstrap.min.css';
import onChange from 'on-change';
import axios from 'axios';
import { validation, handleError } from './validation.js';
import parseData from './parser.js';

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.url = formData.get('link');
  state.phase = 'validating';
};

const renderFeed = (elements, state) => {
  elements.feeds.innerHTML = '';
  elements.posts.innerHTML = '';
  [...state.feeds].reverse().forEach((feed) => {
    const feedItem = `
    <li class="list-group-item">
      <h3>${feed.title}</h3>
      <p>${feed.description}</p>
    </li>`;
    elements.feeds.innerHTML += feedItem;
  });

  const postItems = [...state.posts].map((post) => {
    const link = document.createElement('a');
    link.classList.add('list-group-item', 'list-group-item-action');
    link.href = post.link;
    link.target = '_blank';
    link.textContent = post.title;
    return link;
  });
  elements.posts.append(...postItems);
  state.phase = 'idle';
};

const loadFeed = (state, url) => {
  const proxy = 'https://rss-reader-proxy.herokuapp.com/';
  axios.get(`${proxy}${url}`)
    .then((response) => {
      parseData(state, response.data);
    })
    .catch((err) => {
      handleError(state, err);
    });
};

const reload = (state) => {
  state.links.forEach((url) => {
    loadFeed(state, url);
  });
  state.phase = 'rerender';
};

const renderError = (elements, state) => {
  elements.submit.removeAttribute('disabled');
  elements.input.setCustomValidity(state.errors[0]);
  elements.error.textContent = elements.input.validationMessage;
  elements.form.classList.add('was-validated');
  state.errors = [];
};

const cleanForm = (elements, state) => {
  elements.form.reset();
  elements.submit.removeAttribute('disabled');
  state.links.push(state.url);
  state.url = '';
};

const render = (elements, state) => {
  switch (state.phase) {
    case 'validating':
      elements.submit.setAttribute('disabled', true);
      break;
    case 'error':
      renderError(elements, state);
      break;
    case 'loading':
      elements.input.setCustomValidity('');
      break;
    case 'rendering':
      cleanForm(elements, state);
      elements.feedsContainer.classList.remove('d-none');
      renderFeed(elements, state);
      break;
    case 'rerender':
      renderFeed(elements, state);
      break;
    default:
      state.errors.push(`Unknown phase: ${state.phase}`);
      state.phase = 'error';
  }
};

const init = () => {
  const elements = {
    form: document.querySelector('.rss-input'),
    input: document.querySelector('.rss-link'),
    submit: document.querySelector('.submit'),
    error: document.querySelector('.invalid-feedback'),
    feedsContainer: document.querySelector('.feeds-container'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
  };

  const state = {
    links: [],
    feeds: [],
    posts: [],
    errors: [],
    phase: '',
    url: '',
  };

  return [elements, state];
};

const runner = () => {
  const [elements, state] = init();
  const watchedState = onChange(state, (path, value) => {
    if (path === 'phase') {
      switch (value) {
        case 'error':
        case 'rendering':
        case 'rerender':
          render(elements, watchedState);
          break;
        case 'validating':
          validation(watchedState);
          render(elements, watchedState);
          break;
        case 'loading':
          render(elements, watchedState);
          loadFeed(watchedState, watchedState.url);
          break;
        case 'idle':
          setTimeout(() => {
            reload(watchedState);
          }, 5000);
          break;
        default:
          throw new Error(`Unknown phase: ${value}`);
      }
    }
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(e, watchedState);
  });
};

runner();
