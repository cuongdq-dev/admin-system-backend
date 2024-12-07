import { Lang, LangContent, loadEntities, Service, User } from '@app/entities';
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

  const adminRepository = dataSource.getRepository(User);

  try {
    const admin = adminRepository.create({
      name: 'Admin',
      is_active: true,
      email: process.env.ADMIN_EMAIL,
      password: process.env.ADMIN_PASSWORD,
    });
    await adminRepository.save(admin);
    console.log('Admin created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding Admin:', error.message);
  } finally {
    await queryRunner.release();
  }
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
    const user = userRepository.create({
      name: 'User',
      is_active: true,
      email: 'user@example.com',
      password: process.env.ADMIN_PASSWORD,
    });
    await userRepository.save(user);
    console.log('User created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding User:', error.message);
  } finally {
    await queryRunner.release();
  }
}

async function createLanguages() {
  // Set các options cho DataSource nếu chưa được cấu hình sẵn
  dataSource.setOptions({
    entities: loadEntities,
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

async function createService() {
  dataSource.setOptions({
    entities: loadEntities,
  });
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const serviceRepository = dataSource.getRepository(Service);
  try {
    const serviceArr = [
      { name: 'Docker', icon: 'skill-icons:docker', description: '30mb' },
      { name: 'Nginx', icon: 'devicon:nginx', description: '30mb' },
      {
        name: 'Postgresql',
        icon: 'skill-icons:postgresql-dark',
        description: '30mb',
      },
    ];

    const serviceCreate = serviceRepository.create(serviceArr);
    await serviceRepository.save(serviceCreate);
    console.log('Service created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding Service:', error.message);
  } finally {
    await queryRunner.release();
  }
}

void create();
void createUser();
void createService();
void createLanguages();
