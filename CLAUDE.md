# CLAUDE.md — HidroMeteo Backend

## Project Overview

HidroMeteo Backend is a **NestJS monorepo** for hydrometeorological data acquisition and processing. It consists of 8 microservice applications and 7 shared libraries, all managed from a single codebase.

## Tech Stack

- **Runtime**: Node.js with TypeScript (strict mode)
- **Framework**: NestJS 11 (monorepo mode)
- **Module System**: `nodenext` (requires `.js` extensions in relative imports)
- **Database**: TimescaleDB (PostgreSQL 16 with time-series extensions)
- **Message Broker**: EMQX (MQTT)
- **Auth**: Passport + JWT (bcrypt, class-validator, class-transformer)
- **ORM**: TypeORM
- **Logging**: Winston (via nest-winston)
- **Monitoring**: Prometheus + Grafana
- **Reverse Proxy**: Nginx

## Monorepo Structure

```
hidrometeo-be/
├── apps/                    # 8 microservice applications
│   ├── aadts/               # Port 3001
│   ├── apms/                # Port 3002
│   ├── sams/                # Port 3003
│   ├── mvms/                # Port 3004
│   ├── adsbmas/             # Port 3005
│   ├── wsdas/               # Port 3006
│   ├── vims/                # Port 3007
│   └── mdps/                # Port 3008
├── libs/                    # 7 shared libraries
│   ├── auth/                # @app/auth — Authentication & JWT
│   ├── users/               # @app/users — User management
│   ├── database/            # @app/database — TypeORM + TimescaleDB
│   ├── mqtt/                # @app/mqtt — MQTT client wrapper
│   ├── gateway/             # @app/gateway — API gateway utilities
│   ├── logger/              # @app/logger — Winston logging
│   └── config/              # @app/config — Configuration management
├── nest-cli.json            # NestJS monorepo project definitions
├── tsconfig.json            # Root tsconfig (strict, path aliases)
├── docker-compose.yml       # Infrastructure services
└── .env.example             # Environment variable template
```

## Commands

```bash
# Development — start a specific app in watch mode
npm run start:dev:aadts
npm run start:dev:apms
npm run start:dev:sams
npm run start:dev:mvms
npm run start:dev:adsbmas
npm run start:dev:wsdas
npm run start:dev:vims
npm run start:dev:mdps

# Build a specific app
npm run build:aadts    # (or any app name)

# Build default app (aadts)
npm run build

# Lint
npm run lint

# Test
npm run test

# Start infrastructure
docker compose up -d
```

## Code Conventions

### TypeScript
- **Strict mode** is enabled (`"strict": true` in tsconfig.json)
- **Module resolution**: `nodenext` — always use `.js` extensions in relative imports:
  ```typescript
  // ✅ Correct
  import { FooService } from './foo.service.js';
  
  // ❌ Wrong — will fail with nodenext
  import { FooService } from './foo.service';
  ```
- **Target**: ES2023
- Decorators are enabled (`emitDecoratorMetadata`, `experimentalDecorators`)

### Path Aliases
Import shared libraries using `@app/*` aliases (defined in tsconfig.json `paths`):
```typescript
import { AuthModule } from '@app/auth';
import { DatabaseModule } from '@app/database';
import { MqttModule } from '@app/mqtt';
import { LoggerModule } from '@app/logger';
import { AppConfigModule } from '@app/config';
```

### Naming
- **Config lib** uses `AppConfigModule` / `AppConfigService` to avoid collision with `@nestjs/config`'s `ConfigModule` / `ConfigService`
- Each app's module/controller/service is prefixed with the app name (e.g., `AadtsModule`, `AadtsController`, `AadtsService`)

### Formatting
- **Prettier**: single quotes, trailing commas
- **ESLint**: typescript-eslint with prettier integration, `no-explicit-any` off, `no-floating-promises` warn

## App Structure

Each app under `apps/<name>/` follows this layout:
```
apps/<name>/
├── src/
│   ├── main.ts              # Bootstrap, listens on assigned port
│   ├── <name>.module.ts     # Root module
│   ├── <name>.controller.ts # HTTP controllers
│   └── <name>.service.ts    # Business logic services
└── tsconfig.app.json        # Extends root tsconfig.json
```

## Library Structure

Each lib under `libs/<name>/` follows this layout:
```
libs/<name>/
├── src/
│   ├── index.ts             # Barrel export (re-exports module + service)
│   ├── <name>.module.ts     # NestJS module (providers + exports)
│   └── <name>.service.ts    # Injectable service
└── tsconfig.lib.json        # Extends root tsconfig.json
```

## Auth & Users Libraries (Implemented)

### `@app/users` — User Entity & Service

```
libs/users/src/
├── index.ts                 # Barrel export
├── user-role.enum.ts        # UserRole enum
├── user.entity.ts           # TypeORM entity
├── users.module.ts          # Registers User entity with TypeORM
└── users.service.ts         # CRUD + refresh token management
```

**User Entity** (`users` table):

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK, auto-generated |
| `email` | `varchar` | unique |
| `password_hash` | `varchar` | bcrypt-hashed |
| `name` | `varchar` | — |
| `role` | `enum` | `superadmin`, `admin`, `operator`, `viewer` (default: `viewer`) |
| `software_access` | `simple-array` | e.g. `['APMS','SAMS']` |
| `refresh_token_hash` | `varchar`, nullable | bcrypt-hashed refresh token (single session per user) |
| `is_active` | `boolean` | default `true` |
| `created_at` | `timestamptz` | auto |
| `updated_at` | `timestamptz` | auto |

**UsersService methods**: `findByEmail()`, `findById()`, `updateRefreshToken()`, `create()` (hashes password with bcrypt)

### `@app/auth` — Authentication & Authorization

```
libs/auth/src/
├── index.ts                           # Barrel export (all public API)
├── auth.module.ts                     # Wires Passport, JWT, UsersModule
├── auth.service.ts                    # Login, refresh, logout, token generation
├── auth.controller.ts                 # POST /auth/login, POST /auth/refresh
├── dto/
│   ├── login.dto.ts                   # { email, password } with class-validator
│   └── refresh-token.dto.ts           # { refresh_token }
├── interfaces/
│   └── jwt-payload.interface.ts       # { sub, email, role, software_access }
├── strategies/
│   └── jwt.strategy.ts                # Passport JWT strategy (Bearer token)
├── guards/
│   ├── jwt-auth.guard.ts              # AuthGuard('jwt') wrapper
│   ├── roles.guard.ts                 # Checks @Roles() metadata vs JWT role
│   └── software-access.guard.ts       # Checks @SoftwareAccess() vs JWT; superadmin bypasses
└── decorators/
    ├── current-user.decorator.ts      # @CurrentUser() → JwtPayload from request
    ├── roles.decorator.ts             # @Roles(UserRole.ADMIN, ...)
    └── software-access.decorator.ts   # @SoftwareAccess('APMS')
```

**Auth Endpoints** (auto-registered when `AuthModule` is imported):
- `POST /auth/login` — validates credentials, returns `{ access_token, refresh_token }`
- `POST /auth/refresh` — rotates refresh token (reuse detection), returns new token pair

**JWT Payload**: `{ sub: userId, email, role, software_access }`
- Access token signed with `JWT_SECRET`, expires per `JWT_EXPIRES_IN`
- Refresh token signed with `JWT_REFRESH_SECRET`, expires per `JWT_REFRESH_EXPIRES_IN`

**Guards** (stack order: `JwtAuthGuard` → `RolesGuard` → `SoftwareAccessGuard`):
- `JwtAuthGuard` — validates Bearer token, attaches `JwtPayload` to `request.user`
- `RolesGuard` — reads `@Roles(...)` decorator, rejects if user role not in list
- `SoftwareAccessGuard` — reads `@SoftwareAccess('APMS')` decorator, rejects if user's `software_access` doesn't include it. **Superadmin bypasses this guard.**

**Usage in an app**:
```typescript
// apps/apms/src/apms.module.ts
import { AuthModule } from '@app/auth';

@Module({
  imports: [ConfigModule.forRoot(), DatabaseModule, AuthModule],
})
export class ApmsModule {}

// apps/apms/src/stations.controller.ts
import { JwtAuthGuard, RolesGuard, SoftwareAccessGuard,
         Roles, SoftwareAccess, CurrentUser, JwtPayload } from '@app/auth';
import { UserRole } from '@app/users';

@Controller('stations')
@SoftwareAccess('APMS')
@UseGuards(JwtAuthGuard, RolesGuard, SoftwareAccessGuard)
export class StationsController {
  @Get()
  @Roles(UserRole.ADMIN, UserRole.OPERATOR)
  findAll(@CurrentUser() user: JwtPayload) {
    // user.sub, user.email, user.role, user.software_access
  }
}
```

## Infrastructure (Docker Compose)

| Service       | Image                              | Ports                                      |
|---------------|------------------------------------|--------------------------------------------|
| TimescaleDB   | `timescale/timescaledb:latest-pg16`| 5432                                       |
| EMQX          | `emqx/emqx`                       | 1883, 8083, 8084, 8883, 18083 (dashboard)  |
| Prometheus    | `prom/prometheus`                  | 9090                                       |
| Grafana       | `grafana/grafana`                  | 3000                                       |
| Nginx         | `nginx:alpine`                     | 80, 443                                    |

## Environment Variables

Copy `.env.example` to `.env` before running. Key groups:
- `DB_*` — TimescaleDB connection
- `MQTT_*` — EMQX broker connection
- `JWT_*` — Authentication secrets
- `GRAFANA_*` — Grafana admin credentials
- `*_PORT` — Per-service port assignments (3001–3008)
