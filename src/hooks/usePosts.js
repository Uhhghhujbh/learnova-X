import { useState } from 'react';
import { supabase } from '../api/supabase';

export function usePosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPosts = async (category = 'for-you', search = '') => {
    setLoading(true);
    try {
      let query = supabase
        .from('posts')
        .select('*, users(username, display_name, avatar_url)')
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`title.ilike.%${search}%,content.ilike.%${search}%`);
      } else if (category === 'trending') {
        query = query.eq('is_trending', true);
      } else if (category !== 'for-you') {
        query = query.eq('category', category);
      }

      const { data, error } = await query;
      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    }
    setLoading(false);
  };

  return { posts, loading, fetchPosts };
}