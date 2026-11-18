/** Поєднує CSS-класи, відкидаючи порожні значення. */
export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ');
}
