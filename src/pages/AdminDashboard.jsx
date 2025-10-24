import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import { Home, Sun, Moon, Plus, Trash2, Edit2, Pin, TrendingUp, Users, BarChart3, Eye, Upload, X, MessageCircle, Share2, ThumbsUp, Ban } from 'lucide-react';
import RichEditor from '../components/RichEditor';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, supabase, isAdmin } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [activeTab, setActiveTab] = useState('create');
  const [posts, setPosts] = useState([]);
  const [users, setUsers] = useState([]);
  const [analytics, setAnalytics] = useState({});
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'for-you',
    excerpt: '',
    image_urls: []
  });
  const [editingPost, setEditingPost] = useState(null);
  const [imageFiles, setImageFiles] = useState([]);

  const categories = ['for-you', 'education', 'business', 'jobs', 'tech', 'others', 'ads'];

  useEffect(() => {
    if (!isAdmin) {
      navigate('/');
      return;
    }
    if (activeTab === 'manage') fetchPosts();
    if (activeTab === 'users') fetchUsers();
    if (activeTab === 'analytics') fetchAnalytics();
  }, [activeTab, isAdmin]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users(username, display_name)')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
    setLoading(false);
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (err) {
      console.error('Fetch users error:', err);
    }
    setLoading(false);
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const { data: postsData } = await supabase.from('posts').select('id, views_count, likes_count, comments_count, shares_count');
      const { data: usersData } = await supabase.from('users').select('id');
      const { data: commentsData } = await supabase.from('comments').select('id');

      const totalViews = postsData?.reduce((sum, p) => sum + (p.views_count || 0), 0) || 0;
      const totalLikes = postsData?.reduce((sum, p) => sum + (p.likes_count || 0), 0) || 0;
      const totalShares = postsData?.reduce((sum, p) => sum + (p.shares_count || 0), 0) || 0;

      setAnalytics({
        totalPosts: postsData?.length || 0,
        totalUsers: usersData?.length || 0,
        totalComments: commentsData?.length || 0,
        totalViews,
        totalLikes,
        totalShares
      });
    } catch (err) {
      console.error('Fetch analytics error:', err);
    }
    setLoading(false);
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length + imageFiles.length > 3) {
      alert('Maximum 3 images allowed');
      return;
    }

    for (const file of files) {
      if (file.size > 1024 * 1024) {
        alert(`${file.name} exceeds 1MB limit`);
        continue;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setImageFiles(prev => [...prev, { file, preview: reader.result }]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index) => {
    setImageFiles(prev => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    const uploadedUrls = [];

    for (const img of imageFiles) {
      const fileName = `${Date.now()}_${img.file.name}`;
      const { data, error } = await supabase.storage
        .from('post-images')
        .upload(fileName, img.file);

      if (error) {
        console.error('Upload error:', error);
        continue;
      }

      const { data: urlData } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName);

      if (urlData) uploadedUrls.push(urlData.publicUrl);
    }

    return uploadedUrls;
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.content) {
      alert('Title and content are required');
      return;
    }

    setLoading(true);
    try {
      const imageUrls = imageFiles.length > 0 ? await uploadImages() : [];

      const postData = {
        author_id: user.id,
        title: formData.title,
        content: formData.content,
        category: formData.category,
        excerpt: formData.excerpt || formData.content.slice(0, 300),
        image_urls: imageUrls,
        can_edit_until: new Date(Date.now() + 15 * 60000).toISOString()
      };

      if (editingPost) {
        const { error } = await supabase
          .from('posts')
          .update(postData)
          .eq('id', editingPost.id);

        if (error) throw error;
        alert('Post updated successfully');
      } else {
        const { error } = await supabase.from('posts').insert(postData);
        if (error) throw error;
        alert('Post created successfully');
      }

      setFormData({ title: '', content: '', category: 'for-you', excerpt: '', image_urls: [] });
      setImageFiles([]);
      setEditingPost(null);
      fetchPosts();
    } catch (err) {
      console.error('Create post error:', err);
      alert('Failed to create post');
    }
    setLoading(false);
  };

  const handleDeletePost = async (postId) => {
    if (!window.confirm('Delete this post?')) return;

    try {
      const { error } = await supabase.from('posts').delete().eq('id', postId);
      if (error) throw error;
      setPosts(posts.filter(p => p.id !== postId));
      alert('Post deleted');
    } catch (err) {
      console.error('Delete post error:', err);
      alert('Failed to delete post');
    }
  };

  const handlePinPost = async (postId, currentPinStatus) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_pinned: !currentPinStatus })
        .eq('id', postId);

      if (error) throw error;
      setPosts(posts.map(p => p.id === postId ? { ...p, is_pinned: !currentPinStatus } : p));
      alert(currentPinStatus ? 'Post unpinned' : 'Post pinned');
    } catch (err) {
      console.error('Pin post error:', err);
      alert('Failed to pin post');
    }
  };

  const handleToggleTrending = async (postId, currentTrendingStatus) => {
    try {
      const { error } = await supabase
        .from('posts')
        .update({ is_trending: !currentTrendingStatus })
        .eq('id', postId);

      if (error) throw error;
      setPosts(posts.map(p => p.id === postId ? { ...p, is_trending: !currentTrendingStatus } : p));
      alert(currentTrendingStatus ? 'Removed from trending' : 'Marked as trending');
    } catch (err) {
      console.error('Toggle trending error:', err);
      alert('Failed to toggle trending');
    }
  };

  const handleBanUser = async (userId, currentBanStatus) => {
    if (!window.confirm(`${currentBanStatus ? 'Unban' : 'Ban'} this user?`)) return;

    try {
      const { error } = await supabase
        .from('users')
        .update({ banned: !currentBanStatus })
        .eq('id', userId);

      if (error) throw error;
      setUsers(users.map(u => u.id === userId ? { ...u, banned: !currentBanStatus } : u));
      alert(currentBanStatus ? 'User unbanned' : 'User banned');
    } catch (err) {
      console.error('Ban user error:', err);
      alert('Failed to ban user');
    }
  };

  const editPost = (post) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      content: post.content,
      category: post.category,
      excerpt: post.excerpt || '',
      image_urls: post.image_urls || []
    });
    setActiveTab('create');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>

          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/news')}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
            >
              <Home size={20} />
            </button>

            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
              {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'create'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Plus size={18} />
            Create Post
          </button>

          <button
            onClick={() => setActiveTab('manage')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'manage'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Edit2 size={18} />
            Manage Posts
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'users'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <Users size={18} />
            Users
          </button>

          <button
            onClick={() => setActiveTab('analytics')}
            className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition flex items-center gap-2 ${
              activeTab === 'analytics'
                ? 'bg-blue-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
            }`}
          >
            <BarChart3 size={18} />
            Analytics
          </button>
        </div>

        {activeTab === 'create' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">
              {editingPost ? 'Edit Post' : 'Create New Post'}
            </h2>

            <form onSubmit={handleCreatePost} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter post title"
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map(cat => (
                    <option key={cat} value={cat}>
                      {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Excerpt (Optional)
                </label>
                <input
                  type="text"
                  value={formData.excerpt}
                  onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                  placeholder="Brief description"
                  maxLength={300}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Content
                </label>
                <RichEditor
                  content={formData.content}
                  onChange={(html) => setFormData({ ...formData, content: html })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Images (Max 3, 1MB each)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label
                  htmlFor="image-upload"
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg cursor-pointer transition"
                >
                  <Upload size={18} />
                  Upload Images
                </label>

                {imageFiles.length > 0 && (
                  <div className="mt-4 grid grid-cols-3 gap-4">
                    {imageFiles.map((img, idx) => (
                      <div key={idx} className="relative">
                        <img src={img.preview} alt={`Preview ${idx}`} className="w-full h-32 object-cover rounded-lg" />
                        <button
                          type="button"
                          onClick={() => removeImage(idx)}
                          className="absolute top-2 right-2 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition disabled:opacity-50"
                >
                  {loading ? 'Processing...' : (editingPost ? 'Update Post' : 'Create Post')}
                </button>

                {editingPost && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingPost(null);
                      setFormData({ title: '', content: '', category: 'for-you', excerpt: '', image_urls: [] });
                      setImageFiles([]);
                    }}
                    className="px-6 py-2 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white font-medium rounded-lg transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        )}

        {activeTab === 'manage' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Manage Posts</h2>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : posts.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">No posts found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Title</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Category</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Author</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Stats</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {posts.map(post => (
                      <tr key={post.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="text-gray-900 dark:text-white font-medium">{post.title}</span>
                            {post.is_pinned && <Pin size={14} className="text-blue-600" />}
                            {post.is_trending && <TrendingUp size={14} className="text-red-600" />}
                          </div>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{post.category}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{post.users?.display_name}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400 text-sm">
                          {post.views_count} views, {post.likes_count} likes
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => editPost(post)}
                              className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900 rounded transition"
                              title="Edit"
                            >
                              <Edit2 size={16} />
                            </button>

                            <button
                              onClick={() => handlePinPost(post.id, post.is_pinned)}
                              className={`p-1 rounded transition ${
                                post.is_pinned
                                  ? 'text-blue-600 bg-blue-100 dark:bg-blue-900'
                                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              title={post.is_pinned ? 'Unpin' : 'Pin'}
                            >
                              <Pin size={16} />
                            </button>

                            <button
                              onClick={() => handleToggleTrending(post.id, post.is_trending)}
                              className={`p-1 rounded transition ${
                                post.is_trending
                                  ? 'text-red-600 bg-red-100 dark:bg-red-900'
                                  : 'text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
                              }`}
                              title={post.is_trending ? 'Remove from trending' : 'Mark as trending'}
                            >
                              <TrendingUp size={16} />
                            </button>

                            <button
                              onClick={() => handleDeletePost(post.id)}
                              className="p-1 text-red-600 hover:bg-red-100 dark:hover:bg-red-900 rounded transition"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Manage Users</h2>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : users.length === 0 ? (
              <p className="text-center text-gray-500 dark:text-gray-400 py-10">No users found</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700">
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Username</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Email</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Role</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Posts This Week</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Status</th>
                      <th className="text-left py-3 px-4 text-gray-700 dark:text-gray-300">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map(user => (
                      <tr key={user.id} className="border-b border-gray-100 dark:border-gray-700">
                        <td className="py-3 px-4 text-gray-900 dark:text-white font-medium">{user.username}</td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.email}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.role === 'admin' 
                              ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
                              : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-600 dark:text-gray-400">{user.posts_this_week}/3</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            user.banned
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
                          }`}>
                            {user.banned ? 'Banned' : 'Active'}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => handleBanUser(user.id, user.banned)}
                            className={`p-1 rounded transition ${
                              user.banned
                                ? 'text-green-600 hover:bg-green-100 dark:hover:bg-green-900'
                                : 'text-red-600 hover:bg-red-100 dark:hover:bg-red-900'
                            }`}
                            title={user.banned ? 'Unban User' : 'Ban User'}
                          >
                            <Ban size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h2>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-200 border-t-blue-600"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-700 dark:text-gray-300 font-medium">Total Posts</h3>
                    <Edit2 className="text-blue-600 dark:text-blue-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalPosts || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-700 dark:text-gray-300 font-medium">Total Users</h3>
                    <Users className="text-green-600 dark:text-green-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalUsers || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-700 dark:text-gray-300 font-medium">Total Comments</h3>
                    <MessageCircle className="text-purple-600 dark:text-purple-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalComments || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900 dark:to-yellow-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-700 dark:text-gray-300 font-medium">Total Views</h3>
                    <Eye className="text-yellow-600 dark:text-yellow-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalViews || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900 dark:to-red-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-700 dark:text-gray-300 font-medium">Total Likes</h3>
                    <ThumbsUp className="text-red-600 dark:text-red-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalLikes || 0}</p>
                </div>

                <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900 dark:to-indigo-800 p-6 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-gray-700 dark:text-gray-300 font-medium">Total Shares</h3>
                    <Share2 className="text-indigo-600 dark:text-indigo-400" size={24} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 dark:text-white">{analytics.totalShares || 0}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
