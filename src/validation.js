import * as yup from 'yup';

const validation = (state) => {
  const schema = yup.string().required().url().matches(/rss/)
    .notOneOf(state.links, 'feed is in the list');

  schema
    .validate(state.url)
    .then()
    .catch((err) => err);
};

export default validation;
