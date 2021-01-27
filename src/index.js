import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/js/dist/util.js';
import 'bootstrap/js/dist/modal.js';
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

const markAsRead = (link) => {
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

const createPostElement = ({ modal }, item, index) => {
  const link = document.createElement('a');
  link.href = item.link;
  link.target = '_blank';
  link.textContent = item.title;
  if (!item.isClicked) {
    link.classList.add('font-weight-bold');
  }

  link.addEventListener('click', () => {
    item.isClicked = true;
    markAsRead(link);
  });

  const modalBtn = document.createElement('button');
  modalBtn.classList.add('btn', 'btn-info');
  modalBtn.dataset.toggle = 'modal';
  modalBtn.dataset.target = '#postModal';
  modalBtn.dataset.index = index;
  modalBtn.textContent = 'Preview';

  modalBtn.addEventListener('click', () => {
    fillModal(modal, item);
    item.isClicked = true;
    markAsRead(link);
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
    const feedItem = `
    <li class="list-group-item">
      <h3>${feed.title}</h3>
      <p>${feed.description}</p>
    </li>`;
    elements.feeds.innerHTML += feedItem;
  });

  const postItems = [...state.posts].map(
    (post, index) => createPostElement(elements, post, index),
  );
  elements.posts.append(...postItems);
};

const loadFeed = (state) => {
  axios
    .get(`${proxy}${state.url}`)
    .then((response) => {
      const {
        items,
        channelTitle: title,
        channelDescription: description,
      } = parseData(response.data);
      state.feeds.push({ url: state.url, title, description });
      state.appState = 'ready';
      state.posts = [...items, ...state.posts];
    }).catch((err) => {
      state.error = err;
      state.appState = 'error';
    });
};

const reload = (state) => {
  if (state.feeds.length) {
    const promises = state.feeds.map(({ url }) => axios.get(`${proxy}${url}`));
    Promise.all(promises).then((values) => {
      const newItems = values.flatMap((response) => {
        const { items } = parseData(response.data);
        return _.differenceWith(
          items,
          state.posts,
          (arrVal, othVal) => arrVal.title === othVal.title,
        );
      });
      state.posts = [...newItems, ...state.posts];
    })
      .catch((err) => {
        state.error = err.message;
        state.appState = 'error';
      });
  }
  setTimeout(() => {
    reload(state);
  }, 5000);
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
  Promise.resolve(validation(state))
    .then(() => {
      state.formState = 'valid';
      loadFeed(state);
    }).catch((error) => {
      state.error = error.message;
      state.formState = 'invalid';
    });
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
    modal: document.querySelector('#postModal'),
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
    nsSeparator: false,
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
