const isIn = (data, key, value) => (data.findIndex((el) => el[key] === value) === -1);

const parseData = (state, feed) => {
  const parser = new DOMParser();
  const rssDocument = parser.parseFromString(feed, 'application/xml');
  const error = rssDocument.querySelector('parsererror');

  if (error) {
    const err = rssDocument.firstChild.nodeValue;
    throw new Error(err);
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
  })
    .filter(({ link }) => isIn(state.posts, 'link', link));
  state.posts = [...posts, ...state.posts];

  const isNewFeed = isIn(state.feeds, 'title', title);
  if (isNewFeed) {
    state.feeds.push({ title, description });
    state.phase = 'rendering';
  }
};

export default parseData;
