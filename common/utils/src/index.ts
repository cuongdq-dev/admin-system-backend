import {
  Media,
  Repository as RepositoryEntity,
  StorageType,
} from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
import * as cheerio from 'cheerio';
import slugify from 'slugify';
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
      (service) => service.image?.split(':')[0] == imageName,
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
  const contentType = response.headers.get('Content-Type') || '';
  const mediaEntity = {
    url: imageUrl,
    slug: generateSlug(slug),
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
  index?: number;
}) {
  const response = await fetchWithRetry(body.url);

  if (!response?.ok) {
    return { content: undefined, keywords: undefined, description: undefined };
  }

  const html = await response.text();
  const $ = cheerio.load(html);

  const description = extractMetaDescription($);
  const keywords = extractMetaKeywords($);

  const { content: contentHtml, status: contentStatus } = getHtml(
    new URL(body.url).hostname,
    $,
    body.title.trim(),
    description,
  );

  if (!contentHtml) {
    return { content: undefined, keywords, description, contentStatus };
  }
  const processedContent = await processImages(contentHtml, body.title);
  return { content: processedContent, keywords, description, contentStatus };
}

async function fetchWithRetry(
  url: string,
  retries = 3,
): Promise<Response | null> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          cookie: `_ga=GA1.1.2134139623.1736400412; __RC=31; _uidcms=1736400497073820858; D1N=2fdb8fb7d30915d3291860e3fa04a7da; SESSION-ID=58e504c9-e61c-4ba8-9894-ef206c0cab4d; _ga_GL8EXWQD77=GS1.1.1737032619.2.1.1737032794.60.0.0; qc-pc-float-left=0; qc-pc-right-2=0; qc-pc-top=0; qc-pc-right-4=0; qc-pc-right-1=0; qc-pc-float-right=0; _ga_9XPGNV7HPY=GS1.1.1737041094.11.1.1737041107.47.0.0; _ga_RQZZ2QCVHK=GS1.1.1737041094.10.1.1737041107.0.0.0`,
        },
      });
    } catch (error) {
      if (attempt === retries - 1) console.error('Failed to fetch URL:', url);
    }
  }
  return null;
}

function extractMetaDescription($: cheerio.CheerioAPI): string | undefined {
  return (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content')
  );
}

function extractMetaKeywords($: cheerio.CheerioAPI): { query: string }[] {
  const keywordsContent = $('meta[name="keywords"]').attr('content');
  return keywordsContent
    ? keywordsContent.split(',').map((keyword) => ({ query: keyword.trim() }))
    : [];
}

function getHtml(
  hostname: string,
  $: cheerio.CheerioAPI,
  title: string,
  description: string,
): { content: string; status: PostStatus } {
  $('script, video, source').remove();
  $('div')
    .filter(function () {
      const content = $(this).html().trim();
      const isEmpty = content === '';
      const hasOnlyComments =
        content.startsWith('<!--') && content.endsWith('-->');
      const hasOnlySpecificTags = $(this).children().length === 0;
      return isEmpty || hasOnlyComments || hasOnlySpecificTags;
    })
    .remove();

  $('div').each((_, element) => {
    const $element = $(element);
    const content = $element.contents();
    const isOnlyComments =
      content.length > 0 &&
      content.toArray().every((node) => node.type === 'comment');
    if (isOnlyComments) {
      $element.remove();
    }
  });

  const extractionStrategies: Record<
    string,
    () => { content: string } | undefined
  > = {
    'vnexpress.net': () => {
      $(
        '.wrap-sort.width_common, .header-content.width_common, .header-live.width_common, .tab-live.width_common, .wrap-notifile, .wrap-notifileback.wrap-notifile-backtotop',
      ).remove();
      const title = $('.title-detail').prop('outerHTML');
      const content = $('.fck_detail').prop('outerHTML');
      return { content: title + content };
    },
    'vtv.vn': () => {
      $(
        '.author, .time, .chiase_top, .chiase,.kbv-social, .news_keyword',
      ).remove();
      const content = $('.noidung').prop('outerHTML');
      return { content };
    },

    'afamily.vn': () => {
      $('.bottom-info').remove();
      $('.afcbc-relate-link, .afcbc-relate, .afcbc-leftmenu').remove();

      const title = $('.afcb-title').prop('outerHTML');
      const content = $('.afcbc-body').prop('outerHTML');
      return { content: title + content };
    },

    'bongda24h.vn': () => {
      $('.muc-luc').remove();
      const title = $('.the-article-title').prop('outerHTML');
      const content = $('.the-article-content').prop('outerHTML');
      return { content: title + content };
    },

    'kenh14.vn': () => {
      $('.knc-relate-wrapper,.knc-menu-nav,.knc-rate-link').remove();
      const title = $('.kbwc-title').prop('outerHTML');
      const content = $('.klw-new-content').prop('outerHTML');
      return { content: title + content };
    },

    'dantri.com.vn': () => {
      $('.author-wrap').remove();
      const content = $('.singular-container').prop('outerHTML');
      return { content: content };
    },
    'vietnamnet.vn': () => {
      $(
        '.article-author-multiple-wrapper,.article-author-multiple,.share-social,.articles-edit',
      ).remove();
      const content = $('#maincontent').prop('outerHTML');
      return { content };
    },

    'znews.vn': () => {
      $('.innerarticle, .article').remove();
      const title = $('.the-article-title').prop('outerHTML');
      const summary = $('.the-article-summary').prop('outerHTML');
      const content = $('.the-article-body').prop('outerHTML');

      return { content: title + summary + content };
    },

    'laodong.vn': () => {
      $(
        '.art-info, .google-news, .tin-lien-quan, .m-bottom-20, .art-footer, .box-binh-luan',
      ).remove();
      const content = $('.article-detail').prop('outerHTML');
      return { content };
    },

    'eva.vn': () => {
      $(
        '.eva-breadcrumb, .eva-author-time-art, .eva-link-cate-art, .evtBox',
      ).remove();
      const content = $('#baiviet-container').prop('outerHTML');
      return { content };
    },

    'thethao247.vn': () => {
      $('#comment_area, .expNoEditj').remove();
      const title = $('#title_detail').prop('outerHTML');
      const content = $('#content_detail');
      return { content: title + content };
    },

    'tienphong.vn': () => {
      $('#comment_area, .expNoEditj').remove();
      const title = $('.article__title').prop('outerHTML');
      const content = $('.article-content');
      return { content: title + content };
    },
    'gamek.vn': () => {
      $('.link-content-footer, zone, script').remove();
      const detail = $('.detail');
      const title = detail.find('h1').prop('outerHTML');
      const content = $('.rightdetail');
      return { content: title + content };
    },
    'kinhtechungkhoan.vn': () => {
      $('.link-content-footer, zone, script').remove();
      const title = $('.detail-title').prop('outerHTML');
      const content = $('.item-content');
      content.find('table').remove();
      return { content: title + content };
    },

    'webthethao.vn': () => {
      const title = $('h1').prop('outerHTML');
      const content = $('#abody');
      return { content: title + content };
    },
    'viettimes.vn': () => {
      $('.article__relate__thumb, .article__relate__heading').remove();
      const title = $('.article__title').prop('outerHTML');
      const content = $('.article__body').prop('outerHTML');
      return { content: title + content };
    },

    'cafebiz.vn': () => {
      const detail = $('#mainDetail');
      detail.find('.bottom-info').remove();
      const title = detail.find('.title').prop('outerHTML');
      const content = detail.find('.detail-content');
      return { content: title + content };
    },
    'thanhnien.vn': () => {
      const detail = $('.detail__cmain');
      detail.find('.bottom-info').remove();
      const title = detail.find('.detail-title').prop('outerHTML');
      const content = detail.find('.detail-content');
      return { content: title + content };
    },

    'tuoitre.vn': () => {
      const title = $('.detail-title').prop('outerHTML');
      const content = $('.detail-content.afcbc-body');
      return { content: title + content };
    },
    'oneesports.vn': () => {
      const titleElement = $('*').filter(function () {
        return $(this).text().trim() === title;
      });
      const titleParents = titleElement.parents();
      titleParents.find('.post-meta').remove();
      titleParents.find('.post-share').remove();
      return { content: titleParents.prop('outerHTML') };
    },

    default: () => {
      const titleElement = $('*').filter(function () {
        return $(this).text().trim() === title;
      });

      const descriptionElement = $('*').filter(function () {
        return $(this).text().trim() === description;
      });

      if (!titleElement.length || !descriptionElement.length) {
        return undefined;
      }

      const titleParents = titleElement.parents();
      const descriptionParents = descriptionElement.parents();

      let commonParent = null;
      titleParents.each((_, el) => {
        if (descriptionParents.is(el)) {
          commonParent = el;
          return false;
        }
      });

      return { content: commonParent ? $(commonParent).html() || '' : '' };
    },
  };

  const { content, status } = extractionStrategies[hostname]
    ? {
        content: extractionStrategies[hostname]()?.content,
        status: PostStatus.PUBLISHED,
      }
    : {
        content: extractionStrategies.default()?.content || '',
        status: PostStatus.NEW,
      };

  return { content, status };
}

async function processImages(
  contentHtml: string,
  title: string,
): Promise<string> {
  const $ = cheerio.load(contentHtml);
  const imgTags = $('img');

  for (let i = 0; i < imgTags.length; i++) {
    const img = imgTags[i];

    if ($(img).parent('a').length) {
      $(img).parent('a').replaceWith(img);
    }

    const imgSrc =
      ($(img).attr('src')?.startsWith('http') && $(img).attr('src')) ||
      ($(img).attr('data-original')?.startsWith('http') &&
        $(img).attr('data-original')) ||
      ($(img).attr('data-src')?.startsWith('http') && $(img).attr('data-src'));

    if (imgSrc && imgSrc.startsWith('http')) {
      const base64Image = await saveImageAsBase64(
        'post image ' + title,
        title,
        imgSrc,
      );
      if (base64Image?.data) {
        $(img).attr('src', `data:image/png;base64,${base64Image.data}`);
        $(img).removeAttr('data-original');
        $(img).removeAttr('data-src');
      }
    }
  }

  return $('body').length ? $('body').html() : $.html();
}

export function generateSlug(text: string): string {
  const slug = slugify(text, {
    lower: true,
    trim: true,
    strict: true,
    locale: 'vi',
  });
  return slug;
}
