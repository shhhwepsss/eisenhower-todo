import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Инварианты `_theme.scss` (docs/specs/35-design-system.md, §4, §Инварианты).
 *
 * Тест разбирает файл текстом, а не через Sass API: тут проверяется форма —
 * какие переменные объявлены и какой цвет за ними стоит, — а не то, что Sass
 * умеет его скомпилировать (это уже держит `npm run build`).
 */
const THEME_PATH: string = join(process.cwd(), 'src/styles/_theme.scss');
const THEME_SOURCE: string = readFileSync(THEME_PATH, 'utf-8');

/** Тело одного `@mixin name { ... }` — миксины в файле не вкладываются друг в друга. */
const mixinBody = (source: string, name: string): string => {
  const start: number = source.indexOf(`@mixin ${name}`);
  if (start === -1) throw new Error(`миксин ${name} не найден в _theme.scss`);

  const open: number = source.indexOf('{', start);
  const close: number = source.indexOf('\n}', open);
  return source.slice(open + 1, close);
};

/** Имена custom properties, объявленных внутри блока (`--name: значение;`). */
const variableNames = (body: string): Set<string> => {
  const matches: IterableIterator<RegExpMatchArray> = body.matchAll(/--([a-z0-9-]+):/g);
  const names: string[] = Array.from(matches, (match) => match[1] ?? '');
  return new Set(names.filter((name) => name !== ''));
};

/**
 * `#rrggbb` или укороченный `#rgb` (stylelint `--fix` сокращает `#ffffff` до
 * `#fff`) → `[r, g, b]` в диапазоне 0–255.
 */
const hexToRgb = (hex: string): [number, number, number] => {
  const short: string = hex.replace('#', '');
  const full: string = short.length === 3 ? short.replace(/./g, (char) => char + char) : short;
  const channel = (offset: number): number => parseInt(full.slice(offset, offset + 2), 16);
  return [channel(0), channel(2), channel(4)];
};

/** Относительная светлота канала sRGB (WCAG 2.x). */
const linearize = (channel: number): number => {
  const normalized: number = channel / 255;
  return normalized <= 0.03928 ? normalized / 12.92 : ((normalized + 0.055) / 1.055) ** 2.4;
};

/** Относительная светлота цвета целиком (WCAG 2.x, формула для sRGB). */
const relativeLuminance = (hex: string): number => {
  const [r, g, b]: [number, number, number] = hexToRgb(hex);
  return 0.2126 * linearize(r) + 0.7152 * linearize(g) + 0.0722 * linearize(b);
};

/** Контраст двух цветов по WCAG: (L1 + 0.05) / (L2 + 0.05), L1 ≥ L2. */
const contrastRatio = (hexA: string, hexB: string): number => {
  const luminanceA: number = relativeLuminance(hexA);
  const luminanceB: number = relativeLuminance(hexB);
  const lighter: number = Math.max(luminanceA, luminanceB);
  const darker: number = Math.min(luminanceA, luminanceB);
  return (lighter + 0.05) / (darker + 0.05);
};

/** Значение `--name: #hex;` внутри блока миксина. */
const colorOf = (body: string, name: string): string => {
  const match: RegExpMatchArray | null = body.match(new RegExp(`--${name}:\\s*(#[0-9a-f]{3,8})`));
  const value: string | undefined = match?.[1];
  if (value === undefined) throw new Error(`переменная --${name} не найдена или не hex`);
  return value;
};

const LIGHT: string = mixinBody(THEME_SOURCE, 'light-vars');
const DARK: string = mixinBody(THEME_SOURCE, 'dark-vars');

describe('THEME_PARITY', () => {
  it('множества имён переменных в светлом и тёмном блоках совпадают', () => {
    const lightNames: Set<string> = variableNames(LIGHT);
    const darkNames: Set<string> = variableNames(DARK);

    expect(lightNames.size).toBeGreaterThan(0);
    expect([...darkNames].sort()).toStrictEqual([...lightNames].sort());
  });
});

describe('ZONE_LINE_THEME_STABLE', () => {
  it.each(['q1', 'q2', 'q3', 'q4', 'inbox'])('--zone-%s-line одинаков в обеих темах', (zone) => {
    expect(colorOf(DARK, `zone-${zone}-line`)).toBe(colorOf(LIGHT, `zone-${zone}-line`));
  });
});

describe('CONTRAST_AA', () => {
  const ZONES: readonly string[] = ['q1', 'q2', 'q3', 'q4', 'inbox'];
  const SURFACES: readonly string[] = ['surface-page', 'surface-raised', 'surface-sunken'];
  const NEUTRAL_TEXT: readonly string[] = ['text-primary', 'text-secondary'];

  it.each(ZONES)('зона %s: текст на своей заливке ≥ 4.5:1 в светлой теме', (zone) => {
    const ratio: number = contrastRatio(colorOf(LIGHT, `zone-${zone}-text`), colorOf(LIGHT, `zone-${zone}-bg`));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(ZONES)('зона %s: текст на своей заливке ≥ 4.5:1 в тёмной теме', (zone) => {
    const ratio: number = contrastRatio(colorOf(DARK, `zone-${zone}-text`), colorOf(DARK, `zone-${zone}-bg`));
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it.each(SURFACES.flatMap((surface) => NEUTRAL_TEXT.map((text) => ({ surface, text }))))(
    'нейтральный текст $text на $surface ≥ 4.5:1 в светлой теме',
    ({ surface, text }) => {
      const ratio: number = contrastRatio(colorOf(LIGHT, `color-${text}`), colorOf(LIGHT, `color-${surface}`));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );

  it.each(SURFACES.flatMap((surface) => NEUTRAL_TEXT.map((text) => ({ surface, text }))))(
    'нейтральный текст $text на $surface ≥ 4.5:1 в тёмной теме',
    ({ surface, text }) => {
      const ratio: number = contrastRatio(colorOf(DARK, `color-${text}`), colorOf(DARK, `color-${surface}`));
      expect(ratio).toBeGreaterThanOrEqual(4.5);
    },
  );
});
