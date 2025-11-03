import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button/Button';
import Modal from '../../components/ui/Modal/Modal';
import type { Post, User, Comment } from '../../types';

const Admin: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [posts, setPosts] = useState<Post[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [activeTab, setActiveTab] = useState<'users' | 'posts' | 'comments'>('users');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPosts();
      fetchComments();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    const { data } = await supabase.from('users').select('*').order('created_at', { ascending: false });
    if (data) setUsers(data);
  };

  const fetchPosts = async () => {
    const { data } = await supabase.from('posts').select('*').order('created_at', { ascending: false });
    if (data) setPosts(data);
  };

  const fetchComments = async () => {
    const { data } = await supabase.from('comments').select('*, users:user_id(display_name, username)').order('created_at', { ascending: false });
    if (data) setComments(data);
  };

  const toggleUserBan = async (userId: string, currentlyBanned: boolean) => {
    const { error } = await supabase.from('users').update({ banned: !currentlyBanned }).eq('id', userId);
    if (!error) fetchUsers();
  };

  const togglePostTrending = async (postId: string, currentlyTrending: boolean) => {
    const { error } = await supabase.from('posts').update({ is_trending: !currentlyTrending }).eq('id', postId);
    if (!error) fetchPosts();
  };

  const deleteComment = async (commentId: string) => {
    const { error } = await supabase.from('comments').delete().eq('id', commentId);
    if (!error) fetchComments();
  };

  if (!isAdmin) return <div className="text-center py-8">Admin access required</div>;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('users')} className={`px-4 py-2 font-medium ${activeTab === 'users' ? 'border-b-2 border-gray-900 dark:border-gray-100' : 'text-gray-500'}`}>
          Users ({users.length})
        </button>
        <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 font-medium ${activeTab === 'posts' ? 'border-b-2 border-gray-900 dark:border-gray-100' : 'text-gray-500'}`}>
          Posts ({posts.length})
        </button>
        <button onClick={() => setActiveTab('comments')} className={`px-4 py-2 font-medium ${activeTab === 'comments' ? 'border-b-2 border-gray-900 dark:border-gray-100' : 'text-gray-500'}`}>
          Comments ({comments.length})
        </button>
      </div>

      {activeTab === 'users' && (
        <div className="space-y-4">
          {users.map(user => (
            <div key={user.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold">{user.display_name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">@{user.username} • {user.email}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className={`px-2 py-1 text-xs rounded-full ${user.role === 'admin' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                      {user.role}
                    </span>
                    {user.banned && <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Banned</span>}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <Button variant="secondary" size="sm" onClick={() => setSelectedUser(user)}>View</Button>
                  <Button variant={user.banned ? 'primary' : 'secondary'} size="sm" onClick={() => toggleUserBan(user.id, user.banned)}>
                    {user.banned ? 'Unban' : 'Ban'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'posts' && (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {post.category} • {new Date(post.created_at).toLocaleDateString()} • 
                    Likes: {post.likes_count} • Comments: {post.comments_count}
                  </p>
                </div>
                <div className="flex space-x-2 ml-4">
                  <Button variant={post.is_trending ? 'primary' : 'secondary'} size="sm" onClick={() => togglePostTrending(post.id, post.is_trending)}>
                    {post.is_trending ? 'Remove Trending' : 'Make Trending'}
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'comments' && (
        <div className="space-y-4">
          {comments.map(comment => (
            <div key={comment.id} className="bg-white dark:bg-gray-800 rounded-lg shadow border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium">{comment.users?.display_name}</span>
                    <span className="text-sm text-gray-500">{new Date(comment.created_at).toLocaleDateString()}</span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{comment.content}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => deleteComment(comment.id)} className="ml-4">Delete</Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedUser && (
        <Modal isOpen={!!selectedUser} onClose={() => setSelectedUser(null)}>
          <div className="p-6">
            <h2 className="text-xl font-bold mb-4">User Details</h2>
            {selectedUser && (
              <div className="space-y-3">
                <p><strong>Name:</strong> {selectedUser.display_name}</p>
                <p><strong>Username:</strong> @{selectedUser.username}</p>
                <p><strong>Email:</strong> {selectedUser.email}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.banned ? 'Banned' : 'Active'}</p>
                <p><strong>Joined:</strong> {new Date(selectedUser.created_at).toLocaleDateString()}</p>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Admin;