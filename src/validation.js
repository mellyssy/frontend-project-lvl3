import * as yup from 'yup';

const validation = (state) => {
  const urls = state.feeds.map((o) => o.url);
  const schema = yup.string().required().url().matches(/rss/)
    .notOneOf(urls, 'feed is in the list');

  schema
    .validate(state.url)
    .then()
    .catch((err) => err);
};

export default validation;
