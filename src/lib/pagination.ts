export function paginationItems(current: number, total: number): Array<number | string> {
  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1)

  const pages = [1, current - 1, current, current + 1, total]
    .filter((value, index, values) => value > 0 && value <= total && values.indexOf(value) === index)
    .sort((left, right) => left - right)
  const items: Array<number | string> = []

  pages.forEach((value, index) => {
    if (index > 0 && value - pages[index - 1] > 1) items.push(`ellipsis-${value}`)
    items.push(value)
  })
  return items
}
