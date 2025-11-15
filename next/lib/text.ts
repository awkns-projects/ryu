/**
 * Text utility functions
 * 
 * stripLeadingIcons: Remove leading emoji/icons and separators from text
 * to avoid duplication when placing icons separately in components.
 */

/**
 * Remove leading decorative emoji/symbols and subsequent separators (spaces/colons/dots/etc).
 */
export function stripLeadingIcons(input: string | undefined | null): string {
  if (!input) return ''
  let s = String(input)

  // 1) Remove common emoji/symbol blocks (arrows, misc symbols, geometric shapes, emojis, etc.)
  //    Covers common ranges, better compatibility than using Unicode property classes.
  s = s.replace(
    /^[\s\u2190-\u21FF\u2300-\u23FF\u2460-\u24FF\u25A0-\u25FF\u2600-\u27BF\u2B00-\u2BFF\u1F000-\u1FAFF]+/u,
    ''
  )

  // 2) Remove any remaining leading separators (spaces, hyphens, colons, centered dots, etc.)
  s = s.replace(/^[\s\-:•·]+/, '')

  return s.trim()
}

export default { stripLeadingIcons }

