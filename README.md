# Mezon Campus

## Migration Convention

`sample-campus` follows the same migration convention:

- Schema-only change:
  use `migration:generate` so TypeORM diffs entity metadata against the database schema.
- Data migration / enum migration / backfill:
  use `migration:create`, then write the migration by hand and use helpers from `#src/utils/migration` or `#src/utils`.

### Commands

Create an empty migration:

```bash
yarn migration:create ./database/migrations/create-users-profile
```

Generate a schema diff migration:

```bash
yarn migration:generate ./database/migrations/update-users-profile
```

Run migrations:

```bash
yarn migrate
```

Rollback last migration:

```bash
yarn migrate:rollback
```

Reset and rerun all migrations:

```bash
yarn migrate:fresh
```

## Local Docker

For a local stack with preconfigured infra, use the compose file inside `sample-campus`:

```bash
cd sample-campus
docker compose up -d --build --remove-orphans
```

This starts every service declared in [sample-campus/docker-compose.yml](/Users/macbookpro/onramp-backend/sample-campus/docker-compose.yml):

- `sample-campus-postgres` on `localhost:5433`
- `sample-campus` on `localhost:4000`

The app container loads [sample-campus/.env](/Users/macbookpro/onramp-backend/sample-campus/.env) and then overrides the database connection to use the internal Compose host `sample-campus-postgres`.

The `sample-campus` app container will:

- wait for Postgres
- run `yarn migrate`
- start the Nest app

For local Docker only, `NEZON_DISABLE_BOOTSTRAP=true` is injected by compose so the app does not try to log in to the real Mezon service with a local placeholder token.

### Manual Migration Helpers

For manual migrations, import helpers the same way as `onramp-api`:

```ts
import { insertInMigration, updateInMigration } from '#src/utils/migration';
```

or:

```ts
import { insertInMigration, bulkUpdateInMigration } from '#src/utils';
```

Use this style for:

- seed-like inserts
- enum value changes
- bulk backfills
- data cleanup / patch migrations
