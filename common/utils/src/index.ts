import {
  Media,
  Repository as RepositoryEntity,
  StorageType,
} from '@app/entities';
import * as cheerio from 'cheerio';
import { Parser } from 'xml2js';

export * from './bootstrap';
export * from './call-api';
export * from './enum';
export * from './serializer.interceptor';
export * from './validation-options';

export const convertImageData = (
  repoDb: RepositoryEntity[],
  imageName: string,
) => {
  const repo = repoDb?.find((repo, index) => {
    const service = repo.services.find(
      (service) => service.image.split(':')[0] == imageName,
    );
    if (service) return true;
  });

  const service = repo?.services?.find(
    (service) => service?.image?.split(':')[0] == imageName,
  );

  return {
    server_path: repo?.server_path || '',
    repository: repo,
    service: service,
  };
};

export function convertResponseRepository(data: RepositoryEntity) {
  return {
    ...data,
    images: data.services.reduce(
      (acc, item) => (item.image ? [...acc, item.image] : acc),
      [],
    ),
  };
}

interface RSSItem {
  title: string;
  link?: string;
  pubDate: string;
  description: string;
  'ht:approx_traffic': string;
  'ht:picture': string;
  'ht:picture_source': string;
  'ht:news_item'?: NewsItem[] | NewsItem;
}

interface NewsItem {
  'ht:news_item_title': string;
  'ht:news_item_url': string;
  'ht:news_item_source': string;
  'ht:news_item_picture': string;
  'ht:news_item_snippet': string;
}

interface RSSFeed {
  rss: {
    channel: {
      link?: string;
      item: RSSItem[] | RSSItem;
    };
  };
}

export async function fetchTrendings() {
  const trendingUrl = 'https://trends.google.com/trending/rss?geo=VN';
  const response = await fetch(trendingUrl);
  if (!response.ok) return [];

  const rssFeed = await response.text();

  const parser = new Parser({ explicitArray: false, mergeAttrs: true });
  const result: RSSFeed = await parser.parseStringPromise(rssFeed);
  const trendings = Array.isArray(result.rss.channel.item)
    ? result.rss.channel.item
    : [result.rss.channel.item];

  return trendings.map((trending) => {
    const articles = trending['ht:news_item']
      ? Array.isArray(trending['ht:news_item'])
        ? trending['ht:news_item']
        : [trending['ht:news_item']]
      : undefined;

    return {
      title: { query: trending.title, exploreLink: trending.link },
      shareUrl: trending.link,
      trendDate: trending.pubDate,
      image: {
        imageUrl: trending['ht:picture'],
        source: trending['ht:picture_source'],
      },
      formattedTraffic: trending['ht:approx_traffic'],

      articles: articles?.map((item) => {
        return {
          title: item['ht:news_item_title'],
          source: item['ht:news_item_source'],
          url: item['ht:news_item_url'],
          image: {
            newsUrl: item['ht:news_item_url'],
            imageUrl: item['ht:news_item_picture'],
            source: item['ht:news_item_source'],
          },
        };
      }),
    };
  });
}

export async function saveImageAsBase64(
  slug: string,
  filename: string,
  imageUrl: string,
) {
  const response = await fetch(imageUrl);

  if (!response.ok) {
    console.error('ERROR:', 'Fetch Image ' + slug + ':' + filename);
    return undefined;
  }

  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const base64Image = buffer.toString('base64');

  // Get the image format (png, jpeg, etc.)
  const contentType = response.headers.get('Content-Type') || '';

  const mediaEntity = {
    url: imageUrl,
    slug: slug
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim(),
    filename: filename,
    data: base64Image,
    mimetype: contentType,
    storage_type: StorageType.BASE64,
    size: buffer.length,
  };

  return mediaEntity as Media;
}

export async function generatePostFromHtml(body: {
  url: string;
  title: string;
}) {
  const response = await fetch(body.url, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
  })
    .then((value) => {
      return value;
    })
    .catch((error) => {
      console.log('---------->', body.url, '<----------');
      return error;
    });
  if (!response?.ok) {
    return {
      content: undefined,
      keywords: undefined,
      description: undefined,
    };
  }

  const searchText = body.title.replace('...', '');
  const html = await response.text();

  const $ = cheerio.load(html);

  const description = $('meta[name="description"]').attr('content');
  const keywordsContent = $('meta[name="keywords"]').attr('content');
  const keywords = keywordsContent
    ? keywordsContent.split(',').map((keyword) => ({ query: keyword.trim() }))
    : [];

  const element = $('h1')
    .filter(function () {
      return $(this).text().trim().includes(searchText);
    })
    .first();

  const imgTags = $('img');

  for (let i = 0; i < imgTags.length; i++) {
    const img = imgTags[i];
    const imgSrc = $(img).attr('src');

    if (imgSrc && imgSrc.startsWith('http')) {
      const articleSlug = imgSrc.split('/')[imgSrc.split('/').length - 1];

      const base64Image = await saveImageAsBase64(
        'post image ' + articleSlug || body.title.trim(),
        body.title,
        imgSrc,
      );
      if (base64Image.data) {
        base64Image?.data &&
          $(img).attr('src', `data:image/png;base64,${base64Image?.data}`);
      }
    }
  }

  if (element.length) {
    const parentDiv = element.closest('div');
    return {
      content: `${parentDiv.html()}`,
      keywords,
      description,
    };
  }

  return {
    content: undefined,
    keywords,
    description,
  };
}
