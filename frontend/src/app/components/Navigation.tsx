import Link from 'next/link';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function Navigation() {
  const pages = await prisma.page.findMany({
    where: { published: true },
    select: { slug: true, title: true },
    orderBy: { title: 'asc' },
  });

  return (
    <nav style={{ display: 'flex', gap: '1rem', padding: '1rem', borderBottom: '1px solid #eee' }}>
      {pages.map((page) => (
        <Link key={page.slug} href={`/${page.slug}`}>
          {page.title}
        </Link>
      ))}
    </nav>
  );
}
