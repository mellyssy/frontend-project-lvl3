const parseData = (data) => {
  const parser = new DOMParser();
  const rssDocument = parser.parseFromString(data, 'application/xml');
  const error = rssDocument.querySelector('parsererror');

  if (error) {
    throw new Error('parser error');
  }

  const title = rssDocument.querySelector('channel title').textContent;
  const description = rssDocument.querySelector('description').textContent;
  const items = [...rssDocument.querySelectorAll('item')].map((item) => {
    const itemTitle = item.querySelector('title').textContent;
    const link = item.querySelector('link').textContent;
    const itemDescription = item.querySelector('description').textContent;
    return {
      title: itemTitle, link, description: itemDescription,
    };
  });

  return {
    items,
    title,
    description,
  };
};

export default parseData;
