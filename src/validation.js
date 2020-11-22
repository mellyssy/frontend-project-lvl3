import * as yup from 'yup';
import i18next from 'i18next';
import resources from './locales.js';

const schema = yup.string().required().url().matches(/rss/);

const isCopy = ({ feeds }, link) => feeds.includes(link);

const handleErrorMsg = (err) => {
  i18next.init({
    lng: 'en',
    debug: true,
    resources,
  });
  console.log(err.message);
  switch (err.message) {
    case 'this must be a valid URL':
      return i18next.t('errors.invalidUrl');
    case 'this must match the following: "/rss/"':
      return i18next.t('errors.rssCheck');
    case 'this is a required field':
      return i18next.t('errors.empty');
    case 'feed is in the list':
      return i18next.t('errors.notUnique');
    case 'Network Error':
      return i18next.t('errors.network');
    default:
      return i18next.t('errors.default');
  }
};

const handleError = (state, error) => {
  const msg = handleErrorMsg(error);
  state.errors.push(msg);
  state.phase = 'error';
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
      handleError(state, err);
    });
};

export { validation, handleError };
