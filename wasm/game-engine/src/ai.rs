use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::pathfinding::{NavigationGrid, Position};
use std::collections::HashMap;

/// Game state representation for AI decision-making
#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct GameState {
    pub units: HashMap<String, UnitState>,
    pub buildings: HashMap<String, BuildingState>,
    pub resources: HashMap<String, ResourceState>,
    pub player_resources: PlayerResources,
    pub population: PopulationData,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct UnitState {
    pub id: String,
    pub unit_type: String,
    pub owner_id: String,
    pub position: Position,
    pub state: String, // "idle", "moving", "harvesting", etc.
    pub hp: f32,
    pub carrying_resource: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct BuildingState {
    pub id: String,
    pub building_type: String,
    pub owner_id: String,
    pub position: Position,
    pub hp: f32,
    pub is_complete: bool,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct ResourceState {
    pub id: String,
    pub resource_type: String,
    pub position: Position,
    pub amount: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PlayerResources {
    pub food: f32,
    pub wood: f32,
    pub gold: f32,
    pub stone: f32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct PopulationData {
    pub current: u32,
    pub max: u32,
}

/// AI difficulty levels
#[wasm_bindgen]
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
pub enum AIDifficulty {
    Easy,
    Medium,
    Hard,
}

/// AI action types
#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum AIAction {
    MoveUnit { unit_id: String, target: Position },
    TrainUnit { building_id: String, unit_type: String },
    BuildStructure { builder_id: String, building_type: String, position: Position },
    GatherResource { unit_id: String, resource_id: String },
    Attack { unit_id: String, target_id: String },
    Research { building_id: String, tech_id: String },
    Idle,
}

/// AI state for a player
#[wasm_bindgen]
pub struct AIPlayer {
    difficulty: AIDifficulty,
    player_id: String,

    // Economy priorities
    food_priority: f32,
    wood_priority: f32,
    gold_priority: f32,
    stone_priority: f32,

    // Military priorities
    aggression: f32,
    defense: f32,

    // Decision cooldowns
    last_economic_decision: f32,
    last_military_decision: f32,
}

#[wasm_bindgen]
impl AIPlayer {
    /// Create a new AI player
    #[wasm_bindgen(constructor)]
    pub fn new(player_id: String, difficulty: AIDifficulty) -> AIPlayer {
        let (aggression, food_priority, wood_priority) = match difficulty {
            AIDifficulty::Easy => (0.3, 0.5, 0.3),
            AIDifficulty::Medium => (0.6, 0.7, 0.6),
            AIDifficulty::Hard => (0.9, 1.0, 0.9),
        };

        AIPlayer {
            difficulty,
            player_id,
            food_priority,
            wood_priority,
            gold_priority: 0.5,
            stone_priority: 0.3,
            aggression,
            defense: 0.7,
            last_economic_decision: 0.0,
            last_military_decision: 0.0,
        }
    }

    /// Update AI state and get next action
    pub fn update(&mut self, delta_time: f32, game_state: JsValue) -> JsValue {
        self.last_economic_decision += delta_time;
        self.last_military_decision += delta_time;

        let actions = self.decide_actions(game_state);
        serde_wasm_bindgen::to_value(&actions).unwrap()
    }

    /// Get AI difficulty
    pub fn get_difficulty(&self) -> AIDifficulty {
        self.difficulty
    }

    /// Set resource priority
    pub fn set_resource_priority(&mut self, food: f32, wood: f32, gold: f32, stone: f32) {
        self.food_priority = food.clamp(0.0, 1.0);
        self.wood_priority = wood.clamp(0.0, 1.0);
        self.gold_priority = gold.clamp(0.0, 1.0);
        self.stone_priority = stone.clamp(0.0, 1.0);
    }

    /// Set military strategy
    pub fn set_military_strategy(&mut self, aggression: f32, defense: f32) {
        self.aggression = aggression.clamp(0.0, 1.0);
        self.defense = defense.clamp(0.0, 1.0);
    }
}

impl AIPlayer {
    /// Main decision-making function
    fn decide_actions(&mut self, game_state: JsValue) -> Vec<AIAction> {
        let mut actions = Vec::new();

        // Parse game state
        let state: Result<GameState, _> = serde_wasm_bindgen::from_value(game_state);
        if state.is_err() {
            return actions; // Return empty if parsing fails
        }
        let state = state.unwrap();

        // Economic decisions (every 2-5 seconds depending on difficulty)
        let economic_cooldown = match self.difficulty {
            AIDifficulty::Easy => 5.0,
            AIDifficulty::Medium => 3.0,
            AIDifficulty::Hard => 2.0,
        };

        if self.last_economic_decision >= economic_cooldown {
            actions.extend(self.decide_economic_actions(&state));
            self.last_economic_decision = 0.0;
        }

        // Military decisions (every 3-7 seconds depending on difficulty)
        let military_cooldown = match self.difficulty {
            AIDifficulty::Easy => 7.0,
            AIDifficulty::Medium => 5.0,
            AIDifficulty::Hard => 3.0,
        };

        if self.last_military_decision >= military_cooldown {
            actions.extend(self.decide_military_actions(&state));
            self.last_military_decision = 0.0;
        }

        actions
    }

    /// Decide economic actions (gathering, building, training villagers)
    fn decide_economic_actions(&self, state: &GameState) -> Vec<AIAction> {
        let mut actions = Vec::new();

        // Get AI's units and buildings
        let my_units: Vec<&UnitState> = state.units.values()
            .filter(|u| u.owner_id == self.player_id)
            .collect();

        let my_buildings: Vec<&BuildingState> = state.buildings.values()
            .filter(|b| b.owner_id == self.player_id && b.is_complete)
            .collect();

        // Count villagers
        let villagers: Vec<&UnitState> = my_units.iter()
            .filter(|u| u.unit_type == "villager")
            .cloned()
            .collect();

        let idle_villagers: Vec<&UnitState> = villagers.iter()
            .filter(|u| u.state == "idle")
            .cloned()
            .collect();

        // 1. Train villagers if we have resources and population space
        let town_centers: Vec<&BuildingState> = my_buildings.iter()
            .filter(|b| b.building_type == "town_center")
            .cloned()
            .collect();

        if !town_centers.is_empty() && state.population.current < state.population.max {
            // Cost: 50 food
            if state.player_resources.food >= 50.0 {
                // Train based on difficulty and current villager count
                let desired_villagers = match self.difficulty {
                    AIDifficulty::Easy => 20,
                    AIDifficulty::Medium => 30,
                    AIDifficulty::Hard => 40,
                };

                if villagers.len() < desired_villagers {
                    actions.push(AIAction::TrainUnit {
                        building_id: town_centers[0].id.clone(),
                        unit_type: "villager".to_string(),
                    });
                }
            }
        }

        // 2. Build houses if population is near max
        if state.population.current + 5 >= state.population.max && state.player_resources.wood >= 30.0 {
            if let Some(builder) = idle_villagers.first() {
                // Find safe position near town center
                if let Some(tc) = town_centers.first() {
                    let build_pos = Position {
                        x: tc.position.x + 10,
                        z: tc.position.z + 10,
                    };

                    actions.push(AIAction::BuildStructure {
                        builder_id: builder.id.clone(),
                        building_type: "house".to_string(),
                        position: build_pos,
                    });
                }
            }
        }

        // 3. Assign idle villagers to resource gathering based on priorities
        for villager in idle_villagers.iter().take(3) {
            // Determine which resource to gather based on priorities and current resources
            let resource_type = self.choose_resource_to_gather(state);

            // Find nearest resource of that type
            if let Some(resource) = self.find_nearest_resource(state, &villager.position, &resource_type) {
                actions.push(AIAction::GatherResource {
                    unit_id: villager.id.clone(),
                    resource_id: resource.id.clone(),
                });
            }
        }

        // 4. Build economic buildings
        if villagers.len() >= 10 {
            // Build lumber camp if we have wood workers
            let lumber_camps = my_buildings.iter()
                .filter(|b| b.building_type == "lumber_camp")
                .count();

            if lumber_camps == 0 && state.player_resources.wood >= 100.0 {
                if let Some(builder) = idle_villagers.first() {
                    // Find forest
                    if let Some(tree) = self.find_nearest_resource(state, &builder.position, "tree") {
                        actions.push(AIAction::BuildStructure {
                            builder_id: builder.id.clone(),
                            building_type: "lumber_camp".to_string(),
                            position: tree.position.clone(),
                        });
                    }
                }
            }

            // Build mining camp for gold/stone
            let mining_camps = my_buildings.iter()
                .filter(|b| b.building_type == "mining_camp")
                .count();

            if mining_camps == 0 && state.player_resources.wood >= 100.0 {
                if let Some(builder) = idle_villagers.get(1) {
                    // Find gold mine
                    if let Some(gold) = self.find_nearest_resource(state, &builder.position, "gold_mine") {
                        actions.push(AIAction::BuildStructure {
                            builder_id: builder.id.clone(),
                            building_type: "mining_camp".to_string(),
                            position: gold.position.clone(),
                        });
                    }
                }
            }
        }

        actions
    }

    /// Decide military actions (training units, attacking, defending)
    fn decide_military_actions(&self, state: &GameState) -> Vec<AIAction> {
        let mut actions = Vec::new();

        // Get AI's units and buildings
        let my_units: Vec<&UnitState> = state.units.values()
            .filter(|u| u.owner_id == self.player_id)
            .collect();

        let my_buildings: Vec<&BuildingState> = state.buildings.values()
            .filter(|b| b.owner_id == self.player_id && b.is_complete)
            .collect();

        let enemy_units: Vec<&UnitState> = state.units.values()
            .filter(|u| u.owner_id != self.player_id)
            .collect();

        // Count military units
        let military_units: Vec<&UnitState> = my_units.iter()
            .filter(|u| u.unit_type != "villager")
            .cloned()
            .collect();

        // 1. Build barracks if we have enough economy
        let barracks: Vec<&BuildingState> = my_buildings.iter()
            .filter(|b| b.building_type == "barracks")
            .cloned()
            .collect();

        let villagers_count = my_units.iter().filter(|u| u.unit_type == "villager").count();

        if barracks.is_empty() && villagers_count >= 10 && state.player_resources.wood >= 175.0 {
            // Find a villager to build
            if let Some(villager) = my_units.iter().find(|u| u.unit_type == "villager" && u.state == "idle") {
                // Build near town center
                if let Some(tc) = my_buildings.iter().find(|b| b.building_type == "town_center") {
                    let build_pos = Position {
                        x: tc.position.x + 15,
                        z: tc.position.z,
                    };

                    actions.push(AIAction::BuildStructure {
                        builder_id: villager.id.clone(),
                        building_type: "barracks".to_string(),
                        position: build_pos,
                    });
                }
            }
        }

        // 2. Train military units based on aggression level
        if !barracks.is_empty() {
            let desired_army_size = match self.difficulty {
                AIDifficulty::Easy => (self.aggression * 10.0) as usize,
                AIDifficulty::Medium => (self.aggression * 20.0) as usize,
                AIDifficulty::Hard => (self.aggression * 30.0) as usize,
            };

            if military_units.len() < desired_army_size {
                // Train militia/swordsman (cost: 60 food, 20 gold)
                if state.player_resources.food >= 60.0 && state.player_resources.gold >= 20.0 {
                    if state.population.current < state.population.max {
                        actions.push(AIAction::TrainUnit {
                            building_id: barracks[0].id.clone(),
                            unit_type: "militia".to_string(),
                        });
                    }
                }
            }
        }

        // 3. Attack strategy based on aggression
        let threat_level = self.evaluate_threat_in_state(state);

        if self.aggression > 0.5 && military_units.len() >= 5 {
            // Offensive: attack enemy units or buildings
            if let Some(target) = self.find_attack_target(state, &enemy_units) {
                // Send all military units to attack
                for unit in military_units.iter().take(military_units.len() / 2) {
                    actions.push(AIAction::Attack {
                        unit_id: unit.id.clone(),
                        target_id: target.clone(),
                    });
                }
            }
        } else if threat_level > 0.6 {
            // Defensive: protect base if threatened
            if let Some(enemy) = self.find_nearest_enemy(state) {
                for unit in military_units.iter() {
                    actions.push(AIAction::Attack {
                        unit_id: unit.id.clone(),
                        target_id: enemy.id.clone(),
                    });
                }
            }
        }

        // 4. Build archery range for ranged units (higher difficulty)
        if self.difficulty == AIDifficulty::Hard {
            let archery_ranges = my_buildings.iter()
                .filter(|b| b.building_type == "archery_range")
                .count();

            if archery_ranges == 0 && barracks.len() >= 1 {
                if state.player_resources.wood >= 175.0 {
                    if let Some(villager) = my_units.iter().find(|u| u.unit_type == "villager" && u.state == "idle") {
                        if let Some(tc) = my_buildings.iter().find(|b| b.building_type == "town_center") {
                            let build_pos = Position {
                                x: tc.position.x - 15,
                                z: tc.position.z,
                            };

                            actions.push(AIAction::BuildStructure {
                                builder_id: villager.id.clone(),
                                building_type: "archery_range".to_string(),
                                position: build_pos,
                            });
                        }
                    }
                }
            }
        }

        actions
    }

    /// Choose which resource to gather based on priorities and current stockpile
    fn choose_resource_to_gather(&self, state: &GameState) -> String {
        let res = &state.player_resources;

        // Calculate need for each resource (priority / current amount)
        let food_need = if res.food > 0.0 { self.food_priority / res.food } else { self.food_priority * 10.0 };
        let wood_need = if res.wood > 0.0 { self.wood_priority / res.wood } else { self.wood_priority * 10.0 };
        let gold_need = if res.gold > 0.0 { self.gold_priority / res.gold } else { self.gold_priority * 10.0 };
        let stone_need = if res.stone > 0.0 { self.stone_priority / res.stone } else { self.stone_priority * 10.0 };

        // Return resource with highest need
        if food_need >= wood_need && food_need >= gold_need && food_need >= stone_need {
            "berry_bush".to_string() // or "deer"
        } else if wood_need >= gold_need && wood_need >= stone_need {
            "tree".to_string()
        } else if gold_need >= stone_need {
            "gold_mine".to_string()
        } else {
            "stone_mine".to_string()
        }
    }

    /// Find nearest resource of given type
    fn find_nearest_resource<'a>(&self, state: &'a GameState, from: &Position, resource_type: &str) -> Option<&'a ResourceState> {
        state.resources.values()
            .filter(|r| r.resource_type == resource_type && r.amount > 0.0)
            .min_by(|a, b| {
                let dist_a = a.position.distance(from);
                let dist_b = b.position.distance(from);
                dist_a.partial_cmp(&dist_b).unwrap_or(std::cmp::Ordering::Equal)
            })
    }

    /// Evaluate threat level in current state
    fn evaluate_threat_in_state(&self, state: &GameState) -> f32 {
        let enemy_units: Vec<&UnitState> = state.units.values()
            .filter(|u| u.owner_id != self.player_id)
            .collect();

        // Find own town center position
        let tc_pos = state.buildings.values()
            .find(|b| b.owner_id == self.player_id && b.building_type == "town_center")
            .map(|b| &b.position);

        if let Some(tc_pos) = tc_pos {
            // Count enemies near base (within 30 units)
            let nearby_enemies = enemy_units.iter()
                .filter(|e| {
                    let dist = e.position.distance(tc_pos);
                    dist < 30.0
                })
                .count();

            // Threat increases with number of nearby enemies
            (nearby_enemies as f32 / 10.0).min(1.0)
        } else {
            0.5
        }
    }

    /// Find best attack target
    fn find_attack_target(&self, state: &GameState, enemies: &[&UnitState]) -> Option<String> {
        if enemies.is_empty() {
            // No enemy units, target buildings
            return state.buildings.values()
                .find(|b| b.owner_id != self.player_id)
                .map(|b| b.id.clone());
        }

        // Prioritize villagers for economic damage
        if let Some(villager) = enemies.iter().find(|e| e.unit_type == "villager") {
            return Some(villager.id.clone());
        }

        // Otherwise, target weakest unit
        enemies.iter()
            .min_by(|a, b| a.hp.partial_cmp(&b.hp).unwrap_or(std::cmp::Ordering::Equal))
            .map(|u| u.id.clone())
    }

    /// Find nearest enemy to base
    fn find_nearest_enemy<'a>(&self, state: &'a GameState) -> Option<&'a UnitState> {
        let tc_pos = state.buildings.values()
            .find(|b| b.owner_id == self.player_id && b.building_type == "town_center")
            .map(|b| &b.position)?;

        state.units.values()
            .filter(|u| u.owner_id != self.player_id)
            .min_by(|a, b| {
                let dist_a = a.position.distance(tc_pos);
                let dist_b = b.position.distance(tc_pos);
                dist_a.partial_cmp(&dist_b).unwrap_or(std::cmp::Ordering::Equal)
            })
    }

    /// Evaluate threat level
    fn evaluate_threat(&self) -> f32 {
        // Would analyze:
        // - Enemy unit count near base
        // - Enemy military strength
        // - Our defensive capabilities
        0.5 // Placeholder
    }

    /// Decide target for attack
    fn choose_attack_target(&self, enemies: &[String]) -> Option<String> {
        // Would prioritize:
        // - Villagers (economic damage)
        // - Weak units
        // - Buildings under construction
        enemies.first().cloned()
    }
}

/// AI Manager for handling multiple AI players
#[wasm_bindgen]
pub struct AIManager {
    ai_players: Vec<AIPlayer>,
    navigation_grid: Option<NavigationGrid>,
}

#[wasm_bindgen]
impl AIManager {
    /// Create a new AI manager
    #[wasm_bindgen(constructor)]
    pub fn new() -> AIManager {
        AIManager {
            ai_players: Vec::new(),
            navigation_grid: None,
        }
    }

    /// Add an AI player
    pub fn add_ai_player(&mut self, player_id: String, difficulty: AIDifficulty) {
        self.ai_players.push(AIPlayer::new(player_id, difficulty));
    }

    /// Set navigation grid for pathfinding
    pub fn set_navigation_grid(&mut self, grid: NavigationGrid) {
        self.navigation_grid = Some(grid);
    }

    /// Update all AI players
    pub fn update_all(&mut self, _delta_time: f32, _game_state: JsValue) -> String {
        let mut all_actions = Vec::new();

        for _ai_player in &mut self.ai_players {
            // Simplified: just return empty actions for now
            // In full implementation, would process game_state
            let actions: Vec<AIAction> = Vec::new();
            all_actions.push(actions);
        }

        // Return as JSON string
        serde_json::to_string(&all_actions).unwrap_or_else(|_| "[]".to_string())
    }

    /// Get number of AI players
    pub fn get_ai_count(&self) -> usize {
        self.ai_players.len()
    }

    /// Remove all AI players
    pub fn clear(&mut self) {
        self.ai_players.clear();
    }
}

/// AI strategy patterns
pub struct AIStrategy {
    pub name: String,
    pub description: String,
}

impl AIStrategy {
    /// Rush strategy - early aggression
    pub fn rush() -> Self {
        AIStrategy {
            name: "Rush".to_string(),
            description: "Fast military production and early aggression".to_string(),
        }
    }

    /// Boom strategy - economic focus
    pub fn boom() -> Self {
        AIStrategy {
            name: "Boom".to_string(),
            description: "Focus on economic growth and villager production".to_string(),
        }
    }

    /// Turtle strategy - defensive play
    pub fn turtle() -> Self {
        AIStrategy {
            name: "Turtle".to_string(),
            description: "Build strong defenses and walls".to_string(),
        }
    }

    /// Balanced strategy
    pub fn balanced() -> Self {
        AIStrategy {
            name: "Balanced".to_string(),
            description: "Mix of economy, military, and defense".to_string(),
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_ai_creation() {
        let ai = AIPlayer::new("player1".to_string(), AIDifficulty::Medium);
        assert_eq!(ai.get_difficulty(), AIDifficulty::Medium);
    }

    #[test]
    fn test_ai_manager() {
        let mut manager = AIManager::new();
        manager.add_ai_player("ai1".to_string(), AIDifficulty::Easy);
        manager.add_ai_player("ai2".to_string(), AIDifficulty::Hard);
        assert_eq!(manager.get_ai_count(), 2);
    }
}
