import {
  Category,
  Lang,
  LangContent,
  loadEntities,
  Permission,
  Role,
  RolePermission,
  Server,
  Service,
  User,
} from '@app/entities';
import { UserType } from '@app/entities/user.entity';
import { generateSlug } from '@app/utils';
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
        type: UserType.ADMIN,
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
        type: UserType.USER,
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

async function createCategory() {
  dataSource.setOptions({
    entities: loadEntities,
  });
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const categoryRepository = dataSource.getRepository(Category);
  try {
    const categoryArr = [
      {
        name: 'Thể Thao',
        slug: generateSlug('Thể Thao'),
        description:
          'Sports - News, updates, and analysis of domestic and international sports events, including football, basketball, and more.',
      },
      {
        name: 'Giải Trí',
        slug: generateSlug('Giải Trí'),
        description:
          'Entertainment - The latest news, trends, and insights about showbiz, music, movies, celebrities, and the entertainment industry.',
      },
      {
        name: 'Công Nghệ',
        slug: generateSlug('Công Nghệ'),
        description:
          'Technology - News and developments in technology, AI, software, hardware, devices, and innovations shaping the future.',
      },
      {
        name: 'Pháp Luật - Xã Hội',
        slug: generateSlug('Pháp Luật - Xã Hội'),
        description:
          'Law & Society - Updates on legal matters, societal issues, policies, political events, and matters of public interest.',
      },
      {
        name: 'Kinh Doanh - Thị Trường',
        slug: generateSlug('Kinh Doanh - Thị Trường'),
        description:
          'Business & Market - Insights into business trends, market dynamics, financial news, investments, and economic developments.',
      },
      {
        name: 'Giáo Dục - Khoa Học',
        slug: generateSlug('Giáo Dục - Khoa Học'),
        description:
          'Education & Science - News about educational advancements, scientific breakthroughs, research, and academic insights.',
      },
      {
        name: 'Sức Khỏe',
        slug: generateSlug('Sức Khỏe - Đời Sống'),
        description:
          'Health & Lifestyle - Information on healthcare, wellness tips, medical advancements, and healthy living practices.',
      },
      {
        name: 'Du Lịch - Ẩm Thực',
        slug: generateSlug('Du Lịch - Ẩm Thực'),
        description:
          'Travel & Cuisine - Travel stories, guides, and culinary experiences, highlighting global destinations and cultural cuisines.',
      },
    ];

    await categoryRepository.upsert(categoryArr, {
      conflictPaths: ['slug'],
      skipUpdateIfNoValuesChanged: true,
    });
    console.log('Category created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding category:', error.message);
  } finally {
    await queryRunner.release();
  }
}

async function createPermissionDefault() {
  dataSource.setOptions({
    entities: loadEntities,
  });
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const permissionsRepository = dataSource.getRepository(Permission);
  try {
    const permissionArr = [
      { action: 'read', subject: 'posts' },
      { action: 'create', subject: 'posts' },
      { action: 'publish', subject: 'posts' },
      { action: 'update', subject: 'posts' },
      { action: 'delete', subject: 'posts' },

      // TABLE BOOK
      { action: 'read', subject: 'books' },
      { action: 'publish', subject: 'books' },
      { action: 'create', subject: 'books' },
      { action: 'update', subject: 'books' },
      { action: 'delete', subject: 'books' },

      // TABLE SITE
      { action: 'read', subject: 'sites' },
      { action: 'create', subject: 'sites' },
      { action: 'update', subject: 'sites' },
      { action: 'delete', subject: 'sites' },

      // TABLE CHAPTER
      { action: 'read', subject: 'chapters' },
      { action: 'create', subject: 'chapters' },
      { action: 'update', subject: 'chapters' },
      { action: 'delete', subject: 'chapters' },

      // TABLE MEDIA
      { action: 'read', subject: 'media' },
      { action: 'create', subject: 'media' },
      { action: 'update', subject: 'media' },
      { action: 'delete', subject: 'media' },

      // TABLE USER
      { action: 'read', subject: 'users' },
      { action: 'create', subject: 'users' },
      { action: 'update', subject: 'users' },
      { action: 'delete', subject: 'users' },

      // TABLE ROLE
      { action: 'read', subject: 'roles' },
      { action: 'create', subject: 'roles' },
      { action: 'update', subject: 'roles' },
      { action: 'delete', subject: 'roles' },

      // TABLE CATEGORIES
      { action: 'read', subject: 'categories' },
      { action: 'create', subject: 'categories' },
      { action: 'update', subject: 'categories' },
      { action: 'delete', subject: 'categories' },
    ];

    await permissionsRepository.upsert(permissionArr as Permission[], {
      conflictPaths: ['action', 'subject'],
      skipUpdateIfNoValuesChanged: true,
      upsertType: 'on-conflict-do-update',
    });
    console.log('Permission created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('Error seeding Permission:', error.message);
  } finally {
    await queryRunner.release();
  }
}

async function createRoleDefault() {
  dataSource.setOptions({ entities: loadEntities });
  await dataSource.initialize();

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.connect();
  await queryRunner.startTransaction();

  const roleRepository = dataSource.getRepository(Role);
  const permissionRepository = dataSource.getRepository(Permission);
  const rolePermissionRepository = dataSource.getRepository(RolePermission);

  try {
    const permissionArr = await permissionRepository.find();

    // Tạo role
    const superAdmin = roleRepository.create({
      name: 'Super Admin',
      type: 'system',
      description:
        'Super Admins can access and manage all features and settings.',
    });
    await roleRepository.save(superAdmin);

    // Gán permission + conditions thông qua role_permissions
    const rolePermissions = permissionArr.map((p) =>
      rolePermissionRepository.create({
        role: superAdmin,
        permission: p,
        conditions: { ownerOnly: true, asOwner: true },
      }),
    );
    await rolePermissionRepository.save(rolePermissions);

    await queryRunner.commitTransaction();
    console.log('✅ Role created successfully.');
  } catch (error) {
    await queryRunner.rollbackTransaction();
    console.error('❌ Error seeding Role:', error.message);
  } finally {
    await queryRunner.release();
  }
}

// async function addConditionsAdmin() {
//   dataSource.setOptions({ entities: loadEntities });
//   await dataSource.initialize();

//   const queryRunner = dataSource.createQueryRunner();
//   await queryRunner.connect();
//   await queryRunner.startTransaction();

//   const userRepository = dataSource.getRepository(User);
//   const roleRepository = dataSource.getRepository(Role);
//   const rpcRepository = dataSource.getRepository(RolePermissionCondition);
//   const permissionRepository = dataSource.getRepository(UserPermissions);
//   try {
//     const roleAdmin = await roleRepository.findOne({
//       where: {},
//       relations: ['permissions'],
//     });

//     dataSource.transaction(async (manager) => {
//       const permissions = await manager.find(UserPermissions, {});

//       const updatedRole = await manager.save(Role, {
//         ...roleAdmin,
//         permissions,
//       });
//       await manager.delete(RolePermissionCondition, {
//         role_id: updatedRole.id,
//       });
//       const conditions = permissions.map((p) => ({
//         role_id: updatedRole.id,
//         permission_id: p.id,
//         conditions: { ownerOnly: true, asOwner: true },
//       }));

//       if (conditions.length > 0) {
//         await manager.save(RolePermissionCondition, conditions);
//       }
//     });

//     // const roleUpdate = await roleRepository.update(
//     //   { id: roleAdmin.id },
//     //   { permissions: permissionArr },
//     // );
//     // console.log(roleUpdate);
//     // console.log(roleAdmin.permissions.length, permissionArr.length);
//     // const rpcList = permissionArr.map((p) =>
//     //   conditionsRepository.create({
//     //     role: superAdmin,
//     //     role_id: superAdmin.id,
//     //     permission: { id: p.id },
//     //     permission_id: p.id,
//     //     conditions: { ownerOnly: true, asOwner: true },
//     //   }),
//     // );
//     // await conditionsRepository.save(rpcList);

//     // await roleRepository.save(superAdmin);
//     console.log('Role created successfully.');
//   } catch (error) {
//     await queryRunner.rollbackTransaction();
//     console.error('Error seeding Role:', error.message);
//   } finally {
//     await queryRunner.release();
//   }
// }

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

// async function createNotification() {
//   dataSource.setOptions({
//     entities: loadEntities,
//   });

//   await dataSource.initialize();

//   const queryRunner = dataSource.createQueryRunner();
//   await queryRunner.connect();
//   await queryRunner.startTransaction();
//   const notificationRepository = dataSource.getRepository(Notification);
//   const adminRepository = dataSource.getRepository(User);

//   try {
//     // Fetch a user to associate the notifications
//     // Create notifications covering all statuses and types
//     const admin = await adminRepository.findOne({
//       where: { email: process.env.ADMIN_EMAIL },
//     });
//     const notifications = Object.values(NotificationStatus).flatMap((status) =>
//       Object.values(NotificationType).map((type) =>
//         notificationRepository.create({
//           title: `${type} Notification - ${status}`,
//           message: `This is a ${type} notification with status ${status}.`,
//           status,
//           type,

//           meta_data: JSON.stringify({
//             detail: `Meta for ${type} and status ${status}`,
//           }),
//           user_id: admin.id,
//         }),
//       ),
//     );

//     // Save notifications to the database
//     await notificationRepository.save(notifications);

//     console.log('Full notifications seeded successfully.');
//   } catch (error) {
//     console.error('Error seeding full notifications:', error.message);
//   }
// }
// void createLanguages();
// void createCategory();
// void createService();
// void create();
// void createUser();
// void createServer();
// void createNotification();

// void createPermissionDefault();
void createRoleDefault();
// void addConditionsAdmin();
