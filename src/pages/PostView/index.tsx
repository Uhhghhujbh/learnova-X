import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { Heart, MessageCircle, Share2, ArrowLeft, Flag } from 'lucide-react';
import Button from '../../components/ui/Button/Button';
import Skeleton from '../../components/ui/Skeleton/Skeleton';
import ReportModal from '../../components/features/Posts/ReportModal';
import TagUserInput from '../../components/ui/TagUserInput';

interface Post {
  id: string;
  title: string;
  content: string;
  category: string;
  image_urls: string[];
  likes_count: number;
  comments_count: number;
  shares_count: number;
  created_at: string;
  author_id: string;
  metadata?: any;
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  users?: {
    display_name: string;
    username: string;
    avatar_url: string;
  };
}

const PostDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [taggedUserId, setTaggedUserId] = useState<string | undefined>();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showReport, setShowReport] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPost();
      fetchComments();
      checkLikeStatus();
    }
  }, [id]);

  const fetchPost = async () => {
    const { data, error } = await supabase
      .from('posts')
      .select('*')
      .eq('id', id)
      .single();

    if (data && !error) {
      setPost(data);
      setLikesCount(data.likes_count);
    }
    setLoading(false);
  };

  const fetchComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*, users:user_id(display_name, username, avatar_url)')
      .eq('post_id', id)
      .order('created_at', { ascending: true });

    if (data) setComments(data);
  };

  const checkLikeStatus = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('likes')
      .select('id')
      .eq('post_id', id)
      .eq('user_id', user.id)
      .single();

    setIsLiked(!!data);
  };

  const handleLike = async () => {
    if (isLiked) {
      await supabase.from('likes').delete().eq('post_id', id).eq('user_id', user?.id);
      setIsLiked(false);
      setLikesCount(prev => prev - 1);
    } else {
      await supabase.from('likes').insert([{ post_id: id, user_id: user?.id }]);
      setIsLiked(true);
      setLikesCount(prev => prev + 1);
    }
  };

  const handleComment = async () => {
    if (!user || !newComment.trim()) return;
    
    const { error } = await supabase.from('comments').insert([{
      post_id: id,
      user_id: user.id,
      content: newComment,
      tagged_user_id: taggedUserId || null,
      can_edit_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }]);

    if (!error) {
      setNewComment('');
      setTaggedUserId(undefined);
      fetchComments();
    }
  };

  const handleShare = async () => {
    await navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
    
    await supabase.from('shares').insert([{
      post_id: id,
      user_id: user?.id
    }]);
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-64 w-full" />
        <Skeleton className="h-32 w-full" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <p className="text-gray-500 text-lg mb-4">Post not found</p>
        <Button onClick={() => navigate('/')}>Back to Home</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto p-4 sm:p-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4 flex items-center gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>

        <article className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium capitalize">
                {post.category}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(post.created_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
              {post.title}
            </h1>
          </div>

          {post.image_urls && post.image_urls.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
              {post.image_urls.map((url, index) => (
                <img
                  key={index}
                  src={url}
                  alt={`Post image ${index + 1}`}
                  className="w-full h-48 sm:h-64 object-cover rounded-lg"
                />
              ))}
            </div>
          )}

          <div className="p-4 sm:p-6">
            <div
              className="prose prose-lg dark:prose-invert max-w-none"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
          </div>

          <div className="p-4 sm:p-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLike}
                  className={`flex items-center gap-2 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}
                >
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
                  <span>{likesCount}</span>
                </Button>
                <div className="flex items-center gap-2 text-gray-500">
                  <MessageCircle className="w-5 h-5" />
                  <span>{comments.length}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleShare}
                  className="flex items-center gap-2 text-gray-500"
                >
                  <Share2 className="w-5 h-5" />
                  <span>Share</span>
                </Button>
              </div>
              {user && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowReport(true)}
                  className="flex items-center gap-2 text-gray-500 hover:text-red-500"
                >
                  <Flag className="w-4 h-4" />
                  Report
                </Button>
              )}
            </div>
          </div>
        </article>

        <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-xl sm:text-2xl font-bold mb-6 text-gray-900 dark:text-white">
            Comments ({comments.length})
          </h2>

          {user ? (
            <div className="mb-6">
              <TagUserInput
                value={newComment}
                onChange={(value, userId) => {
                  setNewComment(value);
                  if (userId) setTaggedUserId(userId);
                }}
                placeholder="Add a comment... Type @ to mention someone"
                rows={3}
              />
              <div className="flex justify-end mt-2">
                <Button onClick={handleComment} disabled={!newComment.trim()}>
                  Post Comment
                </Button>
              </div>
            </div>
          ) : (
            <div className="mb-6 p-4 bg-gray-100 dark:bg-gray-700 rounded-lg text-center">
              <p className="text-gray-600 dark:text-gray-400">
                Please sign in to comment
              </p>
            </div>
          )}

          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg"
              >
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                    {comment.users?.display_name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {comment.users?.display_name}
                      </span>
                      <span className="text-sm text-gray-500">
                        @{comment.users?.username}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(comment.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-gray-700 dark:text-gray-300 break-words">
                      {comment.content}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {comments.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No comments yet. Be the first to comment!
              </p>
            )}
          </div>
        </div>
      </div>

      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          postId={post.id}
        />
      )}
    </div>
  );
};

export default PostDetailPage;
