/** Escapes user input so it is matched literally inside a Mongo `$regex` / RegExp. */
export function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
