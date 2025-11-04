import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { AtSign } from 'lucide-react';

interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string;
}

interface TagUserInputProps {
  value: string;
  onChange: (value: string, taggedUserId?: string) => void;
  onTagUser?: (userId: string) => void;
  placeholder?: string;
  rows?: number;
  className?: string;
}

export const TagUserInput: React.FC<TagUserInputProps> = ({
  value,
  onChange,
  onTagUser,
  placeholder = 'Write a comment... Type @ to mention someone',
  rows = 3,
  className = ''
}) => {
  const [showUserList, setShowUserList] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        textareaRef.current &&
        !textareaRef.current.contains(event.target as Node)
      ) {
        setShowUserList(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchUsers = async () => {
    const { data } = await supabase
      .from('users')
      .select('id, username, display_name, avatar_url')
      .eq('banned', false)
      .limit(50);
    
    if (data) setUsers(data);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    const cursor = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(cursor);

    const textBeforeCursor = newValue.slice(0, cursor);
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
    
    if (atSymbolIndex !== -1) {
      const searchQuery = textBeforeCursor.slice(atSymbolIndex + 1);
      const charBeforeAt = atSymbolIndex === 0 ? ' ' : textBeforeCursor[atSymbolIndex - 1];
      
      if (charBeforeAt === ' ' || atSymbolIndex === 0) {
        setSearchTerm(searchQuery);
        
        if (searchQuery.length === 0) {
          setFilteredUsers(users.slice(0, 5));
          setShowUserList(true);
        } else {
          const filtered = users.filter(user =>
            user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.display_name.toLowerCase().includes(searchQuery.toLowerCase())
          ).slice(0, 5);
          
          setFilteredUsers(filtered);
          setShowUserList(filtered.length > 0);
        }
        setSelectedIndex(0);
      } else {
        setShowUserList(false);
      }
    } else {
      setShowUserList(false);
    }
  };

  const insertMention = (user: User) => {
    const textBeforeCursor = value.slice(0, cursorPosition);
    const textAfterCursor = value.slice(cursorPosition);
    const atSymbolIndex = textBeforeCursor.lastIndexOf('@');
    
    const beforeAt = value.slice(0, atSymbolIndex);
    const mention = `@${user.username} `;
    const newValue = beforeAt + mention + textAfterCursor;
    
    onChange(newValue, user.id);
    if (onTagUser) onTagUser(user.id);
    
    setShowUserList(false);
    
    setTimeout(() => {
      if (textareaRef.current) {
        const newCursorPos = beforeAt.length + mention.length;
        textareaRef.current.focus();
        textareaRef.current.setSelectionRange(newCursorPos, newCursorPos);
      }
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!showUserList) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => (prev + 1) % filteredUsers.length);
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => (prev - 1 + filteredUsers.length) % filteredUsers.length);
        break;
      case 'Enter':
        if (filteredUsers.length > 0) {
          e.preventDefault();
          insertMention(filteredUsers[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowUserList(false);
        break;
    }
  };

  return (
    <div className="relative w-full">
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          rows={rows}
          className={`w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none ${className}`}
        />
        <div className="absolute bottom-3 right-3 text-gray-400 pointer-events-none">
          <AtSign className="w-5 h-5" />
        </div>
      </div>

      {showUserList && filteredUsers.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute z-50 w-full mt-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto"
        >
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <AtSign className="w-3 h-3" />
              Mention a user
            </p>
          </div>
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => insertMention(user)}
              className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                index === selectedIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold">
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt={user.display_name}
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  user.display_name[0]?.toUpperCase()
                )}
              </div>
              <div className="flex-1 text-left min-w-0">
                <p className="font-medium text-gray-900 dark:text-white truncate">
                  {user.display_name}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                  @{user.username}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
        <AtSign className="w-3 h-3" />
        Type @ to mention someone
      </p>
    </div>
  );
};

export default TagUserInput;
