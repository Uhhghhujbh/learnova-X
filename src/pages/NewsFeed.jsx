import React, { useState, useEffect, useContext, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { AuthContext, ThemeContext } from '../App';
import { Home, LogOut, Sun, Moon, Menu, X, ThumbsUp, MessageCircle, Share2, Search, Pin, TrendingUp } from 'lucide-react';
import PostCard from '../components/PostCard';
import Comments from '../components/Comments';

export default function NewsFeed() {
  const { postId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const prevPage = useRef(null);
  const homeClickCount = useRef(0);
  const homeClickTimer = useRef(null);
  
  const { user, supabase, isAdmin } = useContext(AuthContext);
  const { theme, toggleTheme } = useContext(ThemeContext);

  const [posts, setPosts] = useState([]);
  const [category, setCategory] = useState('for-you');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [showPinned, setShowPinned] = useState(false);

  const categories = ['for-you', 'trending', 'education', 'business', 'jobs', 'tech', 'others', 'ads'];

  useEffect(() => {
    prevPage.current = location.state?.from || null;
    fetchPosts();
  }, [category, search]);

  useEffect(() => {
    if (postId) {
      fetchSinglePost(postId);
    }
  }, [postId]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*, users(username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%,excerpt.ilike.%${search}%`);
      } else if (category === 'trending') {
        query = query.eq('is_trending', true);
      } else if (category !== 'for-you') {
        query = query.eq('category', category);
      }

      const { data, error } = await query.limit(50);
      if (error) throw error;

      let sortedData = data || [];
      
      if (category === 'for-you' && user) {
        sortedData = await personalizeForYou(sortedData);
      }

      sortedData.sort((a, b) => {
        if (a.is_pinned && !b.is_pinned) return -1;
        if (!a.is_pinned && b.is_pinned) return 1;
        return new Date(b.created_at) - new Date(a.created_at);
      });

      setPosts(sortedData);
    } catch (err) {
      console.error('Fetch posts error:', err);
    }
    setLoading(false);
  };

  const fetchSinglePost = async (pId) => {
    try {
      const { data, error } = await supabase
        .from('posts')
        .select('*, users(username, display_name, avatar_url)')
        .eq('id', pId)
        .single();

      if (error) throw error;
      if (data) {
        setSelectedPost(data);
        await supabase.from('posts').update({ views_count: data.views_count + 1 }).eq('id', pId);
      }
    } catch (err) {
      console.error('Fetch single post error:', err);
    }
  };

  const personalizeForYou = async (postsData) => {
    if (!user) return postsData;
    
    try {
      const { data: history } = await supabase
        .from('read_history')
        .select('category')
        .eq('user_id', user.id);

      if (!history || history.length === 0) return postsData;

      const categoryCount = {};
      history.forEach(h => {
        categoryCount[h.category] = (categoryCount[h.category] || 0) + 1;
      });

      const sortedCategories = Object.entries(categoryCount)
        .sort((a, b) => b[1] - a[1])
        .map(c => c[0]);

      return postsData.sort((a, b) => {
        const aIndex = sortedCategories.indexOf(a.category);
        const bIndex = sortedCategories.indexOf(b.category);
        
        if (aIndex === -1 && bIndex === -1) return 0;
        if (aIndex === -1) return 1;
        if (bIndex === -1) return -1;
        
        return aIndex - bIndex;
      });
    } catch (err) {
      console.error('Personalization error:', err);
      return postsData;
    }
  };

  const handlePostClick = async (post) => {
    setSelectedPost(post);
    
    if (user) {
      await supabase.from('read_history').upsert({
        user_id: user.id,
        post_id: post.id,
        category: post.category,
        time_spent_ms: 0
      }, { onConflict: 'user_id,post_id' });
    }

    await supabase.from('posts').update({ views_count: post.views_count + 1 }).eq('id', post.id);
  };

  const handleLike = async (pId) => {
    try {
      const post = posts.find(p => p.id === pId);
      if (!post) return;

      let newLikesCount = post.likes_count;

      if (user) {
        const { data: existing } = await supabase
          .from('likes')
          .select('id')
          .eq('post_id', pId)
          .eq('user_id', user.id)
          .maybeSingle();

        if (existing) {
          await supabase.from('likes').delete().eq('id', existing.id);
          newLikesCount = Math.max(0, post.likes_count - 1);
        } else {
          await supabase.from('likes').insert({ post_id: pId, user_id: user.id });
          newLikesCount = post.likes_count + 1;
        }
      } else {
        newLikesCount = post.likes_count + 1;
      }

      await supabase.from('posts').update({ likes_count: newLikesCount }).eq('id', pId);
      setPosts(posts.map(p => p.id === pId ? { ...p, likes_count: newLikesCount } : p));
      
      if (selectedPost?.id === pId) {
        setSelectedPost({ ...selectedPost, likes_count: newLikesCount });
      }

      await checkTrendingStatus(pId, newLikesCount);
    } catch (err) {
      console.error('Like error:', err);
    }
  };

  const checkTrendingStatus = async (pId, likesCount) => {
    try {
      const { data: post } = await supabase
        .from('posts')
        .select('likes_count, comments_count, shares_count, is_trending')
        .eq('id', pId)
        .single();

      if (!post) return;

      const shouldTrend = post.likes_count >= 1000 && 
                         post.comments_count >= 500 && 
                         post.shares_count >= 100;

      if (shouldTrend && !post.is_trending) {
        await supabase.from('posts').update({ is_trending: true }).eq('id', pId);
        setPosts(posts.map(p => p.id === pId ? { ...p, is_trending: true } : p));
      }
    } catch (err) {
      console.error('Trending check error:', err);
    }
  };

  const handleShare = async (post) => {
    const url = `${window.location.origin}/news/${post.id}`;
    
    try {
      await navigator.clipboard.writeText(url);
      alert('Share link copied to clipboard!');

      const { data: share } = await supabase
        .from('shares')
        .insert({ post_id: post.id, user_id: user?.id })
        .select()
        .single();

      if (share) {
        const newSharesCount = post.shares_count + 1;
        await supabase.from('posts').update({ shares_count: newSharesCount }).eq('id', post.id);
        setPosts(posts.map(p => p.id === post.id ? { ...p, shares_count: newSharesCount } : p));
        await checkTrendingStatus(post.id, post.likes_count);
      }
    } catch (err) {
      console.error('Share error:', err);
    }
  };

  const handleHomeClick = () => {
    homeClickCount.current += 1;

    if (homeClickTimer.current) {
      clearTimeout(homeClickTimer.current);
    }

    if (homeClickCount.current === 2) {
      homeClickCount.current = 0;
      if (prevPage.current) {
        navigate(prevPage.current);
      } else {
        window.location.href = '/';
      }
    } else {
      homeClickTimer.current = setTimeout(() => {
        if (homeClickCount.current === 1) {
          window.location.reload();
        }
        homeClickCount.current = 0;
      }, 300);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleShowPinned = async () => {
    setShowPinned(!showPinned);
    if (!showPinned) {
      try {
        const { data, error } = await supabase
          .from('posts')
          .select('*, users(username, display_name, avatar_url)')
          .eq('is_pinned', true)
          .order('created_at', { ascending: false });

        if (error) throw error;
        setPosts(data || []);
      } catch (err) {
        console.error('Fetch pinned posts error:', err);
      }
    } else {
      fetchPosts();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <header className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              Learnova X
            </h1>

            <div className="hidden md:flex flex-1 mx-8 relative max-w-xl">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-2 md:gap-4">
              <button
                onClick={handleHomeClick}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                title="Single click: Reload | Double click: Go back"
              >
                <Home size={20} />
              </button>

              <button
                onClick={handleShowPinned}
                className={`p-2 rounded-lg transition ${showPinned ? 'bg-blue-100 dark:bg-blue-900 text-blue-600' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Show pinned posts"
              >
                <Pin size={20} />
              </button>

              <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>

              {user && (
                <button onClick={handleLogout} className="hidden md:block p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                  <LogOut size={20} />
                </button>
              )}

              <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition">
                {menuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          <div className="md:hidden mt-3">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search posts..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {menuOpen && (
            <div className="md:hidden mt-4 pb-2 space-y-2">
              {user && (
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition flex items-center gap-2"
                >
                  <LogOut size={18} />
                  Logout
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => navigate('/admin')}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
                >
                  Admin Dashboard
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-6 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => { setCategory(cat); setShowPinned(false); }}
              className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition ${
                category === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {cat.charAt(0).toUpperCase() + cat.slice(1).replace('-', ' ')}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-200 border-t-blue-600"></div>
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 dark:text-gray-400">No posts found</p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                onLike={handleLike}
                onShare={handleShare}
                onClick={() => handlePostClick(post)}
              />
            ))}
          </div>
        )}
      </div>

      {selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Post Details</h2>
              <button
                onClick={() => setSelectedPost(null)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition"
              >
                <X size={20} />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-start gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white font-bold">
                  {selectedPost.users?.display_name?.charAt(0) || 'A'}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-white">
                    {selectedPost.users?.display_name || 'Anonymous'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {new Date(selectedPost.created_at).toLocaleDateString()}
                  </p>
                </div>
                {selectedPost.is_trending && (
                  <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
                    <TrendingUp size={14} />
                    Trending
                  </div>
                )}
                {selectedPost.is_pinned && (
                  <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                    <Pin size={14} />
                    Pinned
                  </div>
                )}
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{selectedPost.title}</h3>

              <div className="prose dark:prose-invert max-w-none mb-6">
                <div dangerouslySetInnerHTML={{ __html: selectedPost.content }} />
              </div>

              {selectedPost.image_urls && selectedPost.image_urls.length > 0 && (
                <div className="grid gap-4 mb-6">
                  {selectedPost.image_urls.map((url, idx) => (
                    <img key={idx} src={url} alt={`Post image ${idx + 1}`} className="w-full rounded-lg" />
                  ))}
                </div>
              )}

              <div className="flex items-center gap-6 py-4 border-y border-gray-200 dark:border-gray-700">
                <button
                  onClick={() => handleLike(selectedPost.id)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                >
                  <ThumbsUp size={20} />
                  <span>{selectedPost.likes_count}</span>
                </button>

                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                  <MessageCircle size={20} />
                  <span>{selectedPost.comments_count}</span>
                </div>

                <button
                  onClick={() => handleShare(selectedPost)}
                  className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition"
                >
                  <Share2 size={20} />
                  <span>{selectedPost.shares_count}</span>
                </button>
              </div>

              <Comments
                postId={selectedPost.id}
                user={user}
                supabase={supabase}
                onCommentAdded={() => {
                  const newCount = selectedPost.comments_count + 1;
                  setSelectedPost({ ...selectedPost, comments_count: newCount });
                  setPosts(posts.map(p => p.id === selectedPost.id ? { ...p, comments_count: newCount } : p));
                  checkTrendingStatus(selectedPost.id, selectedPost.likes_count);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
