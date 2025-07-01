import {
  Media,
  Repository as RepositoryEntity,
  StorageType,
} from '@app/entities';
import { PostStatus } from '@app/entities/post.entity';
import * as cheerio from 'cheerio';
import * as googleAuth from 'google-auth-library';
import slugify from 'slugify';

import { Parser } from 'xml2js';
export * from './bootstrap';
export * from './call-api';
export * from './enum';
export * from './serializer.interceptor';
export * from './validation-options';

// IMAGE DOCKER
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

// REPOSITORY DOCKER
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

// FETCH LIST HOT SEARCH
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

// CONVERT IMAGE TO BASE 64 AND SAVE TO CDN
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
    data: `data:image/png;base64, ${base64Image}`,
    mimetype: contentType,
    storage_type: StorageType.BASE64,
    size: buffer.length,
  };

  const cdnResult = await uploadImageCdn(mediaEntity);

  if (!!cdnResult?.url) {
    mediaEntity.url = process.env.CDN_DOMAIN + cdnResult?.url;
    mediaEntity.storage_type = StorageType.LOCAL;
  }
  return { ...mediaEntity } as Media;
}

export async function uploadImageCdn(mediaEntity: Record<string, any>) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  return await fetch(process.env.CDN_API + '/upload', {
    headers: myHeaders,
    method: 'POST',
    body: JSON.stringify({ title: mediaEntity.slug, image: mediaEntity.data }),
  })
    .then(async (response) => {
      return response.json();
    })
    .then((result) => {
      return result;
    })
    .catch((error) => {
      return undefined;
    });
}

export async function getListCdn() {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  return await fetch(process.env.CDN_DOMAIN, {
    headers: myHeaders,
    method: 'get',
  })
    .then(async (response) => response.json())
    .then((result) => result)
    .catch((error) => undefined);
}

export async function generatePostFromHtml(body: {
  url: string;
  title: string;
  index?: number;
  categories?: { slug?: string; name?: string }[];
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
  );

  if (!contentHtml) {
    return { content: undefined, keywords, description, contentStatus };
  }

  const requestBody = `Bạn là một hệ thống xử lý nội dung thông minh. 
  Dưới đây là dữ liệu đầu vào gồm tiêu đề, nội dung HTML (hãy sửa nội dung - text trong các thẻ html thôi nhé, không được phép sửa các class, style, cấu trúc các thẻ html), mô tả và từ khóa, hãy chọn 1 category phù hợp từ category ở dữ liệu nhập vào. 
  Hãy tối ưu nội dung này để rõ ràng, hấp dẫn và chuyên nghiệp hơn, đồng thời giữ nguyên các từ khóa. Trả về một object JSON có dạng:
        {
          "title": "Tiêu đề mới đã tối ưu",
          "content": "Nội dung HTML đã được cải thiện",
          "description": "Mô tả mới đã được cải thiện",
          "keywords": "${JSON.stringify(keywords)}",
          "category": {name: 'category name', slug: 'category slug'} 
        }

        Dữ liệu đầu vào:
        - Tiêu đề: "${body.title}"
        - Nội dung: "${contentHtml}"
        - Mô tả: "${description}"
        - Từ khóa: "${JSON.stringify(keywords)}"
        - List Category: ${JSON.stringify(body.categories)}
      Hãy chỉ trả về JSON, không cần bất kỳ văn bản nào khác.`;

  const geminiResponse = await callGeminiApi(requestBody);

  if (!geminiResponse) {
    const { content, thumbnail } = await processImages(contentHtml, body.title);
    return {
      title: body.title,
      content: content,
      keywords,
      description,
      contentStatus,
      thumbnail,
    };
  }

  try {
    const contentData =
      geminiResponse.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const {
      title: newTitle,
      content: newContent,
      description: newDescription,
      keywords: newKeyword,
      category: newCategory,
    } = JSON.parse(contentData.replace(/```json|```/g, ''));

    const { content, thumbnail } = await processImages(newContent, newTitle);

    return {
      title: newTitle,
      content: content,
      keywords: JSON.parse(newKeyword),
      description: newDescription,
      contentStatus,
      thumbnail,
      category: newCategory,
    };
  } catch (error) {
    console.error('Error parsing Gemini API response:', error);
    return {};
  }
}

export async function fetchWithRetry(
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

export function extractMetaDescription(
  $: cheerio.CheerioAPI,
): string | undefined {
  return (
    $('meta[name="description"]').attr('content') ||
    $('meta[property="og:description"]').attr('content')
  );
}

export function extractMetaKeywords(
  $: cheerio.CheerioAPI,
): { query: string }[] {
  const keywordsContent = $('meta[name="keywords"]').attr('content');
  return keywordsContent
    ? keywordsContent.split(',').map((keyword) => ({ query: keyword.trim() }))
    : [];
}

type GetHtmlProps = { content: string; status: PostStatus };
function getHtml(hostname: string, $: cheerio.CheerioAPI): GetHtmlProps {
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
      $('div[type="RelatedOneNews"]').remove();
      $('.tinlienquan').remove();

      const content = $('.noidung').prop('outerHTML');
      return { content };
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

    'thethao247.vn': () => {
      $('#comment_area, .expNoEditj').remove();
      const title = $('#title_detail').prop('outerHTML');
      const content = $('#content_detail');
      return { content: title + content };
    },

    'tienphong.vn': () => {
      $('#comment_area, .expNoEditj').remove();
      $('.article__author').remove();
      $('.ads_middle').remove();
      $('.cms-relate').remove();
      $('.banner group-fyi-wrap ').remove();
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

    default: () => {
      return { content: undefined };
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

export async function processImages(
  contentHtml: string,
  title: string,
): Promise<{ content: string; thumbnail: Media }> {
  const $ = cheerio.load(contentHtml);
  const imgTags = $('img');

  let thumbnail: Media;

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
        'post thumbnail ' + title,
        imgSrc,
      );

      if (i == 0) {
        thumbnail = { ...base64Image, data: undefined } as any;
      }
      if (base64Image?.data) {
        $(img).attr('src', `${base64Image.data}`);
        $(img).removeAttr('data-original');
        $(img).removeAttr('data-src');
      }
    }
  }

  return {
    content: $('body').length ? $('body').html() : $.html(),
    thumbnail: thumbnail,
  };
}

export async function callGeminiApi(prompt: string) {
  const myHeaders = new Headers();
  myHeaders.append('Content-Type', 'application/json');

  const raw = JSON.stringify({
    contents: [{ parts: [{ text: prompt }] }],
  });

  const GEMINI_API_KEYS = [
    process.env.GEMINI_API_KEY_1,
    process.env.GEMINI_API_KEY_2,
    process.env.GEMINI_API_KEY_3,
    process.env.GEMINI_API_KEY_4,
  ];
  for (const key of GEMINI_API_KEYS) {
    console.log(key);
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${key}`,
        { method: 'POST', headers: myHeaders, body: raw, redirect: 'follow' },
      );

      if (!response.ok) {
        const errorResponse = await response.json();
        console.warn('API error with key:', key);
        continue;
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Network or other error with key:', key);
      // Thử key tiếp
      continue;
    }
  }

  console.error('All API keys failed');
  return null;
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

export async function submitToGoogleIndex(url?: string) {
  const serviceAccountBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!serviceAccountBase64) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_BASE64 is missing in .env');
    return false;
  }
  try {
    // 🔹 Decode Base64 về JSON
    const serviceAccountJson = Buffer.from(
      serviceAccountBase64,
      'base64',
    ).toString('utf-8');
    const credentials = JSON.parse(serviceAccountJson);

    // 🔹 Khởi tạo Google Auth Client
    const auth = new googleAuth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/indexing'],
    });

    const client = await auth.getClient();
    // 🔹 Gửi yêu cầu đến Google Indexing API
    const response = await client.request({
      url: 'https://indexing.googleapis.com/v3/urlNotifications:publish',
      method: 'POST',
      data: {
        url,
        type: 'URL_UPDATED',
      },
    });

    if (response.status === 200) {
      console.log(`✅ Successfully indexed: ${url}`);
      return response.data;
    } else {
      console.warn(`⚠️ Failed to index: ${url}`);
      return response;
    }
  } catch (error) {
    console.error(`❌ Google Indexing Error: ${error.message}`);
    return error?.message || 'Google Indexing Error';
  }
}

export async function getMetaDataGoogleConsole(url?: string, domain?: string) {
  const serviceAccountBase64 = process.env.GOOGLE_CREDENTIALS_BASE64;
  if (!serviceAccountBase64) {
    console.error('❌ GOOGLE_SERVICE_ACCOUNT_BASE64 is missing in .env');
    return false;
  }
  try {
    // 🔹 Decode Base64 về JSON
    const serviceAccountJson = Buffer.from(
      serviceAccountBase64,
      'base64',
    ).toString('utf-8');
    const credentials = JSON.parse(serviceAccountJson);

    // 🔹 Khởi tạo Google Auth Client
    const auth = new googleAuth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/webmasters.readonly'],
    });

    const client = await auth.getClient();
    // 🔹 Gửi yêu cầu đến Google Indexing API
    const response = await client.request({
      url: 'https://searchconsole.googleapis.com/v1/urlInspection/index:inspect',
      method: 'POST',
      data: {
        inspectionUrl: url,
        siteUrl: domain,
        languageCode: 'en-US',
      },
    });
    if (response.status === 200) {
      console.log(`✅ Successfully Get Metadata: ${url}`);
      return response.data as Record<string, any>;
    } else {
      console.warn(`⚠️ Failed to index: ${url}`);
      return response;
    }
  } catch (error) {
    console.error(`❌ Google Get Metadata Error: ${error.message}`);
    return error?.message || 'Google Get Metadata Error';
  }
}
