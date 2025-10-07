import { PrismaClient } from '@prisma/client';
import { notFound } from 'next/navigation';

const prisma = new PrismaClient();

export default async function Page({ params }: { params: { slug: string } }) {
  // Await params for Next.js dynamic route
  const { slug } = await Promise.resolve(params);
  const page = await prisma.page.findUnique({
    where: { slug },
    include: { content: true, author: true },
  });

  if (!page) return notFound();

  return (
    <main>
      <h1>{page.title}</h1>
      <div>
        {page.content?.body ? JSON.stringify(page.content.body) : 'No content'}
      </div>
      <p>Author: {page.author?.name || page.author?.email}</p>
    </main>
  );
}
