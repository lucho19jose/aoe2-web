/* tslint:disable */
/* eslint-disable */
/**
 * Get version of the WASM module
 */
export function get_version(): string;
/**
 * Log message to browser console
 */
export function log(s: string): void;
/**
 * Initialize WASM module
 * Should be called once when the module loads
 */
export function init(): void;
/**
 * Benchmark pathfinding performance
 */
export function benchmark_pathfinding(grid_size: number, num_iterations: number): number;
/**
 * AI difficulty levels
 */
export enum AIDifficulty {
  Easy = 0,
  Medium = 1,
  Hard = 2,
}
/**
 * AI Manager for handling multiple AI players
 */
export class AIManager {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Update all AI players
   */
  update_all(_delta_time: number, _game_state: any): string;
  /**
   * Get number of AI players
   */
  get_ai_count(): number;
  /**
   * Add an AI player
   */
  add_ai_player(player_id: string, difficulty: AIDifficulty): void;
  /**
   * Set navigation grid for pathfinding
   */
  set_navigation_grid(grid: NavigationGrid): void;
  /**
   * Create a new AI manager
   */
  constructor();
  /**
   * Remove all AI players
   */
  clear(): void;
}
/**
 * AI state for a player
 */
export class AIPlayer {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Get AI difficulty
   */
  get_difficulty(): AIDifficulty;
  /**
   * Set military strategy
   */
  set_military_strategy(aggression: number, defense: number): void;
  /**
   * Set resource priority
   */
  set_resource_priority(food: number, wood: number, gold: number, stone: number): void;
  /**
   * Create a new AI player
   */
  constructor(player_id: string, difficulty: AIDifficulty);
  /**
   * Update AI state and get next action
   */
  update(delta_time: number, game_state: any): any;
}
/**
 * Navigation grid for pathfinding
 */
export class NavigationGrid {
  free(): void;
  [Symbol.dispose](): void;
  get_height(): number;
  /**
   * Check if a cell is walkable
   */
  is_walkable(x: number, y: number): boolean;
  /**
   * Set walkability of a cell
   */
  set_walkable(x: number, y: number, walkable: boolean): void;
  /**
   * Clear all obstacles
   */
  clear_obstacles(): void;
  /**
   * Set a rectangular area as obstacle
   */
  set_obstacle_rect(x: number, y: number, width: number, height: number): void;
  /**
   * Create a new navigation grid
   */
  constructor(width: number, height: number);
  /**
   * Find path using A* algorithm
   */
  find_path(start_x: number, start_z: number, goal_x: number, goal_z: number): any;
  /**
   * Get grid dimensions
   */
  get_width(): number;
}
/**
 * Position in 2D grid
 */
export class Position {
  free(): void;
  [Symbol.dispose](): void;
  /**
   * Manhattan distance heuristic
   */
  manhattan_distance(other: Position): number;
  constructor(x: number, z: number);
  /**
   * Euclidean distance (for diagonal movement cost)
   */
  distance(other: Position): number;
  x: number;
  z: number;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
  readonly memory: WebAssembly.Memory;
  readonly __wbg_aimanager_free: (a: number, b: number) => void;
  readonly __wbg_aiplayer_free: (a: number, b: number) => void;
  readonly __wbg_get_position_x: (a: number) => number;
  readonly __wbg_get_position_z: (a: number) => number;
  readonly __wbg_navigationgrid_free: (a: number, b: number) => void;
  readonly __wbg_position_free: (a: number, b: number) => void;
  readonly __wbg_set_position_x: (a: number, b: number) => void;
  readonly __wbg_set_position_z: (a: number, b: number) => void;
  readonly aimanager_add_ai_player: (a: number, b: number, c: number, d: number) => void;
  readonly aimanager_clear: (a: number) => void;
  readonly aimanager_get_ai_count: (a: number) => number;
  readonly aimanager_new: () => number;
  readonly aimanager_set_navigation_grid: (a: number, b: number) => void;
  readonly aimanager_update_all: (a: number, b: number, c: number, d: number) => void;
  readonly aiplayer_get_difficulty: (a: number) => number;
  readonly aiplayer_new: (a: number, b: number, c: number) => number;
  readonly aiplayer_set_military_strategy: (a: number, b: number, c: number) => void;
  readonly aiplayer_set_resource_priority: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly aiplayer_update: (a: number, b: number, c: number) => number;
  readonly benchmark_pathfinding: (a: number, b: number) => number;
  readonly get_version: (a: number) => void;
  readonly log: (a: number, b: number) => void;
  readonly navigationgrid_clear_obstacles: (a: number) => void;
  readonly navigationgrid_find_path: (a: number, b: number, c: number, d: number, e: number) => number;
  readonly navigationgrid_get_height: (a: number) => number;
  readonly navigationgrid_get_width: (a: number) => number;
  readonly navigationgrid_is_walkable: (a: number, b: number, c: number) => number;
  readonly navigationgrid_new: (a: number, b: number) => number;
  readonly navigationgrid_set_obstacle_rect: (a: number, b: number, c: number, d: number, e: number) => void;
  readonly navigationgrid_set_walkable: (a: number, b: number, c: number, d: number) => void;
  readonly position_distance: (a: number, b: number) => number;
  readonly position_manhattan_distance: (a: number, b: number) => number;
  readonly init: () => void;
  readonly position_new: (a: number, b: number) => number;
  readonly __wbindgen_export: (a: number, b: number) => number;
  readonly __wbindgen_export2: (a: number, b: number, c: number, d: number) => number;
  readonly __wbindgen_export3: (a: number, b: number, c: number) => void;
  readonly __wbindgen_add_to_stack_pointer: (a: number) => number;
  readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;
/**
* Instantiates the given `module`, which can either be bytes or
* a precompiled `WebAssembly.Module`.
*
* @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
*
* @returns {InitOutput}
*/
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
* If `module_or_path` is {RequestInfo} or {URL}, makes a request and
* for everything else, calls `WebAssembly.instantiate` directly.
*
* @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
*
* @returns {Promise<InitOutput>}
*/
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
