/**
 * Normalize band name for matching/grouping
 * Removes articles, special chars, normalizes spaces
 *
 * Examples:
 * "The Script" → "script"
 * "A Perfect Circle" → "perfect circle"
 * "The Rolling Stones!" → "rolling stones"
 */
export function normalizeBandName(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .replace(/^the\s+/i, '')      // Remove "The" from start
    .replace(/^a\s+/i, '')        // Remove "A" from start
    .replace(/^an\s+/i, '')       // Remove "An" from start
    .replace(/[^\w\s]/g, '')      // Remove special characters
    .replace(/\s+/g, ' ')         // Normalize multiple spaces to single
    .trim();
}

/**
 * Check if two band names match (normalized comparison)
 */
export function bandNamesMatch(name1, name2) {
  return normalizeBandName(name1) === normalizeBandName(name2);
}
