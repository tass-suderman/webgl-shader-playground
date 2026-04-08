/// <reference types="vite/client" />
/// <reference types="@testing-library/jest-dom" />

// superdough.mjs uses a `?audioworklet` query-parameter import that prevents
// TypeScript from parsing the file and inferring its exports. Augment the
// re-exporting package so the missing symbols are typed correctly.
declare module '@strudel/webaudio' {
  export function soundAlias(original: string, alias: string): void
}
