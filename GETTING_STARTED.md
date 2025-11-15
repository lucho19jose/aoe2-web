# Getting Started with Claude Code

This guide explains how to use **Claude Code** to build the Age of Empires II web clone incrementally.

## 🎯 Development Philosophy

Build the game in **small, testable increments**. Each phase should result in a working, playable version with progressively more features.

---

## 📋 Phase 1: Foundation (Start Here!)

### Step 1.1: Project Setup

**Ask Claude Code:**
```
Create a Vue 3 + Quasar project with Vite.

Requirements:
- Use TypeScript for type safety
- Configure Quasar with these plugins: Dialog, Notify, Loading
- Set up the directory structure from ARCHITECTURE.md:
  - /src/core (game engine)
  - /src/rendering (canvas/WebGL)
  - /src/game-logic (systems and entities)
  - /src/ui (Vue components)
  - /src/networking (WebSocket client)
- Install Pinia for state management
- Create a basic layout with a full-screen canvas and HUD

Test: Run 'npm run dev' and see an empty canvas with a header showing "Age of Empires II Web"
```

### Step 1.2: Canvas Renderer

**Ask Claude Code:**
```
Create a canvas rendering system in src/rendering/Renderer.js:

Features:
- Full-screen canvas that resizes with window
- 60 FPS game loop using requestAnimationFrame
- Camera class with pan (WASD or arrow keys) and zoom (mouse wheel)
- Draw a 100x100 tile grid (32px per tile) with alternating colors
- FPS counter in top-left corner

Create these files:
- src/rendering/Renderer.js
- src/rendering/Camera.js
- src/core/Engine.js (main game loop)

Test: Should see a grid that I can pan and zoom smoothly at 60 FPS
```

### Step 1.3: Entity System

**Ask Claude Code:**
```
Implement an Entity Component System (ECS) in src/core/:

Files to create:
- src/core/EntityManager.js - manages all entities
- src/core/components.js - Position, Health, Movement, Combat components
- src/game-logic/entities/Unit.js - Unit class using ECS

Features:
- EntityManager with create, delete, getEntity, getEntitiesWithComponents methods
- Component storage using Maps for fast lookup
- Create 50 test units placed randomly on the map
- Render units as colored circles (16px radius)

Test: Should see 50 colored circles on the grid
```

### Step 1.4: Unit Selection

**Ask Claude Code:**
```
Implement unit selection in src/input/:

Files to create:
- src/input/InputManager.js - handles all input
- src/input/MouseHandler.js - mouse events
- src/input/SelectionBox.js - box selection rendering

Features:
- Click to select single unit (highlight with green circle)
- Drag to create selection box
- Box selection selects all units inside
- Selected units show green outline
- Click empty space to deselect all

Test: Should be able to select units with click and drag
```

### Step 1.5: Basic Movement

**Ask Claude Code:**
```
Implement basic movement system:

Files to create:
- src/game-logic/systems/MovementSystem.js

Features:
- Right-click to move selected units to target position
- Units move at constant speed (100 pixels/second)
- Show green target marker on right-click
- Units stop when they reach target (within 5 pixels)
- Multiple units move to same target (will overlap for now)

Test: Select units and right-click to move them. They should move smoothly to target.
```

**🎉 Phase 1 Complete!** You now have selectable units that can move around a map.

---

## 📋 Phase 2: Core Gameplay

### Step 2.1: Pathfinding

**Ask Claude Code:**
```
Implement A* pathfinding in src/pathfinding/:

Files to create:
- src/pathfinding/AStar.js - A* algorithm implementation
- src/pathfinding/NavigationGrid.js - walkable tile grid
- src/pathfinding/PathfindingManager.js - manages pathfinding requests

Features:
- NavigationGrid with walkable/blocked tiles
- A* pathfinding that avoids blocked tiles
- Path smoothing (remove unnecessary waypoints)
- Add 20 random obstacles (buildings) as blocked tiles
- Units follow the computed path

Test: Units should navigate around obstacles to reach their destination
```

### Step 2.2: Resources & Villagers

**Ask Claude Code:**
```
Add resource gathering system:

Files to create:
- src/game-logic/entities/Villager.js
- src/game-logic/entities/Resource.js (trees, gold mines, stone)
- src/game-logic/systems/ResourceSystem.js

Features:
- Create Villager entity type (can gather resources)
- Create Resource entities: Tree (wood), Gold Mine, Stone Mine
- Villager right-click on resource → walk to it → gather automatically
- Show resource amount above villager when gathering
- Resources deplete after gathering X amount
- Add resource bar UI showing Food: 200, Wood: 200, Gold: 100, Stone: 100

Game data:
- Tree: 100 wood, gather rate 0.5/sec
- Gold Mine: 800 gold, gather rate 0.4/sec
- Stone Mine: 350 stone, gather rate 0.35/sec

Test: Create 5 villagers and 10 of each resource type. Villagers should gather and increase resource count.
```

### Step 2.3: Building Placement

**Ask Claude Code:**
```
Implement building construction:

Files to create:
- src/game-logic/entities/Building.js (base class)
- src/game-logic/entities/TownCenter.js
- src/game-logic/entities/Barracks.js
- src/ui/BuildingPlacer.vue - UI for placing buildings

Features:
- Command panel UI with "Build" button
- Click build → shows building menu (Town Center, Barracks)
- Select building → ghost preview follows mouse
- Green if valid placement, red if invalid (too close to other buildings)
- Click to place → villager walks to location and constructs (5 seconds)
- Building starts at 0% HP, grows to 100% during construction
- Costs: Town Center (275 wood), Barracks (175 wood)

Test: Should be able to place buildings if enough resources. Villager constructs them.
```

### Step 2.4: Unit Production

**Ask Claude Code:**
```
Add unit training system:

Files to create:
- src/game-logic/entities/Militia.js (basic infantry unit)
- src/game-logic/systems/ProductionSystem.js
- src/ui/ProductionQueue.vue - shows units being trained

Features:
- Click on Barracks → shows command panel with "Train Militia" button
- Train Militia costs 60 food, 20 gold, takes 21 seconds
- Production queue (can queue up to 5 units)
- Progress bar shows training progress
- Unit spawns near building when complete
- Can cancel production (refunds 50% of cost)

Test: Build Barracks, train Militia. Should see queue and units spawn after timer.
```

### Step 2.5: Combat System

**Ask Claude Code:**
```
Implement combat system:

Files to create:
- src/game-logic/systems/CombatSystem.js
- src/game-logic/entities/Projectile.js (for archers later)

Features:
- Units have attack, armor, HP stats
- Right-click enemy unit → selected units attack
- Melee units: walk to range (1.5 tiles), attack every 2 seconds
- Damage formula: max(1, attack - armor)
- Show HP bar above damaged units
- Unit dies at 0 HP (remove from game)
- Create enemy units (different color) to test combat

Unit stats:
- Militia: 40 HP, 4 attack, 0 armor, 2s attack speed, melee

Test: Create friendly and enemy Militia. Order attack. Should fight and kill each other.
```

**🎉 Phase 2 Complete!** You now have a working RTS with resources, buildings, and combat.

---

## 📋 Phase 3: Multiplayer

### Step 3.1: Django Backend Setup

**Ask Claude Code:**
```
Set up Django backend with WebSocket support:

Create Django project structure:
- server/aoe2_server/ (Django project)
- server/apps/accounts/ (user authentication)
- server/apps/matchmaking/ (lobby system)
- server/apps/game_server/ (game instance management)

Requirements:
- Django 4.2+ with Django REST Framework
- Django Channels for WebSocket
- PostgreSQL database configuration
- Redis for channel layers
- User registration and JWT authentication

Files to create:
- server/requirements.txt
- server/aoe2_server/settings.py
- server/aoe2_server/asgi.py (ASGI config)
- server/apps/accounts/models.py (User model with ELO)
- server/apps/accounts/views.py (register, login, profile)
- docker-compose.yml (PostgreSQL + Redis containers)

Test: Run migrations, create superuser, test auth endpoints
```

### Step 3.2: WebSocket Game Server

**Ask Claude Code:**
```
Create WebSocket game server:

Files to create:
- server/apps/game_server/consumers.py - GameConsumer class
- server/apps/game_server/routing.py - WebSocket URL routing
- server/apps/game_server/core/GameInstance.py - manages one game

Features:
- WebSocket endpoint: ws://localhost:8000/ws/game/<game_id>/
- Handle: connect, disconnect, command, sync_request
- GameInstance maintains authoritative game state
- Validate all commands server-side
- Broadcast state updates to all connected players every 100ms

Message types:
- CLIENT → SERVER: {type: 'COMMAND', commands: [...]}
- SERVER → CLIENT: {type: 'STATE_UPDATE', tick: N, updates: [...]}

Test: Connect multiple WebSocket clients, send commands, verify state broadcasts
```

### Step 3.3: Client-Side Networking

**Ask Claude Code:**
```
Implement client-side networking:

Files to create:
- src/networking/NetworkManager.js - manages WebSocket connection
- src/networking/WebSocketClient.js - WebSocket wrapper
- src/networking/StateSync.js - synchronizes client/server state
- src/networking/ClientPrediction.js - local prediction

Features:
- Connect to WebSocket server on game start
- Send commands to server (move, attack, build, train)
- Receive state updates from server
- Client-side prediction: apply commands immediately
- Server reconciliation: correct prediction when server update arrives
- Interpolation for smooth remote player movement

Test: Two clients connect to same game. Movement on one should appear on the other.
```

### Step 3.4: Lobby & Matchmaking

**Ask Claude Code:**
```
Create lobby system:

Files to create:
- server/apps/matchmaking/models.py (GameLobby, LobbyPlayer)
- server/apps/matchmaking/consumers.py (LobbyConsumer)
- server/apps/matchmaking/services.py (matchmaking logic)
- src/ui/Lobby.vue - lobby UI component

Features:
- Create lobby (1v1, 2v2, 4v4, FFA)
- Join lobby via lobby list or code
- Select civilization
- Ready up
- Host starts game → creates GameInstance → all players connect
- Simple matchmaking: join random lobby with open slots

Test: Create lobby, join with 2+ clients, start game
```

**🎉 Phase 3 Complete!** You now have working multiplayer!

---

## 📋 Phase 4: WebAssembly Optimization

### Step 4.1: Rust WASM Setup

**Ask Claude Code:**
```
Set up Rust WebAssembly build pipeline:

Create Rust project:
- wasm-pathfinding/ (pathfinding module)
- wasm-collision/ (collision detection module)

Files to create:
- wasm-pathfinding/Cargo.toml
- wasm-pathfinding/src/lib.rs - PathfindingEngine struct
- build-wasm.sh - script to build WASM modules
- src/wasm/pathfinding-bridge.js - JS ↔ WASM interface

Dependencies:
- wasm-bindgen
- wasm-pack

Features:
- A* pathfinding in Rust
- Expose find_path() function to JavaScript
- Build to client/public/wasm/
- Fallback to JavaScript if WASM fails to load

Test: Benchmark JS vs WASM pathfinding. WASM should be 10-50x faster.
```

### Step 4.2: WASM Collision Detection

**Ask Claude Code:**
```
Port collision detection to WASM:

Files to create:
- wasm-collision/src/lib.rs
- wasm-collision/src/spatial_hash.rs
- src/wasm/collision-bridge.js

Features:
- Spatial hash grid in Rust
- query_range(x, y, radius) returns nearby entity IDs
- insert/remove entities
- Much faster than JavaScript for 500+ entities

Test: Add 1000 units. Collision queries should maintain 60 FPS.
```

**🎉 Phase 4 Complete!** Game now runs at 60 FPS with 500+ units.

---

## 🎨 Best Practices for Working with Claude Code

### 1. Be Specific About Files
```
✅ GOOD: "Create src/rendering/Camera.js with pan and zoom"
❌ BAD: "Add camera controls"
```

### 2. Specify Test Criteria
```
✅ GOOD: "Test: Should see 50 units that can be selected and moved"
❌ BAD: "Make it work"
```

### 3. Incremental Changes
```
✅ GOOD: "Add unit selection (click only, no box select yet)"
❌ BAD: "Build the entire game"
```

### 4. Request Documentation
```
✅ GOOD: "Add JSDoc comments explaining the pathfinding algorithm"
```

### 5. Ask for Code Review
```
✅ GOOD: "Review the combat system for potential bugs or performance issues"
```

---

## 🐛 Troubleshooting

### Canvas not rendering?
- Check browser console for errors
- Verify canvas element exists in DOM
- Ensure game loop is running (check FPS counter)

### Units not moving?
- Check MovementSystem is being called every frame
- Verify pathfinding returns valid path
- Debug: console.log the path array

### WebSocket not connecting?
- Verify Django Channels is running (`python manage.py runserver`)
- Check Redis is running (`redis-cli ping` should return PONG)
- Check browser console for WebSocket errors

### Performance issues?
- Use Chrome DevTools Performance tab
- Check if game loop takes >16ms (60 FPS = 16.67ms per frame)
- Reduce number of entities
- Profile pathfinding and rendering

---

## 📚 Next Steps

After completing Phase 4, continue with:

- **Phase 5**: Add more content (civilizations, units, buildings, technologies)
- **Phase 6**: Polish (better AI, UI/UX, sound effects, music)
- **Phase 7**: Advanced features (replays, spectator mode, map editor)

See [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed system designs.

---

**Happy coding! Build your RTS masterpiece one step at a time.** 🎮
