import _ from 'lodash';

const parseData = (data) => {
  const parser = new DOMParser();
  const rssDocument = parser.parseFromString(data, 'application/xml');
  const error = rssDocument.querySelector('parsererror');

  if (error) {
    const err = rssDocument.firstChild.nodeValue;
    throw new Error(err);
  }

  const channelTitle = rssDocument.querySelector('channel title').textContent;
  const channelDescription = rssDocument.querySelector('description').textContent;
  const items = [...rssDocument.querySelectorAll('item')].map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const description = item.querySelector('description').textContent;
    const id = _.uniqueId();
    return {
      title, link, description, id,
    };
  });

  return {
    items,
    channelTitle,
    channelDescription,
  };
};

export default parseData;
