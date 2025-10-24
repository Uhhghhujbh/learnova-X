import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import { Home, LogOut, Sun, Moon, Menu, X, Search, Bell, Settings, ThumbsUp, MessageCircle, Share2 } from 'lucide-react';
import PostCard from '../components/PostCard';
import Comments from '../components/Comments';

export default function NewsFeed() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const { user, supabase, isAdmin } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('for-you');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [profileData, setProfileData] = useState({});
  const [editingProfile, setEditingProfile] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);

  const categories = ['for-you', 'trending', 'education', 'business', 'jobs', 'tech', 'health', 'others'];

  useEffect(() => {
    fetchPosts();
    if (user) fetchNotifications();
  }, [category, search, user]);

  useEffect(() => {
    if (postId) fetchSinglePost(postId);
  }, [postId]);

  useEffect(() => {
    if (user) setProfileData(user);
  }, [user]);

  // FETCH POSTS
  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*, users(id, username, display_name, avatar_url, role)')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      } else if (category === 'trending') {
        query = query.eq('is_trending', true);
      } else if (category !== 'for-you') {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      setPosts(data || []);
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
    setLoading(false);
  };

  // FETCH SINGLE POST
  const fetchSinglePost = async (pId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users(id, username, display_name, avatar_url, role)')
        .eq('id', pId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedPost(data);
        await supabase
          .from('posts')
          .update({ views_count: (data.views_count || 0) + 1 })
          .eq('id', pId)
          .catch(e => console.error('View update error:', e));
      }
    } catch (err) {
      console.error('Fetch post error:', err);
    }
  };

  // FETCH NOTIFICATIONS
  const fetchNotifications = async () => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*, from_user:from_user_id(display_name)')
        .eq('user_id', user.id)
        .eq('is_read', false)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      setNotifications(data || []);
    } catch (err) {
      console.error('Fetch notifications error:', err);
    }
  };

  // LIKE HANDLER
  const handleLike = async (pId) => {
    if (!user) {
      alert('Please login to like posts');
      return;
    }

    try {
      const post = posts.find(p => p.id === pId);
      const { data: existing } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', pId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        await supabase.from('likes').delete().eq('id', existing.id);
        const newCount = Math.max(0, (post?.likes_count || 0) - 1);
        setPosts(posts.map(p => p.id === pId ? { ...p, likes_count: newCount } : p));
        if (selectedPost?.id === pId) setSelectedPost({ ...selectedPost, likes_count: newCount });
      } else {
        await supabase.from('likes').insert({ post_id: pId, user_id: user.id });
        const newCount = (post?.likes_count || 0) + 1;
        setPosts(posts.map(p => p.id === pId ? { ...p, likes_count: newCount } : p));
        if (selectedPost?.id === pId) setSelectedPost({ ...selectedPost, likes_count: newCount });
      }
    } catch (err) {
      console.error('Like error:', err);
      alert('Failed to like post');
    }
  };

  // SHARE HANDLER
  const handleShare = async (post) => {
    if (!user) {
      alert('Please login to share posts');
      return;
    }

    try {
      const url = `${window.location.origin}/news/${post.id}`;
      await navigator.clipboard.writeText(url);
      alert('Link copied!');

      await supabase.from('shares').insert({ post_id: post.id, user_id: user.id });

      const newCount = (post?.shares_count || 0) + 1;
      setPosts(posts.map(p => p.id === post.id ? { ...p, shares_count: newCount } : p));
      if (selectedPost?.id === post.id) setSelectedPost({ ...selectedPost, shares_count: newCount });
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  // UPDATE PROFILE
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    if (!user) return;

    setSaveLoading(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({
          display_name: profileData.display_name,
          bio: profileData.bio || ''
        })
        .eq('id', user.id);

      if (error) throw error;
      alert('Profile updated!');
      setEditingProfile(false);
    } catch (err) {
      console.error('Profile update error:', err);
      alert('Failed to update profile');
    }
    setSaveLoading(false);
  };

  // MARK NOTIFICATION READ
  const markNotificationAsRead = async (notifId) => {
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('id', notifId);
      setNotifications(notifications.filter(n => n.id !== notifId));
    } catch (err) {
      console.error('Notification error:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* HEADER */}
      <header className="sticky top-0 z-40 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent whitespace-nowrap">
              Learnova X
            </h1>

            <div className="hidden md:flex flex-1 relative max-w-md">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition relative"
                >
                  <Bell size={20} className="text-gray-700 dark:text-gray-300" />
                  {notifications.length > 0 && (
                    <span className="absolute top-1 right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
                      {notifications.length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                    <div className="sticky top-0 p-3 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                      <h3 className="font-bold text-gray-900 dark:text-white text-sm">Notifications</h3>
                    </div>
                    {notifications.length === 0 ? (
                      <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">No new notifications</p>
                    ) : (
                      notifications.map(notif => (
                        <div key={notif.id} className="p-3 border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                          <p className="text-sm text-gray-900 dark:text-white">
                            <span className="font-semibold">{notif.from_user?.display_name}</span> {notif.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{new Date(notif.created_at).toLocaleDateString()}</p>
                          <button
                            onClick={() => markNotificationAsRead(notif.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 mt-2"
                          >
                            Dismiss
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Profile */}
              {user && (
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  <Settings size={20} className="text-gray-700 dark:text-gray-300" />
                </button>
              )}

              {/* Theme */}
              <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                {theme === 'light' ? <Moon size={20} className="text-gray-700" /> : <Sun size={20} className="text-gray-300" />}
              </button>

              {/* Mobile Menu */}
              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
              />
            </div>
          </div>

          {/* Mobile Menu */}
          {menuOpen && (
            <div className="md:hidden mt-3 pb-2 space-y-1">
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm text-gray-900 dark:text-white"
                >
                  Admin Dashboard
                </button>
              )}
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                  navigate('/');
                }}
                className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg text-red-600 text-sm"
              >
                Logout
              </button>
            </div>
          )}
        </div>
      </header>

      {/* PROFILE SIDEBAR */}
      {showProfile && user && (
        <div className="fixed right-0 top-16 z-30 w-80 h-[calc(100vh-64px)] bg-white dark:bg-gray-800 border-l border-gray-200 dark:border-gray-700 shadow-lg overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold">
                {profileData.display_name?.charAt(0) || 'U'}
              </div>
              <div>
                <p className="font-bold text-gray-900 dark:text-white">{profileData.display_name}</p>
                <p className="text-sm text-gray-500">@{profileData.username}</p>
              </div>
            </div>

            {!editingProfile ? (
              <>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">{profileData.bio || 'No bio added yet'}</p>
                <button
                  onClick={() => setEditingProfile(true)}
                  className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition mb-4 text-sm"
                >
                  Edit Profile
                </button>
              </>
            ) : (
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Display Name</label>
                  <input
                    type="text"
                    placeholder="Display Name"
                    value={profileData.display_name || ''}
                    onChange={(e) => setProfileData({ ...profileData, display_name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-700 dark:text-gray-300">Bio</label>
                  <textarea
                    placeholder="Tell us about yourself"
                    value={profileData.bio || ''}
                    onChange={(e) => setProfileData({ ...profileData, bio: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm h-20 resize-none"
                  />
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    type="submit"
                    disabled={saveLoading}
                    className="flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition text-sm disabled:opacity-50"
                  >
                    {saveLoading ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingProfile(false)}
                    className="flex-1 px-3 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded-lg font-medium transition text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <button
              onClick={async () => {
                await supabase.auth.signOut();
                navigate('/');
              }}
              className="w-full px-4 py-2 mt-4 text-red-600 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg font-medium transition text-sm"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className={`transition-all ${showProfile ? 'mr-80' : ''}`}>
        <div className="max-w-6xl mx-auto px-4 py-6">
          {/* Categories */}
          <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                  category === cat
                    ? 'bg-blue-600 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                {cat.charAt(0).toUpperCase() + cat.slice(1)}
              </button>
            ))}
          </div>

          {/* Posts Grid */}
          {loading ? (
            <div className="flex justify-center py-20">
              <div className="animate-spin w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"></div>
            </div>
          ) : posts.length === 0 ? (
            <p className="text-center text-gray-500 dark:text-gray-400 py-10">No posts found</p>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {posts.map(post => (
                <PostCard
                  key={post.id}
                  post={post}
                  onLike={handleLike}
                  onShare={handleShare}
                  onClick={() => {
                    setSelectedPost(post);
                    fetchSinglePost(post.id);
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* POST MODAL */}
      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto my-8">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <h2 className="font-bold text-gray-900 dark:text-white">Post Details</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              {/* Author Info */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                  {selectedPost.users?.display_name?.charAt(0) || 'U'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">
                    {selectedPost.users?.display_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500">
                    {new Date(selectedPost.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Title */}
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                {selectedPost.title}
              </h3>

              {/* Content */}
              <div
                className="prose dark:prose-invert max-w-none mb-6 text-gray-800 dark:text-gray-200"
                dangerouslySetInnerHTML={{ __html: selectedPost.content }}
              />

              {/* Images */}
              {selectedPost.image_urls?.length > 0 && (
                <div className="grid gap-4 mb-6">
                  {selectedPost.image_urls.map((url, idx) => (
                    <img
                      key={idx}
                      src={url}
                      alt={`Post ${idx}`}
                      className="w-full rounded-lg max-h-96 object-cover"
                    />
                  ))}
                </div>
              )}

              {/* Stats */}
              <div className="flex gap-6 py-4 border-y border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLike(selectedPost.id)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition text-sm font-medium"
                >
                  <ThumbsUp size={18} />
                  <span>{selectedPost.likes_count || 0}</span>
                </button>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 text-sm font-medium">
                  <MessageCircle size={18} />
                  <span>{selectedPost.comments_count || 0}</span>
                </div>
                <button
                  onClick={() => handleShare(selectedPost)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition text-sm font-medium"
                >
                  <Share2 size={18} />
                  <span>{selectedPost.shares_count || 0}</span>
                </button>
              </div>

              {/* Comments */}
              <Comments
                postId={selectedPost.id}
                user={user}
                supabase={supabase}
                onCommentAdded={() => {
                  fetchSinglePost(selectedPost.id);
                  fetchPosts();
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
