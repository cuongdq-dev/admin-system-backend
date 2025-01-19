import {
  Lang,
  LangContent,
  loadEntities,
  Notification,
  Server,
  Service,
  User,
} from '@app/entities';
import {
  NotificationStatus,
  NotificationType,
} from '@app/entities/notification.entity';
import * as bcrypt from 'bcryptjs';
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
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);
    await adminRepository.upsert(
      {
        name: 'Admin',
        is_active: true,
        email: process.env.ADMIN_EMAIL,
        password: password,
      },
      {
        conflictPaths: ['name', 'email'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
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
    const salt = await bcrypt.genSalt();
    const password = await bcrypt.hash(process.env.ADMIN_PASSWORD, salt);

    await userRepository.upsert(
      {
        name: 'User',
        is_active: true,
        email: 'user@example.com',
        password: password,
      },
      {
        conflictPaths: ['name', 'email'],
        skipUpdateIfNoValuesChanged: true,
      },
    );
    console.log('User created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding User:', error.message);
  } finally {
    await queryRunner.release();
  }
}

async function createLanguages() {
  // Configure data source options if not already configured
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
    for (const language of languages) {
      // Upsert the language
      const { generatedMaps } = await langRepository.upsert(
        {
          code: language.code,
          name: language.name,
          description: language.description,
        },
        { conflictPaths: ['code'] },
      );
      const newLanguage = generatedMaps[0];
      console.log(
        `${language.name} - ${language.code} - ${newLanguage.id} language added/updated.`,
      );

      // Upsert associated content for the language
      const contentEntries = Object.entries(language.content).map(
        ([key, content]) => ({
          code: key,
          content: content as string,
          lang_id: newLanguage.id, // Reference the new or existing language
        }),
      );

      await langContentRepository.upsert(contentEntries, {
        conflictPaths: ['code', 'lang_id'],
      });

      console.log(`Content for ${language.name} added/updated.`);
    }

    // Commit the transaction
    await queryRunner.commitTransaction();
  } catch (error) {
    // Rollback the transaction on error
    await queryRunner.rollbackTransaction();
    console.error('Error seeding languages:', error.message);
  } finally {
    // Release the query runner
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
      {
        name: 'Docker',
        icon: 'skill-icons:docker',
        description: '30mb',
        script: `
        #!/bin/bash

        # Cài đặt Docker
        echo "Đang cài đặt Docker..."
        curl -fsSL https://get.docker.com -o get-docker.sh
        sudo sh get-docker.sh

        # Khởi động Docker và đảm bảo Docker khởi động lại khi hệ thống khởi động
        sudo systemctl start docker
        sudo systemctl enable docker

        # Thêm người dùng vào nhóm docker (không cần sudo khi sử dụng Docker)
        sudo usermod -aG docker $USER

        # Cài đặt Docker Compose
        echo "Đang cài đặt Docker Compose..."
        sudo curl -L "https://github.com/docker/compose/releases/download/$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose

        # Cấp quyền thực thi cho Docker Compose
        sudo chmod +x /usr/local/bin/docker-compose

        # Kiểm tra Docker và Docker Compose
        echo "Kiểm tra phiên bản Docker..."
        docker --version

        echo "Kiểm tra phiên bản Docker Compose..."
        docker-compose --version

        echo "Tạo file docker-compose.yml..."
        cat <<EOL > docker-compose.yml
        version: "3.8"
        services:
          postgres_db:
            image: postgres:latest
            container_name: PostgresCont
            restart: always
            environment:
              - POSTGRES_DB=database_dev
              - POSTGRES_USER=postgres
              - POSTGRES_PASSWORD=postgres123
            ports:
              - 5432:5432
            networks:
              - system_control
            volumes:
              - postgres_db:/var/lib/postgresql/data
          nginx:
            image: nginx:latest
            container_name: nginx_container
            ports:
              - "80:80"
            volumes:
                - ./nginx:/etc/nginx/conf.d/
            networks:
              - system_control
            restart: always
        volumes:
          postgres_db:
            driver: local

        networks:
          system_control:
            driver: bridge
        EOL
        # Thông báo hoàn tất
        echo "Cài đặt Docker, Docker Compose và file docker-compose.yml đã hoàn tất!"
        `,
      },
    ];

    await serviceRepository.upsert(serviceArr, {
      conflictPaths: { name: true },
      skipUpdateIfNoValuesChanged: true,
    });
    console.log('Service created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding Service:', error.message);
  } finally {
    await queryRunner.release();
  }
}

async function createServer() {
  dataSource.setOptions({
    entities: loadEntities,
  });
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const serverRepository = dataSource.getRepository(Server);
  const adminRepository = dataSource.getRepository(User);
  try {
    const admin = await adminRepository.findOne({
      where: { email: process.env.ADMIN_EMAIL },
    });
    const serverArr = [
      {
        name: 'Contabo Singapore',
        host: '194.238.31.149',
        port: '22',
        user: 'root',
        password: '!g6hXE,./gL4~',
        owner_id: admin.id,
      },
    ];

    await serverRepository.upsert(serverArr, {
      conflictPaths: ['name', 'host'],
      skipUpdateIfNoValuesChanged: true,
    });
    console.log('Server created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding server:', error.message);
  } finally {
    await queryRunner.release();
  }
}
async function createNotification() {
  dataSource.setOptions({
    entities: loadEntities,
  });

  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();
  const notificationRepository = dataSource.getRepository(Notification);
  const adminRepository = dataSource.getRepository(User);

  try {
    // Fetch a user to associate the notifications
    // Create notifications covering all statuses and types
    const admin = await adminRepository.findOne({
      where: { email: process.env.ADMIN_EMAIL },
    });
    const notifications = Object.values(NotificationStatus).flatMap((status) =>
      Object.values(NotificationType).map((type) =>
        notificationRepository.create({
          title: `${type} Notification - ${status}`,
          message: `This is a ${type} notification with status ${status}.`,
          status,
          type,

          meta_data: JSON.stringify({
            detail: `Meta for ${type} and status ${status}`,
          }),
          user_id: admin.id,
        }),
      ),
    );

    // Save notifications to the database
    await notificationRepository.save(notifications);

    console.log('Full notifications seeded successfully.');
  } catch (error) {
    console.error('Error seeding full notifications:', error.message);
  }
}
void createService();

void create();
void createUser();
void createServer();
void createLanguages();
void createNotification();
