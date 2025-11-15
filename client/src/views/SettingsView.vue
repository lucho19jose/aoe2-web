<template>
  <div class="settings-view">
    <div class="container">
      <div class="header">
        <q-btn flat icon="arrow_back" label="Back" @click="goBack" />
        <h2>Settings</h2>
        <div style="width: 100px"></div>
      </div>

      <div class="content">
        <q-card class="settings-card">
          <q-tabs v-model="tab" class="text-primary">
            <q-tab name="graphics" label="Graphics" />
            <q-tab name="audio" label="Audio" />
            <q-tab name="controls" label="Controls" />
          </q-tabs>

          <q-separator />

          <q-tab-panels v-model="tab" animated>
            <q-tab-panel name="graphics">
              <div class="settings-section">
                <q-select
                  v-model="settings.graphics.quality"
                  :options="['Low', 'Medium', 'High', 'Ultra']"
                  label="Graphics Quality"
                  outlined
                />
                <q-select
                  v-model="settings.graphics.resolution"
                  :options="['1280x720', '1920x1080', '2560x1440', '3840x2160']"
                  label="Resolution"
                  outlined
                />
                <q-toggle v-model="settings.graphics.fullscreen" label="Fullscreen" />
                <q-toggle v-model="settings.graphics.vsync" label="V-Sync" />
              </div>
            </q-tab-panel>

            <q-tab-panel name="audio">
              <div class="settings-section">
                <q-slider
                  v-model="settings.audio.masterVolume"
                  :min="0"
                  :max="100"
                  label
                  label-always
                  :label-value="'Master: ' + settings.audio.masterVolume + '%'"
                />
                <q-slider
                  v-model="settings.audio.musicVolume"
                  :min="0"
                  :max="100"
                  label
                  label-always
                  :label-value="'Music: ' + settings.audio.musicVolume + '%'"
                />
                <q-slider
                  v-model="settings.audio.sfxVolume"
                  :min="0"
                  :max="100"
                  label
                  label-always
                  :label-value="'SFX: ' + settings.audio.sfxVolume + '%'"
                />
              </div>
            </q-tab-panel>

            <q-tab-panel name="controls">
              <div class="settings-section">
                <q-select
                  v-model="settings.controls.scrollSpeed"
                  :options="['Slow', 'Normal', 'Fast']"
                  label="Camera Scroll Speed"
                  outlined
                />
                <q-toggle v-model="settings.controls.edgeScrolling" label="Edge Scrolling" />
                <q-toggle v-model="settings.controls.smartSelection" label="Smart Selection" />
              </div>
            </q-tab-panel>
          </q-tab-panels>
        </q-card>

        <div class="actions">
          <q-btn color="primary" label="Save Settings" @click="saveSettings" />
          <q-btn flat label="Reset to Default" @click="resetSettings" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useQuasar } from 'quasar'

const router = useRouter()
const $q = useQuasar()
const tab = ref('graphics')

const settings = ref({
  graphics: {
    quality: 'High',
    resolution: '1920x1080',
    fullscreen: false,
    vsync: true
  },
  audio: {
    masterVolume: 80,
    musicVolume: 60,
    sfxVolume: 80
  },
  controls: {
    scrollSpeed: 'Normal',
    edgeScrolling: true,
    smartSelection: true
  }
})

const goBack = () => {
  router.back()
}

const saveSettings = () => {
  localStorage.setItem('aoe2-settings', JSON.stringify(settings.value))
  $q.notify({
    type: 'positive',
    message: 'Settings saved successfully'
  })
}

const resetSettings = () => {
  $q.dialog({
    title: 'Reset Settings',
    message: 'Are you sure you want to reset all settings to default?',
    cancel: true
  }).onOk(() => {
    settings.value = {
      graphics: {
        quality: 'High',
        resolution: '1920x1080',
        fullscreen: false,
        vsync: true
      },
      audio: {
        masterVolume: 80,
        musicVolume: 60,
        sfxVolume: 80
      },
      controls: {
        scrollSpeed: 'Normal',
        edgeScrolling: true,
        smartSelection: true
      }
    }
    $q.notify({
      type: 'info',
      message: 'Settings reset to default'
    })
  })
}
</script>

<style lang="scss" scoped>
.settings-view {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  padding: 2rem;
  overflow-y: auto;
}

.container {
  max-width: 900px;
  margin: 0 auto;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;

  h2 {
    color: #f0a500;
    font-size: 2rem;
    margin: 0;
  }
}

.content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

.settings-card {
  background: rgba(255, 255, 255, 0.95);
}

.settings-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1rem 0;
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
}
</style>
