import { neonConfig } from '@neondatabase/serverless';
import { STAND_HOST, STAND_PROXY_PORT } from './constants/neon-stand.constant';

/**
 * Направляет драйвер Neon на локальный стенд, если база — стенд
 * (docs/specs/51-db-migrations.md, «Проверка в разработке и в CI»). У настоящего Neon
 * адреса HTTP и WebSocket драйвер выводит из имени хоста сам, а прокси стенда слушает
 * один порт без TLS — это ему и сообщается. Для любого другого хоста настройки не
 * трогаются: на проде эта функция ничего не делает.
 */
export const configureNeonFor = (databaseUrl: string): void => {
  const url: URL = new URL(databaseUrl);
  if (url.hostname !== STAND_HOST) return;
  const proxy: string = `${STAND_HOST}:${STAND_PROXY_PORT}`;
  neonConfig.fetchEndpoint = `http://${proxy}/sql`;
  neonConfig.wsProxy = (): string => `${proxy}/v2`;
  neonConfig.useSecureWebSocket = false;
  neonConfig.pipelineTLS = false;
  neonConfig.pipelineConnect = false;
};
