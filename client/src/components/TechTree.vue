<template>
  <div class="tech-tree">
    <div class="tech-tree-header">
      <h3>Technology Tree</h3>
      <div class="age-selector">
        <q-btn-toggle
          v-model="selectedAge"
          :options="ageOptions"
          color="primary"
          toggle-color="positive"
          no-caps
        />
      </div>
    </div>

    <div class="tech-tree-content">
      <!-- Economic Technologies -->
      <div class="tech-category">
        <h4>Economic Technologies</h4>
        <div class="tech-grid">
          <div
            v-for="tech in filteredTechnologies.economic"
            :key="tech.id"
            class="tech-item"
            :class="{
              researched: isResearched(tech.id),
              available: isTechAvailable(tech),
              locked: !isTechAvailable(tech)
            }"
            @click="selectTech(tech)"
          >
            <q-icon :name="tech.icon || 'science'" size="32px" />
            <div class="tech-name">{{ tech.name }}</div>
            <div class="tech-cost">
              <span v-if="tech.cost.food">{{ tech.cost.food }}F</span>
              <span v-if="tech.cost.wood">{{ tech.cost.wood }}W</span>
              <span v-if="tech.cost.gold">{{ tech.cost.gold }}G</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Military Technologies -->
      <div class="tech-category">
        <h4>Military Technologies</h4>
        <div class="tech-grid">
          <div
            v-for="tech in filteredTechnologies.military"
            :key="tech.id"
            class="tech-item"
            :class="{
              researched: isResearched(tech.id),
              available: isTechAvailable(tech),
              locked: !isTechAvailable(tech)
            }"
            @click="selectTech(tech)"
          >
            <q-icon :name="tech.icon || 'shield'" size="32px" />
            <div class="tech-name">{{ tech.name }}</div>
            <div class="tech-cost">
              <span v-if="tech.cost.food">{{ tech.cost.food }}F</span>
              <span v-if="tech.cost.wood">{{ tech.cost.wood }}W</span>
              <span v-if="tech.cost.gold">{{ tech.cost.gold }}G</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Defensive Technologies -->
      <div class="tech-category">
        <h4>Defensive Technologies</h4>
        <div class="tech-grid">
          <div
            v-for="tech in filteredTechnologies.defensive"
            :key="tech.id"
            class="tech-item"
            :class="{
              researched: isResearched(tech.id),
              available: isTechAvailable(tech),
              locked: !isTechAvailable(tech)
            }"
            @click="selectTech(tech)"
          >
            <q-icon :name="tech.icon || 'castle'" size="32px" />
            <div class="tech-name">{{ tech.name }}</div>
            <div class="tech-cost">
              <span v-if="tech.cost.food">{{ tech.cost.food }}F</span>
              <span v-if="tech.cost.wood">{{ tech.cost.wood }}W</span>
              <span v-if="tech.cost.gold">{{ tech.cost.gold }}G</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Age Advancement -->
      <div class="tech-category">
        <h4>Age Advancement</h4>
        <div class="age-progress">
          <div
            v-for="age in ages"
            :key="age.id"
            class="age-item"
            :class="{
              current: age.id === currentAge,
              completed: isAgeCompleted(age.id),
              locked: !canAdvanceToAge(age.id)
            }"
          >
            <q-icon name="castle" size="48px" />
            <div class="age-name">{{ age.name }}</div>
            <div v-if="age.cost" class="age-cost">
              {{ age.cost.food }}F {{ age.cost.gold }}G
            </div>
            <q-btn
              v-if="!isAgeCompleted(age.id) && canAdvanceToAge(age.id)"
              label="Research"
              color="primary"
              size="sm"
              @click="advanceToAge(age.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Tech Details Dialog -->
    <q-dialog v-model="showTechDetails">
      <q-card style="min-width: 300px">
        <q-card-section v-if="selectedTech">
          <div class="text-h6">{{ selectedTech.name }}</div>
          <div class="text-caption">{{ selectedTech.description }}</div>
        </q-card-section>
        <q-card-section v-if="selectedTech">
          <div class="tech-details">
            <div><strong>Cost:</strong></div>
            <div>
              <span v-if="selectedTech.cost.food">{{ selectedTech.cost.food }} Food</span>
              <span v-if="selectedTech.cost.wood">{{ selectedTech.cost.wood }} Wood</span>
              <span v-if="selectedTech.cost.gold">{{ selectedTech.cost.gold }} Gold</span>
              <span v-if="selectedTech.cost.stone">{{ selectedTech.cost.stone }} Stone</span>
            </div>
            <div><strong>Research Time:</strong> {{ selectedTech.researchTime }}s</div>
            <div v-if="selectedTech.effects"><strong>Effects:</strong></div>
            <ul v-if="selectedTech.effects">
              <li v-for="effect in selectedTech.effects" :key="effect">{{ effect }}</li>
            </ul>
          </div>
        </q-card-section>
        <q-card-actions align="right">
          <q-btn flat label="Close" color="primary" v-close-popup />
          <q-btn
            v-if="selectedTech && isTechAvailable(selectedTech) && !isResearched(selectedTech.id)"
            label="Research"
            color="positive"
            @click="researchTech(selectedTech.id)"
            v-close-popup
          />
        </q-card-actions>
      </q-card>
    </q-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { getAllTechnologies, type TechnologyConfig } from '@/config/technologies'
import { getAllAges, type AgeConfig } from '@/config/ages'

interface Props {
  currentAge: string
  researchedTechs: Set<string>
  resources: {
    food: number
    wood: number
    gold: number
    stone: number
  }
}

const props = defineProps<Props>()
const emit = defineEmits<{
  research: [techId: string]
  advanceAge: [ageId: string]
}>()

const selectedAge = ref('all')
const showTechDetails = ref(false)
const selectedTech = ref<TechnologyConfig | null>(null)

const ageOptions = [
  { label: 'All', value: 'all' },
  { label: 'Dark Age', value: 'dark_age' },
  { label: 'Feudal', value: 'feudal_age' },
  { label: 'Castle', value: 'castle_age' },
  { label: 'Imperial', value: 'imperial_age' }
]

const ages = computed(() => getAllAges())
const allTechnologies = computed(() => getAllTechnologies())

const filteredTechnologies = computed(() => {
  const techs = allTechnologies.value

  const filterByAge = (tech: TechnologyConfig) => {
    if (selectedAge.value === 'all') return true
    return tech.age === selectedAge.value
  }

  return {
    economic: techs.filter(t => t.category === 'economic' && filterByAge(t)),
    military: techs.filter(t => t.category === 'military' && filterByAge(t)),
    defensive: techs.filter(t => t.category === 'defensive' && filterByAge(t))
  }
})

const isResearched = (techId: string): boolean => {
  return props.researchedTechs.has(techId)
}

const isTechAvailable = (tech: TechnologyConfig): boolean => {
  // Check if all prerequisites are researched
  if (tech.prerequisites) {
    return tech.prerequisites.every(prereq => isResearched(prereq))
  }
  return true
}

const canAfford = (cost: any): boolean => {
  return (
    (cost.food || 0) <= props.resources.food &&
    (cost.wood || 0) <= props.resources.wood &&
    (cost.gold || 0) <= props.resources.gold &&
    (cost.stone || 0) <= props.resources.stone
  )
}

const isAgeCompleted = (ageId: string): boolean => {
  const ageOrder = ['dark_age', 'feudal_age', 'castle_age', 'imperial_age']
  const currentAgeIndex = ageOrder.indexOf(props.currentAge)
  const targetAgeIndex = ageOrder.indexOf(ageId)
  return targetAgeIndex <= currentAgeIndex
}

const canAdvanceToAge = (ageId: string): boolean => {
  const ageOrder = ['dark_age', 'feudal_age', 'castle_age', 'imperial_age']
  const currentAgeIndex = ageOrder.indexOf(props.currentAge)
  const targetAgeIndex = ageOrder.indexOf(ageId)
  return targetAgeIndex === currentAgeIndex + 1
}

const selectTech = (tech: TechnologyConfig) => {
  selectedTech.value = tech
  showTechDetails.value = true
}

const researchTech = (techId: string) => {
  emit('research', techId)
}

const advanceToAge = (ageId: string) => {
  emit('advanceAge', ageId)
}
</script>

<style lang="scss" scoped>
.tech-tree {
  width: 100%;
  height: 100%;
  padding: 1rem;
  background: #1a1a1a;
  color: white;
  overflow-y: auto;
}

.tech-tree-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #333;

  h3 {
    margin: 0;
    font-size: 1.8rem;
  }
}

.tech-tree-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.tech-category {
  h4 {
    margin: 0 0 1rem 0;
    font-size: 1.4rem;
    color: #4a9eff;
  }
}

.tech-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(120px, 1fr));
  gap: 1rem;
}

.tech-item {
  background: #2a2a2a;
  border: 2px solid #444;
  border-radius: 8px;
  padding: 1rem;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 8px rgba(0, 0, 0, 0.3);
  }

  &.researched {
    background: #1a4d1a;
    border-color: #2d7a2d;
  }

  &.available {
    border-color: #4a9eff;
  }

  &.locked {
    opacity: 0.5;
    cursor: not-allowed;

    &:hover {
      transform: none;
    }
  }

  .tech-name {
    margin-top: 0.5rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .tech-cost {
    margin-top: 0.5rem;
    font-size: 0.8rem;
    color: #ffd700;
    display: flex;
    gap: 0.5rem;
    justify-content: center;
  }
}

.age-progress {
  display: flex;
  gap: 2rem;
  justify-content: space-around;
  flex-wrap: wrap;
}

.age-item {
  background: #2a2a2a;
  border: 3px solid #444;
  border-radius: 12px;
  padding: 1.5rem;
  text-align: center;
  min-width: 150px;

  &.current {
    border-color: #4a9eff;
    background: #1a3a5a;
  }

  &.completed {
    border-color: #2d7a2d;
    background: #1a4d1a;
  }

  &.locked {
    opacity: 0.5;
  }

  .age-name {
    margin: 0.5rem 0;
    font-size: 1.1rem;
    font-weight: 600;
  }

  .age-cost {
    margin: 0.5rem 0;
    color: #ffd700;
    font-size: 0.9rem;
  }
}

.tech-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;

  ul {
    margin: 0.5rem 0;
    padding-left: 1.5rem;
  }
}
</style>
