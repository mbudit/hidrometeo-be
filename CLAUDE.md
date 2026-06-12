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

# Database Migrations
npm run migration:run    # Compile database library and run pending migrations
npm run migration:revert # Revert the last applied migration
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

### `@app/database` — TypeORM + TimescaleDB

```
libs/database/src/
├── index.ts                 # Barrel export (module, datasource, entities)
├── database.module.ts       # Configures global TypeOrmModule.forRootAsync
├── database.service.ts      # Skeletal DatabaseService
├── data-source.ts           # TypeORM CLI DataSource configuration
├── entities/                # TypeORM entity definitions
│   ├── index.ts             # Barrel export for all entities
│   ├── station.entity.ts
│   ├── sensor-reading.entity.ts (hypertable)
│   ├── sensor-alert.entity.ts
│   ├── sync-queue.entity.ts
│   ├── camera.entity.ts
│   ├── camera-snapshot.entity.ts
│   ├── aircraft.entity.ts
│   ├── aircraft-track.entity.ts (hypertable)
│   ├── geofence.entity.ts
│   ├── geofence-event.entity.ts
│   ├── device-node.entity.ts
│   └── alert-rule.entity.ts
└── migrations/              # Database migrations
    ├── 1780587140000-InitialSchema.ts
    └── 1781074719000-OptimizeADSB.ts
```

### ADSBMAS Microservice (`apps/adsbmas`)

The ADSBMAS microservice manages real-time ADS-B aircraft data acquisition, tracking, geofence analysis, and web telemetry broadcasting.

#### Module Architecture & Data Flows

```
  [PyQt Receiver App] 
          │ (TCP port 30105, SBS-1 format)
          ▼
   AdsbIngestionModule (SBS-1 Parser)
          │ (Forward state)
          ▼
    TrackingModule ──(Geofence checks)──► GeofenceModule (Ray-casting point-in-polygon)
          │                                      │
          ├─► WebSocket Gateway (Port 3005)      ├─► WebSocket Gateway (Alerts)
          │   (/ws/aircraft Socket.IO namespace) │
          ▼                                      ▼
    TimescaleDB (Batch coordinate inserts)  postgres.geofence_events (Crossovers)
```

#### Key Functional Components
* **`AdsbIngestionModule`**: Spawns a TCP socket server on port `30105` that parses incoming SBS-1 transponder telemetry lines, extracts aircraft details, and routes them to the tracker.
* **`TrackingModule`**: Maintains an in-memory active aircraft cache, calculates heading and velocity dynamically (using Haversine/Bearing equations), evicts stale targets (idle > 60s), broadcasts eviction notices (`aircraft-evicted`) via WebSocket, and flushes batches of flight coordinates to TimescaleDB every 5 seconds.
* **`GeofenceModule`**: Caches geofence definitions, implements a fast point-in-polygon ray-casting algorithm to test whether an aircraft is inside each geofence on every coordinate change, writes enter/exit crossovers to the `geofence_events` table, broadcasts alerts, and handles soft-deletion (`is_active = false`) of geofences to preserve crossover event logs.
* **`PlaybackModule`**: Performs historical queries against TimescaleDB coordinates filtered by `icao24` and time boundaries.
* **`GatewayModule`**: Hosts the Socket.IO gateway on port `3005` at the `/ws/aircraft` namespace, pushing real-time position reports (`aircraft-update`), eviction alerts (`aircraft-evicted`), and crossover events (`geofence-alert`).

#### REST API Routes

| Method | Path | Description | Access |
|---|---|---|---|
| `POST` | `/auth/login` | User login (returns access & refresh token pairs) | Public |
| `GET` | `/aircraft/live` | Retrieves currently active aircraft states | Operator, Admin |
| `GET` | `/aircraft/:icao24` | Retrieves specific metadata and latest coordinates | Operator, Admin |
| `GET` | `/aircraft/:icao24/history` | Retrieves historical tracking coordinates for playback | Operator, Admin |
| `GET` | `/geofences` | Retrieves active geofences | Operator, Admin |
| `POST` | `/geofences` | Creates a new geofence zone (stores GeoJSON polygon) | Admin |
| `DELETE` | `/geofences/:id` | Soft-deletes a geofence zone (`is_active = false`) | Admin |
| `GET` | `/geofences/events` | Retrieves logs of geofence crossing events | Operator, Admin |

---

## Infrastructure (Docker Compose)

| Service       | Image                              | Ports                                      |
|---------------|------------------------------------|--------------------------------------------|
| TimescaleDB   | `timescale/timescaledb:latest-pg16`| 5432                                       |
| EMQX          | `emqx/emqx`                        | 1883, 8083, 8084, 8883, 18083 (dashboard)  |
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
