import React, { useRef } from 'react';
import { Bold, Italic, List, ListOrdered, Heading1, Heading2 } from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({ value, onChange, placeholder }) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const formatText = (format: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    
    let newText = '';
    let cursorOffset = 0;

    switch (format) {
      case 'bold':
        newText = `**${selectedText}**`;
        cursorOffset = 2;
        break;
      case 'italic':
        newText = `*${selectedText}*`;
        cursorOffset = 1;
        break;
      case 'h1':
        newText = `# ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'h2':
        newText = `## ${selectedText}`;
        cursorOffset = 3;
        break;
      case 'ul':
        newText = `- ${selectedText}`;
        cursorOffset = 2;
        break;
      case 'ol':
        newText = `1. ${selectedText}`;
        cursorOffset = 3;
        break;
      default:
        return;
    }

    const before = value.substring(0, start);
    const after = value.substring(end);
    const updated = before + newText + after;
    
    onChange(updated);

    // Restore focus and selection
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + cursorOffset, start + cursorOffset + selectedText.length);
    }, 0);
  };

  return (
    <div className="border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
      <div className="flex items-center gap-1 p-2 bg-gray-50 dark:bg-gray-700 border-b border-gray-300 dark:border-gray-600">
        <button
          type="button"
          onClick={() => formatText('bold')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('italic')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('h1')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Heading 1"
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('h2')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('ul')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={() => formatText('ol')}
          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>
      </div>
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-3 py-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white resize-none focus:outline-none"
        rows={8}
      />
    </div>
  );
};

export default RichTextEditor;
