import React, { useState, useEffect } from 'react';
import { Send, Trash2, Edit2, User } from 'lucide-react';

export default function Comments({ postId, user, supabase, onCommentAdded }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState('');
  const [loading, setLoading] = useState(false);
  const [taggedUser, setTaggedUser] = useState('');
  const [searchUsers, setSearchUsers] = useState([]);
  const [showUserSearch, setShowUserSearch] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [postId]);

  useEffect(() => {
    if (commentText.includes('@')) {
      const lastAtIndex = commentText.lastIndexOf('@');
      const searchTerm = commentText.slice(lastAtIndex + 1);
      if (searchTerm.length > 0) {
        searchForUsers(searchTerm);
      } else {
        setShowUserSearch(false);
      }
    } else {
      setShowUserSearch(false);
    }
  }, [commentText]);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('comments')
        .select('*, users(id, username, display_name, avatar_url)')
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setComments(data || []);
    } catch (err) {
      console.error('Fetch comments error:', err);
    }
  };

  const searchForUsers = async (term) => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, username, display_name')
        .or(`username.ilike.%${term}%,display_name.ilike.%${term}%`)
        .limit(5);

      if (error) throw error;
      setSearchUsers(data || []);
      setShowUserSearch(data && data.length > 0);
    } catch (err) {
      console.error('User search error:', err);
    }
  };

  const selectUser = (selectedUser) => {
    const lastAtIndex = commentText.lastIndexOf('@');
    const newText = commentText.slice(0, lastAtIndex) + `@${selectedUser.username} `;
    setCommentText(newText);
    setTaggedUser(selectedUser.id);
    setShowUserSearch(false);
  };

  const handleAddComment = async () => {
    if (!user) {
      alert('You must be logged in to comment');
      return;
    }
    if (!commentText.trim()) return;

    setLoading(true);
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
        .select('*, users(id, username, display_name, avatar_url)')
        .single();

      if (error) throw error;

      setComments([...comments, data]);
      setCommentText('');
      setTaggedUser('');
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Add comment error:', err);
      alert('Failed to add comment');
    }
    setLoading(false);
  };

  const handleEditComment = async (commentId) => {
    if (!editText.trim()) return;

    try {
      const { error } = await supabase
        .from('comments')
        .update({ content: editText, updated_at: new Date().toISOString() })
        .eq('id', commentId);

      if (error) throw error;

      setComments(comments.map(c => c.id === commentId ? { ...c, content: editText } : c));
      setEditingId(null);
      setEditText('');
    } catch (err) {
      console.error('Edit comment error:', err);
      alert('Failed to edit comment');
    }
  };

  const handleDeleteComment = async (commentId) => {
    if (!window.confirm('Delete this comment?')) return;

    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId);

      if (error) throw error;

      setComments(comments.filter(c => c.id !== commentId));
      if (onCommentAdded) onCommentAdded();
    } catch (err) {
      console.error('Delete comment error:', err);
      alert('Failed to delete comment');
    }
  };

  const canEdit = (comment) => {
    if (!user || comment.user_id !== user.id) return false;
    if (!comment.can_edit_until) return false;
    return new Date(comment.can_edit_until) > new Date();
  };

  return (
    <div className="mt-6">
      <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">
        Comments ({comments.length})
      </h4>

      {user && (
        <div className="mb-6 relative">
          <div className="flex gap-2">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a comment... (use @ to tag users)"
              className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              rows="3"
            />
            <button
              onClick={handleAddComment}
              disabled={loading || !commentText.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed h-fit"
            >
              <Send size={20} />
            </button>
          </div>

          {showUserSearch && searchUsers.length > 0 && (
            <div className="absolute left-0 right-12 top-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 max-h-40 overflow-y-auto">
              {searchUsers.map(u => (
                <button
                  key={u.id}
                  onClick={() => selectUser(u)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 transition flex items-center gap-2"
                >
                  <User size={16} />
                  <span className="text-gray-900 dark:text-white">{u.display_name}</span>
                  <span className="text-gray-500 dark:text-gray-400 text-sm">@{u.username}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {!user && (
        <p className="text-gray-500 dark:text-gray-400 mb-6 text-sm">
          You must be logged in to comment
        </p>
      )}

      <div className="space-y-4">
        {comments.map(comment => (
          <div key={comment.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                {comment.users?.display_name?.charAt(0) || 'A'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium text-gray-900 dark:text-white text-sm">
                    {comment.users?.display_name || 'Anonymous'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(comment.created_at).toLocaleString()}
                  </p>
                </div>

                {editingId === comment.id ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      className="flex-1 p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={() => handleEditComment(comment.id)}
                      className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition text-sm"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditingId(null); setEditText(''); }}
                      className="px-3 py-1 bg-gray-300 hover:bg-gray-400 dark:bg-gray-600 dark:hover:bg-gray-500 text-gray-900 dark:text-white rounded transition text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-700 dark:text-gray-300 text-sm break-words">
                      {comment.content}
                    </p>

                    {user && (user.id === comment.user_id || user.role === 'admin') && (
                      <div className="flex gap-2 mt-2">
                        {canEdit(comment) && user.id === comment.user_id && (
                          <button
                            onClick={() => {
                              setEditingId(comment.id);
                              setEditText(comment.content);
                            }}
                            className="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition text-xs flex items-center gap-1"
                          >
                            <Edit2 size={12} />
                            Edit
                          </button>
                        )}

                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition text-xs flex items-center gap-1"
                        >
                          <Trash2 size={12} />
                          Delete
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {comments.length === 0 && (
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">
            No comments yet. Be the first to comment!
          </p>
        )}
      </div>
    </div>
  );
}
