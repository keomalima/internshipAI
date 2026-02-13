'use client';

import { useEditor, EditorContent } from '@tiptap/react';
import { useEffect } from 'react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import { Bold, Italic, Underline as UnderlineIcon, List, ListOrdered } from 'lucide-react';
import { Toggle } from '@/components/ui/toggle';

interface RichTextEditorProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
}

export default function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
    const editor = useEditor({
        extensions: [
            StarterKit,
            Underline,
        ],
        editorProps: {
            attributes: {
                // Added list-disc, list-decimal, and padding to ensure lists are visible
                class: 'min-h-[200px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 prose prose-sm max-w-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5',
            },
        },
        onUpdate: ({ editor }) => {
            onChange(editor.getHTML());
        },
        // We set initial content here. 
        // We do NOT put 'value' in the dependency array of useEditor, 
        // relying on the useEffect below for updates.
        content: value, 
        immediatelyRender: false, 
    });

    // Robust sync to prevent cursor jumping
    useEffect(() => {
        if (!editor) return;

        const currentContent = editor.getHTML();
        
        // Tiptap represents empty content as '<p></p>'
        // If your database/state has '', we treat them as equal to avoid a reset.
        const isSameContent = currentContent === value || (currentContent === '<p></p>' && value === '');

        if (!isSameContent) {
            // Only update if the content is truly different.
            // This preserves the cursor position during normal typing.
            editor.commands.setContent(value);
        }
    }, [value, editor]);

    if (!editor) {
        return null;
    }

    return (
        <div className="border rounded-md bg-white">
            <div className="flex items-center gap-1 border-b p-1 bg-muted/50">
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bold')}
                    onPressedChange={() => editor.chain().focus().toggleBold().run()}
                    aria-label="Bold"
                >
                    <Bold className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('italic')}
                    onPressedChange={() => editor.chain().focus().toggleItalic().run()}
                    aria-label="Italic"
                >
                    <Italic className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('underline')}
                    onPressedChange={() => editor.chain().focus().toggleUnderline().run()}
                    aria-label="Underline"
                >
                    <UnderlineIcon className="h-4 w-4" />
                </Toggle>
                <div className="w-px h-4 bg-border mx-1" />
                <Toggle
                    size="sm"
                    pressed={editor.isActive('bulletList')}
                    onPressedChange={() => editor.chain().focus().toggleBulletList().run()}
                    aria-label="Bullet List"
                >
                    <List className="h-4 w-4" />
                </Toggle>
                <Toggle
                    size="sm"
                    pressed={editor.isActive('orderedList')}
                    onPressedChange={() => editor.chain().focus().toggleOrderedList().run()}
                    aria-label="Ordered List"
                >
                    <ListOrdered className="h-4 w-4" />
                </Toggle>
            </div>
            <EditorContent editor={editor} className="p-2" data-placeholder={placeholder || ""} />
        </div>
    );
}
