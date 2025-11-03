import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { usePins } from '../../hooks/usePins';
import { supabase } from '../../lib/supabase';
import Button from '../../components/ui/Button/Button';
import Input from '../../components/ui/Input/Input';
import PostCard from '../../components/features/Posts/PostCard';
import type { Post } from '../../types';

const Profile: React.FC = () => {
  const { user } = useAuth();
  const { pins } = usePins();
  const [userPosts, setUserPosts] = useState<Post[]>([]);
  const [activeTab, setActiveTab] = useState<'posts' | 'pins'>('posts');
  const [editing, setEditing] = useState(false);
  const [profileData, setProfileData] = useState({ displayName: '', bio: '' });

  useEffect(() => {
    if (user) {
      fetchUserPosts();
      setProfileData({ displayName: user.display_name, bio: user.bio });
    }
  }, [user]);

  const fetchUserPosts = async () => {
    if (!user) return;
    const { data } = await supabase.from('posts').select('*').eq('author_id', user.id).order('created_at', { ascending: false });
    if (data) setUserPosts(data);
  };

  const updateProfile = async () => {
    if (!user) return;
    const { error } = await supabase.from('users').update({ 
      display_name: profileData.displayName, 
      bio: profileData.bio 
    }).eq('id', user.id);
    
    if (!error) setEditing(false);
  };

  if (!user) return <div className="text-center py-8">Please sign in to view profile</div>;

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
        <div className="flex items-center space-x-4 mb-4">
          <div className="w-20 h-20 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center text-2xl font-bold">
            {user.display_name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1">
            {editing ? (
              <div className="space-y-3">
                <Input value={profileData.displayName} onChange={(e) => setProfileData(prev => ({ ...prev, displayName: e.target.value }))} placeholder="Display Name" />
                <Input value={profileData.bio} onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))} placeholder="Bio" />
                <div className="flex space-x-2">
                  <Button onClick={updateProfile}>Save</Button>
                  <Button variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
                </div>
              </div>
            ) : (
              <>
                <h1 className="text-2xl font-bold">{user.display_name}</h1>
                <p className="text-gray-600 dark:text-gray-400">@{user.username}</p>
                <p className="mt-2">{user.bio || 'No bio yet'}</p>
                <Button onClick={() => setEditing(true)} className="mt-3">Edit Profile</Button>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
        <button onClick={() => setActiveTab('posts')} className={`px-4 py-2 font-medium ${activeTab === 'posts' ? 'border-b-2 border-gray-900 dark:border-gray-100' : 'text-gray-500'}`}>
          My Posts ({userPosts.length})
        </button>
        <button onClick={() => setActiveTab('pins')} className={`px-4 py-2 font-medium ${activeTab === 'pins' ? 'border-b-2 border-gray-900 dark:border-gray-100' : 'text-gray-500'}`}>
          Pinned Posts ({pins.length})
        </button>
      </div>

      <div className="space-y-6">
        {activeTab === 'posts' ? (
          userPosts.map(post => <PostCard key={post.id} post={post} />)
        ) : (
          pins.map(pin => pin.posts && <PostCard key={pin.id} post={pin.posts} />)
        )}
        
        {activeTab === 'posts' && userPosts.length === 0 && (
          <div className="text-center py-8 text-gray-500">No posts yet</div>
        )}
        
        {activeTab === 'pins' && pins.length === 0 && (
          <div className="text-center py-8 text-gray-500">No pinned posts</div>
        )}
      </div>
    </div>
  );
};

export default Profile;