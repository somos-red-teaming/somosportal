'use client'

import { useEffect, useRef } from 'react'

interface RichTextEditorProps {
  content: string
  onChange: (content: string) => void
  placeholder?: string
}

export function RichTextEditor({ content, onChange, placeholder = 'Start typing...' }: RichTextEditorProps) {
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const initializedRef = useRef(false)

  useEffect(() => {
    if (initializedRef.current || !editorRef.current) return

    const loadTinyMCE = async () => {
      // @ts-ignore
      if (window.tinymce) {
        // @ts-ignore
        window.tinymce.remove()
      }

      const script = document.createElement('script')
      script.src = '/tinymce/tinymce.min.js'
      script.onload = () => {
        // @ts-ignore
        window.tinymce.init({
          target: editorRef.current,
          height: 200,
          menubar: false,
          plugins: 'lists',
          toolbar: 'bold italic underline | h2 h3 | bullist numlist | hr',
          placeholder,
          branding: false,
          statusbar: false,
          promotion: false,
          license_key: 'gpl',
          setup: (editor: any) => {
            editor.ui.registry.addButton('h2', {
              text: 'H2',
              onAction: () => editor.execCommand('FormatBlock', false, 'h2')
            })
            editor.ui.registry.addButton('h3', {
              text: 'H3',
              onAction: () => editor.execCommand('FormatBlock', false, 'h3')
            })
            editor.on('change keyup', () => {
              onChange(editor.getContent())
            })
          },
          init_instance_callback: (editor: any) => {
            editor.setContent(content)
          }
        })
      }
      document.head.appendChild(script)
      initializedRef.current = true
    }

    loadTinyMCE()

    return () => {
      // @ts-ignore
      if (window.tinymce) {
        // @ts-ignore
        window.tinymce.remove()
      }
    }
  }, [])

  useEffect(() => {
    // @ts-ignore
    const editor = window.tinymce?.activeEditor
    if (editor && editor.getContent() !== content) {
      editor.setContent(content)
    }
  }, [content])

  return <textarea ref={editorRef} defaultValue={content} />
}
