// TRENDING
interface ITrendingArticle {
  id?: string;
  title: string;
  source: string;
  url: string;
  image?: ITrendingImage;
}

interface ITrendingImage {
  id?: string;
  newsUrl: string;
  source: string;
  imageUrl: string;
}

interface ITrending {
  id?: string;
  title: { query: string; exploreLink: string };
  formattedTraffic: string;
  relatedQueries: { query?: string }[];
  image?: ITrendingImage;
  articles: ITrendingArticle[];
}
