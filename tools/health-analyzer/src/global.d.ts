declare module 'glob' {
  export function glob(
    pattern: string,
    options?: { cwd?: string; ignore?: string[] }
  ): Promise<string[]>;
}
