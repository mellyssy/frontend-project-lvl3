import 'bootstrap/dist/css/bootstrap.min.css';
import onChange from 'on-change';
import axios from 'axios';
import i18next from 'i18next';
import validation from './validation.js';
import parseData from './parser.js';
import resources from './locales.js';

// const isIn = (data, key, value) => (data.findIndex((el) => el[key] === value) === -1);

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.url = formData.get('link');
  state.formState = 'validating';
};

const renderError = (elements, state) => {
  elements.submit.removeAttribute('disabled');
  const msg = i18next.t(state.errors[0]);
  elements.input.setCustomValidity(msg);
  elements.error.textContent = elements.input.validationMessage;
  elements.form.classList.add('was-validated');
  state.errors = [];
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

const loadFeed = (state, url) => {
  const proxy = 'https://rss-reader-proxy.herokuapp.com/';
  return axios.get(`${proxy}${url}`); // возвращаем промис
  // .then((response) => {
  //   const parsed = parseData(state, response.data);
  // })
  // .catch((err) => {
  //   state.errors.push(err);
  //   state.appState = 'error';
  // });
};

const reload = (state) => {
  const promises = state.links.map((url) => loadFeed(state, url));
  Promise.all(promises).then((response) => {
    const parsed = parseData(state, response.data);
  })
    .catch((err) => {
      state.errors.push(err);
      state.appState = 'error';
    });
};

const cleanForm = (elements, state) => {
  elements.form.reset();
  elements.submit.removeAttribute('disabled');
  state.links.push(state.url);
  state.url = '';
};

const init = () => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });

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
    appState: '',
    formState: '',
    postsState: '',
    // appState 'loading', 'ready', 'error'
    // formState 'valid', 'invalid'
    // postsState ?
  };

  return [elements, state];
};

const runner = () => {
  const [elements, state] = init();
  const watchedState = onChange(state, (path, value) => {
    if (path === 'appState') {
      if (value === 'loading') {
        loadFeed(watchedState, elements, watchedState.url);
      } else if (value === 'error') {
        renderError(elements, state);
      } else if (value === 'ready') {
        renderFeed(elements, state);
        reload(watchedState);
      }
    } else if (path === 'formState') {
      if (value === 'invalid') {
        watchedState.appState = 'error';
      } else if (value === 'valid') {
        elements.input.setCustomValidity('');
        cleanForm(elements, state);
        elements.feedsContainer.classList.remove('d-none');
        watchedState.appState = 'loading';
      } else if (value === 'validating') {
        elements.submit.setAttribute('disabled', true);
        const error = validation(watchedState);
        if (error) {
          watchedState.errors.push(error);
          watchedState.formState = 'invalid';
        } else {
          watchedState.formState = 'valid';
        }
      }
    }
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(e, watchedState);
  });
};

runner();

// if (path === 'phase') {
//   switch (value) {
//     case 'error':
//     case 'rendering':
//     case 'rerender':
//       render(elements, watchedState);
//       break;
//     case 'validating':
//       const error = validation(watchedState);
//       if (error) {
//         handleError(watchedState, error);
//       } else {
//         watchedState.phase = 'loading';
//       }
//       break;
//     case 'loading':
//       render(elements, watchedState);
//       loadFeed(watchedState, watchedState.url);
//       break;
//     case 'idle':
//       setTimeout(() => {
//         reload(watchedState);
//       }, 5000);
//       break;
//     default:
//       throw new Error(`Unknown phase: ${value}`);
//   }
