[![Ask DeepWiki](https://deepwiki.com/badge.svg)](https://deepwiki.com/cuongdq-dev/admin-system-backend)

```markdown
# CK Ecommerce - Admin System Backend

Hệ thống backend đa chức năng cho nền tảng quản lý nội dung và thương mại điện tử, được xây dựng với kiến trúc microservices sử dụng NestJS framework.

## 🎯 Tổng quan dự án

Đây là một hệ thống backend toàn diện hỗ trợ nhiều chức năng:

- **🛒 Thương mại điện tử**: Quản lý sản phẩm, đơn hàng, thanh toán, giỏ hàng
- **📚 Sách truyện online**: Quản lý sách, chương truyện, đọc online
- **📰 Tin tức tổng hợp**: Crawl và tổng hợp tin tức từ nhiều nguồn
- **🖥️ Quản lý server**: Quản lý VPS, Docker containers, deployment
- **🔍 SEO tự động**: Tích hợp Google Search Console, tự động indexing
- **🌐 Đa ngôn ngữ**: Hỗ trợ tiếng Việt và tiếng Anh

## 🏗️ Kiến trúc Microservices

Hệ thống bao gồm 5 ứng dụng chính: [1](#4-0)

| Service    | Port | Chức năng                                 |
| ---------- | ---- | ----------------------------------------- |
| **Admin**  | 3003 | Giao diện quản trị, quản lý nội dung      |
| **User**   | 3002 | API công khai cho người dùng cuối         |
| **Socket** | 3004 | WebSocket server, real-time communication |
| **Batch**  | 3006 | Xử lý tác vụ tự động, crawling, indexing  |
| **VPS**    | 3005 | Quản lý server, Docker, deployment        |

## 🛠️ Công nghệ nổi bật

### Backend Framework & Core

- **NestJS v10** - Framework chính với TypeScript [2](#4-1)
- **TypeScript v5.1** - Ngôn ngữ lập trình chính [3](#4-2)
- **Node.js** - Runtime environment

### Database & ORM

- **PostgreSQL** - Database chính [4](#4-3)
- **TypeORM v0.3** - Object-Relational Mapping [5](#4-4)
- **Redis v4.7** - Caching và WebSocket clustering [6](#4-5)

### Authentication & Security

- **JWT** - Authentication system [7](#4-6)
- **Passport.js** - Authentication middleware [8](#4-7)
- **bcryptjs** - Password hashing [9](#4-8)

### Real-time & Communication

- **Socket.IO v4.8** - WebSocket implementation [10](#4-9)
- **Redis Adapter** - Socket.IO clustering [11](#4-10)

### Cloud Services & Storage

- **AWS S3 SDK v3** - Cloud file storage [12](#4-11)
- **Multer S3** - File upload handling [13](#4-12)

### Payment & E-commerce

- **Stripe v15** - Payment gateway [14](#4-13)

### Google Services Integration

- **Google APIs v146** - Search Console, Indexing API [15](#4-14)
- **Google Auth Library** - OAuth authentication [16](#4-15)

### Task Scheduling & Automation

- **NestJS Schedule** - Cron jobs [17](#4-16)
- **Cheerio** - HTML parsing cho web scraping [18](#4-17)

### API Documentation & Validation

- **Swagger/OpenAPI** - API documentation [19](#4-18)
- **Class Validator** - Input validation [20](#4-19)
- **Class Transformer** - Data transformation [21](#4-20)

### DevOps & Server Management

- **Docker** - Containerization
- **Docker Compose** - Multi-container orchestration
- **Node SSH** - Server management automation [22](#4-21)

### Development Tools

- **ESLint & Prettier** - Code quality [23](#4-22)
- **Jest** - Testing framework [24](#4-23)
- **Morgan** - HTTP request logger [25](#4-24)

### Utilities & SEO

- **Slugify** - URL slug generation [26](#4-25)
- **Sitemap Generator** - XML sitemap tự động [27](#4-26)
- **Firebase Admin** - Push notifications [28](#4-27)

## 📁 Cấu trúc dự án
```

├── apps/ # Các microservices
│ ├── admin/ # 🔧 Admin API - Quản lý hệ thống
│ ├── user/ # 👥 User API - API công khai
│ ├── socket/ # 🔌 WebSocket server
│ ├── batch/ # ⚙️ Batch processing - Tự động hóa
│ └── vps/ # 🖥️ VPS management
├── common/ # Shared modules
│ ├── entities/ # 🗃️ Database entities
│ ├── modules/ # 📦 Common modules
│ ├── utils/ # 🛠️ Utilities
│ ├── seeding/ # 🌱 Database seeding
│ └── config/ # ⚙️ Configurations
└── docker-compose.yml # 🐳 Docker services

````

## 🚀 Cài đặt và Khởi chạy

### Yêu cầu hệ thống
- **Node.js** >= 18
- **PostgreSQL** >= 12
- **Redis** >= 6
- **Docker & Docker Compose** (tùy chọn)

### 1. Cài đặt dependencies
```bash
npm install
````

### 2. Cấu hình môi trường

```bash
cp .env.example .env
```

Cập nhật các biến môi trường quan trọng:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT secret key
- `AWS_ACCESS_KEY_ID`, `AWS_SECRET_KEY` - AWS S3 credentials
- `STRIPE_SECRET_KEY` - Stripe payment key
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` - Google OAuth

### 3. Database setup

```bash
# Chạy migrations
npm run migration:run

# Seed dữ liệu mẫu
npm run seed
```

### 4. Khởi chạy ứng dụng

#### Development mode

```bash
# Chạy tất cả services
npm run start:dev

# Hoặc chạy từng service riêng lẻ
npm run start:admin    # Admin API
npm run start:user     # User API
npm run start:socket   # WebSocket server
npm run start:batch    # Batch processing
npm run start:vps      # VPS management
```

#### Production mode với Docker

```bash
docker-compose up -d
```

## 📚 Chức năng chính

### 🛒 E-commerce

- Quản lý sản phẩm, variants, inventory
- Xử lý đơn hàng, thanh toán qua Stripe
- Quản lý khách hàng, giỏ hàng
- Hệ thống notification [29](#4-28)

### 📚 Sách truyện online

- Quản lý sách, tác giả, thể loại
- Hệ thống chương truyện với nội dung đầy đủ
- API đọc sách cho người dùng
- Tích hợp SEO cho từng chương [30](#4-29)

### 📰 Tin tức tự động

- Crawl tin tức từ nhiều nguồn
- Tự động tạo bài viết từ trending topics
- Phân loại và tag tự động
- Tích hợp Google Trends [31](#4-30)

### 🖥️ Quản lý server

- Kết nối và quản lý VPS từ xa
- Quản lý Docker containers, images
- Deploy ứng dụng tự động
- Monitor server resources

### 🔍 SEO tự động

- Tự động submit URL lên Google
- Tạo sitemap XML tự động
- Theo dõi indexing status
- Tối ưu meta tags [32](#4-31)

### 🌐 Đa ngôn ngữ

- Hỗ trợ tiếng Việt và tiếng Anh
- Giao diện admin đa ngôn ngữ
- Nội dung có thể localize [33](#4-32)

## 📖 API Documentation

Sau khi khởi chạy, truy cập Swagger UI tại:

- **Admin API**: http://localhost:3003/api
- **User API**: http://localhost:3002/api

## 🗄️ Database Management [34](#4-33)

```bash
# Tạo migration mới
npm run migration:generate -- <tên-migration>

# Chạy migrations
npm run migration:run

# Xem trạng thái migrations
npm run migration:show

# Rollback migration
npm run migration:revert

# Seed dữ liệu mẫu
npm run seed

# Xóa dữ liệu mẫu
npm run clear
```

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov

# Watch mode
npm run test:watch
```

## 🔧 Scripts hữu ích [35](#4-34)

```bash
# Build các services
npm run build:admin
npm run build:user
npm run build:socket
npm run build:batch
npm run build:vps

# Format code
npm run format

# Lint code
npm run lint
```

## 🌟 Tính năng nổi bật

- **Kiến trúc Microservices**: Dễ scale và maintain
- **Tự động hóa hoàn toàn**: Crawling, indexing, deployment
- **Multi-tenant**: Hỗ trợ nhiều website từ một backend
- **Real-time**: WebSocket cho notifications và updates
- **SEO-friendly**: Tự động tối ưu cho search engines
- **Cloud-ready**: Tích hợp sẵn AWS, Docker
- **Monitoring**: Health checks và logging đầy đủ

## 🤝 Contributing

1. Fork repository
2. Tạo feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Tạo Pull Request

## 📄 License

Dự án này được cấp phép dưới **UNLICENSED**.

---

**Phát triển bởi**: CK Team  
**Phiên bản**: 0.0.1  
**Cập nhật**: 2025
