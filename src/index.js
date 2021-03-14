/* eslint-disable no-param-reassign */
import 'bootstrap';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import _ from 'lodash';
import validation from './validation.js';
import parseData from './parser.js';
import resources from './locales.js';

const renderError = (elements, key, i18e) => {
  elements.submit.removeAttribute('disabled');
  elements.input.removeAttribute('disabled');
  const message = i18e.t(`errors.${key}`, 'something went wrong :(');
  elements.input.setCustomValidity(message);
  elements.error.textContent = message;
  elements.form.classList.add('was-validated');
};

const markAsRead = (id) => {
  const link = document.querySelector(`a[data-index="${id}"]`);
  link.classList.remove('font-weight-bold');
  link.classList.add('font-weight-normal');
};

const fillModal = (modal, data) => {
  const title = modal.querySelector('.modal-title');
  const body = modal.querySelector('.modal-body p');
  const link = modal.querySelector('.full-article-link');
  link.href = data.link;
  title.textContent = data.title;
  body.textContent = data.description;
};

const createPostElement = ({ modal }, item, state) => {
  const link = document.createElement('a');
  link.href = item.link;
  link.target = '_blank';
  link.textContent = item.title;
  link.dataset.index = item.id;

  if (!state.clickedLinks.has(item.id)) {
    link.classList.add('font-weight-bold');
  }

  link.addEventListener('click', () => {
    state.clickedLinks.add(item.id);
  });

  const modalBtn = document.createElement('button');
  modalBtn.classList.add('btn', 'btn-info');
  modalBtn.dataset.toggle = 'modal';
  modalBtn.dataset.target = '#postModal';
  modalBtn.textContent = 'Preview';
  modalBtn.addEventListener('click', () => {
    fillModal(modal, item);
    state.clickedLinks.add(item.id);
  });

  const listItem = document.createElement('li');
  listItem.classList.add('list-group-item', 'd-flex', 'justify-content-between', 'align-items-center');
  listItem.appendChild(link);
  listItem.appendChild(modalBtn);
  return listItem;
};

const renderFeed = (elements, state) => {
  elements.feeds.innerHTML = '';
  elements.posts.innerHTML = '';
  [...state.feeds].reverse().forEach((feed) => {
    const feedItem = document.createElement('li');
    feedItem.classList.add('list-group-item');
    const feedTitle = document.createElement('h3');
    feedTitle.textContent = feed.title;
    const feedDescription = document.createElement('p');
    feedDescription.textContent = feed.description;
    feedItem.append(feedTitle, feedDescription);
    elements.feeds.appendChild(feedItem);
  });
  const postItems = state.posts.map(
    (post) => createPostElement(elements, post, state),
  );
  elements.posts.append(...postItems);
};

const addProxy = (link) => `https://hexlet-allorigins.herokuapp.com/get?disableCache=true&url=${encodeURIComponent(link)}`;

const loadFeed = (state) => {
  axios
    .get(addProxy(state.url))
    .then((response) => {
      const { items, title, description } = parseData(response.data.contents);
      state.feeds.push({ url: state.url, title, description });
      state.url = '';
      state.appState = 'ready';
      const itemsWithId = items.map((item) => ({ ...item, id: _.uniqueId() }));
      state.posts = [...itemsWithId, ...state.posts];
    }).catch((err) => {
      state.error = err;
      state.appState = 'error';
    });
};

const reload = (state) => {
  const promises = state.feeds.map(({ url }) => axios.get(addProxy(url)).then((response) => {
    const { items } = parseData(response.data.contents);
    const newItems = _.differenceWith(
      items,
      state.posts,
      (arrVal, othVal) => arrVal.title === othVal.title,
    ).map((item) => ({ ...item, id: _.uniqueId() }));
    state.posts = [...newItems, ...state.posts];
  }));
  Promise.all(promises).then()
    .finally(() => {
      setTimeout(() => {
        reload(state);
      }, 5000);
    });
};

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.url = formData.get('url').trim();
  state.formState = 'validating';
  const urls = state.feeds.map((o) => o.url);
  const validationError = validation(urls, state.url);
  if (validationError) {
    state.error = validationError;
    state.formState = 'invalid';
    return;
  }
  state.formState = 'valid';
  state.appState = 'loading';
  loadFeed(state);
};

const run = () => {
  const i18nextInstance = i18next.createInstance();

  return i18nextInstance.init({
    lng: 'en',
    nsSeparator: false,
    resources,
  }).then(() => {
    const elements = {
      form: document.querySelector('.rss-input'),
      input: document.querySelector('.rss-link'),
      submit: document.querySelector('.submit'),
      error: document.querySelector('.invalid-feedback'),
      success: document.querySelector('.valid-feedback'),
      feedsContainer: document.querySelector('.feeds-container'),
      feeds: document.querySelector('.feeds'),
      posts: document.querySelector('.posts'),
      modal: document.querySelector('#postModal'),
    };

    const state = {
      feeds: [],
      posts: [],
      clickedLinks: new Set(),
      error: '',
      url: '',
      appState: '',
      formState: '',
    };
    const watchedState = onChange(state, (path, value) => {
      if (path === 'appState') {
        if (value === 'error') {
          renderError(elements, watchedState.error, i18nextInstance);
        } else if (value === 'ready') {
          elements.input.setCustomValidity('');
          elements.success.textContent = 'RSS успешно загружен';
          elements.form.classList.add('was-validated');
          elements.form.reset();
          elements.submit.removeAttribute('disabled');
          elements.input.removeAttribute('disabled');
          elements.feedsContainer.classList.remove('d-none');
        } else if (value === 'loading') {
          elements.submit.setAttribute('disabled', true);
          elements.input.setAttribute('disabled', true);
        }
      } else if (path === 'formState') {
        if (value === 'invalid') {
          renderError(elements, watchedState.error, i18nextInstance);
        }
      } else if (path === 'posts') {
        renderFeed(elements, watchedState);
      } else if (path === 'clickedLinks') {
        const arr = [...state.clickedLinks];
        markAsRead(arr[arr.length - 1]);
      }
    });

    elements.form.addEventListener('submit', (e) => {
      e.preventDefault();
      handleSubmit(e, watchedState);
    });
    reload(watchedState);
  });
};

export default run;
