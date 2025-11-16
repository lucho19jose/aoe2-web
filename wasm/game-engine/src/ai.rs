use wasm_bindgen::prelude::*;
use serde::{Deserialize, Serialize};
use crate::pathfinding::{NavigationGrid, Position};

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
    fn decide_actions(&mut self, _game_state: JsValue) -> Vec<AIAction> {
        let mut actions = Vec::new();

        // Parse game state (would normally deserialize from JsValue)
        // For now, return placeholder logic

        // Economic decisions (every 2-5 seconds depending on difficulty)
        let economic_cooldown = match self.difficulty {
            AIDifficulty::Easy => 5.0,
            AIDifficulty::Medium => 3.0,
            AIDifficulty::Hard => 2.0,
        };

        if self.last_economic_decision >= economic_cooldown {
            actions.extend(self.decide_economic_actions());
            self.last_economic_decision = 0.0;
        }

        // Military decisions (every 3-7 seconds depending on difficulty)
        let military_cooldown = match self.difficulty {
            AIDifficulty::Easy => 7.0,
            AIDifficulty::Medium => 5.0,
            AIDifficulty::Hard => 3.0,
        };

        if self.last_military_decision >= military_cooldown {
            actions.extend(self.decide_military_actions());
            self.last_military_decision = 0.0;
        }

        actions
    }

    /// Decide economic actions (gathering, building, training villagers)
    fn decide_economic_actions(&self) -> Vec<AIAction> {
        let actions = Vec::new();

        // Simplified AI logic - in real implementation, this would:
        // 1. Check current resources
        // 2. Count idle villagers
        // 3. Decide what to build/train
        // 4. Assign villagers to resources based on priorities

        // Example: Train villager if we have resources
        // actions.push(AIAction::TrainUnit {
        //     building_id: "town_center_1".to_string(),
        //     unit_type: "villager".to_string(),
        // });

        actions
    }

    /// Decide military actions (training units, attacking, defending)
    fn decide_military_actions(&self) -> Vec<AIAction> {
        let actions = Vec::new();

        // Simplified AI logic - in real implementation:
        // 1. Scout enemy positions
        // 2. Decide unit composition
        // 3. Train military units based on aggression level
        // 4. Attack or defend based on strategy

        actions
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
