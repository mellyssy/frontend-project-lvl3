import * as yup from 'yup';

const schema = yup.string().required().url().matches(/rss/);

const isCopy = ({ feeds }, link) => feeds.includes(link);

const handleErrorMsg = (err) => {
  switch (err.message) {
    case 'this must be a valid URL':
      return 'URL is invalid, check example to see valid URL';
    case 'this must match the following: "/rss/"':
      return 'URL is invalid, make sure you\'re passing .rss link';
    case 'this is a required field':
      return 'Don\'t forget to put in URL';
    case 'feed is in the list':
      return 'You can\'t add feed twice';
    default:
      return 'Unknown error, what are you doing?';
  }
};

const validation = (state) => {
  schema
    .validate(state.link)
    .then((value) => {
      if (isCopy(state, value)) {
        throw new Error('feed is in the list');
      }
      state.phase = 'loading';
    })
    .catch((err) => {
      const msg = handleErrorMsg(err);
      state.errors.push(msg);
      state.phase = 'error';
    });
};

export default validation;
