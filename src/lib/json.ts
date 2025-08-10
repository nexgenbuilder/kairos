// src/lib/json.ts
export function toJSONSafe<T = any>(input: T): T {
    if (input === null || input === undefined) return input as any;
  
    const t = typeof input;
    if (t === 'bigint') return Number(input) as any;
    if (t !== 'object') return input;
  
    if (input instanceof Date) return input.toISOString() as any;
    if (Array.isArray(input)) return input.map(toJSONSafe) as any;
  
    const out: any = {};
    for (const [k, v] of Object.entries(input as any)) {
      const vv = toJSONSafe(v as any);
      if (vv !== undefined) out[k] = vv;
    }
    return out;
  }
  