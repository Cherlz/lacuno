// Enforces "every claim links to its source": walks Claude's output and removes
// any finding whose source_ids are empty or point to records that don't exist.
export function keepSourced<T>(value: T, validIds: Set<string>): T {
  if (Array.isArray(value)) {
    return value
      .map((v) => keepSourced(v, validIds))
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
        out[k] = keepSourced(v, validIds);
      }
    }
    return out as T;
  }
  return value;
}
