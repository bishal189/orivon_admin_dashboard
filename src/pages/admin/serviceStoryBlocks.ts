import type { ContentBlock } from '../../api/client'

function heading(id: string, level: 2 | 3 | 4, text = ''): ContentBlock {
  return { id, type: 'heading', level, text }
}

function paragraph(id: string, text = ''): ContentBlock {
  return { id, type: 'paragraph', text }
}

/** The same sections the public service page reads. Empty sections stay off the page. */
export function serviceStoryBlocks(): ContentBlock[] {
  return [
    heading('svc-eyebrow', 4),
    heading('svc-cta-primary', 3, 'Book a Consultation'),
    paragraph('svc-cta-primary-href', '/contact'),
    heading('svc-cta-secondary', 3, 'WhatsApp Us'),
    paragraph('svc-cta-secondary-href', 'https://wa.me/971501107221'),
    heading('svc-about-label', 4, 'About this pathway'),
    heading('svc-about-title', 3),
    paragraph('svc-about-body'),
    heading('svc-guidance-title', 3),
    paragraph('svc-guidance-body'),
    heading('svc-includes-label', 4, 'What we cover'),
    heading('svc-includes-title', 2),
    paragraph('svc-includes-lead'),
    heading('svc-include-1', 3),
    paragraph('svc-include-text-1'),
    heading('svc-include-2', 3),
    paragraph('svc-include-text-2'),
    heading('svc-include-3', 3),
    paragraph('svc-include-text-3'),
    heading('svc-process-label', 4, 'How we work'),
    heading('svc-process-title', 2),
    paragraph('svc-process-lead'),
    heading('svc-step-1', 3),
    paragraph('svc-step-text-1'),
    heading('svc-step-2', 3),
    paragraph('svc-step-text-2'),
    heading('svc-step-3', 3),
    paragraph('svc-step-text-3'),
    heading('svc-audiences-title', 2),
    heading('svc-audience-1', 3),
    paragraph('svc-audience-text-1'),
    heading('svc-why-title', 2),
    heading('svc-why-1', 3),
    paragraph('svc-why-text-1'),
    heading('svc-related-label', 4, 'Related pathways'),
    heading('svc-related-title', 2, 'Other support on this pathway.'),
    heading('svc-final-title', 2, 'Ready to take the next step?'),
    paragraph('svc-final-lead'),
    paragraph('svc-final-note'),
    heading('svc-final-primary', 3, 'Book a Consultation'),
    paragraph('svc-final-primary-href', '/contact'),
    heading('svc-final-secondary', 3, 'WhatsApp Us'),
    paragraph('svc-final-secondary-href', 'https://wa.me/971501107221'),
  ]
}

const fixedLabels: Record<string, string> = {
  'svc-eyebrow': 'Eyebrow',
  'svc-cta-primary': 'Top primary button',
  'svc-cta-primary-href': 'Top primary button link',
  'svc-cta-secondary': 'Top secondary button',
  'svc-cta-secondary-href': 'Top secondary button link',
  'svc-about-label': 'About label',
  'svc-about-title': 'About heading',
  'svc-about-body': 'About text',
  'svc-guidance-title': 'Side card heading',
  'svc-guidance-body': 'Side card text',
  'svc-includes-label': 'Includes label',
  'svc-includes-title': 'Includes heading',
  'svc-includes-lead': 'Includes introduction',
  'svc-process-label': 'Process label',
  'svc-process-title': 'Process heading',
  'svc-process-lead': 'Process introduction',
  'svc-audiences-title': 'Audiences heading',
  'svc-why-title': 'Reasons heading',
  'svc-related-label': 'Related label',
  'svc-related-title': 'Related heading',
  'svc-final-title': 'Closing heading',
  'svc-final-lead': 'Closing text',
  'svc-final-note': 'Closing note',
  'svc-final-primary': 'Closing primary button',
  'svc-final-primary-href': 'Closing primary button link',
  'svc-final-secondary': 'Closing secondary button',
  'svc-final-secondary-href': 'Closing secondary button link',
}

export function serviceBlockLabel(id: string) {
  if (fixedLabels[id]) return fixedLabels[id]
  const numbered: [RegExp, string][] = [
    [/^svc-include-(\d+)$/, 'Include'],
    [/^svc-include-text-(\d+)$/, 'Include'],
    [/^svc-step-(\d+)$/, 'Step'],
    [/^svc-step-text-(\d+)$/, 'Step'],
    [/^svc-audience-(\d+)$/, 'Audience'],
    [/^svc-audience-text-(\d+)$/, 'Audience'],
    [/^svc-why-(\d+)$/, 'Reason'],
    [/^svc-why-text-(\d+)$/, 'Reason'],
  ]
  for (const [pattern, name] of numbered) {
    const match = id.match(pattern)
    if (!match) continue
    const kind = id.includes('-text-') ? 'text' : 'title'
    return `${name} ${match[1]} ${kind}`
  }
  return ''
}

export function isServiceStory(blocks: ContentBlock[]) {
  return blocks.some((block) => block.id.startsWith('svc-'))
}

function nextNumber(blocks: ContentBlock[], pattern: RegExp) {
  const numbers = blocks.map((block) => {
    const match = block.id.match(pattern)
    return match ? Number(match[1]) : 0
  })
  return Math.max(0, ...numbers) + 1
}

function insertAfterLast(blocks: ContentBlock[], pattern: RegExp, extra: ContentBlock[]) {
  let index = -1
  blocks.forEach((block, position) => {
    if (pattern.test(block.id)) index = position
  })
  if (index < 0) return [...blocks, ...extra]
  return [...blocks.slice(0, index + 1), ...extra, ...blocks.slice(index + 1)]
}

export function addServicePair(blocks: ContentBlock[], kind: 'include' | 'step' | 'audience' | 'why') {
  const prefix = kind === 'include' ? 'svc-include' : kind === 'step' ? 'svc-step' : kind === 'audience' ? 'svc-audience' : 'svc-why'
  const n = nextNumber(blocks, new RegExp(`^${prefix}-(\\d+)$`))
  return insertAfterLast(blocks, new RegExp(`^${prefix}-text-\\d+$`), [
    heading(`${prefix}-${n}`, 3),
    paragraph(`${prefix}-text-${n}`),
  ])
}
