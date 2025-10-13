import { Address } from './address.entity';
import { BatchLogs } from './batch_logs.entity';
import { BillItem } from './bill-item.entity';
import { BillShare } from './bill-share.entity';
import { Bill } from './bill.entity';
import { Book } from './book.entity';
import { Chapter } from './book_chapter.entity';
import { Cart } from './cart.entity';
import { CartItem } from './cart_item.entity';
import { Category } from './category.entity';
import { AuthProvider, Customer } from './customer.entity';
import { CustomerSession } from './customer_session.entity';
import {
  CustomerToken,
  TokenType as CustomerTokenType,
} from './customer_token.entity';
import { GoogleIndexBookRequest } from './google_index_book_requests.entity';
import { GoogleIndexRequest } from './google_index_request.entity';
import { GroupMember } from './group-member.entity';
import { Group } from './group.entity';
import { Lang } from './lang.entity';
import { LangContent } from './lang_content.entity';
import { Media, StorageType } from './media.entity';
import { MessageRead } from './message-read.entity';
import { Message } from './message.entity';
import { Notification } from './notification.entity';
import { Order, OrderStatus } from './order.entity';
import { Payment, PaymentProvider, PaymentStatus } from './payment.entity';
import { Permission } from './permission.entity';
import { Post } from './post.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product_variant.entity';
import { ProductVariantMedia } from './product_variant_media.entity';
import { Repository } from './repository.entity';
import { Role } from './role.entity';
import { RolePermission } from './role_permission.entity';
import { Server } from './server.entity';
import { Service } from './service.entity';
import { ServerService } from './service_service.entity';
import { Site } from './site.entity';
import { SiteBook } from './site_books.entity';
import { SitePost } from './site_posts.entity';
import { Trending } from './trending.entity';
import { TrendingArticle } from './trending_articles.entity';
import { User } from './user.entity';
import { UserRole } from './user_roles.entity';
import { Session } from './user_session.entity';
import { Token, TokenType as UserTokenType } from './user_token.entity';

export {
  Address,
  AuthProvider,
  BatchLogs,
  Bill,
  BillItem,
  BillShare,
  Book,
  Cart,
  CartItem,
  Category,
  Chapter,
  Customer,
  CustomerSession,
  CustomerToken,
  CustomerTokenType,
  // BUDDY
  GoogleIndexBookRequest,
  GoogleIndexRequest,
  Group,
  GroupMember,
  Lang,
  LangContent,
  Media,
  Message,
  MessageRead,
  Notification,
  Order,
  OrderStatus,
  Payment,
  PaymentProvider,
  PaymentStatus,
  Permission,
  Post,
  Product,
  ProductVariant,
  ProductVariantMedia,
  Repository,
  // role
  Role,
  RolePermission,
  Server,
  ServerService,
  Service,
  Session,
  Site,
  SiteBook,
  SitePost,
  StorageType,
  Token,
  Trending,
  TrendingArticle,
  User as User,
  UserRole,
  UserTokenType,
};
export const loadEntities = [
  CustomerSession,
  CustomerToken,
  Media,
  Post,
  Category,
  BatchLogs,
  Site,
  Chapter,
  Session,
  Token,
  SiteBook,
  GoogleIndexBookRequest,
  Book,
  User,
  Customer,
  Address,
  Product,
  ProductVariant,
  ProductVariantMedia,
  GoogleIndexRequest,
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
  // role
  Role,
  Permission,
  UserRole,
  RolePermission,
  // BUDDY
  Bill,
  BillItem,
  Group,
  GroupMember,
  Message,
  MessageRead,
  BillShare,
];
