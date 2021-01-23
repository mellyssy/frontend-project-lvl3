const parseData = (data) => {
  const parser = new DOMParser();
  const rssDocument = parser.parseFromString(data, 'application/xml');
  const error = rssDocument.querySelector('parsererror');

  if (error) {
    const err = rssDocument.firstChild.nodeValue;
    throw new Error(err);
  }

  const channelTitle = rssDocument.querySelector('channel title').textContent;
  const description = rssDocument.querySelector('description').textContent;
  const items = [...rssDocument.querySelectorAll('item')].map((item) => {
    const title = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    return { title, link };
  });

  return {
    items,
    channelTitle,
    description,
  };
};

export default parseData;
