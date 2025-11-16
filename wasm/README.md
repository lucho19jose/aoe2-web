# WebAssembly Game Engine

High-performance game engine modules written in Rust and compiled to WebAssembly for AoE2 Web Edition.

## 📦 Modules

### `game-engine`
Main WASM module containing:
- **Pathfinding**: A* algorithm implementation (2-10x faster than JavaScript)
- **AI System**: Single-player AI decision making
- **Future**: Combat calculations, physics, collision detection

## 🚀 Features

### Pathfinding
- **A* Algorithm**: Optimal pathfinding with heuristics
- **8-directional movement**: Supports diagonal movement with proper cost
- **Dynamic obstacles**: Add/remove obstacles at runtime
- **Grid-based navigation**: 100x100 default grid (configurable)

### AI System
- **Multiple difficulty levels**: Easy, Medium, Hard
- **Decision-making**: Economic and military strategies
- **Configurable behavior**: Adjust aggression, resource priorities
- **Multi-AI support**: Handle multiple AI players simultaneously

## 🛠️ Building

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install wasm-pack
cargo install wasm-pack
```

### Build WASM module
```bash
cd wasm/game-engine
wasm-pack build --target web --out-dir pkg
```

### Copy to client
```bash
cp pkg/* ../../client/src/wasm/
```

## 📊 Performance

### Pathfinding Benchmark
Run the benchmark to see WASM vs JavaScript performance:

```typescript
import { getWasmPathfinding } from '@/pathfinding/WasmPathfinding'

const wasm = getWasmPathfinding()
await wasm.init(100, 100)
await wasm.benchmark(100, 100) // grid_size, iterations
```

**Typical results:**
- WASM: ~0.15ms per path
- JavaScript: ~1.2ms per path
- **8x faster with WASM!**

## 🎮 Usage in TypeScript

### Pathfinding

```typescript
import { HybridNavigationGrid } from '@/pathfinding/HybridNavigationGrid'

// Create navigation grid (auto-detects and uses WASM if available)
const grid = new HybridNavigationGrid(100, 1)

// Add obstacles
grid.addRectObstacle({ x: 10, y: 0, z: 10 }, 5, 5)

// Find path
const path = grid.findPath(
  { x: 0, y: 0, z: 0 },
  { x: 50, y: 0, z: 50 }
)

// Check if using WASM
console.log('Using WASM:', grid.isUsingWasm())
```

### AI System

```typescript
import { getWasmPathfinding } from '@/pathfinding/WasmPathfinding'

const wasm = getWasmPathfinding()
await wasm.init()

// Add AI players
wasm.addAIPlayer('ai_player_1', 'hard')
wasm.addAIPlayer('ai_player_2', 'medium')

// Update AI every frame
function gameLoop(deltaTime: number, gameState: any) {
  const actions = wasm.updateAI(deltaTime, gameState)
  // Process AI actions...
}
```

## 🏗️ Architecture

### Single Player Mode
```
┌─────────────┐      ┌──────────────┐
│  Frontend   │─────>│  WASM Engine │
│  (Vue/TS)   │<─────│  (Rust)      │
└─────────────┘      └──────────────┘
                            │
                            ├─> Pathfinding (A*)
                            ├─> AI Decision Making
                            └─> Game Logic
```

### Multiplayer Mode
```
┌─────────────┐      ┌──────────────┐      ┌─────────────┐
│  Frontend   │─────>│  WebSocket   │─────>│   Django    │
│  (Vue/TS)   │<─────│  Connection  │<─────│   Server    │
└─────────────┘      └──────────────┘      └─────────────┘
      │                                            │
      │                                            ├─> Authoritative State
      └─> WASM (Client Prediction Only)          ├─> Validation
                                                   └─> Sync to Clients
```

## 📝 API Reference

### NavigationGrid (WASM)

```rust
// Rust API (exported to JavaScript)
pub struct NavigationGrid {
    pub fn new(width: usize, height: usize) -> NavigationGrid
    pub fn find_path(&self, start_x: i32, start_z: i32, goal_x: i32, goal_z: i32) -> JsValue
    pub fn set_walkable(&mut self, x: i32, y: i32, walkable: bool)
    pub fn set_obstacle_rect(&mut self, x: i32, y: i32, width: i32, height: i32)
    pub fn clear_obstacles(&mut self)
    pub fn is_walkable(&self, x: i32, y: i32) -> bool
}
```

### AIPlayer (WASM)

```rust
pub struct AIPlayer {
    pub fn new(player_id: String, difficulty: AIDifficulty) -> AIPlayer
    pub fn update(&mut self, delta_time: f32, game_state: JsValue) -> JsValue
    pub fn set_resource_priority(&mut self, food: f32, wood: f32, gold: f32, stone: f32)
    pub fn set_military_strategy(&mut self, aggression: f32, defense: f32)
}

pub enum AIDifficulty {
    Easy,
    Medium,
    Hard,
}
```

## 🧪 Testing

```bash
cd wasm/game-engine

# Run Rust tests
cargo test

# Run WASM tests in browser
wasm-pack test --headless --firefox
```

## 🔧 Configuration

### Cargo.toml
```toml
[package]
name = "game-engine"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
```

### Build Profiles
- **Debug**: Fast compilation, larger binary
- **Release**: Optimized for size and speed (LTO enabled)

## 📈 Future Enhancements

- [ ] Multi-threaded pathfinding with Web Workers
- [ ] More sophisticated AI strategies (Rush, Boom, Turtle)
- [ ] Combat damage calculations in WASM
- [ ] Physics engine for projectiles
- [ ] Fog of War calculations
- [ ] Formation movement
- [ ] Unit collision avoidance (flow fields)

## 🤝 Contributing

When adding new WASM modules:
1. Add new .rs file in `src/`
2. Implement with `#[wasm_bindgen]` annotations
3. Re-export in `lib.rs`
4. Rebuild with `wasm-pack build`
5. Create TypeScript wrapper in client

## 📚 Resources

- [Rust WASM Book](https://rustwasm.github.io/docs/book/)
- [wasm-bindgen Guide](https://rustwasm.github.io/wasm-bindgen/)
- [A* Pathfinding](https://en.wikipedia.org/wiki/A*_search_algorithm)
