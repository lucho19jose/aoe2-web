# Changelog

All notable changes to the AoE2 Web Edition project will be documented in this file.

## [Unreleased] - 2025-11-17

### Added

#### Core Game Systems

- **Civilization System** (`client/src/config/civilizations.ts`)
  - Implemented 12 playable civilizations: Britons, Franks, Goths, Teutons, Japanese, Chinese, Byzantines, Persians, Saracens, Turks, Vikings, Mongols
  - Each civilization has unique bonuses affecting units, buildings, economy, and technologies
  - Team bonuses system for multiplayer gameplay
  - Civilization bonus application system with automatic stat modifications

- **Age Advancement System** (`client/src/config/ages.ts`)
  - Complete 4-age progression: Dark Age → Feudal Age → Castle Age → Imperial Age
  - Each age has specific resource requirements, research time, and building prerequisites
  - Progressive unlocking of units, buildings, and technologies per age
  - Age-specific bonuses (max population, building HP, military unlock levels)
  - Helper functions to check advancement eligibility and available content

#### Units

- **Extended Unit Roster** (`client/src/config/units.ts`)
  - Added 35+ unit types across all categories:
    - **Infantry**: Militia line (5 upgrades), Spearman line (3 upgrades), Eagle Warrior line (3 upgrades)
    - **Archers**: Archer line (3 upgrades), Skirmisher line (2 upgrades), Cavalry Archer (2 upgrades), Hand Cannoneer
    - **Cavalry**: Scout line (3 upgrades), Knight line (3 upgrades), Camel line (2 upgrades)
    - **Siege**: Battering Ram, Mangonel line (2 upgrades), Scorpion line (2 upgrades)
    - **Monk**: Conversion and healing unit
  - Complete unit stats: HP, attack, armor (melee/pierce), speed, range, cost, training time
  - Unit counter system with strong_against/weak_against relationships
  - Age-based unit availability

#### Buildings

- **Extended Building System** (`client/src/config/buildings.ts`)
  - Added 25+ building types:
    - **Economic**: Town Center, House, Mill, Lumber Camp, Mining Camp, Market, Dock, Farm
    - **Military**: Barracks, Archery Range, Stable, Blacksmith, Siege Workshop, Monastery, University
    - **Defensive**: Castle, Tower line (4 upgrades), Outpost, Walls (3 types), Gates (2 types)
    - **Special**: Wonder
  - Complete building stats: HP, armor, line of sight, garrison capacity, attack capabilities
  - Building production queues and technology trees
  - Age-based building availability

#### UI Components

- **Technology Tree Viewer** (`client/src/components/TechTree.vue`)
  - Visual representation of all available technologies
  - Categorized view: Economic, Military, Defensive technologies
  - Age progression display with advancement UI
  - Technology prerequisites and dependency visualization
  - Real-time availability checking based on resources and research status
  - Interactive technology details with research buttons
  - Age filtering system

- **Game Statistics Integration** (`client/src/views/GameView.vue`)
  - Integrated GameStatistics component into main game view
  - Statistics accessible via in-game menu
  - Victory/Defeat modal with statistics button
  - Full-screen statistics display dialog
  - Real-time statistics tracking during gameplay

### Changed

- Enhanced game view with statistics and victory/defeat screens
- Updated type definitions to support new game systems
- Improved modular configuration structure

### Technical Details

#### New Configuration Files

1. `client/src/config/civilizations.ts` (450+ lines)
   - 12 civilizations with unique bonuses
   - Bonus type system (13 bonus types)
   - Civilization bonus application functions

2. `client/src/config/ages.ts` (350+ lines)
   - 4 complete age definitions
   - Age requirements and unlocks
   - Age progression helper functions

3. `client/src/config/units.ts` (750+ lines)
   - 35+ unit configurations
   - Complete stat definitions
   - Unit query helper functions

4. `client/src/config/buildings.ts` (500+ lines)
   - 25+ building configurations
   - Building capabilities and production queues
   - Building query helper functions

5. `client/src/components/TechTree.vue` (400+ lines)
   - Interactive technology tree UI
   - Age filtering and progression display

#### Modified Files

- `client/src/views/GameView.vue`: Added statistics integration and victory/defeat modals

### Statistics

- **Total New Code**: ~2,500 lines
- **New Configuration Files**: 5
- **Modified Files**: 1
- **Civilizations**: 12
- **Ages**: 4
- **Units**: 35+
- **Buildings**: 25+
- **Technologies**: 100+ (defined in existing technologies.ts)

### Compatibility

- All new systems are backward compatible with existing game engine
- No breaking changes to existing APIs
- New configuration files follow established patterns

### Documentation

- Comprehensive inline documentation for all new systems
- Type definitions for all new interfaces
- Helper functions with clear purpose and usage

### Future Integration

These new systems provide the foundation for:
- Age advancement in gameplay
- Civilization selection in lobby
- Expanded unit and building production
- Visual technology tree in game UI
- Enhanced AI with civilization-specific strategies

## Previous Releases

See NUEVAS_CARACTERISTICAS.md for features implemented in previous development sessions.
