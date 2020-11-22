import 'bootstrap/dist/css/bootstrap.min.css';
import onChange from 'on-change';
import axios from 'axios';
import { validation, handleError } from './validation.js';

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.link = formData.get('link');
  state.phase = 'validating';
};

const renderFeed = ({ feeds, posts }, { data }) => {
  feeds.innerHTML = '';
  posts.innerHTML = '';
  data.reverse().forEach((feed) => {
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
  state.data.push({
    title,
    description,
    posts,
  });
  state.phase = 'rendering';
};

const loadFeed = (state) => {
  const url = state.link;
  axios.get(`https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
    .then((response) => {
      state.feeds.push(state.link);
      state.link = '';
      parseData(state, response.data);
    })
    .catch((err) => {
      handleError(state, err);
    });
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
      elements.input.setCustomValidity('');
      break;
    case 'rendering':
      elements.form.reset();
      elements.submit.removeAttribute('disabled');
      renderFeed(elements, state);
      elements.feedsContainer.classList.remove('d-none');
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
    error: document.querySelector('.invalid-feedback'),
    feedsContainer: document.querySelector('.feeds-container'),
    feeds: document.querySelector('.feeds'),
    posts: document.querySelector('.posts'),
  };

  const state = {
    feeds: [],
    data: [],
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
    } else if (value === 'loading') {
      render(elements, watchedState);
      loadFeed(watchedState);
    } else if (value === 'rendering') {
      render(elements, watchedState);
    }
  });

  elements.form.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(e, watchedState);
  });
};

runner();
