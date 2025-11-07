import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from './useAuth';

export const useLikeShare = (postId: string) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [sharesCount, setSharesCount] = useState(0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [shareLoading, setShareLoading] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchCounts = async () => {
      const { data: post } = await supabase
        .from('posts')
        .select('likes_count, shares_count')
        .eq('id', postId)
        .single();
      
      if (post && mounted) {
        setLikesCount(post.likes_count);
        setSharesCount(post.shares_count);
      }
    };

    const checkLikeStatus = async () => {
      if (!user) {
        if (mounted) {
          setIsLiked(false);
        }
        return;
      }
      
      const { data } = await supabase
        .from('likes')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .single();
      
      if (mounted) {
        setIsLiked(!!data);
      }
    };

    fetchCounts();
    checkLikeStatus();

    return () => {
      mounted = false;
    };
  }, [postId, user?.id]);

  const toggleLike = async () => {
    if (!user || likeLoading) return;
    
    setLikeLoading(true);
    
    try {
      // Check rate limit
      const { data: rateLimitCheck } = await supabase.functions.invoke('check-rate-limit', {
        body: { user_id: user.id, action_type: 'like' }
      });

      if (!rateLimitCheck?.allowed) {
        throw new Error(rateLimitCheck?.message || 'Rate limit exceeded');
      }

      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);

        if (!error) {
          setIsLiked(false);
          setLikesCount(prev => Math.max(0, prev - 1));
        }
      } else {
        // Like
        const { error } = await supabase
          .from('likes')
          .insert([{ post_id: postId, user_id: user.id }]);

        if (!error) {
          setIsLiked(true);
          setLikesCount(prev => prev + 1);
        }
      }
    } catch (error: any) {
      console.error('Like error:', error);
      return { error: error.message };
    } finally {
      setLikeLoading(false);
    }
  };

  const sharePost = async (shareType: 'link' | 'twitter' | 'facebook' | 'whatsapp') => {
    if (shareLoading) return;
    
    setShareLoading(true);
    
    try {
      const postUrl = `${window.location.origin}/post/${postId}`;
      
      // Get post title for sharing
      const { data: post } = await supabase
        .from('posts')
        .select('title')
        .eq('id', postId)
        .single();

      const shareText = post?.title || 'Check out this post';

      switch (shareType) {
        case 'link':
          await navigator.clipboard.writeText(postUrl);
          break;
        
        case 'twitter':
          window.open(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(postUrl)}`,
            '_blank',
            'width=550,height=420'
          );
          break;
        
        case 'facebook':
          window.open(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}`,
            '_blank',
            'width=550,height=420'
          );
          break;
        
        case 'whatsapp':
          window.open(
            `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + postUrl)}`,
            '_blank'
          );
          break;
      }

      // Log share
      await supabase
        .from('shares')
        .insert([{
          post_id: postId,
          user_id: user?.id || null,
          share_type: shareType
        }]);

      setSharesCount(prev => prev + 1);
      
      return { success: true };
    } catch (error: any) {
      console.error('Share error:', error);
      return { error: error.message };
    } finally {
      setShareLoading(false);
    }
  };

  return {
    isLiked,
    likesCount,
    sharesCount,
    likeLoading,
    shareLoading,
    toggleLike,
    sharePost
  };
};
