import 'bootstrap/dist/css/bootstrap.min.css';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import validation from './validation.js';
import parseData from './parser.js';
import resources from './locales.js';

const proxy = 'https://rss-reader-proxy.herokuapp.com/';

const renderError = (elements, message) => {
  elements.submit.removeAttribute('disabled');
  elements.input.setCustomValidity(i18next.t(`errors.${message}`));
  elements.error.textContent = elements.input.validationMessage;
  elements.form.classList.add('was-validated');
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
};

const loadFeed = (state) => {
  axios
    .get(`${proxy}${state.url}`)
    .then((response) => {
      const { items, channelTitle: title, description } = parseData(response.data);
      state.feeds.push({ url: state.url, title, description });
      state.appState = 'ready';
      state.posts = [...items, ...state.posts];
    }).catch((err) => {
      state.error = err;
      state.appState = 'error';
    });
};

const reload = (state) => {
  const promises = state.feeds.map(({ url }) => axios.get(`${proxy}${url}`));
  Promise.all(promises).then((response) => {
    const { items } = parseData(response.data);

    const newItems = _.difference(items, state.posts);
    state.posts = [...newItems, ...state.posts];

    setTimeout(() => {
      reload(state);
    }, 5000);
  })
    .catch((err) => {
      state.error = err;
      state.appState = 'error';
    });
};

const cleanForm = (elements, state) => {
  elements.form.reset();
  elements.submit.removeAttribute('disabled');
  state.url = '';
};

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.url = formData.get('link');
  state.appState = 'loading'; // bad idea
  state.formState = 'validating';
  const err = validation(state);
  if (err) {
    state.error = err;
    state.formState = 'invalid';
  } else {
    state.formState = 'valid';
    loadFeed(state);
  }
};

const runner = () => {
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
    feeds: [],
    posts: [],
    error: '',
    phase: '',
    url: '',
    appState: '',
    formState: '',
    postsState: '',
  };

  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  }).then(() => {
    const watchedState = onChange(state, (path, value) => {
      if (path === 'appState') {
        if (value === 'error') {
          renderError(elements, state.error);
        } else if (value === 'ready') {
          elements.input.setCustomValidity('');
          cleanForm(elements, state);
          elements.feedsContainer.classList.remove('d-none');
        }
      } else if (path === 'formState') {
        if (value === 'invalid') {
          renderError(elements, state.error);
        } else if (value === 'validating') {
          elements.submit.setAttribute('disabled', true);
        }
      } else if (path === 'posts') {
        renderFeed(elements, state);
      }
    });

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(e, watchedState);
    });

    reload(watchedState);
  });
};

runner();
