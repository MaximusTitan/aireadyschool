declare module 'shortid' {
  export function generate(): string;
  export function seed(seed: number): void;
  export function characters(characters: string): string;
  export function isValid(id: string): boolean;
}
