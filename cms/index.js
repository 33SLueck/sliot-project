const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const { initializeSecrets } = require('./secrets');

const app = express();
const prisma = new PrismaClient();

app.use(cors());
app.use(express.json());

// Middleware for error handling
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('❌ API Error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Initialize with secrets (Parameter Store in production, env vars locally)
initializeSecrets().then(async config => {
  const PORT = process.env.PORT || 4000;
  
  console.log(`🚀 CMS starting in ${config.app.nodeEnv} mode`);
  console.log(`📊 Database: Connected`);

  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ 
      status: 'healthy', 
      environment: config.app.nodeEnv,
      timestamp: new Date().toISOString()
    });
  });

  // --- POSTS API ---
  // Get all posts
  app.get('/api/posts', asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, categoryId } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = parseInt(categoryId);
    
    const posts = await prisma.post.findMany({
      where,
      include: {
        author: { select: { id: true, displayName: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
        _count: { select: { comments: true } }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });
    
    const total = await prisma.post.count({ where });
    
    res.json({
      data: posts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // Get single post by ID or slug
  app.get('/api/posts/:identifier', asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);
    
    const post = await prisma.post.findFirst({
      where: isNumeric ? { id: parseInt(identifier) } : { slug: identifier },
      include: {
        author: { select: { id: true, displayName: true, email: true } },
        category: true,
        tags: { include: { tag: true } },
        comments: {
          where: { status: 'APPROVED' },
          include: { user: { select: { id: true, displayName: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    res.json(post);
  }));

  // Create new post
  app.post('/api/posts', asyncHandler(async (req, res) => {
    const { title, content, excerpt, slug, status, categoryId, tagIds, featuredImageId } = req.body;
    
    const post = await prisma.post.create({
      data: {
        title,
        content,
        excerpt,
        slug,
        status: status || 'DRAFT',
        authorId: '1', // TODO: Get from authenticated user
        categoryId: categoryId ? parseInt(categoryId) : null,
        featuredImageId: featuredImageId ? parseInt(featuredImageId) : null,
        tags: tagIds ? {
          create: tagIds.map(tagId => ({ tag: { connect: { id: parseInt(tagId) } } }))
        } : undefined
      },
      include: {
        author: { select: { id: true, displayName: true, email: true } },
        category: true,
        tags: { include: { tag: true } }
      }
    });
    
    res.status(201).json(post);
  }));

  // --- CATEGORIES API ---
  app.get('/api/categories', asyncHandler(async (req, res) => {
    const categories = await prisma.category.findMany({
      include: {
        _count: { select: { posts: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  }));

  // --- TAGS API ---
  app.get('/api/tags', asyncHandler(async (req, res) => {
    const tags = await prisma.tag.findMany({
      include: {
        _count: { select: { posts: true } }
      },
      orderBy: { name: 'asc' }
    });
    res.json(tags);
  }));

  // --- PAGES API ---
  app.get('/api/pages', asyncHandler(async (req, res) => {
    const pages = await prisma.page.findMany({
      include: {
        author: { select: { id: true, displayName: true, email: true } }
      },
      orderBy: { title: 'asc' }
    });
    res.json(pages);
  }));

  app.get('/api/pages/:identifier', asyncHandler(async (req, res) => {
    const { identifier } = req.params;
    const isNumeric = /^\d+$/.test(identifier);
    
    const page = await prisma.page.findFirst({
      where: isNumeric ? { id: parseInt(identifier) } : { slug: identifier },
      include: {
        author: { select: { id: true, displayName: true, email: true } }
      }
    });
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }
    
    res.json(page);
  }));

  // --- MEDIA API ---
  app.get('/api/media', asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, type } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = type ? { type } : {};
    
    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });
    
    const total = await prisma.media.count({ where });
    
    res.json({
      data: media,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  }));

  // --- USERS API ---
  app.get('/api/users', asyncHandler(async (req, res) => {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        cognitoId: true,
        email: true,
        displayName: true,
        role: true,
        isActive: true,
        createdAt: true,
        _count: {
          select: {
            posts: true,
            comments: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(users);
  }));

  // Create or update user (for Cognito callback)
  app.post('/api/users', asyncHandler(async (req, res) => {
    const { cognitoSub, email, name } = req.body;

    if (!cognitoSub || !email) {
      return res.status(400).json({ 
        error: 'Missing required fields: cognitoSub and email are required' 
      });
    }

    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { cognitoId: cognitoSub }
      });

      if (existingUser) {
        // Update existing user if needed
        const updatedUser = await prisma.user.update({
          where: { cognitoId: cognitoSub },
          data: {
            email,
            displayName: name || existingUser.displayName,
            lastLoginAt: new Date()
          }
        });
        return res.json(updatedUser);
      }

      // Create new user
      const newUser = await prisma.user.create({
        data: {
          cognitoId: cognitoSub,
          email,
          displayName: name || email.split('@')[0],
          role: 'EDITOR', // Default role
          lastLoginAt: new Date()
        }
      });

      console.log(`✅ Created new user: ${email} (${cognitoSub})`);
      res.status(201).json(newUser);

    } catch (error) {
      console.error('Error creating/updating user:', error);
      
      // Handle unique constraint violation
      if (error.code === 'P2002') {
        return res.status(409).json({ 
          error: 'User with this email already exists' 
        });
      }
      
      throw error;
    }
  }));

  // --- SETTINGS API ---
  app.get('/api/settings', asyncHandler(async (req, res) => {
    const settings = await prisma.setting.findMany({
      orderBy: { key: 'asc' }
    });
    
    const settingsObj = settings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});
    
    res.json(settingsObj);
  }));

  // --- MENU API ---
  app.get('/api/menus/:location', asyncHandler(async (req, res) => {
    const { location } = req.params;
    
    const menuItems = await prisma.menu.findMany({
      where: { location },
      orderBy: { order: 'asc' }
    });
    
    res.json(menuItems);
  }));

  // --- STATS API ---
  app.get('/api/stats', asyncHandler(async (req, res) => {
    const [
      totalPosts,
      totalPages,
      totalUsers,
      totalComments,
      publishedPosts,
      draftPosts
    ] = await Promise.all([
      prisma.post.count(),
      prisma.page.count(),
      prisma.user.count(),
      prisma.comment.count(),
      prisma.post.count({ where: { status: 'PUBLISHED' } }),
      prisma.post.count({ where: { status: 'DRAFT' } })
    ]);
    
    res.json({
      posts: { total: totalPosts, published: publishedPosts, draft: draftPosts },
      pages: { total: totalPages },
      users: { total: totalUsers },
      comments: { total: totalComments }
    });
  }));

  // Seed data endpoint (development only)
  if (config.app.nodeEnv === 'development') {
    app.post('/api/seed', asyncHandler(async (req, res) => {
      // Run the seed script
      const { execSync } = require('child_process');
      try {
        execSync('npx prisma db seed', { cwd: __dirname, stdio: 'inherit' });
        res.json({ message: 'Database seeded successfully' });
      } catch (error) {
        res.status(500).json({ error: 'Failed to seed database', details: error.message });
      }
    }));
  }

  app.listen(PORT, () => {
    console.log(`🎯 CMS API running on port ${PORT}`);
    console.log(`🔗 Health check: http://localhost:${PORT}/health`);
    console.log(`📚 API endpoints:`);
    console.log(`   GET  /api/posts - List posts`);
    console.log(`   GET  /api/posts/:id - Get post by ID`);
    console.log(`   POST /api/posts - Create post`);
    console.log(`   GET  /api/categories - List categories`);
    console.log(`   GET  /api/tags - List tags`);
    console.log(`   GET  /api/pages - List pages`);
    console.log(`   GET  /api/media - List media`);
    console.log(`   GET  /api/users - List users`);
    console.log(`   GET  /api/settings - Get settings`);
    console.log(`   GET  /api/stats - Get stats`);
    if (config.app.nodeEnv === 'development') {
      console.log(`   POST /api/seed - Seed database (dev only)`);
    }
  });
}).catch(error => {
  console.error('❌ Failed to initialize CMS:', error);
  process.exit(1);
});