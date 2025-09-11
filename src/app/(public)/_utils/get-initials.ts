export function getInitials(name: string | null | undefined): string {
  if (!name || typeof name !== "string") {
    return "?"
  }

  const words = name
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0)

  if (words.length === 0) {
    return "?"
  }

  if (words.length === 1) {
    // Single word - take first character
    return words[0].charAt(0).toUpperCase()
  }

  // Multiple words - take first character of first and last word
  const firstInitial = words[0].charAt(0).toUpperCase()
  const lastInitial = words[words.length - 1].charAt(0).toUpperCase()

  return firstInitial + lastInitial
}
