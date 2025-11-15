# WebAssembly Integration Guide

Complete guide for integrating Rust WebAssembly into the Age of Empires II web clone.

---

## 🎯 When to Use WebAssembly

### ✅ Use WASM for:
- **Pathfinding**: 10-50x faster than JavaScript A*
- **Collision Detection**: Spatial hashing with thousands of queries/frame
- **Game State Simulation**: Deterministic physics/combat calculations
- **Map Generation**: Procedural terrain generation
- **AI Evaluation**: Minimax, Monte Carlo tree search

### ❌ Don't Use WASM for:
- **DOM Manipulation**: JavaScript is better
- **Network I/O**: JavaScript's async is easier
- **Simple calculations**: WASM overhead not worth it
- **Rendering**: WebGL from JavaScript is fine

**Rule of Thumb**: If it's CPU-intensive and called every frame, use WASM.

---

## 🦀 Rust Setup

### 1. Install Rust

```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install wasm-pack
curl https://rustwasm.github.io/wasm-pack/installer/init.sh -sSf | sh
```

### 2. Create WASM Module

```bash
# Create Rust library
cargo new --lib wasm-pathfinding
cd wasm-pathfinding
```

### 3. Configure Cargo.toml

```toml
[package]
name = "wasm-pathfinding"
version = "0.1.0"
edition = "2021"

[lib]
crate-type = ["cdylib", "rlib"]

[dependencies]
wasm-bindgen = "0.2"
serde = { version = "1.0", features = ["derive"] }
serde-wasm-bindgen = "0.6"

[dev-dependencies]
wasm-bindgen-test = "0.3"

[profile.release]
opt-level = 3        # Maximum optimization
lto = true           # Link-time optimization
codegen-units = 1    # Better optimization, slower compile
```

---

## 🔧 Pathfinding Module

### src/lib.rs

```rust
use wasm_bindgen::prelude::*;
use std::collections::{BinaryHeap, HashMap};
use std::cmp::Ordering;

#[wasm_bindgen]
#[derive(Clone, Copy, Debug, PartialEq, Eq, Hash)]
pub struct Point {
    pub x: i32,
    pub y: i32,
}

#[wasm_bindgen]
impl Point {
    #[wasm_bindgen(constructor)]
    pub fn new(x: i32, y: i32) -> Point {
        Point { x, y }
    }
}

// A* node for priority queue
#[derive(Clone, Eq, PartialEq)]
struct Node {
    point: Point,
    g_score: i32,  // Cost from start
    f_score: i32,  // g_score + heuristic
}

impl Ord for Node {
    fn cmp(&self, other: &Self) -> Ordering {
        other.f_score.cmp(&self.f_score)  // Reverse for min-heap
    }
}

impl PartialOrd for Node {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

#[wasm_bindgen]
pub struct PathfindingEngine {
    width: usize,
    height: usize,
    obstacles: Vec<bool>,  // Flattened 2D grid
}

#[wasm_bindgen]
impl PathfindingEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> PathfindingEngine {
        PathfindingEngine {
            width,
            height,
            obstacles: vec![false; width * height],
        }
    }

    pub fn set_obstacle(&mut self, x: i32, y: i32, blocked: bool) {
        if x >= 0 && x < self.width as i32 && y >= 0 && y < self.height as i32 {
            let index = (y as usize * self.width) + x as usize;
            self.obstacles[index] = blocked;
        }
    }

    pub fn find_path(&self, start: Point, goal: Point) -> Vec<Point> {
        if !self.is_walkable(goal) {
            return Vec::new();  // Goal is blocked
        }

        let mut open_set = BinaryHeap::new();
        let mut came_from: HashMap<Point, Point> = HashMap::new();
        let mut g_score: HashMap<Point, i32> = HashMap::new();

        g_score.insert(start, 0);
        open_set.push(Node {
            point: start,
            g_score: 0,
            f_score: self.heuristic(start, goal),
        });

        while let Some(current_node) = open_set.pop() {
            let current = current_node.point;

            if current == goal {
                return self.reconstruct_path(came_from, current);
            }

            for neighbor in self.get_neighbors(current) {
                let tentative_g = g_score.get(&current).unwrap_or(&i32::MAX) + 1;

                if tentative_g < *g_score.get(&neighbor).unwrap_or(&i32::MAX) {
                    came_from.insert(neighbor, current);
                    g_score.insert(neighbor, tentative_g);

                    open_set.push(Node {
                        point: neighbor,
                        g_score: tentative_g,
                        f_score: tentative_g + self.heuristic(neighbor, goal),
                    });
                }
            }
        }

        Vec::new()  // No path found
    }

    // Manhattan distance heuristic
    fn heuristic(&self, a: Point, b: Point) -> i32 {
        (a.x - b.x).abs() + (a.y - b.y).abs()
    }

    fn get_neighbors(&self, point: Point) -> Vec<Point> {
        let directions = [
            (-1, 0), (1, 0), (0, -1), (0, 1),  // Cardinal
            (-1, -1), (-1, 1), (1, -1), (1, 1)  // Diagonal
        ];

        directions
            .iter()
            .filter_map(|(dx, dy)| {
                let new_x = point.x + dx;
                let new_y = point.y + dy;
                let new_point = Point::new(new_x, new_y);

                if self.is_walkable(new_point) {
                    Some(new_point)
                } else {
                    None
                }
            })
            .collect()
    }

    fn is_walkable(&self, point: Point) -> bool {
        if point.x < 0 || point.x >= self.width as i32 ||
           point.y < 0 || point.y >= self.height as i32 {
            return false;
        }

        let index = (point.y as usize * self.width) + point.x as usize;
        !self.obstacles[index]
    }

    fn reconstruct_path(&self, came_from: HashMap<Point, Point>, mut current: Point) -> Vec<Point> {
        let mut path = vec![current];

        while let Some(&previous) = came_from.get(&current) {
            current = previous;
            path.push(current);
        }

        path.reverse();
        path
    }
}

// Test module
#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pathfinding() {
        let mut engine = PathfindingEngine::new(10, 10);

        // Create obstacle
        for y in 2..8 {
            engine.set_obstacle(5, y, true);
        }

        let path = engine.find_path(Point::new(0, 5), Point::new(9, 5));

        assert!(!path.is_empty());
        assert_eq!(path.first(), Some(&Point::new(0, 5)));
        assert_eq!(path.last(), Some(&Point::new(9, 5)));
    }
}
```

---

## 🏗️ Build WASM

### build-wasm.sh

```bash
#!/bin/bash

echo "Building WASM modules..."

# Build pathfinding module
cd wasm-pathfinding
wasm-pack build --target web --out-dir ../client/public/wasm/pathfinding
cd ..

# Build collision module (if exists)
if [ -d "wasm-collision" ]; then
    cd wasm-collision
    wasm-pack build --target web --out-dir ../client/public/wasm/collision
    cd ..
fi

echo "WASM build complete!"
```

```bash
chmod +x build-wasm.sh
./build-wasm.sh
```

---

## 🌉 JavaScript Bridge

### client/src/wasm/pathfinding-bridge.js

```javascript
let wasmModule = null;
let PathfindingEngine = null;

export async function initWasm() {
  try {
    // Import WASM module
    const wasm = await import('/wasm/pathfinding/wasm_pathfinding.js');
    await wasm.default();  // Initialize

    wasmModule = wasm;
    PathfindingEngine = wasm.PathfindingEngine;

    console.log('✅ WASM pathfinding loaded');
    return true;
  } catch (error) {
    console.warn('⚠️ WASM failed to load, using JavaScript fallback:', error);
    return false;
  }
}

export class PathfindingManager {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.useWasm = false;
    this.wasmEngine = null;
    this.jsEngine = null;  // Fallback
  }

  async initialize() {
    this.useWasm = await initWasm();

    if (this.useWasm) {
      this.wasmEngine = new PathfindingEngine(this.width, this.height);
    } else {
      // Fallback to JavaScript implementation
      this.jsEngine = new JsPathfindingEngine(this.width, this.height);
    }
  }

  setObstacle(x, y, blocked) {
    if (this.useWasm) {
      this.wasmEngine.set_obstacle(x, y, blocked);
    } else {
      this.jsEngine.setObstacle(x, y, blocked);
    }
  }

  findPath(start, goal) {
    if (this.useWasm) {
      const wasmStart = new wasmModule.Point(start.x, start.y);
      const wasmGoal = new wasmModule.Point(goal.x, goal.y);
      const wasmPath = this.wasmEngine.find_path(wasmStart, wasmGoal);

      // Convert WASM array to JavaScript array
      const path = [];
      for (let i = 0; i < wasmPath.length; i++) {
        const point = wasmPath[i];
        path.push({ x: point.x, y: point.y });
      }
      return path;
    } else {
      return this.jsEngine.findPath(start, goal);
    }
  }
}

// JavaScript fallback implementation
class JsPathfindingEngine {
  constructor(width, height) {
    this.width = width;
    this.height = height;
    this.obstacles = Array(width * height).fill(false);
  }

  setObstacle(x, y, blocked) {
    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
      this.obstacles[y * this.width + x] = blocked;
    }
  }

  findPath(start, goal) {
    // JavaScript A* implementation (slower)
    // ... (same algorithm as Rust, but in JavaScript)
  }
}
```

---

## 🎮 Integration into Game

### client/src/core/Engine.js

```javascript
import { PathfindingManager } from '@/wasm/pathfinding-bridge';

export class GameEngine {
  constructor() {
    this.pathfinding = null;
  }

  async initialize() {
    // Initialize WASM pathfinding
    this.pathfinding = new PathfindingManager(100, 100);
    await this.pathfinding.initialize();

    // Set obstacles (buildings)
    this.buildings.forEach(building => {
      const tileX = Math.floor(building.x / TILE_SIZE);
      const tileY = Math.floor(building.y / TILE_SIZE);
      this.pathfinding.setObstacle(tileX, tileY, true);
    });
  }

  moveUnit(unit, targetX, targetY) {
    const startTile = {
      x: Math.floor(unit.x / TILE_SIZE),
      y: Math.floor(unit.y / TILE_SIZE)
    };
    const goalTile = {
      x: Math.floor(targetX / TILE_SIZE),
      y: Math.floor(targetY / TILE_SIZE)
    };

    // Find path using WASM
    const path = this.pathfinding.findPath(startTile, goalTile);

    // Convert tile path to world coordinates
    unit.path = path.map(tile => ({
      x: tile.x * TILE_SIZE + TILE_SIZE / 2,
      y: tile.y * TILE_SIZE + TILE_SIZE / 2
    }));
  }
}
```

---

## 📊 Performance Benchmarking

### client/src/utils/benchmark.js

```javascript
import { PathfindingManager } from '@/wasm/pathfinding-bridge';
import { JsPathfindingEngine } from '@/pathfinding/AStar';

export async function benchmarkPathfinding() {
  const width = 100;
  const height = 100;

  // WASM version
  const wasmEngine = new PathfindingManager(width, height);
  await wasmEngine.initialize();

  // JavaScript version
  const jsEngine = new JsPathfindingEngine(width, height);

  // Add same obstacles
  for (let i = 0; i < 100; i++) {
    const x = Math.floor(Math.random() * width);
    const y = Math.floor(Math.random() * height);
    wasmEngine.setObstacle(x, y, true);
    jsEngine.setObstacle(x, y, true);
  }

  const iterations = 1000;
  const start = { x: 0, y: 0 };
  const goal = { x: 99, y: 99 };

  // Benchmark WASM
  const wasmStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    wasmEngine.findPath(start, goal);
  }
  const wasmTime = performance.now() - wasmStart;

  // Benchmark JavaScript
  const jsStart = performance.now();
  for (let i = 0; i < iterations; i++) {
    jsEngine.findPath(start, goal);
  }
  const jsTime = performance.now() - jsStart;

  console.log(`WASM: ${wasmTime.toFixed(2)}ms (${(iterations / wasmTime * 1000).toFixed(0)} paths/sec)`);
  console.log(`JS:   ${jsTime.toFixed(2)}ms (${(iterations / jsTime * 1000).toFixed(0)} paths/sec)`);
  console.log(`Speedup: ${(jsTime / wasmTime).toFixed(1)}x`);

  return { wasmTime, jsTime, speedup: jsTime / wasmTime };
}
```

Expected results:
```
WASM: 45ms (22,222 paths/sec)
JS:   890ms (1,124 paths/sec)
Speedup: 19.8x
```

---

## 🔍 Debugging WASM

### 1. Enable Debug Symbols

```toml
# Cargo.toml
[profile.release]
debug = true  # Include debug symbols
```

### 2. Console Logging from Rust

```rust
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

#[wasm_bindgen]
pub fn find_path(&self, start: Point, goal: Point) -> Vec<Point> {
    log(&format!("Finding path from {:?} to {:?}", start, goal));
    // ...
}
```

### 3. Browser DevTools

Chrome/Firefox support WASM debugging:
1. Open DevTools → Sources
2. Find `.wasm` file
3. Set breakpoints in WASM code
4. Step through execution

---

## 🧪 Testing WASM

### wasm-bindgen-test

```rust
#[cfg(test)]
mod tests {
    use super::*;
    use wasm_bindgen_test::*;

    wasm_bindgen_test_configure!(run_in_browser);

    #[wasm_bindgen_test]
    fn test_pathfinding_in_browser() {
        let mut engine = PathfindingEngine::new(10, 10);
        engine.set_obstacle(5, 5, true);

        let path = engine.find_path(Point::new(0, 0), Point::new(9, 9));
        assert!(!path.is_empty());
    }
}
```

Run tests:
```bash
wasm-pack test --chrome --headless
```

---

## 📦 Build Pipeline Integration

### package.json

```json
{
  "scripts": {
    "dev": "npm run build:wasm && vite",
    "build": "npm run build:wasm && vite build",
    "build:wasm": "./build-wasm.sh",
    "benchmark": "node scripts/benchmark-wasm.js"
  }
}
```

### vite.config.js

```javascript
import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  optimizeDeps: {
    exclude: ['@/wasm']  // Don't optimize WASM modules
  },
  server: {
    fs: {
      allow: ['..']  // Allow WASM from parent directory
    }
  }
});
```

---

## 🚀 Performance Tips

### 1. Minimize JS ↔ WASM Calls

❌ **Bad**: Call WASM for each unit
```javascript
units.forEach(unit => {
  const path = wasmEngine.findPath(unit.pos, target);  // Slow!
});
```

✅ **Good**: Batch calls
```javascript
const requests = units.map(u => ({ start: u.pos, goal: target }));
const paths = wasmEngine.findPathsBatch(requests);  // Fast!
```

### 2. Use Typed Arrays

❌ **Bad**: Pass JavaScript objects
```javascript
wasmEngine.findPath({ x: 10, y: 20 }, { x: 50, y: 60 });
```

✅ **Good**: Use numbers or typed arrays
```javascript
const coords = new Int32Array([10, 20, 50, 60]);
wasmEngine.findPathFromArray(coords);
```

### 3. Keep Large Data in WASM

Don't copy large arrays back and forth. Keep obstacles in WASM, only return paths.

---

## 🎯 Next Steps

1. **Collision Detection Module**: Port spatial hashing to WASM
2. **Game Simulation Module**: Deterministic combat/movement calculations
3. **Map Generation**: Procedural terrain in WASM
4. **Optimize Memory**: Use `wee_alloc` for smaller WASM binary

---

## 📚 Resources

- [Rust and WebAssembly Book](https://rustwasm.github.io/docs/book/)
- [wasm-bindgen Guide](https://rustwasm.github.io/wasm-bindgen/)
- [WASM Performance Tips](https://hacks.mozilla.org/2018/01/oxidizing-source-maps-with-rust-and-webassembly/)

---

**WebAssembly gives your game near-native performance in the browser. Use it wisely!** 🚀
