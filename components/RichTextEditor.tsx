'use client'

import { Editor } from '@tinymce/tinymce-react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Start typing...' }: RichTextEditorProps) {
  return (
    <Editor
      tinymceScriptSrc="/tinymce/tinymce.min.js"
      value={content}
      onEditorChange={onChange}
      init={{
        height: 200,
        base_url: '/tinymce',
        suffix: '.min',
        license_key: 'gpl' as any,
        menubar: false,
        plugins: 'lists',
        toolbar: 'bold italic underline | h2 h3 | bullist numlist | hr',
        setup: (editor) => {
          editor.ui.registry.addButton('h2', {
            text: 'H2',
            onAction: () => editor.execCommand('FormatBlock', false, 'h2')
          })
          editor.ui.registry.addButton('h3', {
            text: 'H3',
            onAction: () => editor.execCommand('FormatBlock', false, 'h3')
          })
        },
        skin: 'oxide',
        icons: 'default',
        skin_url: '/tinymce/skins/ui/oxide',
        icons_url: '/tinymce/icons/default/icons.min.js',
        content_css: '/tinymce/skins/content/default/content.min.css',
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; }',
        placeholder,
        branding: false,
        statusbar: false,
        promotion: false,
      }}
    />
  )
}
