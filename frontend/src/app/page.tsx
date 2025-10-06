
import AuthHeader from '@/components/AuthHeader';

interface Post {
  id: number;
  title: string;
  content: string;
  excerpt?: string;
  slug: string;
  status: string;
  authorId: string;
  categoryId?: number;
  createdAt: string;
  updatedAt: string;
  category?: Category;
  tags?: Tag[];

}

interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string;
}

interface Tag {
  id: number;
  name: string;
  slug: string;
}

interface CMSStats {
  totalPosts: number;
  totalCategories: number;
  totalTags: number;
  totalUsers: number;
}

// Server action to fetch CMS data
async function fetchCMSData() {
  const apiUrl = process.env.CMS_INTERNAL_URL || 'http://cms:4000';
  const [postsResponse, categoriesResponse, statsResponse] = await Promise.all([
    fetch(`${apiUrl}/api/posts?limit=6`),
    fetch(`${apiUrl}/api/categories`),
    fetch(`${apiUrl}/api/stats`)
  ]);

  if (!postsResponse.ok || !categoriesResponse.ok || !statsResponse.ok) {
    throw new Error('Failed to fetch CMS data');
  }

  const postsData = await postsResponse.json();
  const categoriesData = await categoriesResponse.json();
  const statsData = await statsResponse.json();

  return {
    posts: postsData.posts || postsData || [],
    categories: categoriesData.categories || categoriesData || [],
    stats: statsData,
  };
}


export default async function Home() {
  let posts: Post[] = [];
  let categories: Category[] = [];
  let stats: CMSStats | null = null;
  let error: string | null = null;
  try {
    const data = await fetchCMSData();
    posts = data.posts;
    categories = data.categories;
    stats = data.stats;
  } catch (err) {
    error = err instanceof Error ? err.message : 'Failed to load content';
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const truncateContent = (content: string, maxLength: number = 150) => {
    if (content.length <= maxLength) return content;
    return content.substring(0, maxLength) + '...';
  };

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connection Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <form method="GET">
            <button 
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AuthHeader />
      {/* ...existing code... */}
      {/* Stats Section */}
      {stats && (
        <section className="bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600">{stats.totalPosts}</div>
                <div className="text-gray-600">Posts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600">{stats.totalCategories}</div>
                <div className="text-gray-600">Categories</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600">{stats.totalTags}</div>
                <div className="text-gray-600">Tags</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-orange-600">{stats.totalUsers}</div>
                <div className="text-gray-600">Users</div>
              </div>
            </div>
          </div>
        </section>
      )}
      {/* ...existing code... */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Main Content - Posts */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Latest Posts</h2>
              <span className="text-gray-500">{posts.length} posts</span>
            </div>
            {posts.length > 0 ? (
              <div className="grid gap-6">
                {posts.map((post) => (
                  <article key={post.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                    <div className="p-6">
                      <div className="flex items-center space-x-4 mb-4">
                        {post.category && (
                          <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm">
                            {post.category.name}
                          </span>
                        )}
                        <span className="text-gray-500 text-sm">
                          {formatDate(post.createdAt)}
                        </span>
                        <span className={`px-2 py-1 rounded text-xs ${
                          post.status === 'published' 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {post.status}
                        </span>
                      </div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-3">
                        {post.title}
                      </h3>
                      <p className="text-gray-600 mb-4">
                        {post.excerpt || truncateContent(post.content)}
                      </p>
                      {post.tags && post.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {post.tags.map((tag) => (
                            <span key={tag.id} className="bg-gray-100 text-gray-700 px-2 py-1 rounded text-sm">
                              #{tag.name}
                            </span>
                          ))}
                        </div>
                      )}
                      <div className="flex justify-between items-center">
                        <span className="text-gray-500 text-sm">
                          Slug: /{post.slug}
                        </span>
                        <button className="text-blue-600 hover:text-blue-800 font-medium">
                          Read More →
                        </button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                <div className="text-gray-400 text-4xl mb-4">📝</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No posts found</h3>
                <p className="text-gray-600">The CMS database appears to be empty.</p>
              </div>
            )}
          </div>
          {/* Sidebar - Categories */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Categories</h3>
              {categories.length > 0 ? (
                <div className="space-y-3">
                  {categories.map((category) => (
                    <div key={category.id} className="flex justify-between items-center">
                      <div>
                        <div className="font-medium text-gray-900">{category.name}</div>
                        {category.description && (
                          <div className="text-sm text-gray-600">{category.description}</div>
                        )}
                        <div className="text-xs text-gray-500">/{category.slug}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500">
                  <div className="text-2xl mb-2">📂</div>
                  <p>No categories found</p>
                </div>
              )}
            </div>
            {/* CMS Info */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 p-6 mt-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-3">CMS Status</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">API:</span>
                  <span className="text-blue-900 font-medium">localhost:4000</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Frontend:</span>
                  <span className="text-blue-900 font-medium">localhost:8080</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Database:</span>
                  <span className="text-blue-900 font-medium">PostgreSQL</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">ORM:</span>
                  <span className="text-blue-900 font-medium">Prisma</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}