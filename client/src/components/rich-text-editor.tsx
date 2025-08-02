import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  value: string;
  onChange: (content: string) => void;
  placeholder?: string;
  className?: string;
}

export default function RichTextEditor({
  value,
  onChange,
  placeholder = "Start writing your blog post...",
  className,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value;
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Handle basic formatting shortcuts
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'b':
          e.preventDefault();
          document.execCommand('bold');
          break;
        case 'i':
          e.preventDefault();
          document.execCommand('italic');
          break;
        case 'u':
          e.preventDefault();
          document.execCommand('underline');
          break;
      }
    }
  };

  return (
    <div className={cn("border border-gray-300 rounded-lg", className)}>
      {/* Toolbar */}
      <div className="border-b border-gray-200 p-2 flex items-center gap-2 bg-gray-50">
        <button
          type="button"
          onClick={() => document.execCommand('bold')}
          className="p-2 hover:bg-gray-200 rounded text-sm font-bold"
        >
          B
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('italic')}
          className="p-2 hover:bg-gray-200 rounded text-sm italic"
        >
          I
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('underline')}
          className="p-2 hover:bg-gray-200 rounded text-sm underline"
        >
          U
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          type="button"
          onClick={() => document.execCommand('formatBlock', false, 'h1')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
        >
          H1
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('formatBlock', false, 'h2')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
        >
          H2
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('formatBlock', false, 'p')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
        >
          P
        </button>
        <div className="w-px h-6 bg-gray-300 mx-2" />
        <button
          type="button"
          onClick={() => document.execCommand('insertUnorderedList')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
        >
          • List
        </button>
        <button
          type="button"
          onClick={() => document.execCommand('insertOrderedList')}
          className="p-2 hover:bg-gray-200 rounded text-sm"
        >
          1. List
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onKeyDown={handleKeyDown}
        className="min-h-[300px] p-4 focus:outline-none"
        data-placeholder={placeholder}
        style={{
          minHeight: '300px',
        }}
        suppressContentEditableWarning={true}
      />
      
      <style>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          font-style: italic;
        }
      `}</style>
    </div>
  );
}
