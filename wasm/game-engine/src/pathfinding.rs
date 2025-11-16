use std::collections::{BinaryHeap, HashMap, HashSet};
use std::cmp::Ordering;
use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};

/// Position in 2D grid
#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, Serialize, Deserialize)]
#[wasm_bindgen]
pub struct Position {
    pub x: i32,
    pub z: i32,
}

#[wasm_bindgen]
impl Position {
    #[wasm_bindgen(constructor)]
    pub fn new(x: i32, z: i32) -> Position {
        Position { x, z }
    }

    /// Manhattan distance heuristic
    pub fn manhattan_distance(&self, other: &Position) -> i32 {
        (self.x - other.x).abs() + (self.z - other.z).abs()
    }

    /// Euclidean distance (for diagonal movement cost)
    pub fn distance(&self, other: &Position) -> f32 {
        let dx = (self.x - other.x) as f32;
        let dz = (self.z - other.z) as f32;
        (dx * dx + dz * dz).sqrt()
    }
}

/// A* pathfinding node
#[derive(Debug, Clone)]
struct PathNode {
    position: Position,
    g_cost: f32,     // Cost from start
    h_cost: f32,     // Heuristic cost to goal
    f_cost: f32,     // Total cost (g + h)
    parent: Option<Position>,
}

impl PathNode {
    fn new(position: Position, g_cost: f32, h_cost: f32, parent: Option<Position>) -> Self {
        PathNode {
            position,
            g_cost,
            h_cost,
            f_cost: g_cost + h_cost,
            parent,
        }
    }
}

impl PartialEq for PathNode {
    fn eq(&self, other: &Self) -> bool {
        self.position == other.position
    }
}

impl Eq for PathNode {}

impl PartialOrd for PathNode {
    fn partial_cmp(&self, other: &Self) -> Option<Ordering> {
        Some(self.cmp(other))
    }
}

impl Ord for PathNode {
    fn cmp(&self, other: &Self) -> Ordering {
        // Reverse ordering for min-heap behavior
        other.f_cost.partial_cmp(&self.f_cost).unwrap_or(Ordering::Equal)
    }
}

/// Navigation grid for pathfinding
#[wasm_bindgen]
pub struct NavigationGrid {
    width: usize,
    height: usize,
    walkable: Vec<bool>,
}

#[wasm_bindgen]
impl NavigationGrid {
    /// Create a new navigation grid
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> NavigationGrid {
        let size = width * height;
        NavigationGrid {
            width,
            height,
            walkable: vec![true; size],
        }
    }

    /// Set walkability of a cell
    pub fn set_walkable(&mut self, x: i32, y: i32, walkable: bool) {
        if let Some(index) = self.get_index(x, y) {
            self.walkable[index] = walkable;
        }
    }

    /// Check if a cell is walkable
    pub fn is_walkable(&self, x: i32, y: i32) -> bool {
        self.get_index(x, y)
            .map(|i| self.walkable[i])
            .unwrap_or(false)
    }

    /// Set a rectangular area as obstacle
    pub fn set_obstacle_rect(&mut self, x: i32, y: i32, width: i32, height: i32) {
        for dy in 0..height {
            for dx in 0..width {
                self.set_walkable(x + dx, y + dy, false);
            }
        }
    }

    /// Clear all obstacles
    pub fn clear_obstacles(&mut self) {
        for cell in &mut self.walkable {
            *cell = true;
        }
    }

    /// Find path using A* algorithm
    pub fn find_path(&self, start_x: i32, start_z: i32, goal_x: i32, goal_z: i32) -> JsValue {
        let start = Position::new(start_x, start_z);
        let goal = Position::new(goal_x, goal_z);

        if !self.is_walkable(start.x, start.z) || !self.is_walkable(goal.x, goal.z) {
            return serde_wasm_bindgen::to_value(&Vec::<Position>::new()).unwrap();
        }

        let path = self.a_star(start, goal);
        serde_wasm_bindgen::to_value(&path).unwrap()
    }

    /// A* pathfinding algorithm
    fn a_star(&self, start: Position, goal: Position) -> Vec<Position> {
        let mut open_set = BinaryHeap::new();
        let mut came_from: HashMap<Position, Position> = HashMap::new();
        let mut g_scores: HashMap<Position, f32> = HashMap::new();
        let mut closed_set: HashSet<Position> = HashSet::new();

        // Initialize start node
        let h_cost = start.manhattan_distance(&goal) as f32;
        open_set.push(PathNode::new(start, 0.0, h_cost, None));
        g_scores.insert(start, 0.0);

        while let Some(current) = open_set.pop() {
            // Check if we reached the goal
            if current.position == goal {
                return self.reconstruct_path(&came_from, current.position);
            }

            // Skip if already processed
            if closed_set.contains(&current.position) {
                continue;
            }

            closed_set.insert(current.position);

            // Check all neighbors
            for neighbor_pos in self.get_neighbors(current.position) {
                if closed_set.contains(&neighbor_pos) {
                    continue;
                }

                // Calculate movement cost (1.0 for cardinal, ~1.414 for diagonal)
                let move_cost = current.position.distance(&neighbor_pos);
                let tentative_g = current.g_cost + move_cost;

                // Check if this path is better
                if tentative_g < *g_scores.get(&neighbor_pos).unwrap_or(&f32::INFINITY) {
                    came_from.insert(neighbor_pos, current.position);
                    g_scores.insert(neighbor_pos, tentative_g);

                    let h_cost = neighbor_pos.manhattan_distance(&goal) as f32;
                    open_set.push(PathNode::new(
                        neighbor_pos,
                        tentative_g,
                        h_cost,
                        Some(current.position),
                    ));
                }
            }
        }

        // No path found
        Vec::new()
    }

    /// Reconstruct path from came_from map
    fn reconstruct_path(&self, came_from: &HashMap<Position, Position>, mut current: Position) -> Vec<Position> {
        let mut path = vec![current];

        while let Some(&parent) = came_from.get(&current) {
            current = parent;
            path.push(current);
        }

        path.reverse();

        // Remove start position (unit is already there)
        if path.len() > 1 {
            path.remove(0);
        }

        path
    }

    /// Get walkable neighbors of a position (8-directional)
    fn get_neighbors(&self, pos: Position) -> Vec<Position> {
        let directions = [
            (-1, -1), (0, -1), (1, -1),  // Top row
            (-1,  0),          (1,  0),  // Middle row
            (-1,  1), (0,  1), (1,  1),  // Bottom row
        ];

        directions
            .iter()
            .filter_map(|(dx, dz)| {
                let new_x = pos.x + dx;
                let new_z = pos.z + dz;
                if self.is_walkable(new_x, new_z) {
                    Some(Position::new(new_x, new_z))
                } else {
                    None
                }
            })
            .collect()
    }

    /// Get grid index from coordinates
    fn get_index(&self, x: i32, y: i32) -> Option<usize> {
        if x >= 0 && y >= 0 && (x as usize) < self.width && (y as usize) < self.height {
            Some(y as usize * self.width + x as usize)
        } else {
            None
        }
    }

    /// Get grid dimensions
    pub fn get_width(&self) -> usize {
        self.width
    }

    pub fn get_height(&self) -> usize {
        self.height
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_pathfinding_simple() {
        let grid = NavigationGrid::new(10, 10);
        let path = grid.a_star(Position::new(0, 0), Position::new(5, 5));
        assert!(!path.is_empty());
        assert_eq!(path.last().unwrap(), &Position::new(5, 5));
    }

    #[test]
    fn test_pathfinding_with_obstacle() {
        let mut grid = NavigationGrid::new(10, 10);
        // Add vertical wall
        for y in 0..8 {
            grid.set_walkable(5, y, false);
        }

        let path = grid.a_star(Position::new(0, 5), Position::new(9, 5));
        assert!(!path.is_empty());
        // Path should go around the wall
        assert!(path.iter().all(|p| p.x != 5 || p.z >= 8));
    }

    #[test]
    fn test_no_path() {
        let mut grid = NavigationGrid::new(10, 10);
        // Create complete wall
        for y in 0..10 {
            grid.set_walkable(5, y, false);
        }

        let path = grid.a_star(Position::new(0, 5), Position::new(9, 5));
        assert!(path.is_empty());
    }
}
