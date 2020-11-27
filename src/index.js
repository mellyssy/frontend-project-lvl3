import 'bootstrap/dist/css/bootstrap.min.css';
import onChange from 'on-change';
import axios from 'axios';
import { validation, handleError } from './validation.js';

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.link = formData.get('link');
  state.phase = 'validating';
};

const isInFeeds = (data, title) => data.findIndex((feed) => feed.title === title);

const renderFeed = ({ feeds, posts }, { data }) => {
  feeds.innerHTML = '';
  posts.innerHTML = '';
  [...data].reverse().forEach((feed) => {
    const feedItem = `
    <li class="list-group-item">
      <h3>${feed.title}</h3>
      <p>${feed.description}</p>
    </li>`;
    feeds.innerHTML += feedItem;

    const postItems = feed.posts.map((post) => {
      const link = document.createElement('a');
      link.classList.add('list-group-item', 'list-group-item-action');
      link.href = post.link;
      link.target = '_blank';
      link.textContent = post.title;
      return link;
    });
    posts.append(...postItems);
  });
};

const parseData = (state, feed) => {
  const parser = new DOMParser();
  const rssDocument = parser.parseFromString(feed, 'application/xml');
  const error = rssDocument.querySelector('parsererror');

  if (error) {
    const err = rssDocument.firstChild.nodeValue;
    handleError(state, err);
    return;
  }

  const title = rssDocument.querySelector('channel title').textContent;
  const description = rssDocument.querySelector('description').textContent;
  const posts = [...rssDocument.querySelectorAll('item')].map((item) => {
    const postTitle = item.querySelector('title').textContent;
    const postLink = item.querySelector('link').textContent;
    return {
      title: postTitle,
      link: postLink,
    };
  });

  const feedIndex = isInFeeds(state.data, title);
  if (feedIndex !== -1) {
    state.data[feedIndex].posts = posts;
    return;
  }

  state.data.push({ title, description, posts });
  state.phase = 'rendering';
};

const loadFeed = (state, url) => {
  axios.get(`https://thingproxy.freeboard.io/fetch/${encodeURIComponent(url)}`,
    { headers: { 'Access-Control-Allow-Origin': '*' } })
    .then((response) => {
      parseData(state, response.data);
    })
    .catch((err) => {
      handleError(state, err);
    });
};

const reload = (state) => {
  state.feeds.forEach((url) => {
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
  state.feeds.push(state.link);
  state.link = '';
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
      renderFeed(elements, state);
      elements.feedsContainer.classList.remove('d-none');
      state.phase = 'idle';
      break;
    case 'rerender':
      renderFeed(elements, state);
      state.phase = 'idle';
      break;
    default:
      state.errors.push('Unknown phase');
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
    feeds: [],
    data: [],
    errors: [],
    phase: '',
    link: '',
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
          loadFeed(watchedState, state.link);
          break;
        case 'idle':
          setTimeout(() => {
            reload(watchedState);
          }, 5000);
          break;
        default:
          throw new Error('unexpected phase');
      }
    }
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(e, watchedState);
  });
};

runner();
