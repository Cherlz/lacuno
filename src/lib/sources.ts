// Enforces "every claim links to its source": walks Claude's output and removes
// any finding whose source_ids are empty or point to records that don't exist.
export function keepSourced<T>(value: T, validIds: Set<string>): T {
  return dropBlank(keepSourcedInner(value, validIds));
}

function keepSourcedInner<T>(value: T, validIds: Set<string>): T {
  if (Array.isArray(value)) {
    return value
      .map((v) => keepSourcedInner(v, validIds))
      .filter((v) => {
        if (v && typeof v === "object" && "source_ids" in v) {
          return (v as { source_ids: string[] }).source_ids.length > 0;
        }
        return true;
      }) as T;
  }
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) {
      if (k === "source_ids" && Array.isArray(v)) {
        out[k] = [...new Set(v.filter((id) => validIds.has(id)))];
      } else {
        out[k] = keepSourcedInner(v, validIds);
      }
    }
    return out as T;
  }
  return value;
}

// The field that carries an item's meaning; an item without it would show as an empty bullet.
const TEXT_KEYS = ["item", "point", "name", "possibility", "test", "event", "summary", "symptom", "name_in_record"];

function isBlank(v: unknown): boolean {
  if (typeof v === "string") return !v.trim();
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const key = TEXT_KEYS.find((k) => k in v);
    return key ? isBlank((v as Record<string, unknown>)[key]) : false;
  }
  return false;
}

/** Removes empty strings and items with no text from every list, so nothing renders as an empty bullet. */
export function dropBlank<T>(value: T): T {
  if (Array.isArray(value)) return value.filter((v) => !isBlank(v)).map(dropBlank) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, dropBlank(v)])) as T;
  }
  return value;
}
