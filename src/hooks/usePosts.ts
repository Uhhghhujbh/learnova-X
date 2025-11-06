import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import type { Post } from '../types';
import { LIMITS } from '../constants/limits';

export const usePosts = (category?: string, searchQuery?: string) => {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchPosts = useCallback(async (pageNum: number, refresh = false) => {
    if (loading) return;
    setLoading(true);

    try {
      let query = supabase
        .from('posts')
        .select('*', { count: 'exact' })
        .eq('banned', false);

      // Category filter
      if (category && category !== 'for-you') {
        query = query.eq('category', category);
      }

      // Full-text search
      if (searchQuery && searchQuery.trim()) {
        query = query.textSearch('title_content_fts', searchQuery.trim(), {
          type: 'websearch',
          config: 'english'
        });
      }

      // Sorting
      if (category === 'for-you' || !category) {
        // For You: Mix of trending and recent
        query = query.order('engagement_score', { ascending: false });
      } else {
        // Other categories: Recent first
        query = query.order('created_at', { ascending: false });
      }

      // Pagination
      const from = pageNum * LIMITS.POSTS_PER_PAGE;
      const to = from + LIMITS.POSTS_PER_PAGE - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      if (data) {
        setPosts(prev => refresh ? data : [...prev, ...data]);
        setHasMore((count || 0) > (pageNum + 1) * LIMITS.POSTS_PER_PAGE);
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  }, [category, searchQuery, loading]);

  useEffect(() => {
    setPage(0);
    fetchPosts(0, true);
  }, [category, searchQuery]);

  const loadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchPosts(nextPage);
    }
  };

  const addPost = (post: Post) => setPosts(prev => [post, ...prev]);
  
  const updatePost = (postId: string, updates: Partial<Post>) => 
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, ...updates } : p));
  
  const deletePost = (postId: string) => 
    setPosts(prev => prev.filter(p => p.id !== postId));

  return { 
    posts, 
    loading, 
    hasMore, 
    loadMore, 
    addPost, 
    updatePost, 
    deletePost, 
    refresh: () => fetchPosts(0, true) 
  };
};
