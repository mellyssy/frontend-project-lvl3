import * as yup from 'yup';

const validation = (state) => {
  const urls = state.feeds.map((o) => o.url);
  const schema = yup.string().required().url().matches(/rss/)
    .notOneOf(urls, 'feed is in the list');

  return schema.validate(state.url);
};

export default validation;
