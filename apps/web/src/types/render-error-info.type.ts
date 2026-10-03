/**
 * Общая часть трёх колбэков React: у них разные типы второго аргумента, и роднит
 * их ровно `componentStack` — цепочка компонентов до места падения.
 */
export type RenderErrorInfo = { componentStack?: string | undefined };
