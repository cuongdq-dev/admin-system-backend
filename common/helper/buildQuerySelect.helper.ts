export function extractSelectPaths(
  selectObj: Record<string, any>,
  rootAlias = 'member',
): string[] {
  const result: string[] = [];

  function recurse(obj: Record<string, any>, prefix: string) {
    for (const key in obj) {
      const value = obj[key];
      if (value === true) {
        result.push(`${prefix}.${key}`);
      } else if (typeof value === 'object' && value !== null) {
        recurse(value, `${prefix}.${key}`);
      }
    }
  }

  recurse(selectObj, rootAlias);
  return result;
}
