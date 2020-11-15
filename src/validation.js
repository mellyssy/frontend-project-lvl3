import * as yup from 'yup';

const schema = yup.string().required().url().matches(/.*\.rss$/);

const handleErrorMsg = (err) => {
  console.log(err.message);
  switch (err.message) {
    case 'this must be a valid URL':
      return 'URL is invalid, check example to see valid URL';
    case 'this must match the following: "/.*\\.rss$/"':
      return 'URL is invalid, make sure you\'re passing .rss link';
    case 'this is a required field':
      return 'Don\'t forget to put in URL';
    default:
      return 'Unknown error, what are you doing?';
  }
};

const validation = (state) => {
  schema
    .validate(state.link)
    .then((value) => {
      state.feeds.push(value);
      state.phase = 'loading';
    })
    .catch((err) => {
      const msg = handleErrorMsg(err);
      state.errors.push(msg);
      state.phase = 'error';
    });
};

export default validation;
