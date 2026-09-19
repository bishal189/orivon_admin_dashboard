import { Plus, Trash2 } from 'lucide-react'
import type { ContentBlock } from '../api/client'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'
const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-600 transition hover:bg-slate-50'

function newId() {
  return `block_${Math.random().toString(36).slice(2, 10)}`
}

type BodyBlocksEditorProps = {
  blocks: ContentBlock[]
  onChange: (blocks: ContentBlock[]) => void
}

export function BodyBlocksEditor({ blocks, onChange }: BodyBlocksEditorProps) {
  const update = (id: string, patch: Partial<ContentBlock>) => {
    onChange(blocks.map((block) => (block.id === id ? { ...block, ...patch } as ContentBlock : block)))
  }

  const remove = (id: string) => {
    onChange(blocks.filter((block) => block.id !== id))
  }

  const addHeading = (level: 2 | 3 | 4) => {
    onChange([...blocks, { id: newId(), type: 'heading', level, text: '' }])
  }

  const addParagraph = () => {
    onChange([...blocks, { id: newId(), type: 'paragraph', text: '' }])
  }

  const addList = () => {
    onChange([...blocks, { id: newId(), type: 'list', items: [''] }])
  }

  const addImage = () => {
    onChange([...blocks, {
      id: newId(),
      type: 'image',
      url: '',
      alt: '',
      width: undefined,
      height: undefined,
      filename: '',
      webpUrl: '',
      avifUrl: '',
      isPrimary: false,
    }])
  }

  return (
    <div className="space-y-3 sm:col-span-2">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Main body content</p>
          <p className="mt-1 text-xs text-slate-400">
            H1 is set above. Body headings start at H2. Each image block has its own editable alt text.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={secondaryButton} onClick={() => addHeading(2)} type="button"><Plus className="h-3.5 w-3.5" />H2</button>
          <button className={secondaryButton} onClick={() => addHeading(3)} type="button"><Plus className="h-3.5 w-3.5" />H3</button>
          <button className={secondaryButton} onClick={() => addHeading(4)} type="button"><Plus className="h-3.5 w-3.5" />H4</button>
          <button className={secondaryButton} onClick={addParagraph} type="button"><Plus className="h-3.5 w-3.5" />Paragraph</button>
          <button className={secondaryButton} onClick={addList} type="button"><Plus className="h-3.5 w-3.5" />List</button>
          <button className={secondaryButton} onClick={addImage} type="button"><Plus className="h-3.5 w-3.5" />Image</button>
        </div>
      </div>

      {blocks.length === 0 && (
        <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-center text-xs text-slate-400">
          No body blocks yet. Add an H2 section heading, paragraph, list, or image.
        </p>
      )}

      {blocks.map((block) => (
        <div className="rounded-xl border border-slate-200 bg-white p-3.5" key={block.id}>
          <div className="mb-2 flex items-center justify-between gap-2">
            {block.type === 'heading' ? (
              <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
                Heading
                <select
                  className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs"
                  onChange={(event) => update(block.id, { level: Number(event.target.value) as 2 | 3 | 4 })}
                  value={block.level}
                >
                  <option value={2}>H2</option>
                  <option value={3}>H3</option>
                  <option value={4}>H4</option>
                </select>
              </label>
            ) : (
              <span className="text-[11px] font-semibold text-slate-600">
                {block.type === 'list' ? 'List' : block.type === 'image' ? 'Image' : 'Paragraph'}
              </span>
            )}
            <button aria-label="Remove block" className="rounded-md p-1.5 text-red-500 hover:bg-red-50" onClick={() => remove(block.id)} type="button">
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
          {block.type === 'heading' ? (
            <input
              className={inputClass}
              onChange={(event) => update(block.id, { text: event.target.value })}
              placeholder="Section heading"
              value={block.text}
            />
          ) : block.type === 'list' ? (
            <textarea
              className={`${inputClass} min-h-28 resize-y`}
              onChange={(event) => update(block.id, {
                items: event.target.value.split('\n'),
              })}
              placeholder="One list item per line"
              value={(block.items || []).join('\n')}
            />
          ) : block.type === 'image' ? (
            <div className="space-y-3">
              <label className="block text-xs font-medium text-slate-700">
                Image URL
                <input
                  className={inputClass}
                  onChange={(event) => update(block.id, { url: event.target.value })}
                  placeholder="https://…/descriptive-name.webp"
                  type="url"
                  value={block.url}
                />
              </label>
              <label className="block text-xs font-medium text-slate-700">
                Alt text (required, unique to this image)
                <input
                  className={inputClass}
                  onChange={(event) => update(block.id, { alt: event.target.value })}
                  placeholder="Describe this image"
                  value={block.alt}
                />
              </label>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  Width
                  <input
                    className={inputClass}
                    onChange={(event) => update(block.id, { width: Number(event.target.value) || undefined })}
                    inputMode="numeric"
                    value={block.width ?? ''}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  Height
                  <input
                    className={inputClass}
                    onChange={(event) => update(block.id, { height: Number(event.target.value) || undefined })}
                    inputMode="numeric"
                    value={block.height ?? ''}
                  />
                </label>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block text-xs font-medium text-slate-700">
                  WebP URL
                  <input
                    className={inputClass}
                    onChange={(event) => update(block.id, { webpUrl: event.target.value })}
                    type="url"
                    value={block.webpUrl || ''}
                  />
                </label>
                <label className="block text-xs font-medium text-slate-700">
                  AVIF URL
                  <input
                    className={inputClass}
                    onChange={(event) => update(block.id, { avifUrl: event.target.value })}
                    type="url"
                    value={block.avifUrl || ''}
                  />
                </label>
              </div>
              <label className="flex items-center gap-2 text-xs text-slate-600">
                <input
                  checked={Boolean(block.isPrimary)}
                  className="h-4 w-4 accent-[#1f4d42]"
                  onChange={(event) => update(block.id, { isPrimary: event.target.checked })}
                  type="checkbox"
                />
                Treat as primary / LCP image (eager load)
              </label>
            </div>
          ) : (
            <textarea
              className={`${inputClass} min-h-24 resize-y`}
              onChange={(event) => update(block.id, { text: event.target.value })}
              placeholder="Body paragraph"
              value={block.text}
            />
          )}
        </div>
      ))}
    </div>
  )
}
