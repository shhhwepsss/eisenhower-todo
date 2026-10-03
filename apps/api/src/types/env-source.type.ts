/** Откуда читается окружение: `process.env` на проде и в dev, объект — в тестах. */
export type EnvSource = Record<string, string | undefined>;
