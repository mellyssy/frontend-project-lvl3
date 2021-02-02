import * as yup from 'yup';

const validation = (urls, url) => {
  const schema = yup.string().required().url().matches(/rss/)
    .notOneOf(urls, 'feed is in the list');

  return schema.validateSync(url);
};

export default validation;
