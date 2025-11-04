import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { usePins } from '../../../hooks/usePins';
import { Heart, MessageCircle, Share2, Pin, MoreHorizontal, ExternalLink } from 'lucide-react';
import { supabase } from '../../../lib/supabase';
import type { Post } from '../../../types';
import ReportModal from './ReportModal';
import { Flag } from 'lucide-react';
import { sanitizeHTML } from '../../../lib/utils/security';
import Button from '../../ui/Button/Button';
import Modal from '../../ui/Modal/Modal';
import Toast from '../../ui/Toast/Toast';
import TagUserInput from '../../ui/TagUserInput';

export const PostCard: React.FC<{ post: Post }> = ({ post }) => {
  const { user } = useAuth();
  const { togglePin, pins } = usePins();
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const isPinned = pins.some(p => p.post_id === post.id);

  useEffect(() => {
    const checkLikeStatus = async () => {
      if (!user) return;
      const { data } = await supabase.from('likes').select('id').eq('post_id', post.id).eq('user_id', user.id).single();
      setIsLiked(!!data);
    };
    checkLikeStatus();
  }, [user, post.id]);

  const handleLike = async () => {
    if (!user) { setToast({ message: 'Please sign in to like posts', type: 'error' }); return; }
    if (isLiked) {
      const { error } = await supabase.from('likes').delete().eq('post_id', post.id).eq('user_id', user.id);
      if (!error) { setIsLiked(false); setLikesCount(prev => prev - 1); }
    } else {
      const { error } = await supabase.from('likes').insert([{ post_id: post.id, user_id: user.id }]);
      if (!error) { setIsLiked(true); setLikesCount(prev => prev + 1); }
    }
  };

  const handlePin = async () => {
    const { success, error } = await togglePin(post.id);
    if (success) setToast({ message: isPinned ? 'Post unpinned' : 'Post pinned', type: 'success' });
    else setToast({ message: error || 'Pin failed', type: 'error' });
  };

  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.origin}/post/${post.id}`);
    setToast({ message: 'Link copied to clipboard', type: 'success' });
    setShowShare(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-4 transition-all hover:shadow-md">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm font-medium capitalize">{post.category}</span>
          <span className="text-sm text-gray-500 dark:text-gray-400">{new Date(post.created_at).toLocaleDateString()}</span>
        </div>
        <div className="relative">
          <Button variant="ghost" size="sm" onClick={() => setShowMenu(!showMenu)}><MoreHorizontal className="w-4 h-4" /></Button>
          {showMenu && (<div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-10">
            <button onClick={handlePin} className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">{isPinned ? 'Unpin' : 'Pin'} Post</button>
            {user?.id === post.author_id && (<button className="flex items-center w-full px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700">Edit Post</button>)}
          </div>)}
        </div>
      </div>

      <div className="mb-4" dangerouslySetInnerHTML={{ __html: sanitizeHTML(post.content) }} />

      {post.image_urls && post.image_urls.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-4">
          {post.image_urls.map((url, index) => (
            <img key={index} src={url} alt={`Post image ${index + 1}`} loading="lazy" className="rounded-lg w-full h-48 object-cover" />
          ))}
        </div>
      )}

      {post.metadata && (
        <div className="mb-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700/50">
          <div className="flex items-start space-x-3">
            {post.metadata.image && <img src={post.metadata.image} alt="Link preview" className="w-16 h-16 object-cover rounded" />}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{post.metadata.title}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{post.metadata.description}</p>
              <div className="flex items-center mt-2">
                <ExternalLink className="w-3 h-3 mr-1 text-gray-400" />
                <span className="text-xs text-gray-400 truncate">{new URL(post.metadata.url).hostname}</span>
              </div>
            </div>
          </div>
        </div>
      )}

     <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700 flex-wrap gap-2">
  <div className="flex items-center space-x-3 sm:space-x-4">
    <Button variant="ghost" size="sm" onClick={handleLike} className={`flex items-center space-x-1 sm:space-x-2 ${isLiked ? 'text-red-500' : 'text-gray-500'}`}>
      <Heart className={`w-4 h-4 sm:w-5 sm:h-5 ${isLiked ? 'fill-current' : ''}`} />
      <span className="text-sm sm:text-base">{likesCount}</span>
    </Button>
    <Button variant="ghost" size="sm" onClick={() => setShowComments(true)} className="flex items-center space-x-1 sm:space-x-2 text-gray-500">
      <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-sm sm:text-base">{post.comments_count}</span>
    </Button>
    <Button variant="ghost" size="sm" onClick={() => setShowShare(true)} className="flex items-center space-x-1 sm:space-x-2 text-gray-500">
      <Share2 className="w-4 h-4 sm:w-5 sm:h-5" />
      <span className="text-sm sm:text-base">{post.shares_count}</span>
    </Button>
  </div>
  <div className="flex items-center gap-2">
    {user && (
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setShowReport(true)}
        className="flex items-center gap-1 text-gray-500 hover:text-red-500"
      >
        <Flag className="w-4 h-4" />
        <span className="hidden sm:inline text-sm">Report</span>
      </Button>
    )}
    {isPinned && <Pin className="w-4 h-4 text-blue-500 fill-current" />}
  </div>
</div>

      {showComments && <CommentsModal postId={post.id} onClose={() => setShowComments(false)} />}
      {showShare && <ShareModal onClose={() => setShowShare(false)} onShare={handleShare} />}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      {showReport && (
        <ReportModal
          isOpen={showReport}
          onClose={() => setShowReport(false)}
          postId={post.id}
        />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

const CommentsModal: React.FC<{ postId: string; onClose: () => void }> = ({ postId, onClose }) => {
  const [comments, setComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState('');
  const [taggedUserId, setTaggedUserId] = useState<string | undefined>();
  const { user } = useAuth();

  useEffect(() => {
    fetchComments();
    const subscription = supabase.channel(`comments-${postId}`).on('postgres_changes', { event: '*', schema: 'public', table: 'comments', filter: `post_id=eq.${postId}` }, fetchComments).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [postId]);

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*, users:user_id(display_name, username, avatar_url)').eq('post_id', postId).order('created_at', { ascending: true });
    if (data) setComments(data);
  };

  const addComment = async () => {
    if (!user || !newComment.trim()) return;
    const { error } = await supabase.from('comments').insert([{ 
      post_id: postId, 
      user_id: user.id, 
      content: newComment,
      tagged_user_id: taggedUserId || null,
      can_edit_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
    }]);
    if (!error) {
      setNewComment('');
      setTaggedUserId(undefined);
    }
  };

  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Comments</h3>
        <div className="space-y-4 max-h-96 overflow-y-auto">
          {comments.map(comment => (
            <div key={comment.id} className="flex space-x-3">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <span className="font-medium text-sm">{comment.users?.display_name}</span>
                  <span className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                </div>
                <p className="text-sm mt-1">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
        {user ? (
          <div className="mt-4">
            <TagUserInput
              value={newComment}
              onChange={(value, userId) => {
                setNewComment(value);
                if (userId) setTaggedUserId(userId);
              }}
              placeholder="Add a comment... Type @ to mention someone"
              rows={2}
            />
            <div className="flex justify-end mt-2">
              <Button onClick={addComment} disabled={!newComment.trim()}>Post</Button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500 mt-4">Please sign in to comment</p>
        )}
      </div>
    </Modal>
  );
};
const ShareModal: React.FC<{ onClose: () => void; onShare: () => void }> = ({ onClose, onShare }) => {
  return (
    <Modal isOpen={true} onClose={onClose}>
      <div className="p-6">
        <h3 className="text-lg font-semibold mb-4">Share Post</h3>
        <div className="space-y-3">
          <button onClick={onShare} className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">Copy Link</button>
          <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">Share to Twitter</button>
          <button className="w-full text-left p-3 border border-gray-200 rounded-lg hover:bg-gray-50">Share to Facebook</button>
        </div>
      </div>
    </Modal>
  );
};

export default PostCard;
