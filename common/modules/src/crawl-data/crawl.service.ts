import {
  Book,
  Category,
  Chapter,
  Media,
  Site,
  SiteBook,
  StorageType,
} from '@app/entities';
import { VideoStatus } from '@app/entities/book.entity';
import { CategoryType } from '@app/entities/category.entity';
import { SiteType } from '@app/entities/site.entity';
import {
  callGeminiApi,
  fetchWithRetry,
  generateSlug,
  saveImageAsBase64,
} from '@app/utils';
import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

@Injectable()
export class CrawlService {
  private readonly logger = new Logger(CrawlService.name);
  constructor(
    @InjectRepository(Site)
    private readonly siteRepository: Repository<Site>,

    @InjectRepository(Media)
    private readonly mediaRepository: Repository<Media>,

    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,

    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,

    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,

    @InjectRepository(SiteBook)
    private readonly siteBookRepository: Repository<SiteBook>,
  ) {}

  async handleCrawlerDaoTruyen() {
    let page = 0;
    const pageSize = 2;

    while (true) {
      const response = await fetchWithRetry(
        `https://daotruyen.me/api/public/stories?pageNo=${page}&pageSize=${pageSize}`,
      );

      if (!response?.ok) break;

      const data = await response.json();
      if (Array.isArray(data.content)) {
        const stories = this.transformStories(data.content);
        for (const story of stories) {
          await this.processBook(story);
        }
      }

      if (data.last) break;

      // page++;
      return false;
    }
  }

  private transformStories(books: Record<string, any>): Book[] {
    return books.map((book) => ({
      title: book?.story?.name,
      description: book?.story?.description,
      slug: generateSlug(book?.story?.name),
      author: {
        name: book?.story.authorName,
        slug: generateSlug(book?.story?.authorName),
      },
      created_at: book?.story?.createdAt,
      total_chapter: parseInt(book?.totalChapter, 10) || 0,
      source_url: `https://daotruyen.me/api/public/v2/${book?.slug}`,
      is_new: true,
    }));
  }

  private async processBook(book: any) {
    this.logger.debug('START - Crawler Book: ' + book.title);

    const bookDetail = await this.fetchBookDetail(book.slug);
    if (!bookDetail) return;

    const thumbnail = await this.saveBookThumbnail(book, bookDetail);

    // 1. Get Gemini-generated data
    const geminiData = await this.generateGeminiBook(book);
    const bookResult = {
      ...book,
      social_description: geminiData,
      thumbnail_id: thumbnail.generatedMaps[0].id,
    };
    console.log(bookResult);
    await this.bookRepository.upsert(bookResult, {
      conflictPaths: ['title', 'slug'],
      skipUpdateIfNoValuesChanged: true,
    });

    const bookAfterUpsert = await this.bookRepository.findOne({
      where: { slug: book.slug },
      relations: ['categories', 'chapters'],
    });

    await this.handleCategories(bookAfterUpsert, bookDetail?.categories);
    await this.handleSiteBook(bookAfterUpsert);
    await this.handleChapters(bookAfterUpsert, bookDetail?.chapters);
    await this.countWord(bookAfterUpsert.id, bookAfterUpsert.title);

    this.logger.debug('END - Crawler Book Chapter: ' + book.title);
  }

  async generateGeminiBook(book: Book) {
    this.logger.debug('START - gemini book: ' + book.title);

    const requestBody = `
            🎯 Bạn là một chuyên gia kể chuyện & tiếp thị nội dung chuyên nghiệp, có kinh nghiệm tạo nội dung hấp dẫn để đăng truyện audio hoặc video hoạt hình lên các nền tảng như **Facebook, YouTube, TikTok**.

            Tôi có một truyện cần bạn phân tích và tạo nội dung truyền thông để thu hút người xem.

            📚 **Thông tin truyện:**
            - Tên truyện: ${book.title}
            - Mô tả gốc (nếu có): ${book.description || 'Không có mô tả'}
            - Tác giả: ${book.author.name || 'Không rõ'}

            📝 **Yêu cầu của bạn:**

            1. ✨ **description_social**: Viết một đoạn mô tả hấp dẫn, lôi cuốn người đọc/nghe. Phù hợp để đặt trong phần mô tả khi đăng video lên **Facebook hoặc YouTube**. Văn phong gợi cảm xúc, kích thích tò mò, truyền cảm hứng — độ dài dưới 1000 ký tự, có thể sử dụng các icon, cần xuống dòng cho hợp lý, kết hợp kêu gọi mọi người like share, theo dõi.... .

            2. 🎬 **title_social**: Viết tiêu đề ngắn (dưới 100 ký tự) để làm caption hoặc tiêu đề video. Cần gây ấn tượng mạnh, gợi sự tò mò hoặc cảm xúc ngay lập tức.

            3. 🔍 **keywords**: Tạo danh sách các từ khóa liên quan đến nội dung truyện — bao gồm **tên truyện**, **thể loại**, **description vừa tạo ra** , **tình huống cảm xúc chính**, và các yếu tố đặc trưng giúp người dùng tìm thấy video. Viết dưới dạng mảng JSON gồm 10-20 từ khóa, nhớ từ khoá tốt nhất cho SEO nhé.

            💡 **Lưu ý:**
            - Văn phong đậm chất kể chuyện, cảm xúc, kích thích trí tò mò.
            - Không liệt kê lại nội dung truyện, chỉ viết theo hướng truyền cảm hứng hoặc giới thiệu hấp dẫn.

            🔖 **Định dạng kết quả mong muốn:**  
            Xuất ra **một đối tượng JSON duy nhất**, đúng theo mẫu sau:
            {
              "description_social": "string",
              "title_social": "string",
              "keywords": ["string", "string", ...]
            }
            `;

    try {
      const geminiResponse = await callGeminiApi(requestBody);
      const SeoContent =
        geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Cập nhật voice_content vào chapter trong DB

      return this.extractJsonFromText(SeoContent);
    } catch (chapterError) {
      console.error(
        `Failed to generate Gemini SEO: ${book.title}`,
        chapterError,
      );
      this.logger.debug('END - generate Gemini SEO: ' + book.title);

      return false;
    }
  }

  private async fetchBookDetail(slug: string) {
    const response = await fetchWithRetry(
      `https://daotruyen.me/api/public/v2/${slug}`,
    );
    if (!response?.ok) return null;

    return await response.json();
  }

  private async saveBookThumbnail(book: any, detail: any) {
    const thumbnailData = await saveImageAsBase64(
      'book image ' + book.title,
      'book thumbnail ' + book.title,
      `https://daotruyen.me${detail?.story?.image}`,
    );

    return await this.mediaRepository.upsert(
      {
        filename: thumbnailData.filename,
        slug: generateSlug(`thumbnail book ${book.title}`),
        storage_type: StorageType.URL,
        url: thumbnailData.url,
        mimetype: 'url',
        deleted_at: null,
        deleted_by: null,
      },
      {
        conflictPaths: ['slug'],
      },
    );
  }

  private async handleCategories(book: any, categories: any[]) {
    const newCategories: Category[] = [];

    for (const c of categories) {
      await this.categoryRepository.upsert(
        {
          name: c.categoryName,
          slug: c.categoryName,
          status: CategoryType.BOOK,
        },
        { conflictPaths: ['name', 'slug'] },
      );

      const category = await this.categoryRepository.findOneOrFail({
        where: { name: c.categoryName },
      });

      newCategories.push(category);
    }

    await this.bookRepository.save({ ...book, categories: newCategories });
  }

  private async handleSiteBook(book: any) {
    const autoPostSites = await this.siteRepository.find({
      where: { autoPost: true, type: SiteType.BOOK },
      relations: ['categories'],
      select: ['categories', 'autoPost', 'id', 'domain'],
    });

    for (const site of autoPostSites) {
      await this.siteBookRepository.upsert(
        { site_id: site.id, book_id: book.id },
        { conflictPaths: ['site_id', 'book_id'] },
      );
    }
  }

  private async handleChapters(
    book: Book,
    chapters: (Chapter & { chapterNumber: number })[],
  ) {
    for (const chapter of chapters) {
      const findChapter = await this.chapterRepository.findOne({
        where: {
          chapter_number: chapter?.chapterNumber,
          book_id: book.id,
          voice_content: null,
        },
      });
      if (findChapter) continue;

      const content = await this.getChapterContentDaoTruyen(
        book.slug,
        chapter?.chapterNumber,
      );

      const generateAI = await this.generateGeminiChapter(
        book,
        content,
        chapter?.chapterNumber,
        `https://daotruyen.me/api/public/v2/${book?.slug}/${chapter.chapterNumber}`,
      );

      if (!generateAI) continue;
    }
    await this.bookRepository.update(
      { id: book.id },
      { video_status: VideoStatus.AI_GENERATE },
    );
  }

  async fetchChapters() {
    const allData = (await this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.thumbnail', 'thumbnail')
      .innerJoin('book.chapters', 'chapters')
      .loadRelationCountAndMap('book.chapter_count', 'book.chapters') // ✅ đếm số chương
      .select([
        'book.id',
        'book.title',
        'book.slug',
        'book.total_chapter',
        'chapters.id',
        'chapters.chapter_number',
      ])
      .getMany()) as ({
      id: string;
      title: string;
      total_chapter: number;
      chapter_count: number;
    } & Book)[];

    const books = allData?.filter(
      (book) => book.total_chapter > book?.chapter_count,
    );

    for (const book of books) {
      const existingChapters = book.chapters.map((ch) => ch.chapter_number);
      const missingChapters = [];

      for (let i = 1; i <= book.total_chapter; i++) {
        if (!existingChapters.includes(i)) {
          missingChapters.push(i);
        }
      }

      for (const chapterNumber of missingChapters) {
        this.logger.debug(
          `Generating chapter ${chapterNumber} for book ${book.title}`,
        );

        const content = await this.getChapterContentDaoTruyen(
          book.slug,
          chapterNumber,
        );

        const result = await this.generateGeminiChapter(
          book,
          content,
          chapterNumber,
          `https://daotruyen.me/api/public/v2/${book?.slug}/${chapterNumber}`,
        );

        if (!result) {
          this.logger.warn(
            `Failed to generate chapter ${chapterNumber} for book ${book.title}`,
          );
        }
      }
    }
  }

  async getChapterContentDaoTruyen(slug: string, chapterNumber: number) {
    const chapterResponse = await fetchWithRetry(
      `https://daotruyen.me/api/public/v2/${slug}/${chapterNumber}`,
    );
    if (!chapterResponse.ok) return false;
    const chapterDetail = await chapterResponse.json();
    return chapterDetail?.chapter?.paragraph || '';
  }

  async generateGeminiChapter(
    book: Book,
    content: string,
    chapterNumber: number,
    source_url: string,
  ) {
    this.logger.debug('START - Crawler Book Chapter: ' + chapterNumber);

    const requestBody = `
              Bạn là một chuyên gia kể chuyện chuyên nghiệp. Hãy giúp tôi **chuyển truyện gốc dưới đây** thành một **câu chuyện kể lại sinh động, cảm xúc**, phù hợp để dùng trong **video hoạt hình dạng kể chuyện hoặc giọng đọc truyện audio**.

              📌 **Yêu cầu bắt buộc:**
              1. Viết lại truyện theo **văn kể chuyện tự nhiên** như đang thuật lại cho người nghe.
              2. **Giữ nguyên cốt truyện và mạch nội dung chính**, chỉ thay đổi cách viết và diễn đạt.
              3. Đối thoại cần được viết lại tự nhiên, giống như hội thoại trong đời thực — thêm nhấn nhá, ngắt nghỉ, biểu cảm phù hợp.
              4. Nếu trong truyện gốc có ký hiệu cảm xúc như '^^', 'T_T', ':D', ':O', v.v... thì **hãy chuyển thành mô tả cảm xúc bằng lời** như:
                - ^^ → mỉm cười nhẹ nhàng
                - T_T → giọng nghẹn ngào, bật khóc
                - :O, O_O → tròn mắt ngạc nhiên, sửng sốt
              5. Không chèn giải thích kỹ thuật, không viết ghi chú ngoài truyện.
              🔐 Đặc biệt:  
              - Trước nội dung truyện, hãy chèn đoạn mở đầu sau:

              > **Bạn đang nghe truyện tại Vùng Đất Truyện — website truyện audio dành riêng cho bạn yêu thích giọng kể truyền cảm.**

              Chỉ xuất ra phần nội dung kể chuyện đã được chuyển thể
              Truyện cần convert:
              ${content}
            `;

    try {
      const geminiResponse = await callGeminiApi(requestBody);
      const voiceContent =
        geminiResponse?.candidates?.[0]?.content?.parts?.[0]?.text || '';

      // Cập nhật voice_content vào chapter trong DB
      const chapterData = {
        book_id: book?.id,
        chapter_number: chapterNumber,
        content: content,
        voice_content: voiceContent,
        slug: generateSlug(book.title + '-' + `Chương ${chapterNumber}`),
        source_url: source_url,
        title: `Chương ${chapterNumber}`,
      };

      await this.chapterRepository.upsert(
        { ...chapterData },
        { conflictPaths: ['title', 'slug', 'book_id'] },
      );
      this.logger.debug('END - Crawler Book Chapter: ' + chapterNumber);

      return true;
    } catch (chapterError) {
      console.error(
        `Failed to generate Gemini for chapter ${book.title} - chapter: ${chapterNumber}`,
        chapterError,
      );
      this.logger.debug('END - Crawler Book Chapter: ' + chapterNumber);

      return false;
    }
  }

  async countWord(bookId: string, bookTitle) {
    this.logger.debug('START - Đếm Word: ' + bookTitle);

    const result = await this.chapterRepository
      .createQueryBuilder('chapter')
      .select(`SUM(LENGTH(COALESCE(chapter.content, '')))`, 'contentLength')
      .addSelect(
        `SUM(LENGTH(COALESCE(chapter.voice_content, '')))`,
        'voiceContentLength',
      )
      .where('chapter.book_id = :bookId', {
        bookId: bookId,
      })
      .getRawOne();

    const contentLength = parseInt(result.contentLength, 10) || 0;
    const voiceContentLength = parseInt(result.voiceContentLength, 10) || 0;

    await this.bookRepository.update(
      { id: bookId },
      {
        word_count: contentLength,
        voice_count: voiceContentLength,
      },
    );

    this.logger.debug('END - Đếm Word: ' + bookTitle);
  }

  private extractJsonFromText(text: string): any {
    try {
      const match = text.match(/{[\s\S]+}/);
      if (match) return JSON.parse(match[0]);
    } catch (err) {
      this.logger.warn('Failed to parse Gemini JSON:', err);
    }
    return {};
  }
}
