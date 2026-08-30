declare module 'prismjs' {
  export function highlightAll(): void;
  export function highlightElement(element: HTMLElement): void;
  export const languages: Record<string, any>;
}
