import { loadEntities } from 'common/entities';
import { Lang } from 'common/entities/lang.entity';
import { LangContent } from 'common/entities/lang_content.entity';
import { User } from 'common/entities/user.entity';
import dataSource from 'ormconfig';
import { languages } from './lang';

async function create() {
  dataSource.setOptions({
    entities: loadEntities,
  });
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const userRepository = dataSource.getRepository(User);

  try {
    const admin = userRepository.create({
      name: 'Admin',
      is_active: true,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    await admin.save();
    console.log('Admin created successfully.');
  } catch (error) {
    console.log(error.message);
  }
  process.stdout;
}

async function createUser() {
  dataSource.setOptions({
    entities: loadEntities,
  });
  await dataSource.initialize();
  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const userRepository = dataSource.getRepository(User);

  try {
    const admin = userRepository.create({
      name: 'User',
      is_active: true,
      email: 'user@example.com',
      password: process.env.ADMIN_PASSWORD,
    });
    await admin.save();
    console.log('Admin created successfully.');
  } catch (error) {
    console.log(error.message);
  }
  process.stdout;
}

async function createLanguages() {
  // Set các options cho DataSource nếu chưa được cấu hình sẵn
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
    for (const language of languages as any) {
      const existingLanguage = await langRepository.findOne({
        where: { code: language.code },
      });

      if (!existingLanguage) {
        const newLanguage = langRepository.create({
          code: language.code,
          name: language.name,
          description: language.description,
        });
        await langRepository.save(newLanguage);
        console.log(`${language.name} language added.`);

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
void create();
void createUser();
