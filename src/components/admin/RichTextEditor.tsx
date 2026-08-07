// Editor de texto rico del admin, sobre TipTap.
//
// Lo usan los paneles Blog y PaginasLegales. Vivía en AdminPage.tsx y esos
// paneles lo importaban de vuelta desde ahí, lo que creaba un ciclo de
// imports; por eso se mueve a su propio módulo.
//
// `TBtn` es el botón de la barra de herramientas. Solo lo usa este archivo,
// así que no se exporta: viaja con el editor y no forma parte de su API.
//
// Ambos a nivel de módulo. Ver la nota en `layout.tsx`.

import { AlignCenter, AlignLeft, AlignRight, Image as ImageIcon, Link as LinkIcon, Link2Off, List, Minus, Quote, Redo2, Undo2 } from 'lucide-react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import TextAlign from '@tiptap/extension-text-align'
import { TextStyle } from '@tiptap/extension-text-style'
import Color from '@tiptap/extension-color'
import { Image } from '@tiptap/extension-image'

function TBtn({ onClick, active, title, children }: {
  onClick: () => void; active?: boolean; title?: string; children: React.ReactNode
}) {
  return (
    <button className={`text-sdm-sm ${active ? 'bg-[var(--navy-dark)] text-white font-bold' : 'bg-transparent text-[var(--muted)] font-normal hover:bg-[var(--border)]'}`}
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      style={{ padding: '4px 8px', borderRadius: 3, border: 'none', cursor: 'pointer',
        fontFamily: 'inherit', lineHeight: 1,
        transition: 'all 0.1s' }}
    >
      {children}
    </button>
  )
}

export function RichTextEditor({ value, onChange }: { value: string; onChange: (html: string) => void }) {
  const editor = useEditor({
    extensions: [
      // StarterKit 3.x ya trae link y underline. Registrarlos aparte los duplica
      // y TipTap avisa por consola; Link se configura desde el propio StarterKit.
      StarterKit.configure({
        link: { openOnClick: false, HTMLAttributes: { target: '_blank', rel: 'noopener noreferrer' } },
      }),
      TextStyle,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Image.configure({ inline: false, allowBase64: false }),
    ],
    content: value || '',
    onUpdate: ({ editor }) => onChange(editor.getHTML()),
    editorProps: {
      attributes: {
        style: [
          'min-height: 320px',
          'padding: 16px',
          'outline: none',
          'font-size: 15px',
          'line-height: 1.8',
          'color: var(--ink)',
          'font-weight: 300',
        ].join(';'),
      },
    },
  })

  if (!editor) return null

  const addLink = () => {
    const url = window.prompt('URL del enlace:')
    if (!url) return
    editor.chain().focus().setLink({ href: url }).run()
  }

  const addImage = () => {
    const url = window.prompt('URL de la imagen:')
    if (!url) return
    editor.chain().focus().setImage({ src: url }).run()
  }

  const groups = [
    [
      <TBtn key="h2" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} active={editor.isActive('heading', { level: 2 })} title="Título H2">H2</TBtn>,
      <TBtn key="h3" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} active={editor.isActive('heading', { level: 3 })} title="Título H3">H3</TBtn>,
    ],
    [
      <TBtn key="b" onClick={() => editor.chain().focus().toggleBold().run()} active={editor.isActive('bold')} title="Negrita"><strong>B</strong></TBtn>,
      <TBtn key="i" onClick={() => editor.chain().focus().toggleItalic().run()} active={editor.isActive('italic')} title="Cursiva"><em>I</em></TBtn>,
      <TBtn key="u" onClick={() => editor.chain().focus().toggleUnderline().run()} active={editor.isActive('underline')} title="Subrayado"><span style={{ textDecoration: 'underline' }}>U</span></TBtn>,
      <TBtn key="s" onClick={() => editor.chain().focus().toggleStrike().run()} active={editor.isActive('strike')} title="Tachado"><s>S</s></TBtn>,
    ],
    [
      <TBtn key="al" onClick={() => editor.chain().focus().setTextAlign('left').run()} active={editor.isActive({ textAlign: 'left' })} title="Izquierda"><AlignLeft size={14} strokeWidth={2} /></TBtn>,
      <TBtn key="ac" onClick={() => editor.chain().focus().setTextAlign('center').run()} active={editor.isActive({ textAlign: 'center' })} title="Centrar"><AlignCenter size={14} strokeWidth={2} /></TBtn>,
      <TBtn key="ar" onClick={() => editor.chain().focus().setTextAlign('right').run()} active={editor.isActive({ textAlign: 'right' })} title="Derecha"><AlignRight size={14} strokeWidth={2} /></TBtn>,
    ],
    [
      <TBtn key="ul" onClick={() => editor.chain().focus().toggleBulletList().run()} active={editor.isActive('bulletList')} title="Lista"><List size={14} strokeWidth={2} /></TBtn>,
      <TBtn key="ol" onClick={() => editor.chain().focus().toggleOrderedList().run()} active={editor.isActive('orderedList')} title="Lista numerada">1. Lista</TBtn>,
      <TBtn key="bq" onClick={() => editor.chain().focus().toggleBlockquote().run()} active={editor.isActive('blockquote')} title="Cita"><Quote size={14} strokeWidth={2} /></TBtn>,
      <TBtn key="hr" onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Separador"><Minus size={14} strokeWidth={2} /></TBtn>,
    ],
    [
      <TBtn key="link" onClick={addLink} active={editor.isActive('link')} title="Insertar enlace"><LinkIcon size={14} strokeWidth={2} /></TBtn>,
      <TBtn key="unlink" onClick={() => editor.chain().focus().unsetLink().run()} title="Quitar enlace"><Link2Off size={14} strokeWidth={2} /></TBtn>,
      <TBtn key="img" onClick={addImage} title="Insertar imagen (URL)"><ImageIcon size={14} strokeWidth={2} /></TBtn>,
    ],
    [
      <TBtn key="undo" onClick={() => editor.chain().focus().undo().run()} title="Deshacer"><Undo2 size={14} strokeWidth={2} /></TBtn>,
      <TBtn key="redo" onClick={() => editor.chain().focus().redo().run()} title="Rehacer"><Redo2 size={14} strokeWidth={2} /></TBtn>,
    ],
  ]

  return (
    <div style={{ border: '1px solid var(--border)', borderRadius: 4, overflow: 'hidden', background: '#fff' }}>
      <div className="bg-[var(--off)]" style={{
        display: 'flex', flexWrap: 'wrap', gap: 2, padding: '8px 10px',
        borderBottom: '1px solid var(--border)',
        alignItems: 'center'}}>
        {groups.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', gap: 1, marginRight: gi < groups.length - 1 ? 6 : 0, borderRight: gi < groups.length - 1 ? '1px solid var(--border)' : 'none', paddingRight: gi < groups.length - 1 ? 6 : 0 }}>
            {group}
          </div>
        ))}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 4, paddingLeft: 6, borderLeft: '1px solid var(--border)' }}>
          <span className="text-sdm-sm" style={{ color: 'var(--muted)' }}>Color:</span>
          <input type="color" onChange={e => editor.chain().focus().setColor(e.target.value).run()} title="Color del texto"
            style={{ width: 26, height: 26, borderRadius: 3, border: '1px solid var(--border)', padding: 2, cursor: 'pointer', background: 'none' }} />
        </div>
      </div>
      <EditorContent editor={editor} />
      <style>{`
        .ProseMirror h2 { font-size: 22px; font-weight: 500; color: var(--navy-dark); margin: 20px 0 8px; font-family: 'Cormorant Garamond', Georgia, serif; }
        .ProseMirror h3 { font-size: 17px; font-weight: 600; color: var(--navy-dark); margin: 16px 0 6px; }
        .ProseMirror p  { margin: 0 0 12px; }
        .ProseMirror ul, .ProseMirror ol { padding-left: 22px; margin: 0 0 12px; }
        .ProseMirror li { margin-bottom: 4px; }
        .ProseMirror blockquote { border-left: 3px solid var(--sky); padding-left: 16px; margin: 16px 0; color: var(--muted); font-style: italic; }
        .ProseMirror hr { border: none; border-top: 1px solid var(--border); margin: 20px 0; }
        .ProseMirror a { color: var(--navy); text-decoration: underline; }
        .ProseMirror strong { font-weight: 700; }
        .ProseMirror em { font-style: italic; }
        .ProseMirror s { text-decoration: line-through; }
      `}</style>
    </div>
  )
}
