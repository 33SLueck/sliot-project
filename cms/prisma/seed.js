const { PrismaClient } = require('@prisma/client');
const { v4: uuidv4 } = require('uuid');

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create initial categories
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { slug: 'iot' },
      update: {},
      create: {
        name: 'IoT',
        slug: 'iot',
        description: 'Internet of Things related content',
        color: '#3B82F6'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'automation' },
      update: {},
      create: {
        name: 'Automation',
        slug: 'automation',
        description: 'Workflow automation and n8n content',
        color: '#10B981'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'security' },
      update: {},
      create: {
        name: 'Security',
        slug: 'security',
        description: 'Security best practices and implementations',
        color: '#EF4444'
      }
    }),
    prisma.category.upsert({
      where: { slug: 'tutorials' },
      update: {},
      create: {
        name: 'Tutorials',
        slug: 'tutorials',
        description: 'Step-by-step guides and tutorials',
        color: '#8B5CF6'
      }
    })
  ]);

  console.log('✅ Categories created:', categories.length);

  // Create initial tags
  const tags = await Promise.all([
    prisma.tag.upsert({
      where: { slug: 'n8n' },
      update: {},
      create: {
        name: 'n8n',
        slug: 'n8n',
        color: '#FF6D00'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'aws' },
      update: {},
      create: {
        name: 'AWS',
        slug: 'aws',
        color: '#FF9900'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'docker' },
      update: {},
      create: {
        name: 'Docker',
        slug: 'docker',
        color: '#2496ED'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'security' },
      update: {},
      create: {
        name: 'Security',
        slug: 'security',
        color: '#DC2626'
      }
    }),
    prisma.tag.upsert({
      where: { slug: 'oauth' },
      update: {},
      create: {
        name: 'OAuth',
        slug: 'oauth',
        color: '#059669'
      }
    })
  ]);

  console.log('✅ Tags created:', tags.length);

  // Create initial settings
  const settings = await Promise.all([
    prisma.setting.upsert({
      where: { key: 'site_title' },
      update: {},
      create: {
        key: 'site_title',
        value: 'SLIoT Platform',
        type: 'string',
        description: 'Website title',
        category: 'General'
      }
    }),
    prisma.setting.upsert({
      where: { key: 'site_description' },
      update: {},
      create: {
        key: 'site_description',
        value: 'Secure Low-cost IoT automation platform with enterprise-grade security',
        type: 'string',
        description: 'Website description for SEO',
        category: 'SEO'
      }
    }),
    prisma.setting.upsert({
      where: { key: 'posts_per_page' },
      update: {},
      create: {
        key: 'posts_per_page',
        value: '10',
        type: 'number',
        description: 'Number of posts to display per page',
        category: 'General'
      }
    }),
    prisma.setting.upsert({
      where: { key: 'comments_enabled' },
      update: {},
      create: {
        key: 'comments_enabled',
        value: 'true',
        type: 'boolean',
        description: 'Enable comments on posts',
        category: 'General'
      }
    }),
    prisma.setting.upsert({
      where: { key: 'comment_moderation' },
      update: {},
      create: {
        key: 'comment_moderation',
        value: 'true',
        type: 'boolean',
        description: 'Require comment approval before publishing',
        category: 'General'
      }
    })
  ]);

  console.log('✅ Settings created:', settings.length);

  // Create main navigation menu
  const mainMenu = await prisma.menu.upsert({
    where: { name: 'Main Navigation' },
    update: {},
    create: {
      name: 'Main Navigation',
      description: 'Primary website navigation'
    }
  });

  // Create menu items
  const menuItems = await Promise.all([
    prisma.menuItem.create({
      data: {
        label: 'Home',
        url: '/',
        order: 1,
        menuId: mainMenu.id
      }
    }),
    prisma.menuItem.create({
      data: {
        label: 'Blog',
        url: '/blog',
        order: 2,
        menuId: mainMenu.id
      }
    }),
    prisma.menuItem.create({
      data: {
        label: 'Automation',
        url: '/automation',
        order: 3,
        menuId: mainMenu.id
      }
    }),
    prisma.menuItem.create({
      data: {
        label: 'About',
        url: '/about',
        order: 4,
        menuId: mainMenu.id
      }
    })
  ]);

  console.log('✅ Menu items created:', menuItems.length);

  console.log('🎉 Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });