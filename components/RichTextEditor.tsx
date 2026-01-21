'use client'

import dynamic from 'next/dynamic'

const Editor = dynamic(
  () => import('@tinymce/tinymce-react').then(m => m.Editor),
  { ssr: false }
)

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
        menubar: false,
        plugins: 'lists',
        toolbar: 'bold italic underline | h2 h3 | bullist numlist | hr',
        placeholder,
        content_style: 'body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; font-size: 14px; }',
        branding: false,
        statusbar: false,
        promotion: false,
        license_key: 'gpl',
      }}
    />
  )
}
