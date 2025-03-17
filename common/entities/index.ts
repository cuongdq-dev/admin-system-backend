import { Address } from './address.entity';
import { Cart } from './cart.entity';
import { CartItem } from './cart_item.entity';
import { Category } from './category.entity';
import { AuthProvider, Customer } from './customer.entity';
import { CustomerSession } from './customer_session.entity';
import {
  CustomerToken,
  TokenType as CustomerTokenType,
} from './customer_token.entity';
import { Lang } from './lang.entity';
import { LangContent } from './lang_content.entity';
import { Media, StorageType } from './media.entity';
import { Notification } from './notification.entity';
import { Order, OrderStatus } from './order.entity';
import { Payment, PaymentProvider, PaymentStatus } from './payment.entity';
import { Post } from './post.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product_variant.entity';
import { ProductVariantMedia } from './product_variant_media.entity';
import { Repository } from './repository.entity';
import { Server } from './server.entity';
import { Service } from './service.entity';
import { ServerService } from './service_service.entity';
import { Site } from './site.entity';
import { SitePost } from './site_posts.entity';
import { Trending } from './trending.entity';
import { TrendingArticle } from './trending_articles.entity';
import { User } from './user.entity';
import { Session } from './user_session.entity';
import { Token, TokenType as UserTokenType } from './user_token.entity';

export {
  Address,
  AuthProvider,
  Cart,
  CartItem,
  Customer,
  CustomerSession,
  CustomerToken,
  CustomerTokenType,
  Lang,
  LangContent,
  Media,
  Notification,
  Order,
  OrderStatus,
  SitePost,
  Payment,
  PaymentProvider,
  PaymentStatus,
  Post,
  Category,
  Product,
  ProductVariant,
  ProductVariantMedia,
  Repository,
  Server,
  ServerService,
  Service,
  Session,
  Site,
  StorageType,
  Token,
  Trending,
  TrendingArticle,
  User,
  UserTokenType,
};
export const loadEntities = [
  CustomerSession,
  CustomerToken,
  Media,
  Post,
  Category,
  Site,
  Session,
  Token,
  User,
  Customer,
  Address,
  Product,
  ProductVariant,
  ProductVariantMedia,
  Cart,
  SitePost,
  CartItem,
  Order,
  Payment,
  Lang,
  Trending,
  TrendingArticle,
  Server,
  Service,
  Notification,
  Repository,
  ServerService,
  LangContent,
];
