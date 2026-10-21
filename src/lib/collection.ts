import type { Category, Property } from "../data/properties";

export const SAVED_HOMES_STORAGE_KEY = "aurel:saved:v1";

export type SavedPropertyIds = readonly string[] | ReadonlySet<string>;

function toIdSet(ids: SavedPropertyIds): ReadonlySet<string> {
  return ids instanceof Set ? ids : new Set(ids);
}

function normalizeIds(ids: SavedPropertyIds, validIds?: SavedPropertyIds): string[] {
  const allowed = validIds ? toIdSet(validIds) : undefined;
  const normalized: string[] = [];
  const seen = new Set<string>();

  for (const id of ids) {
    if (typeof id !== "string") continue;

    const trimmedId = id.trim();
    if (!trimmedId || seen.has(trimmedId)) continue;
    if (allowed && !allowed.has(trimmedId)) continue;

    seen.add(trimmedId);
    normalized.push(trimmedId);
  }

  return normalized;
}

/**
 * Return homes matching the selected category and, optionally, the saved set.
 * The source array is never mutated.
 */
export function filterProperties(
  source: readonly Property[],
  category: Category | "All" = "All",
  savedOnly = false,
  savedIds: SavedPropertyIds = [],
): Property[] {
  const saved = toIdSet(savedIds);

  return source.filter((property) => {
    const categoryMatches = category === "All" || property.category === category;
    const savedMatches = !savedOnly || saved.has(property.id);
    return categoryMatches && savedMatches;
  });
}

/**
 * Safely parse a saved-home payload and keep only unique, valid string IDs.
 */
export function parseSavedHomes(raw: string | null | undefined, validIds?: SavedPropertyIds): string[] {
  if (!raw) return [];

  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];

    return normalizeIds(parsed.filter((value): value is string => typeof value === "string"), validIds);
  } catch {
    return [];
  }
}

/**
 * Toggle one saved-home ID while preserving order and removing invalid IDs.
 */
export function toggleSavedHome(
  currentIds: SavedPropertyIds,
  propertyId: string,
  validIds?: SavedPropertyIds,
): string[] {
  const normalized = normalizeIds(currentIds, validIds);
  const candidate = propertyId.trim();
  const allowed = validIds ? toIdSet(validIds) : undefined;

  if (!candidate || (allowed && !allowed.has(candidate))) return normalized;

  if (normalized.includes(candidate)) {
    return normalized.filter((id) => id !== candidate);
  }

  return [...normalized, candidate];
}
