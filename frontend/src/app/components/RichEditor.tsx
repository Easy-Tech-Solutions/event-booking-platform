import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Link from '@tiptap/extension-link';
import Placeholder from '@tiptap/extension-placeholder';
import {
  Bold, Italic, Strikethrough, List, ListOrdered, Heading2, Heading3,
  Quote, Minus, Link as LinkIcon, Image as ImageIcon, Undo, Redo, Code,
} from 'lucide-react';
import apiClient from '../api/client';

interface RichEditorProps {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: number;
}

export function RichEditor({ value, onChange, placeholder = 'Start writing…', minHeight = 280 }: RichEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({ inline: false, allowBase64: false }),
      Link.configure({ openOnClick: false, autolink: true }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        class: 'prose prose-sm max-w-none focus:outline-none px-4 py-3',
        style: `min-height: ${minHeight}px`,
      },
    },
  });

  if (!editor) return null;

  const ToolBtn = ({
    onClick, active = false, title, children,
  }: { onClick: () => void; active?: boolean; title: string; children: React.ReactNode }) => (
    <button
      type="button"
      title={title}
      onClick={onClick}
      className={`p-1.5 rounded hover:bg-gray-100 transition-colors ${active ? 'bg-gray-200 text-gray-900' : 'text-gray-600'}`}
    >
      {children}
    </button>
  );

  const addLink = () => {
    const url = prompt('Enter URL:');
    if (url) editor.chain().focus().setLink({ href: url }).run();
  };

  const addImage = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      const fd = new FormData();
      fd.append('file', file);
      try {
        const res = await apiClient.post('/upload?folder=blog', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        editor.chain().focus().setImage({ src: res.data.url }).run();
      } catch {
        alert('Image upload failed.');
      }
    };
    input.click();
  };

  return (
    <div className="border rounded-lg overflow-hidden bg-white">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b bg-gray-50">
        <ToolBtn title="Bold" active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()}>
          <Bold className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Italic" active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()}>
          <Italic className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Strikethrough" active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()}>
          <Strikethrough className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Code" active={editor.isActive('code')} onClick={() => editor.chain().focus().toggleCode().run()}>
          <Code className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn title="Heading 2" active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}>
          <Heading2 className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Heading 3" active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}>
          <Heading3 className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn title="Bullet List" active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()}>
          <List className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Ordered List" active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()}>
          <ListOrdered className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Blockquote" active={editor.isActive('blockquote')} onClick={() => editor.chain().focus().toggleBlockquote().run()}>
          <Quote className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Divider" onClick={() => editor.chain().focus().setHorizontalRule().run()}>
          <Minus className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn title="Link" active={editor.isActive('link')} onClick={addLink}>
          <LinkIcon className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Insert Image" onClick={addImage}>
          <ImageIcon className="w-4 h-4" />
        </ToolBtn>

        <div className="w-px h-5 bg-gray-300 mx-1" />

        <ToolBtn title="Undo" onClick={() => editor.chain().focus().undo().run()}>
          <Undo className="w-4 h-4" />
        </ToolBtn>
        <ToolBtn title="Redo" onClick={() => editor.chain().focus().redo().run()}>
          <Redo className="w-4 h-4" />
        </ToolBtn>
      </div>

      {/* Editor area */}
      <EditorContent editor={editor} />

      <style>{`
        .tiptap p.is-editor-empty:first-child::before {
          content: attr(data-placeholder);
          float: left;
          color: #adb5bd;
          pointer-events: none;
          height: 0;
        }
        .tiptap img { max-width: 100%; height: auto; border-radius: 6px; margin: 8px 0; }
        .tiptap h2 { font-size: 1.25rem; font-weight: 700; margin: 1rem 0 0.5rem; }
        .tiptap h3 { font-size: 1.1rem; font-weight: 600; margin: 0.875rem 0 0.375rem; }
        .tiptap blockquote { border-left: 3px solid #004406; margin: 0.75rem 0; padding-left: 1rem; color: #555; }
        .tiptap hr { border: none; border-top: 1px solid #e5e7eb; margin: 1rem 0; }
        .tiptap ul { list-style-type: disc; padding-left: 1.5rem; }
        .tiptap ol { list-style-type: decimal; padding-left: 1.5rem; }
        .tiptap code { background: #f3f4f6; padding: 0.125rem 0.375rem; border-radius: 4px; font-size: 0.875em; }
        .tiptap a { color: #004406; text-decoration: underline; }
      `}</style>
    </div>
  );
}
