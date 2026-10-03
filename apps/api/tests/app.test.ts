import { app } from '../src/app';

/** Ответ API на запрос к пути под `/api` (docs/specs/50-api-skeleton.md). */
const requestApi = async (path: string): Promise<Response> => {
  const request: Request = new Request(`http://localhost${path}`);
  return app.fetch(request);
};

describe('API', () => {
  it('/api/health отвечает 200 и версией сборки', async () => {
    const response: Response = await requestApi('/api/health');
    const body: unknown = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: 'ok', version: 'dev' });
  });

  it('неизвестный путь под /api — 404 в JSON, а не HTML', async () => {
    const response: Response = await requestApi('/api/unknown');
    const body: unknown = await response.json();

    expect(response.status).toBe(404);
    expect(response.headers.get('content-type')).toMatch(/^application\/json/);
    expect(body).toEqual({ error: 'not_found' });
  });

  it('ONE_ORIGIN: ответ без CORS-заголовков', async () => {
    const response: Response = await requestApi('/api/health');

    expect(response.headers.get('access-control-allow-origin')).toBeNull();
  });
});
