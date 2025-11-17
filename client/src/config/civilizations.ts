/**
 * Civilizations configuration with unique bonuses
 * Based on Age of Empires 2
 */

export interface CivilizationBonus {
  description: string
  type: 'economic' | 'military' | 'defensive' | 'special'
  effect: {
    target?: string // unit, building, resource
    stat?: string // hp, attack, speed, cost, etc.
    value: number | string
  }
}

export interface Civilization {
  id: string
  name: string
  description: string
  bonuses: CivilizationBonus[]
  uniqueUnit: {
    name: string
    type: string
    description: string
  }
  uniqueTech: {
    name: string
    description: string
  }
  teamBonus: CivilizationBonus
}

export const CIVILIZATIONS: Record<string, Civilization> = {
  BRITONS: {
    id: 'britons',
    name: 'Britones',
    description: 'Civilización de arqueros con ventajas en rango',
    bonuses: [
      {
        description: 'Arqueros tienen +1 de rango en Castle Age, +1 en Imperial Age',
        type: 'military',
        effect: { target: 'archer', stat: 'range', value: 2 }
      },
      {
        description: 'Centro de ciudad trabaja 10% más rápido',
        type: 'economic',
        effect: { target: 'town_center', stat: 'work_rate', value: 1.1 }
      },
      {
        description: 'Pastores trabajan 25% más rápido',
        type: 'economic',
        effect: { target: 'villager', stat: 'gather_rate_food', value: 1.25 }
      }
    ],
    uniqueUnit: {
      name: 'Longbowman',
      type: 'archer',
      description: 'Arquero con alcance excepcional'
    },
    uniqueTech: {
      name: 'Yeomen',
      description: '+1 rango para arqueros y torres'
    },
    teamBonus: {
      description: 'Campos de tiro (Archery Range) trabajan 20% más rápido',
      type: 'military',
      effect: { target: 'archery_range', stat: 'production_speed', value: 1.2 }
    }
  },

  FRANKS: {
    id: 'franks',
    name: 'Francos',
    description: 'Civilización de caballería con economía fuerte',
    bonuses: [
      {
        description: 'Caballería +20% HP',
        type: 'military',
        effect: { target: 'knight', stat: 'hp', value: 1.2 }
      },
      {
        description: 'Castillos cuestan -25%',
        type: 'defensive',
        effect: { target: 'castle', stat: 'cost', value: 0.75 }
      },
      {
        description: 'Granja mejoras gratis',
        type: 'economic',
        effect: { target: 'farm', stat: 'upgrades_free', value: 'true' }
      },
      {
        description: 'Foragers trabajan 25% más rápido',
        type: 'economic',
        effect: { target: 'villager', stat: 'gather_rate_berries', value: 1.25 }
      }
    ],
    uniqueUnit: {
      name: 'Throwing Axeman',
      type: 'infantry',
      description: 'Infantería que lanza hachas'
    },
    uniqueTech: {
      name: 'Bearded Axe',
      description: 'Throwing Axemen +1 rango'
    },
    teamBonus: {
      description: 'Caballeros tienen +2 línea de visión',
      type: 'military',
      effect: { target: 'knight', stat: 'line_of_sight', value: 2 }
    }
  },

  MONGOLS: {
    id: 'mongols',
    name: 'Mongoles',
    description: 'Civilización nómada con caballería de arqueros',
    bonuses: [
      {
        description: 'Unidades de caballería se mueven 30% más rápido',
        type: 'military',
        effect: { target: 'cavalry', stat: 'speed', value: 1.3 }
      },
      {
        description: 'Cazadores trabajan 50% más rápido',
        type: 'economic',
        effect: { target: 'villager', stat: 'gather_rate_hunt', value: 1.5 }
      },
      {
        description: '+50% HP para unidades de asedio',
        type: 'military',
        effect: { target: 'siege', stat: 'hp', value: 1.5 }
      },
      {
        description: 'Línea de visión +2 para exploradores',
        type: 'military',
        effect: { target: 'scout', stat: 'line_of_sight', value: 2 }
      }
    ],
    uniqueUnit: {
      name: 'Mangudai',
      type: 'cavalry_archer',
      description: 'Arquero a caballo que es rápido y mortal'
    },
    uniqueTech: {
      name: 'Drill',
      description: 'Unidades de asedio se mueven 50% más rápido'
    },
    teamBonus: {
      description: 'Exploradores +2 línea de visión',
      type: 'military',
      effect: { target: 'scout', stat: 'line_of_sight', value: 2 }
    }
  },

  TEUTONS: {
    id: 'teutons',
    name: 'Teutones',
    description: 'Civilización defensiva con infantería pesada',
    bonuses: [
      {
        description: 'Frailes tienen +2 de rango para curación',
        type: 'special',
        effect: { target: 'monk', stat: 'heal_range', value: 2 }
      },
      {
        description: 'Torres pueden acomodar +5 unidades',
        type: 'defensive',
        effect: { target: 'tower', stat: 'garrison', value: 5 }
      },
      {
        description: 'Conversión de frailes enemigos 33% más resistente',
        type: 'special',
        effect: { target: 'monk', stat: 'conversion_resistance', value: 0.67 }
      },
      {
        description: 'Granjas cuestan -33%',
        type: 'economic',
        effect: { target: 'farm', stat: 'cost', value: 0.67 }
      }
    ],
    uniqueUnit: {
      name: 'Teutonic Knight',
      type: 'infantry',
      description: 'Caballero fuertemente armado con alto ataque'
    },
    uniqueTech: {
      name: 'Crenellations',
      description: 'Castillos +3 de rango, infantería en guarnición dispara flechas'
    },
    teamBonus: {
      description: 'Unidades resisten conversión más efectivamente',
      type: 'special',
      effect: { target: 'all', stat: 'conversion_resistance', value: 0.8 }
    }
  },

  VIKINGS: {
    id: 'vikings',
    name: 'Vikingos',
    description: 'Civilización naval e infantería',
    bonuses: [
      {
        description: 'Infantería +10% HP en Feudal, +15% en Castle, +20% en Imperial',
        type: 'military',
        effect: { target: 'infantry', stat: 'hp', value: 1.2 }
      },
      {
        description: 'Barcos de guerra cuestan -15%',
        type: 'military',
        effect: { target: 'warship', stat: 'cost', value: 0.85 }
      },
      {
        description: 'Carros de mano y carretilla gratis',
        type: 'economic',
        effect: { target: 'wheelbarrow', stat: 'cost', value: 0 }
      }
    ],
    uniqueUnit: {
      name: 'Berserk',
      type: 'infantry',
      description: 'Guerrero que se regenera automáticamente'
    },
    uniqueTech: {
      name: 'Chieftains',
      description: 'Infantería +4 ataque vs caballería'
    },
    teamBonus: {
      description: 'Muelles cuestan -15%',
      type: 'economic',
      effect: { target: 'dock', stat: 'cost', value: 0.85 }
    }
  },

  SARACENS: {
    id: 'saracens',
    name: 'Sarracenos',
    description: 'Civilización de caballería y comercio',
    bonuses: [
      {
        description: 'Mercado cuesta -75 madera',
        type: 'economic',
        effect: { target: 'market', stat: 'cost_wood', value: -75 }
      },
      {
        description: 'Comercio genera +5% de oro',
        type: 'economic',
        effect: { target: 'trade', stat: 'gold_rate', value: 1.05 }
      },
      {
        description: 'Galeras atacan 20% más rápido',
        type: 'military',
        effect: { target: 'galley', stat: 'attack_speed', value: 1.2 }
      },
      {
        description: 'Unidades de caballería +20 HP',
        type: 'military',
        effect: { target: 'cavalry', stat: 'hp', value: 20 }
      }
    ],
    uniqueUnit: {
      name: 'Mameluke',
      type: 'cavalry',
      description: 'Camello que lanza jabalinas'
    },
    uniqueTech: {
      name: 'Zealotry',
      description: 'Mamelukes y camellos +30 HP'
    },
    teamBonus: {
      description: 'Arqueros a pie +1 ataque vs edificios',
      type: 'military',
      effect: { target: 'foot_archer', stat: 'attack_building', value: 1 }
    }
  },

  CHINESE: {
    id: 'chinese',
    name: 'Chinos',
    description: 'Civilización versátil con ventajas económicas',
    bonuses: [
      {
        description: 'Empiezas con +3 aldeanos, -50 comida, -200 madera',
        type: 'economic',
        effect: { target: 'start', stat: 'villagers', value: 3 }
      },
      {
        description: 'Centro de ciudad soporta +5 de población',
        type: 'economic',
        effect: { target: 'town_center', stat: 'population', value: 5 }
      },
      {
        description: 'Tecnologías cuestan -10% en Feudal, -15% en Castle, -20% en Imperial',
        type: 'economic',
        effect: { target: 'technology', stat: 'cost', value: 0.8 }
      },
      {
        description: 'Granjeros +5% de eficiencia',
        type: 'economic',
        effect: { target: 'villager', stat: 'gather_rate_farm', value: 1.05 }
      }
    ],
    uniqueUnit: {
      name: 'Chu Ko Nu',
      type: 'archer',
      description: 'Arquero que dispara múltiples flechas'
    },
    uniqueTech: {
      name: 'Rocketry',
      description: 'Chu Ko Nu +2 ataque, +4 vs unidades de asedio'
    },
    teamBonus: {
      description: 'Granjas +45 comida',
      type: 'economic',
      effect: { target: 'farm', stat: 'food', value: 45 }
    }
  },

  JAPANESE: {
    id: 'japanese',
    name: 'Japoneses',
    description: 'Civilización de infantería rápida',
    bonuses: [
      {
        description: 'Infantería ataca 25% más rápido',
        type: 'military',
        effect: { target: 'infantry', stat: 'attack_speed', value: 1.25 }
      },
      {
        description: 'Molinos, campamentos de leñadores y minería gratis',
        type: 'economic',
        effect: { target: 'eco_buildings', stat: 'cost', value: 0 }
      },
      {
        description: 'Barcos de pesca tienen +2 armadura, +50% HP',
        type: 'economic',
        effect: { target: 'fishing_ship', stat: 'hp', value: 1.5 }
      },
      {
        description: 'Galeras +50% línea de visión',
        type: 'military',
        effect: { target: 'galley', stat: 'line_of_sight', value: 1.5 }
      }
    ],
    uniqueUnit: {
      name: 'Samurai',
      type: 'infantry',
      description: 'Guerrero rápido con bonificación vs unidades únicas'
    },
    uniqueTech: {
      name: 'Kataparuto',
      description: 'Trabucos y Onagros disparan y se empaquetan 33% más rápido'
    },
    teamBonus: {
      description: 'Galeras +50% línea de visión',
      type: 'military',
      effect: { target: 'galley', stat: 'line_of_sight', value: 1.5 }
    }
  }
}

/**
 * Get civilization by ID
 */
export function getCivilization(civId: string): Civilization | null {
  const key = civId.toUpperCase()
  return CIVILIZATIONS[key] || null
}

/**
 * Get all civilizations as array
 */
export function getAllCivilizations(): Civilization[] {
  return Object.values(CIVILIZATIONS)
}

/**
 * Apply civilization bonuses to game state
 */
export function applyCivilizationBonuses(
  civId: string,
  gameState: any
): void {
  const civ = getCivilization(civId)
  if (!civ) return

  console.log(`🏛️ Applying bonuses for ${civ.name}:`)
  civ.bonuses.forEach(bonus => {
    console.log(`  • ${bonus.description}`)
  })

  // In a full implementation, you would apply these bonuses to:
  // - Unit stats (HP, attack, speed, etc.)
  // - Building costs and capabilities
  // - Resource gathering rates
  // - Technology costs
  // etc.
}
