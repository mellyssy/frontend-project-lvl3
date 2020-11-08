import 'bootstrap/dist/css/bootstrap.min.css';
import onChange from 'on-change';
import * as yup from 'yup';

const handleSubmit = (e, state) => {
  const formData = new FormData(e.target);
  state.link = formData.get('link');
  state.phase = 'validating';
  console.log(state);
};

const schema = yup.string().required().url().matches(/.*\.rss$/);

const validation = (state) => {
  schema
    .validate(state.link)
    .then((value) => {
      state.feeds.push(value);
      state.phase = 'loading';
    })
    .catch((err) => {
      state.errors.push(err);
      state.phase = 'loading';
    });
};

const runner = () => {
  const formElement = document.querySelector('.rss-input');
  const inputElement = formElement.querySelector('.rss-link');
  const submitElement = formElement.querySelector('.submit');

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
    }
  });

  formElement.addEventListener('submit', (e) => {
    e.preventDefault();
    handleSubmit(e, watchedState);
  });
};

runner();
