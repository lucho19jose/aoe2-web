mod pathfinding;
mod ai;

use wasm_bindgen::prelude::*;

// Re-export modules
pub use pathfinding::{NavigationGrid, Position};
pub use ai::{AIPlayer, AIManager, AIDifficulty};

/// Initialize WASM module
/// Should be called once when the module loads
#[wasm_bindgen(start)]
pub fn init() {
    // Set panic hook for better error messages
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();

    // Log initialization
    log("AoE2 Web Game Engine (WASM) initialized");
}

/// Log message to browser console
#[wasm_bindgen]
pub fn log(s: &str) {
    web_sys::console::log_1(&s.into());
}

/// Get version of the WASM module
#[wasm_bindgen]
pub fn get_version() -> String {
    env!("CARGO_PKG_VERSION").to_string()
}

/// Benchmark pathfinding performance
#[wasm_bindgen]
pub fn benchmark_pathfinding(grid_size: usize, num_iterations: usize) -> f64 {
    use std::time::Instant;

    let mut grid = NavigationGrid::new(grid_size, grid_size);

    // Add some obstacles
    grid.set_obstacle_rect(grid_size as i32 / 4, 0, 2, grid_size as i32 / 2);

    let start = Instant::now();

    for i in 0..num_iterations {
        let start_x = (i % grid_size) as i32;
        let start_z = (i / grid_size) as i32;
        let goal_x = ((grid_size - 1) - (i % grid_size)) as i32;
        let goal_z = ((grid_size - 1) - (i / grid_size)) as i32;

        let _ = grid.find_path(start_x, start_z, goal_x, goal_z);
    }

    let elapsed = start.elapsed();
    elapsed.as_secs_f64() * 1000.0 // Return milliseconds
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_version() {
        let version = get_version();
        assert!(!version.is_empty());
    }
}
