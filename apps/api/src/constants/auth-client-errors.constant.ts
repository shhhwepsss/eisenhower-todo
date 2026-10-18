/**
 * Ошибки Auth.js, которые вызывает клиент, а не сервер: испорченная или просроченная
 * cookie, неизвестное действие, отказ на странице согласия, подделанный state. Для API
 * это пережитая аномалия — `warn` (CLAUDE.md §9); иначе один `curl` в цикле засыпал бы
 * лог записями `error`. Имена — поле `type` ошибок `@auth/core/errors`.
 */
export const AUTH_CLIENT_ERRORS: ReadonlySet<string> = new Set([
  'AccessDenied',
  'InvalidCallbackUrl',
  'InvalidCheck',
  'InvalidProvider',
  'JWTSessionError',
  'MissingCSRF',
  'OAuthAccountNotLinked',
  'UnknownAction',
  'Verification',
]);
