const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Create a user
  const user = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin',
      password: 'changeme', // Replace with hashed password in production
    },
  });

  // Create Home page
  await prisma.page.upsert({
    where: { slug: 'home' },
    update: {},
    create: {
      slug: 'home',
      title: 'Home',
      authorId: user.id,
      published: true,
      content: {
        create: {
          body: { message: 'Welcome to the Home page!' },
        },
      },
    },
  });

  // Create About page
  await prisma.page.upsert({
    where: { slug: 'about' },
    update: {},
    create: {
      slug: 'about',
      title: 'About',
      authorId: user.id,
      published: true,
      content: {
        create: {
          body: { message: 'This is the About page.' },
        },
      },
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
