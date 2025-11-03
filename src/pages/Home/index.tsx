import React, { useState, useEffect } from 'react';
import { usePosts } from '../../hooks/usePosts';
import { CATEGORIES } from '../../constants/limits';
import PostCard from '../../components/features/Posts/PostCard';
import PostCreator from '../../components/features/Posts/PostCreator';
import Skeleton from '../../components/ui/Skeleton/Skeleton';
import Button from '../../components/ui/Button/Button';

const Home: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('for-you');
  const [searchQuery, setSearchQuery] = useState('');
  const { posts, loading, hasMore, loadMore, refresh } = usePosts(selectedCategory === 'for-you' ? undefined : selectedCategory, searchQuery);

  useEffect(() => {
    const handleSearchUpdate = (event: CustomEvent) => setSearchQuery(event.detail);
    const handlePostCreated = () => refresh();
    
    window.addEventListener('searchUpdate', handleSearchUpdate as EventListener);
    window.addEventListener('postCreated', handlePostCreated as EventListener);
    
    return () => {
      window.removeEventListener('searchUpdate', handleSearchUpdate as EventListener);
      window.removeEventListener('postCreated', handlePostCreated as EventListener);
    };
  }, [refresh]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-center mb-2 bg-gradient-to-r from-gray-900 to-gray-600 dark:from-gray-100 dark:to-gray-300 bg-clip-text text-transparent">Learnova X</h1>
          <p className="text-center text-gray-600 dark:text-gray-400 mb-8">be X nd Updated</p>
          
          <div className="flex overflow-x-auto space-x-2 pb-4 mb-6 scrollbar-hide">
            {['for-you', ...CATEGORIES].map(cat => (
              <Button
                key={cat}
                variant={selectedCategory === cat ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setSelectedCategory(cat)}
                className="whitespace-nowrap capitalize"
              >
                {cat.replace('-', ' ')}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {posts.map(post => (
            <PostCard key={post.id} post={post} />
          ))}
          
          {loading && Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="flex items-center space-x-3 mb-4">
                <Skeleton className="w-20 h-6 rounded-full" />
                <Skeleton className="w-24 h-4" />
              </div>
              <Skeleton className="w-full h-4 mb-2" />
              <Skeleton className="w-3/4 h-4 mb-4" />
              <Skeleton className="w-full h-48 rounded-lg mb-4" />
              <div className="flex space-x-4">
                <Skeleton className="w-16 h-6" />
                <Skeleton className="w-16 h-6" />
                <Skeleton className="w-16 h-6" />
              </div>
            </div>
          ))}
        </div>

        {hasMore && !loading && (
          <div className="text-center mt-8">
            <Button onClick={loadMore} variant="secondary">Load More</Button>
          </div>
        )}

        <PostCreator onPostCreated={refresh} />
      </div>
    </div>
  );
};

export default Home;