import { Lang } from 'common/entities/lang.entity';
import { LangContent } from 'common/entities/lang_content.entity';
import { languages } from './lang'; // Import dữ liệu ngôn ngữ từ file lang-content.ts
import dataSource from 'ormconfig';

async function createLanguages() {
  dataSource.setOptions({
    entities: [Lang, LangContent],
  });

  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const langRepository = dataSource.getRepository(Lang);
  const langContentRepository = dataSource.getRepository(LangContent);

  try {
    // Duyệt qua từng ngôn ngữ trong languages
    for (const language of languages) {
      // Dùng languages.languages thay vì rawData
      const existingLanguage = await langRepository.findOne({
        where: { code: language.code },
      });

      if (!existingLanguage) {
        // Tạo mới một ngôn ngữ nếu chưa tồn tại
        const newLanguage = langRepository.create({
          code: language.code,
          name: language.name,
          description: language.description,
        });
        await langRepository.save(newLanguage);
        console.log(`${language.name} language added.`);

        // Thêm nội dung cho ngôn ngữ
        for (const [key, content] of Object.entries(language.content)) {
          const langContent = langContentRepository.create({
            code: key,
            content: content as string,
            lang_id: newLanguage.id,
          });
          await langContentRepository.save(langContent);
          console.log(`Content for ${language.name} added: ${key}`);
        }
      } else {
        console.log(`${language.name} language already exists.`);
      }
    }

    await queryRunner.commitTransaction();
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding languages:', error.message);
  } finally {
    await queryRunner.release();
  }
}

void createLanguages();
