import React from 'react';
import { ThumbsUp, MessageCircle, Share2, Eye, TrendingUp, Pin } from 'lucide-react';

export default function PostCard({ post, onLike, onShare, onClick }) {
  const stripHtml = (html) => {
    const tmp = document.createElement('div');
    tmp.innerHTML = html;
    return tmp.textContent || tmp.innerText || '';
  };

  const excerpt = post.excerpt || stripHtml(post.content).slice(0, 150) + '...';

  return (
    <div
      onClick={onClick}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition cursor-pointer overflow-hidden"
    >
      {post.image_urls && post.image_urls.length > 0 && (
        <img
          src={post.image_urls[0]}
          alt={post.title}
          className="w-full h-48 object-cover"
        />
      )}

      <div className="p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
            {post.users?.display_name?.charAt(0) || 'A'}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {post.users?.display_name || 'Anonymous'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {new Date(post.created_at).toLocaleDateString()}
            </p>
          </div>
          {post.is_trending && (
            <div className="flex items-center gap-1 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300 px-2 py-1 rounded-full text-xs font-medium">
              <TrendingUp size={12} />
            </div>
          )}
          {post.is_pinned && (
            <div className="flex items-center gap-1 bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
              <Pin size={12} />
            </div>
          )}
        </div>

        <span className="inline-block px-2 py-1 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded mb-2">
          {post.category}
        </span>

        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {post.title}
        </h3>

        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
          {excerpt}
        </p>

        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onLike(post.id);
            }}
            className="flex items-center gap-1 hover:text-blue-600 dark:hover:text-blue-400 transition"
          >
            <ThumbsUp size={16} />
            <span>{post.likes_count}</span>
          </button>

          <div className="flex items-center gap-1">
            <MessageCircle size={16} />
            <span>{post.comments_count}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onShare(post);
            }}
            className="flex items-center gap-1 hover:text-green-600 dark:hover:text-green-400 transition"
          >
            <Share2 size={16} />
            <span>{post.shares_count}</span>
          </button>

          <div className="flex items-center gap-1 ml-auto">
            <Eye size={16} />
            <span>{post.views_count}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
