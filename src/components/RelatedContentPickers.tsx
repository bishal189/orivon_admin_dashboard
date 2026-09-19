import { useEffect, useMemo, useState } from 'react'
import {
  api,
  RELATION_KIND_META,
  type ContentRecord,
  type ContentRelationRef,
  type ContentType,
  type RelationKind,
} from '../api/client'

const inputClass =
  'mt-1.5 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-brand-500 focus:ring-3 focus:ring-brand-100'

type RelatedContentPickersProps = {
  excludeId?: string
  sourceType?: ContentType
  value: ContentRelationRef[]
  onChange: (relations: ContentRelationRef[]) => void
}

export function RelatedContentPickers({
  excludeId,
  sourceType,
  value,
  onChange,
}: RelatedContentPickersProps) {
  const [optionsByType, setOptionsByType] = useState<Partial<Record<ContentType, ContentRecord[]>>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    void Promise.all(
      RELATION_KIND_META.map(async (meta) => {
        const { records } = await api.getContent({ type: meta.targetType, pageSize: 100, sortBy: 'title', sortDirection: 'asc' })
        return [meta.targetType, records] as const
      }),
    )
      .then((entries) => {
        if (cancelled) return
        setOptionsByType(Object.fromEntries(entries))
      })
      .catch(() => {
        if (!cancelled) setOptionsByType({})
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  const selectedByKind = useMemo(() => {
    const map = new Map<RelationKind, Set<string>>()
    for (const meta of RELATION_KIND_META) map.set(meta.kind, new Set())
    for (const relation of value) {
      map.get(relation.type)?.add(relation.targetId)
    }
    return map
  }, [value])

  const add = (kind: RelationKind, targetType: ContentType, record: ContentRecord) => {
    if ((selectedByKind.get(kind) || new Set()).has(record.id)) return
    const defaultAnchor = defaultAnchorFor(sourceType, kind, record)
    onChange([
      ...value,
      {
        targetId: record.id,
        type: kind,
        order: value.length,
        anchor: defaultAnchor,
        label: record.h1 || record.title,
        slug: record.slug,
        targetType,
      },
    ])
  }

  const remove = (kind: RelationKind, targetId: string) => {
    onChange(value.filter((relation) => !(relation.type === kind && relation.targetId === targetId)))
  }

  const setAnchor = (kind: RelationKind, targetId: string, anchor: string) => {
    onChange(value.map((relation) => (
      relation.type === kind && relation.targetId === targetId
        ? { ...relation, anchor }
        : relation
    )))
  }

  return (
    <div className="space-y-4 sm:col-span-2">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-brand-600">Structured internal links</p>
        <p className="mt-1 text-xs text-slate-400">
          Curate topical links with custom anchor text. Doctor pages should link services; treatment pages should link doctors;
          conditions and articles should link appropriate service options.
        </p>
      </div>
      {loading ? <p className="text-xs text-slate-400">Loading related content options…</p> : null}
      <div className="grid gap-3 lg:grid-cols-2">
        {RELATION_KIND_META.map((meta) => {
          const options = (optionsByType[meta.targetType] || []).filter((item) => item.id !== excludeId)
          const selected = selectedByKind.get(meta.kind) || new Set()
          const rows = value.filter((relation) => relation.type === meta.kind)
          return (
            <div className="rounded-xl border border-slate-200 bg-white p-3.5" key={meta.kind}>
              <label className="block text-[11px] font-semibold text-slate-700">
                {meta.label}
                <span className="mt-0.5 block font-normal text-slate-400">{meta.hint}</span>
                <select
                  className={inputClass}
                  onChange={(event) => {
                    const record = options.find((item) => item.id === event.target.value)
                    if (record) add(meta.kind, meta.targetType, record)
                    event.currentTarget.value = ''
                  }}
                  value=""
                >
                  <option value="">Add {meta.targetType.toLowerCase()}…</option>
                  {options.map((item) => (
                    <option disabled={selected.has(item.id)} key={item.id} value={item.id}>
                      {item.h1 || item.title}
                    </option>
                  ))}
                </select>
              </label>
              {rows.length === 0 ? (
                <p className="mt-2 text-[11px] text-slate-400">None selected</p>
              ) : (
                <ul className="mt-3 space-y-2">
                  {rows.map((relation) => (
                    <li className="rounded-lg border border-slate-100 bg-slate-50 p-2.5" key={`${relation.type}-${relation.targetId}`}>
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <p className="truncate text-[11px] font-medium text-slate-700">
                          {relation.label || relation.slug || relation.targetId}
                        </p>
                        <button
                          className="text-[11px] text-red-500 hover:text-red-700"
                          onClick={() => remove(meta.kind, relation.targetId)}
                          type="button"
                        >
                          Remove
                        </button>
                      </div>
                      <label className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-slate-400">
                        Anchor text
                        <input
                          className={inputClass}
                          onChange={(event) => setAnchor(meta.kind, relation.targetId, event.target.value)}
                          placeholder="Custom link text shown on the page"
                          value={relation.anchor || ''}
                        />
                      </label>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function defaultAnchorFor(sourceType: ContentType | undefined, kind: RelationKind, record: ContentRecord) {
  const title = record.h1 || record.title
  if (sourceType === 'PROVIDER' && kind === 'related-service') return `Explore ${title}`
  if (sourceType === 'SERVICE' && kind === 'related-provider') return `Speak with our ${title} team`
  if (sourceType === 'CONDITION' && kind === 'related-service') return `${title} support`
  if (sourceType === 'ARTICLE' && kind === 'related-service') return `Learn about ${title}`
  return title
}
