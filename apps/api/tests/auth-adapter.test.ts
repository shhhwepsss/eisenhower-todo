import type { Adapter, AdapterAccount, AdapterUser } from '@auth/core/adapters';
import { createNeonAuthAdapter } from '../src/db/neon/neon-auth-adapter';
import { NeonSchemaMigrator } from '../src/db/neon/neon-schema-migrator';
import type { SchemaMigrator } from '../src/types';
import { MIGRATIONS_FOLDER, STAND_URL, queryStand, readJournal, resetStand, tableExists } from './fixtures/stand';
import type { Row } from './fixtures/stand';

/**
 * Таблицы входа и адаптер Auth.js на настоящем драйвере Neon против стенда
 * (docs/specs/52-google-auth.md). Адаптер вызывается так же, как его зовёт Auth.js при
 * входе; в базу тест смотрит своим соединением.
 */
const HAS_STAND: boolean = STAND_URL !== undefined;
const STAND: string = STAND_URL ?? '';

const GOOGLE_SUBJECT: string = '108204268033311374519';

const PROFILE: AdapterUser = {
  id: 'ignored-by-adapter',
  name: 'Анна Смирнова',
  email: 'anna@example.com',
  emailVerified: null,
  image: 'https://lh3.googleusercontent.com/a/photo',
};

const accountOf = (userId: string): AdapterAccount => {
  return {
    userId,
    type: 'oidc',
    provider: 'google',
    providerAccountId: GOOGLE_SUBJECT,
    access_token: 'access-token',
    id_token: 'id-token',
    expires_at: 1_791_000_000,
    token_type: 'bearer',
    scope: 'openid email profile',
  };
};

/** Обязательные методы адаптера: у типа `Adapter` каждый метод опционален. */
type LoginAdapter = Required<Pick<Adapter, 'createUser' | 'linkAccount' | 'getUserByAccount' | 'getUserByEmail'>>;

const createAdapter = (): LoginAdapter => {
  const adapter: Adapter = createNeonAuthAdapter(STAND);
  return adapter as LoginAdapter;
};

const countRows = async (table: string): Promise<number> => {
  const rows: Row[] = await queryStand(`select count(*)::int as total from ${table}`);
  return rows[0]?.total as number;
};

describe.skipIf(!HAS_STAND)('таблицы входа и адаптер Auth.js на стенде', () => {
  beforeEach(async () => {
    await resetStand();
    const migrator: SchemaMigrator = new NeonSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    await migrator.migrate();
  }, 30_000);

  it('миграция создаёт users и accounts; повторный прогон журнал не меняет', async () => {
    const migrator: SchemaMigrator = new NeonSchemaMigrator(STAND, MIGRATIONS_FOLDER);
    const journalBefore: Row[] = await readJournal();
    await migrator.migrate();
    const journalAfter: Row[] = await readJournal();
    const hasUsers: boolean = await tableExists('users');
    const hasAccounts: boolean = await tableExists('accounts');

    expect(hasUsers).toBe(true);
    expect(hasAccounts).toBe(true);
    expect(journalAfter).toEqual(journalBefore);
  }, 30_000);

  it('первый вход: createUser и linkAccount, затем getUserByAccount находит того же пользователя', async () => {
    const adapter: LoginAdapter = createAdapter();
    const created: AdapterUser = await adapter.createUser(PROFILE);
    const account: AdapterAccount = accountOf(created.id);
    await adapter.linkAccount(account);
    const found: AdapterUser | null = await adapter.getUserByAccount({
      provider: 'google',
      providerAccountId: GOOGLE_SUBJECT,
    });

    expect(found?.id).toBe(created.id);
    expect(found?.email).toBe(PROFILE.email);
    expect(found?.name).toBe(PROFILE.name);
  }, 30_000);

  it('идентификатор пользователя выдаёт приложение, время создания — база', async () => {
    const adapter: LoginAdapter = createAdapter();
    const created: AdapterUser = await adapter.createUser(PROFILE);
    const rows: Row[] = await queryStand('select id, created_at, email_verified from users');

    expect(created.id).not.toBe(PROFILE.id);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.id).toBe(created.id);
    // Ровно три знака миллисекунд: `timestamptz(3)`, как у времени задач в #46.
    expect(rows[0]?.created_at).toMatch(/\.\d{3}\+00$/);
    expect(rows[0]?.email_verified).toBeNull();
  }, 30_000);

  it('неизвестный аккаунт Google: getUserByAccount отдаёт null', async () => {
    const adapter: LoginAdapter = createAdapter();
    const found: AdapterUser | null = await adapter.getUserByAccount({
      provider: 'google',
      providerAccountId: GOOGLE_SUBJECT,
    });

    expect(found).toBeNull();
  }, 30_000);

  it('ONE_USER_PER_GOOGLE_ACCOUNT: второй createUser с той же почтой падает, строка одна', async () => {
    const adapter: LoginAdapter = createAdapter();
    await adapter.createUser(PROFILE);
    const createAgain = async (): Promise<AdapterUser> => adapter.createUser(PROFILE);
    const second: Promise<AdapterUser> = createAgain();

    await expect(second).rejects.toThrow();
    const total: number = await countRows('users');
    expect(total).toBe(1);
  }, 30_000);

  it('ONE_USER_PER_GOOGLE_ACCOUNT: второй linkAccount того же аккаунта падает, строка одна', async () => {
    const adapter: LoginAdapter = createAdapter();
    const created: AdapterUser = await adapter.createUser(PROFILE);
    const account: AdapterAccount = accountOf(created.id);
    await adapter.linkAccount(account);
    const linkAgain = async (): Promise<unknown> => adapter.linkAccount(account);
    const second: Promise<unknown> = linkAgain();

    await expect(second).rejects.toThrow();
    const total: number = await countRows('accounts');
    expect(total).toBe(1);
  }, 30_000);

  it('аккаунт без пользователя не создаётся: внешний ключ', async () => {
    const adapter: LoginAdapter = createAdapter();
    const orphan: AdapterAccount = accountOf('no-such-user');
    const linkOrphan = async (): Promise<unknown> => adapter.linkAccount(orphan);
    const linked: Promise<unknown> = linkOrphan();

    await expect(linked).rejects.toThrow();
    const total: number = await countRows('accounts');
    expect(total).toBe(0);
  }, 30_000);

  it('оборванный первый вход: пользователь без аккаунта находится по почте', async () => {
    const adapter: LoginAdapter = createAdapter();
    const created: AdapterUser = await adapter.createUser(PROFILE);
    const byAccount: AdapterUser | null = await adapter.getUserByAccount({
      provider: 'google',
      providerAccountId: GOOGLE_SUBJECT,
    });
    const byEmail: AdapterUser | null = await adapter.getUserByEmail(PROFILE.email);

    expect(byAccount).toBeNull();
    expect(byEmail?.id).toBe(created.id);
  }, 30_000);
});
