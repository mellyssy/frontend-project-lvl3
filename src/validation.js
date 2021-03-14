import * as yup from 'yup';

yup.setLocale({
  mixed: {
    default: 'something went wrong :(',
    notOneOf: 'feed is in the list',
  },
});

const validation = (urls, url) => {
  const schema = yup.string().required().url()
    .notOneOf(urls);

  try {
    schema.validateSync(url);
  } catch (error) {
    return error.message;
  }

  return false;
};

export default validation;
