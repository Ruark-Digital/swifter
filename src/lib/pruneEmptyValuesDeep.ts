export const pruneEmptyValuesDeep = <T>(input: T): T => {
  const prune = (value: any): any => {
    if (value === null || value === undefined) return undefined;

    if (typeof value === "string") {
      return value.trim().length === 0 ? undefined : value;
    }

    if (typeof value === "number" || typeof value === "boolean") {
      return value;
    }

    if (Array.isArray(value)) {
      const next = value.map((v) => prune(v)).filter((v) => v !== undefined);
      return next.length === 0 ? undefined : next;
    }

    if (typeof value === "object") {
      const proto = Object.getPrototypeOf(value);
      const isPlainObject = proto === Object.prototype || proto === null;
      if (!isPlainObject) return value;

      const next: Record<string, any> = {};
      for (const [k, v] of Object.entries(value)) {
        const cleaned = prune(v);
        if (cleaned !== undefined) {
          next[k] = cleaned;
        }
      }
      return Object.keys(next).length === 0 ? undefined : next;
    }

    return value;
  };

  const cleaned = prune(input);
  return (cleaned === undefined ? ({} as any) : cleaned) as T;
};

