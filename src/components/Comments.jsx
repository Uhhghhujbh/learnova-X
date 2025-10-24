import React, { useState, useEffect } from 'react';
import { Send, Trash2, Edit2, User, AlertCircle } from 'lucide-react';

export default function Comments({ postId, user, supabase, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [taggedUser, setTaggedUser] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    fetchComments();
    const interval = setInterval(fetchComments, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, [postId]);

  useEffect(() => {
    if (commentText.includes('@')) {
      const lastAtIndex = commentText.lastIndexOf('@');
      const searchTerm = commentText.slice(lastAtIndex + 1).trim();
      if (searchTerm.length > 1) {
        searchForUsers(searchTerm);
      } else {
        setShowUserSearch(false);
      }
    } else {
      setShowUserSearch(false);
    }
  }, [commentText]);

  // ========== FETCH COMMENTS ==========
  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, user:user_id(id, username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
      setError('');
    } catch (err) {
      console.error('Fetch comments error:', err);
      setError('Failed to load comments');
    }
  };

  // ========== SEARCH USERS ==========
  const searchForUsers = async (term) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(5);

      if (error) throw error;
      setSearchUsers(data || []);
      setShowUserSearch((data || []).length > 0);
    } catch (err) {
      console.error('Search users error:', err);
    }
  };

  // ========== SELECT TAGGED USER ==========
  const selectUser = (selectedUser) => {
    const lastAtIndex = commentText.lastIndexOf('@');
    const beforeAt = commentText.slice(0, lastAtIndex);
    const newText = beforeAt + `@${selectedUser.username} `;
    setCommentText(newText);
    setTaggedUser(selectedUser.id);
    setShowUserSearch(false);
  };

  // ========== ADD COMMENT ==========
  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!user) {
      setError('Please login to comment');
      return;
    }
    if (!commentText.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: commentText,
          tagged_user_id: taggedUser || null,
          can_edit_until: new Date(Date.now() + 15 * 60000).toISOString()
        })
        .select('*, user:user_id(id, username, display_name, avatar_url)')
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setCommentText('');
      setTaggedUser('');
      setError('');

      // Create notification if user was tagged
      if (taggedUser) {
        await supabase.from('notifications').insert({
          user_id: taggedUser,
          from_user_id: user.id,
          post_id: postId,
          comment_id: data.id,
          type: 'tag',
          message: `${user.display_name} tagged you in a comment`
        });
      }

      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Add comment error:', err);
      setError(err.message || 'Failed to add comment');
    }
    setLoading(false);
  };

  // ========== EDIT COMMENT ==========
  const handleEditComment = async (commentId) => {
    if (!editText.trim()) {
      setError('Comment cannot be empty');
      return;
    }

    try {
      const { error } = await supabase
        .from('comments')
        .update({
          content: editText,
          updated_at: new Date().toISOString()
        })
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setComments(comments.map(c => c.id === commentId ? { ...c, content: editText } : c));
      setEditingId(null);
      setEditText('');
      setError('');
    } catch (err) {
      console.error('Edit comment error:', err);
      setError('Failed to edit comment');
    }
  };

  // ========== DELETE COMMENT ==========
  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== commentId));
      setError('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Delete comment error:', err);
      setError('Failed to delete comment');
    }
  };

  // ========== CHECK EDIT PERMISSION ==========
  const canEdit = (comment) => {
    if (!user || comment.user_id !== user.id) return false;
    if (!comment.can_edit_until) return false;
    return new Date(comment.can_edit_until) > new Date();
  };

  return (
    <div className="mt-8 w-full">
      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Comments ({comments.length})
      </h4>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 dark:bg-red-900 border border-red-300 dark:border-red-700 rounded-lg flex items-start gap-2">
          <AlertCircle size={18} className="text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Comment Form */}
      {user ? (
        <form onSubmit={handleAddComment} className="mb-6 relative">
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment... (use @ to tag users)"
              maxLength={500}
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
            <button
              type="submit"
              disabled={loading || !commentText.trim()}
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 h-fit flex items-center gap-2 font-medium"
            >
              <Send size={18} />
              {loading ? 'Posting...' : 'Post'}
            </button>
          </div>
          <p className="text-xs text-gray-500 mt-2">{commentText.length}/500</p>

          {/* User Search Dropdown */}
          {showUserSearch && searchUsers.length > 0 && (
            <div className="absolute left-0 right-16 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              {searchUsers.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => selectUser(u)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center gap-2 text-sm"
                >
                  <User size={14} />
                  <div>
                    <p className="text-gray-900 dark:text-white font-medium">{u.display_name}</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">@{u.username}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </form>
      ) : (
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm bg-gray-50 dark:bg-gray-700 p-3 rounded-lg">
          Please login to comment
        </p>
      )}

      {/* Comments List */}
      <div className="space-y-4">
        {comments.length === 0 ? (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8 text-sm">
            No comments yet. Be the first!
          </p>
        ) : (
          comments.map(comment => (
            <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
              <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                  {comment.user?.display_name?.charAt(0) || 'U'}
                </div>

                {/* Comment Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-semibold text-gray-900 dark:text-white text-sm">
                      {comment.user?.display_name || 'Anonymous'}
                    </p>
                    <p className="text-xs text-gray-500">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Edit Mode */}
                  {editingId === comment.id ? (
                    <div className="flex gap-2 mt-2">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                        rows="2"
                      />
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleEditComment(comment.id)}
                          className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => { setEditingId(null); setEditText(''); }}
                          className="px-3 py-1 bg-gray-400 hover:bg-gray-500 dark:bg-gray-600 dark:hover:bg-gray-500 text-white rounded text-xs font-medium transition"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Comment Text */}
                      <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                        {comment.content}
                      </p>

                      {/* Action Buttons */}
                      {user && (user.id === comment.user_id) && (
                        <div className="flex gap-3 mt-2">
                          {canEdit(comment) && (
                            <button
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditText(comment.content);
                              }}
                              className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition text-xs flex items-center gap-1"
                            >
                              <Edit2 size={14} />
                              Edit
                            </button>
                          )}

                          <button
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition text-xs flex items-center gap-1"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
