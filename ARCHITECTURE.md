# Age of Empires II Web - Architecture Document

## 🎯 Project Overview

A web-based real-time strategy game inspired by Age of Empires II: Definitive Edition, featuring:
- Real-time multiplayer (2-8 players)
- Classic RTS gameplay mechanics
- Multiple civilizations with unique bonuses
- Advanced AI opponents
- Replay system and spectator mode

---

## 📋 Core Requirements

### Performance Targets
- **Rendering**: 60 FPS with 500+ units on screen
- **Input Latency**: <100ms for local actions
- **Network Latency**: <150ms for multiplayer synchronization
- **Unit Pathfinding**: Handle 200+ units simultaneously
- **Memory**: <500MB for game client

### Gameplay Features
- ✅ Resource gathering (Food, Wood, Gold, Stone)
- ✅ Multiple unit types (Infantry, Archers, Cavalry, Siege)
- ✅ Building construction and tech tree
- ✅ Fog of War and line of sight
- ✅ Formation movement
- ✅ Unit combat with different damage types
- ✅ Multiplayer with matchmaking
- ✅ AI opponents with difficulty levels
- ✅ Replay system
- ✅ Map editor

---

## 🏗️ Technology Stack

### Frontend
```
Framework:     Vue 3 (Composition API)
UI Library:    Quasar Framework
Rendering:     WebGL (Three.js) + Canvas 2D fallback
State:         Pinia (Vue state management)
Networking:    WebSocket (native) + Socket.io
Performance:   WebAssembly (for game logic core)
```

### Backend
```
API Server:    Django 4.x + Django REST Framework
Real-time:     Django Channels (WebSocket)
Task Queue:    Celery + Redis
AI Engine:     Python (with optional C++ extensions)
Database:      PostgreSQL 15+
Cache:         Redis 7+
```

### WebAssembly Components (C++/Rust)
```
- Pathfinding (A* algorithm)
- Collision detection (spatial hashing)
- Game state simulation
- Combat calculations
- Map generation
```

### DevOps
```
Containerization: Docker + Docker Compose
CI/CD:           GitHub Actions
Hosting:         AWS/GCP/DigitalOcean
CDN:             CloudFlare
Monitoring:      Prometheus + Grafana
```

---

## 🎮 Client Architecture

### Directory Structure
```
/client
├── /public
│   ├── assets/
│   │   ├── sprites/          # Unit and building sprites
│   │   ├── terrain/          # Terrain textures
│   │   ├── audio/            # Sound effects and music
│   │   └── ui/               # UI icons and elements
│   └── wasm/                 # Compiled WebAssembly modules
│
├── /src
│   ├── /core                 # Game engine core
│   │   ├── Engine.js         # Main game loop
│   │   ├── EntityManager.js  # ECS-based entity system
│   │   ├── EventBus.js       # Event system
│   │   └── constants.js      # Game constants
│   │
│   ├── /rendering            # Rendering layer
│   │   ├── Renderer.js       # Main renderer (WebGL/Canvas)
│   │   ├── Camera.js         # Camera controls
│   │   ├── SpriteManager.js  # Sprite loading/caching
│   │   ├── TerrainRenderer.js
│   │   ├── UnitRenderer.js
│   │   └── UIRenderer.js
│   │
│   ├── /game-logic          # Game systems
│   │   ├── /systems
│   │   │   ├── MovementSystem.js
│   │   │   ├── CombatSystem.js
│   │   │   ├── ResourceSystem.js
│   │   │   ├── ProductionSystem.js
│   │   │   ├── TechTreeSystem.js
│   │   │   └── VisionSystem.js
│   │   ├── /entities
│   │   │   ├── Unit.js
│   │   │   ├── Building.js
│   │   │   ├── Resource.js
│   │   │   └── Projectile.js
│   │   └── GameState.js      # Central game state
│   │
│   ├── /pathfinding         # Pathfinding system
│   │   ├── PathfindingManager.js
│   │   ├── AStar.js          # A* implementation
│   │   ├── FlowField.js      # Flow field pathfinding
│   │   ├── NavMesh.js        # Navigation mesh
│   │   └── wasm-bridge.js    # WASM pathfinding bridge
│   │
│   ├── /networking          # Network layer
│   │   ├── NetworkManager.js
│   │   ├── WebSocketClient.js
│   │   ├── StateSync.js      # State synchronization
│   │   ├── ClientPrediction.js
│   │   ├── ServerReconciliation.js
│   │   └── ReplayRecorder.js
│   │
│   ├── /input               # Input handling
│   │   ├── InputManager.js
│   │   ├── MouseHandler.js
│   │   ├── KeyboardHandler.js
│   │   ├── SelectionBox.js
│   │   └── CommandIssuer.js
│   │
│   ├── /ui                  # Vue components
│   │   ├── /game
│   │   │   ├── GameHUD.vue
│   │   │   ├── MiniMap.vue
│   │   │   ├── ResourceBar.vue
│   │   │   ├── UnitPanel.vue
│   │   │   ├── CommandPanel.vue
│   │   │   └── TechTree.vue
│   │   ├── /menu
│   │   │   ├── MainMenu.vue
│   │   │   ├── Lobby.vue
│   │   │   ├── Settings.vue
│   │   │   └── Leaderboard.vue
│   │   └── /shared
│   │       ├── Button.vue
│   │       ├── Modal.vue
│   │       └── Tooltip.vue
│   │
│   ├── /wasm                # WebAssembly interfaces
│   │   ├── pathfinding.js
│   │   ├── collision.js
│   │   └── simulation.js
│   │
│   ├── /data                # Game data
│   │   ├── civilizations.json
│   │   ├── units.json
│   │   ├── buildings.json
│   │   ├── technologies.json
│   │   └── maps.json
│   │
│   ├── /utils               # Utilities
│   │   ├── math.js
│   │   ├── geometry.js
│   │   ├── pool.js          # Object pooling
│   │   └── logger.js
│   │
│   ├── App.vue
│   ├── main.js
│   └── router.js
│
├── package.json
├── vite.config.js
└── quasar.config.js
```

---

## 🖥️ Server Architecture

### Directory Structure
```
/server
├── /aoe2_server            # Django project
│   ├── settings.py
│   ├── urls.py
│   ├── asgi.py             # ASGI config for WebSockets
│   └── wsgi.py
│
├── /apps
│   ├── /accounts           # User management
│   │   ├── models.py
│   │   ├── serializers.py
│   │   ├── views.py
│   │   └── urls.py
│   │
│   ├── /matchmaking        # Lobby and matchmaking
│   │   ├── models.py
│   │   ├── services.py     # Matchmaking logic
│   │   ├── consumers.py    # WebSocket consumers
│   │   └── urls.py
│   │
│   ├── /game_server        # Game instance management
│   │   ├── /core
│   │   │   ├── GameInstance.py
│   │   │   ├── GameState.py
│   │   │   ├── CommandValidator.py
│   │   │   └── StateReconciliation.py
│   │   ├── /systems
│   │   │   ├── MovementSystem.py
│   │   │   ├── CombatSystem.py
│   │   │   ├── EconomySystem.py
│   │   │   └── VisionSystem.py
│   │   ├── consumers.py    # Game WebSocket consumer
│   │   └── models.py
│   │
│   ├── /ai_engine          # AI opponents
│   │   ├── /bots
│   │   │   ├── BaseBot.py
│   │   │   ├── EasyBot.py
│   │   │   ├── MediumBot.py
│   │   │   └── HardBot.py
│   │   ├── /strategy
│   │   │   ├── BuildOrder.py
│   │   │   ├── MicroManagement.py
│   │   │   ├── MacroManagement.py
│   │   │   └── DecisionTree.py
│   │   └── BotController.py
│   │
│   ├── /replay             # Replay system
│   │   ├── models.py
│   │   ├── recorder.py
│   │   ├── player.py
│   │   └── views.py
│   │
│   └── /leaderboard        # Rankings
│       ├── models.py
│       ├── elo.py          # ELO rating system
│       └── views.py
│
├── /data                   # Game data definitions
│   ├── civilizations.json
│   ├── units.json
│   ├── buildings.json
│   ├── technologies.json
│   └── maps.json
│
├── requirements.txt
├── Dockerfile
└── docker-compose.yml
```

---

## 🧮 WebAssembly Integration

### Why WebAssembly?
- **Pathfinding**: 10-50x faster than JavaScript A*
- **Collision Detection**: Near-native performance for spatial queries
- **Game State Simulation**: Fast local prediction and replay
- **Deterministic**: Exact same results across all clients

### WASM Modules (Rust/C++)

#### 1. Pathfinding Module (`wasm-pathfinding/`)
```rust
// src/lib.rs
#[wasm_bindgen]
pub struct PathfindingEngine {
    grid: Grid,
    cache: HashMap<(i32, i32), Vec<Point>>
}

#[wasm_bindgen]
impl PathfindingEngine {
    pub fn new(width: usize, height: usize) -> PathfindingEngine { }
    pub fn find_path(&self, start: Point, goal: Point) -> Vec<Point> { }
    pub fn update_obstacles(&mut self, obstacles: Vec<Point>) { }
}
```

#### 2. Collision Detection Module (`wasm-collision/`)
```rust
#[wasm_bindgen]
pub struct SpatialHash {
    cell_size: f32,
    cells: HashMap<(i32, i32), Vec<EntityId>>
}

#[wasm_bindgen]
impl SpatialHash {
    pub fn query_range(&self, x: f32, y: f32, radius: f32) -> Vec<EntityId> { }
    pub fn insert(&mut self, id: EntityId, x: f32, y: f32) { }
}
```

#### 3. Game Simulation Module (`wasm-simulation/`)
```rust
#[wasm_bindgen]
pub struct GameSimulator {
    state: GameState
}

#[wasm_bindgen]
impl GameSimulator {
    pub fn tick(&mut self, commands: Vec<Command>) -> Vec<StateUpdate> { }
    pub fn validate_command(&self, cmd: Command) -> bool { }
}
```

### JavaScript ↔ WASM Bridge
```javascript
// client/src/wasm/pathfinding.js
import init, { PathfindingEngine } from '@/wasm/pathfinding_bg.wasm';

class WasmPathfinding {
  async initialize() {
    await init();
    this.engine = PathfindingEngine.new(MAP_WIDTH, MAP_HEIGHT);
  }

  findPath(start, goal) {
    return this.engine.find_path(start, goal);
  }
}
```

---

## 🔄 Network Architecture

### Client-Server Communication Model

```
┌─────────────┐                  ┌─────────────┐
│   Client 1  │◄────WebSocket────►│             │
├─────────────┤                  │   Game      │
│ Prediction  │                  │   Server    │
│ Rendering   │                  │ (Django     │
└─────────────┘                  │  Channels)  │
                                 │             │
┌─────────────┐                  │ Validates   │
│   Client 2  │◄────WebSocket────►│ Simulates   │
├─────────────┤                  │ Broadcasts  │
│ Prediction  │                  └─────────────┘
│ Rendering   │                        │
└─────────────┘                        │
                                       ▼
                                 ┌─────────────┐
                                 │  PostgreSQL │
                                 │   + Redis   │
                                 └─────────────┘
```

### Message Protocol

#### Client → Server (Commands)
```javascript
{
  type: 'COMMAND',
  seq: 12345,              // Sequence number
  timestamp: 1699999999,   // Client timestamp
  commands: [
    {
      type: 'MOVE_UNITS',
      unitIds: [1, 2, 3],
      target: { x: 100, y: 200 }
    },
    {
      type: 'BUILD',
      buildingType: 'barracks',
      position: { x: 50, y: 75 }
    }
  ]
}
```

#### Server → Client (State Updates)
```javascript
{
  type: 'STATE_UPDATE',
  tick: 5000,              // Server tick number
  timestamp: 1699999999,   // Server timestamp
  updates: [
    {
      type: 'UNIT_MOVED',
      unitId: 1,
      position: { x: 95, y: 195 },
      velocity: { x: 1.5, y: 1.5 }
    },
    {
      type: 'UNIT_ATTACKED',
      attackerId: 2,
      targetId: 10,
      damage: 5
    }
  ]
}
```

### State Synchronization Strategy

1. **Client-Side Prediction**: Client immediately applies commands locally
2. **Server Authority**: Server validates and simulates all commands
3. **Reconciliation**: Client adjusts state based on authoritative server updates
4. **Lag Compensation**: Server uses client timestamps for hit detection

```javascript
// Simplified reconciliation
class StateReconciliation {
  reconcile(serverState, clientState) {
    // 1. Apply server state
    this.applyServerState(serverState);

    // 2. Re-apply unacknowledged client commands
    const unackedCommands = this.getUnacknowledgedCommands(serverState.lastAckSeq);
    for (const cmd of unackedCommands) {
      this.applyCommand(cmd);
    }
  }
}
```

---

## 🗄️ Database Schema

### PostgreSQL Tables

```sql
-- Users and authentication
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    elo_rating INTEGER DEFAULT 1000,
    games_played INTEGER DEFAULT 0,
    games_won INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Civilizations
CREATE TABLE civilizations (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    bonuses JSONB NOT NULL,
    unique_units JSONB NOT NULL,
    unique_techs JSONB NOT NULL
);

-- Game matches
CREATE TABLE games (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    map_type VARCHAR(50) NOT NULL,
    game_mode VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL,  -- 'waiting', 'in_progress', 'completed'
    created_at TIMESTAMP DEFAULT NOW(),
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    winner_id UUID REFERENCES users(id),
    replay_data_url TEXT
);

-- Game players
CREATE TABLE game_players (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    civilization_id INTEGER REFERENCES civilizations(id),
    team INTEGER,
    color INTEGER,
    position INTEGER,
    is_ai BOOLEAN DEFAULT FALSE,
    ai_difficulty VARCHAR(20),
    final_score INTEGER
);

-- Replay data (stored in chunks)
CREATE TABLE replay_chunks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    game_id UUID REFERENCES games(id) ON DELETE CASCADE,
    chunk_number INTEGER NOT NULL,
    tick_start INTEGER NOT NULL,
    tick_end INTEGER NOT NULL,
    data BYTEA NOT NULL,  -- Compressed command stream
    UNIQUE(game_id, chunk_number)
);

-- Leaderboard
CREATE TABLE leaderboard (
    user_id UUID REFERENCES users(id) PRIMARY KEY,
    rank INTEGER,
    elo_rating INTEGER,
    games_played INTEGER,
    win_rate DECIMAL(5, 2),
    updated_at TIMESTAMP DEFAULT NOW()
);
```

### Redis Data Structures

```
# Active game sessions
game:{game_id}:state          → Hash (current game state)
game:{game_id}:players        → Set (connected player IDs)
game:{game_id}:commands       → List (command queue)

# Matchmaking
matchmaking:queue:{elo_range} → Sorted Set (players by wait time)
matchmaking:player:{user_id}  → Hash (player preferences)

# Real-time stats
stats:online_players          → String (count)
stats:active_games            → String (count)
```

---

## 🎯 Game Systems Implementation

### 1. Entity Component System (ECS)

```javascript
// Entity Manager using ECS pattern
class EntityManager {
  constructor() {
    this.entities = new Map();
    this.components = {
      position: new Map(),
      health: new Map(),
      movement: new Map(),
      combat: new Map(),
      resource: new Map(),
      vision: new Map()
    };
  }

  createEntity(type, data) {
    const id = this.generateId();
    this.entities.set(id, { type, active: true });

    // Assign components based on type
    if (type === 'unit') {
      this.components.position.set(id, { x: data.x, y: data.y });
      this.components.health.set(id, { current: data.maxHp, max: data.maxHp });
      this.components.movement.set(id, { speed: data.speed, path: [] });
      this.components.combat.set(id, { attack: data.attack, range: data.range });
      this.components.vision.set(id, { range: data.lineOfSight });
    }

    return id;
  }
}
```

### 2. Pathfinding System

```javascript
class PathfindingManager {
  constructor() {
    this.wasmEngine = null;
    this.pathCache = new LRUCache(1000);
    this.workerPool = [];
  }

  async initialize() {
    // Load WASM module
    this.wasmEngine = await WasmPathfinding.create();

    // Create worker pool for JS fallback
    for (let i = 0; i < 4; i++) {
      this.workerPool.push(new Worker('pathfinding-worker.js'));
    }
  }

  async findPath(start, goal, unitSize) {
    const cacheKey = `${start.x},${start.y}:${goal.x},${goal.y}:${unitSize}`;

    // Check cache
    if (this.pathCache.has(cacheKey)) {
      return this.pathCache.get(cacheKey);
    }

    // Use WASM for fast pathfinding
    const path = this.wasmEngine.findPath(start, goal, unitSize);

    // Cache result
    this.pathCache.set(cacheKey, path);

    return path;
  }

  findPathsForGroup(units, goal) {
    // Flow field pathfinding for groups
    const flowField = this.wasmEngine.createFlowField(goal);
    return units.map(unit => this.followFlowField(unit, flowField));
  }
}
```

### 3. Combat System

```javascript
class CombatSystem {
  constructor() {
    this.damageMultipliers = {
      'infantry': { 'infantry': 1.0, 'archer': 0.5, 'cavalry': 1.5 },
      'archer': { 'infantry': 1.2, 'archer': 1.0, 'cavalry': 0.8 },
      'cavalry': { 'infantry': 0.8, 'archer': 1.5, 'cavalry': 1.0 }
    };
  }

  update(deltaTime) {
    const units = entityManager.getEntitiesWithComponents(['position', 'combat']);

    for (const [id, unit] of units) {
      if (!unit.combat.target) {
        this.findTarget(id, unit);
      } else {
        this.attackTarget(id, unit, deltaTime);
      }
    }
  }

  attackTarget(attackerId, attacker, deltaTime) {
    const target = entityManager.getEntity(attacker.combat.target);

    // Check range
    const distance = this.getDistance(attacker.position, target.position);
    if (distance > attacker.combat.range) {
      return; // Move closer
    }

    // Attack cooldown
    attacker.combat.attackCooldown -= deltaTime;
    if (attacker.combat.attackCooldown > 0) return;

    // Calculate damage
    const baseDamage = attacker.combat.attack;
    const multiplier = this.damageMultipliers[attacker.type][target.type] || 1.0;
    const armor = target.combat.armor || 0;
    const finalDamage = Math.max(1, (baseDamage * multiplier) - armor);

    // Apply damage
    this.applyDamage(attacker.combat.target, finalDamage);

    // Reset cooldown
    attacker.combat.attackCooldown = attacker.combat.attackSpeed;

    // Create projectile if ranged
    if (attacker.combat.projectile) {
      projectileManager.create(attacker.position, target.position, attacker.combat.projectile);
    }
  }
}
```

### 4. Fog of War System

```javascript
class FogOfWarSystem {
  constructor(mapWidth, mapHeight, tileSize) {
    this.width = mapWidth;
    this.height = mapHeight;
    this.tileSize = tileSize;

    // Create visibility grid
    this.visibility = new Uint8Array(mapWidth * mapHeight);
    // 0 = unexplored, 1 = explored (fog), 2 = visible
  }

  update(playerUnits, playerBuildings) {
    // Reset all visible tiles to fog
    for (let i = 0; i < this.visibility.length; i++) {
      if (this.visibility[i] === 2) {
        this.visibility[i] = 1;
      }
    }

    // Update visibility for each unit/building
    [...playerUnits, ...playerBuildings].forEach(entity => {
      const vision = entityManager.components.vision.get(entity.id);
      this.revealArea(entity.position.x, entity.position.y, vision.range);
    });
  }

  revealArea(centerX, centerY, radius) {
    const radiusSq = radius * radius;
    const minX = Math.floor((centerX - radius) / this.tileSize);
    const maxX = Math.ceil((centerX + radius) / this.tileSize);
    const minY = Math.floor((centerY - radius) / this.tileSize);
    const maxY = Math.ceil((centerY + radius) / this.tileSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (x < 0 || x >= this.width || y < 0 || y >= this.height) continue;

        const distSq = ((x * this.tileSize) - centerX) ** 2 +
                       ((y * this.tileSize) - centerY) ** 2;

        if (distSq <= radiusSq) {
          const index = y * this.width + x;
          this.visibility[index] = 2; // Visible
        }
      }
    }
  }
}
```

---

## 📊 Performance Optimizations

### 1. Object Pooling
```javascript
class ObjectPool {
  constructor(factory, initialSize = 100) {
    this.factory = factory;
    this.pool = [];

    for (let i = 0; i < initialSize; i++) {
      this.pool.push(factory());
    }
  }

  acquire() {
    return this.pool.pop() || this.factory();
  }

  release(obj) {
    obj.reset();
    this.pool.push(obj);
  }
}

// Usage
const projectilePool = new ObjectPool(() => new Projectile(), 200);
```

### 2. Spatial Partitioning (Quadtree)
```javascript
class Quadtree {
  constructor(bounds, maxObjects = 10, maxLevels = 4, level = 0) {
    this.bounds = bounds;
    this.maxObjects = maxObjects;
    this.maxLevels = maxLevels;
    this.level = level;
    this.objects = [];
    this.nodes = [];
  }

  insert(entity) {
    if (this.nodes.length > 0) {
      const index = this.getIndex(entity);
      if (index !== -1) {
        this.nodes[index].insert(entity);
        return;
      }
    }

    this.objects.push(entity);

    if (this.objects.length > this.maxObjects && this.level < this.maxLevels) {
      if (this.nodes.length === 0) {
        this.split();
      }

      let i = 0;
      while (i < this.objects.length) {
        const index = this.getIndex(this.objects[i]);
        if (index !== -1) {
          this.nodes[index].insert(this.objects.splice(i, 1)[0]);
        } else {
          i++;
        }
      }
    }
  }

  retrieve(entity) {
    const index = this.getIndex(entity);
    let returnObjects = this.objects;

    if (this.nodes.length > 0) {
      if (index !== -1) {
        returnObjects = returnObjects.concat(this.nodes[index].retrieve(entity));
      } else {
        this.nodes.forEach(node => {
          returnObjects = returnObjects.concat(node.retrieve(entity));
        });
      }
    }

    return returnObjects;
  }
}
```

### 3. Render Optimization
```javascript
class Renderer {
  constructor(canvas) {
    this.ctx = canvas.getContext('2d', { alpha: false });
    this.camera = new Camera();
    this.visibleEntities = [];
  }

  render() {
    // Clear only dirty regions
    this.clearDirtyRegions();

    // Frustum culling
    this.visibleEntities = this.getVisibleEntities();

    // Sort by y-position for proper layering
    this.visibleEntities.sort((a, b) => a.position.y - b.position.y);

    // Batch draw calls by sprite sheet
    const batches = this.groupByTexture(this.visibleEntities);

    for (const [texture, entities] of batches) {
      this.ctx.drawImage(texture, 0, 0);
      entities.forEach(entity => this.drawEntity(entity));
    }
  }

  getVisibleEntities() {
    const viewport = this.camera.getViewport();
    return spatialHash.query(viewport.x, viewport.y, viewport.width, viewport.height);
  }
}
```

---

## 🚀 Development Phases

### Phase 1: Foundation (Weeks 1-4)
**Goal**: Basic rendering and movement

**Tasks**:
1. ✅ Set up Vue 3 + Quasar project
2. ✅ Create canvas rendering system
3. ✅ Implement camera controls (pan, zoom)
4. ✅ Create basic entity system
5. ✅ Add unit selection (single + box select)
6. ✅ Implement basic movement (click to move)
7. ✅ Set up Django backend with REST API
8. ✅ Create user authentication

**Deliverable**: Can select and move units on a map

---

### Phase 2: Core Gameplay (Weeks 5-10)
**Goal**: Single-player gameplay loop

**Tasks**:
1. ✅ Implement pathfinding (A* algorithm)
2. ✅ Add resource gathering (villagers collect resources)
3. ✅ Create building placement system
4. ✅ Implement production queues (train units)
5. ✅ Add combat system (melee + ranged)
6. ✅ Create tech tree system
7. ✅ Implement fog of war
8. ✅ Add game UI (resource bar, mini-map, command panel)
9. ✅ Create 3-5 basic unit types
10. ✅ Create 5-8 building types

**Deliverable**: Playable single-player vs basic AI

---

### Phase 3: Multiplayer (Weeks 11-16)
**Goal**: Online multiplayer support

**Tasks**:
1. ✅ Set up Django Channels WebSocket server
2. ✅ Implement authoritative server game logic
3. ✅ Create client-side prediction
4. ✅ Add server reconciliation
5. ✅ Implement lobby system
6. ✅ Add matchmaking service
7. ✅ Create replay recording system
8. ✅ Optimize network protocol (delta compression)
9. ✅ Add reconnection handling

**Deliverable**: 2-8 player online matches

---

### Phase 4: WebAssembly Integration (Weeks 17-20)
**Goal**: Performance optimization

**Tasks**:
1. ✅ Set up Rust/C++ WASM build pipeline
2. ✅ Port pathfinding to WASM
3. ✅ Port collision detection to WASM
4. ✅ Create game state simulation in WASM
5. ✅ Benchmark and optimize
6. ✅ Create JS ↔ WASM bridges

**Deliverable**: 60 FPS with 500+ units

---

### Phase 5: Content & Polish (Weeks 21-28)
**Goal**: Complete game content

**Tasks**:
1. ✅ Add 8-12 civilizations
2. ✅ Create 30+ unit types
3. ✅ Create 20+ building types
4. ✅ Implement 50+ technologies
5. ✅ Add sound effects and music
6. ✅ Create 10+ map types
7. ✅ Polish UI/UX
8. ✅ Add tutorials

**Deliverable**: Feature-complete game

---

### Phase 6: Advanced Features (Weeks 29-32)
**Goal**: Enhanced gameplay

**Tasks**:
1. ✅ Improve AI (difficulty levels)
2. ✅ Add formation movement
3. ✅ Create map editor
4. ✅ Add spectator mode
5. ✅ Implement ranked matchmaking
6. ✅ Add achievement system
7. ✅ Create leaderboard

**Deliverable**: Polished, competitive-ready game

---

## 📝 Working with Claude Code

### How to Break Down Requests

When working with Claude Code on this project, structure your requests in phases:

#### Example Request Flow:

**Phase 1.1 - Project Setup**
```
"Create a Vue 3 + Quasar project with Vite.
Set up the following structure:
- /src/core for game engine
- /src/rendering for rendering
- /src/ui for Vue components
Add Pinia for state management and configure Quasar."
```

**Phase 1.2 - Canvas Renderer**
```
"Create a canvas-based renderer in src/rendering/Renderer.js that:
- Creates a full-screen canvas
- Implements a game loop at 60 FPS
- Has a Camera class with pan and zoom
- Can draw a grid-based map
Include proper TypeScript types."
```

**Phase 1.3 - Entity System**
```
"Implement an Entity Component System (ECS) in src/core/:
- EntityManager.js to manage entities
- Component system with Position, Health, Movement components
- Create a Unit class that uses the ECS
- Add 50 test units to the scene"
```

**Phase 2.1 - Pathfinding**
```
"Implement A* pathfinding in src/pathfinding/:
- Create AStar.js with A* algorithm
- PathfindingManager.js to handle requests
- NavigationGrid.js to represent walkable terrain
- Integrate with the movement system
Add tests for pathfinding edge cases."
```

**Phase 3.1 - WebSocket Setup**
```
"Set up Django Channels WebSocket server:
- Configure ASGI and channels routing
- Create GameConsumer for handling game connections
- Implement connection, disconnect, and command handlers
- Add authentication middleware
Include Docker configuration."
```

### Best Practices for Claude Code

1. **One System at a Time**: Focus on completing one system before moving to the next
2. **Specify File Paths**: Always mention exact file paths
3. **Request Tests**: Ask for unit tests for critical systems
4. **Incremental Complexity**: Start simple, then add features
5. **Performance Targets**: Mention specific performance requirements
6. **Code Review**: Ask Claude to review complex implementations

---

## 🔧 Technical Challenges & Solutions

### Challenge 1: Pathfinding Performance
**Problem**: JavaScript A* too slow for 200+ units
**Solution**:
- Use WASM for pathfinding (10-50x faster)
- Implement path caching with LRU cache
- Use flow fields for group movement
- Offload to Web Workers as fallback

### Challenge 2: Network Latency
**Problem**: 100-200ms latency feels unresponsive
**Solution**:
- Client-side prediction for immediate feedback
- Lag compensation for combat
- Interpolation for smooth movement
- Delta compression to reduce bandwidth

### Challenge 3: State Synchronization
**Problem**: Keeping all clients in sync
**Solution**:
- Authoritative server validates all actions
- Deterministic simulation on all clients
- Server reconciliation with command replay
- Snapshot interpolation for rendering

### Challenge 4: Rendering 1000+ Entities
**Problem**: Drawing too many sprites drops FPS
**Solution**:
- Frustum culling (only draw visible entities)
- Spatial hashing for quick queries
- Sprite batching by texture
- Object pooling for projectiles
- Dirty rectangle optimization

### Challenge 5: Fog of War
**Problem**: Calculating vision for all units is expensive
**Solution**:
- Tile-based visibility grid
- Only update when units move
- Use bit flags for memory efficiency
- GPU-based fog rendering with shaders

---

## 📚 Key Resources

### Documentation
- Vue 3: https://vuejs.org/
- Quasar: https://quasar.dev/
- Django Channels: https://channels.readthedocs.io/
- Three.js: https://threejs.org/
- Rust WASM: https://rustwasm.github.io/

### Learning Resources
- "Multiplayer Game Programming" by Joshua Glazer
- "Real-Time Rendering" by Tomas Akenine-Möller
- "Game Programming Patterns" by Robert Nystrom
- "Multiplayer Game Development with Unreal Engine 5" (concepts apply)

### Game Design References
- Age of Empires II data: https://aoe2.net/
- 0 A.D. (open-source RTS): https://play0ad.com/
- RTS game design patterns

---

## 🎯 Success Metrics

### Performance
- ✅ 60 FPS with 500 units
- ✅ <100ms input latency
- ✅ <150ms network latency
- ✅ <5s match loading time
- ✅ <500MB memory usage

### Gameplay
- ✅ 8+ civilizations
- ✅ 30+ unit types
- ✅ 20+ building types
- ✅ 4 ages (Dark, Feudal, Castle, Imperial)
- ✅ 2-8 player multiplayer
- ✅ AI opponents

### Quality
- ✅ <1% crash rate
- ✅ <5% desync rate in multiplayer
- ✅ 95%+ uptime
- ✅ Cross-browser compatibility (Chrome, Firefox, Safari, Edge)

---

## 🔐 Security Considerations

1. **Input Validation**: Server validates all commands
2. **Rate Limiting**: Prevent command spam
3. **Anti-Cheat**: Server-authoritative simulation
4. **DDoS Protection**: CloudFlare + rate limiting
5. **Authentication**: JWT tokens with refresh
6. **Data Encryption**: HTTPS/WSS only

---

## 📦 Deployment

### Production Stack
```yaml
# docker-compose.prod.yml
services:
  nginx:
    image: nginx:alpine
    ports: ["80:80", "443:443"]

  frontend:
    build: ./client
    environment:
      - NODE_ENV=production

  backend:
    build: ./server
    environment:
      - DEBUG=False
      - DJANGO_SETTINGS_MODULE=aoe2_server.settings.production

  channels:
    build: ./server
    command: daphne -b 0.0.0.0 -p 8001 aoe2_server.asgi:application

  postgres:
    image: postgres:15-alpine
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

  celery:
    build: ./server
    command: celery -A aoe2_server worker -l info
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Run tests
        run: |
          npm test
          python manage.py test

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to production
        run: |
          docker-compose -f docker-compose.prod.yml up -d
```

---

## 🎉 Conclusion

This architecture provides a solid foundation for building a web-based Age of Empires II clone. Key takeaways:

1. **Use WebAssembly** for performance-critical code (pathfinding, collision)
2. **Authoritative server** for multiplayer prevents cheating
3. **Client-side prediction** for responsive gameplay
4. **ECS architecture** for flexible entity management
5. **Phased development** to incrementally build complexity

Start with Phase 1 and work your way through. Each phase builds on the previous, ensuring you have a working game at each step.

Good luck building your RTS masterpiece! 🎮
