import React, { useState, useRef } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { X, Upload, Link, Plus } from 'lucide-react';
import { CATEGORIES } from '../../../constants/limits';
import { supabase } from '../../../lib/supabase';
import { validateFile, sanitizeHTML } from '../../../lib/utils/security';
import { fetchMetadata } from '../../../lib/utils/metadata';
import Button from '../../ui/Button/Button';
import Modal from '../../ui/Modal/Modal';
import Toast from '../../ui/Toast/Toast';
import RichTextEditor from '../../ui/RichTextEditor';

export const PostCreator: React.FC<{ onPostCreated: () => void }> = ({ onPostCreated }) => {
  const { user, isAdmin } = useAuth();
  
  if (!isAdmin) return null;

  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [linkUrl, setLinkUrl] = useState('');
  const [metadata, setMetadata] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (files: FileList) => {
    const newImages: File[] = [];
    const newPreviews: string[] = [];
    
    Array.from(files).slice(0, 3 - images.length).forEach(file => {
      const validation = validateFile(file);
      if (!validation.valid) {
        setToast({ message: validation.error!, type: 'error' });
        return;
      }
      newImages.push(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        newPreviews.push(e.target?.result as string);
        setImagePreviews(prev => [...prev, ...newPreviews]);
      };
      reader.readAsDataURL(file);
    });
    
    setImages(prev => [...prev, ...newImages]);
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const fetchLinkMetadata = async () => {
    if (!linkUrl) return;
    setLoading(true);
    const data = await fetchMetadata(linkUrl);
    setMetadata(data);
    setLoading(false);
  };

  const createPost = async () => {
    if (!user || !title.trim() || !content.trim() || !category) {
      setToast({ message: 'Please fill all required fields', type: 'error' });
      return;
    }

    setLoading(true);
    let imageUrls: string[] = [];

    try {
      // Upload images
      for (const image of images) {
        const fileName = `${user.id}/${Date.now()}-${image.name}`;
        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, image);
        
        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('post-images')
            .getPublicUrl(fileName);
          imageUrls.push(urlData.publicUrl);
        }
      }

      // Create post
      const postData = {
        author_id: user.id,
        title: title.trim(),
        content: sanitizeHTML(content),
        excerpt: content.replace(/<[^>]*>/g, '').slice(0, 150) + (content.length > 150 ? '...' : ''),
        category,
        image_urls: imageUrls,
        metadata: metadata || null,
        can_edit_until: new Date(Date.now() + 15 * 60 * 1000).toISOString()
      };

      const { error } = await supabase.from('posts').insert([postData]);
      
      if (!error) {
        setToast({ message: 'Post created successfully', type: 'success' });
        setIsOpen(false);
        resetForm();
        onPostCreated();
      } else {
        setToast({ message: 'Failed to create post', type: 'error' });
      }
    } catch (error) {
      setToast({ message: 'Error creating post', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('');
    setImages([]);
    setImagePreviews([]);
    setLinkUrl('');
    setMetadata(null);
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-8 right-8 rounded-full w-14 h-14 shadow-lg z-30 flex items-center justify-center"
      >
        <Plus className="w-6 h-6" />
      </Button>
      
      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)}>
        <div className="p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <h2 className="text-2xl font-bold mb-6">Create Post</h2>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Title *</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Enter post title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">Select category</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Content *</label>
              <RichTextEditor
                value={content}
                onChange={setContent}
                placeholder="Write your post content..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Add Link</label>
              <div className="flex space-x-2">
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://example.com"
                  className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                <Button onClick={fetchLinkMetadata} loading={loading}>
                  <Link className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {metadata && (
              <div className="p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-700">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-medium">{metadata.title}</p>
                  <button onClick={() => setMetadata(null)}>
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{metadata.description}</p>
                {metadata.image && (
                  <img src={metadata.image} alt="Preview" className="w-full h-32 object-cover rounded" />
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Images ({images.length}/3)</label>
              <input
                type="file"
                ref={fileInputRef}
                multiple
                accept="image/*"
                onChange={(e) => e.target.files && handleImageUpload(e.target.files)}
                className="hidden"
              />
              
              <div className="grid grid-cols-3 gap-2 mb-2">
                {imagePreviews.map((preview, index) => (
                  <div key={index} className="relative">
                    <img src={preview} alt={`Preview ${index}`} className="w-full h-24 object-cover rounded" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-24 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg flex items-center justify-center hover:border-gray-400"
                  >
                    <Upload className="w-6 h-6 text-gray-400" />
                  </button>
                )}
              </div>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button variant="secondary" onClick={() => setIsOpen(false)}>
                Cancel
              </Button>
              <Button onClick={createPost} loading={loading}>
                Create Post
              </Button>
            </div>
          </div>
        </div>
      </Modal>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </>
  );
};

export default PostCreator;
