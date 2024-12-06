import { Address } from './address.entity';
import { Cart } from './cart.entity';
import { CartItem } from './cart_item.entity';
import { Customer } from './customer.entity';
import { CustomerSession } from './customer_session.entity';
import { CustomerToken } from './customer_token.entity';
import { Lang } from './lang.entity';
import { LangContent } from './lang_content.entity';
import { Media } from './media.entity';
import { Order } from './order.entity';
import { Payment } from './payment.entity';
import { Post } from './post.entity';
import { Product } from './product.entity';
import { ProductVariant } from './product_variant.entity';
import { ProductVariantMedia } from './product_variant_media.entity';
import { Repository } from './repository.entity';
import { Server } from './server.entity';
import { Service } from './service.entity';
import { ServerService } from './service_service.entity';
import { User } from './user.entity';
import { Session } from './user_session.entity';
import { Token } from './user_token.entity';

export const loadEntities = [
  CustomerSession,
  CustomerToken,
  Media,
  Post,
  Session,
  Token,
  User,
  Customer,
  Address,
  Product,
  ProductVariant,
  ProductVariantMedia,
  Cart,
  CartItem,
  Order,
  Payment,
  Lang,
  Server,
  Service,
  Repository,
  ServerService,
  LangContent,
];
