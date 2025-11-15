<template>
  <q-layout view="hHh lpR fFf">
    <q-header elevated class="bg-dark text-white">
      <q-toolbar>
        <q-toolbar-title>
          Age of Empires II Web Edition
        </q-toolbar-title>
        <q-space />
        <q-btn flat round dense icon="settings" />
      </q-toolbar>
    </q-header>

    <q-page-container>
      <router-view />
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
// Main App Component
</script>

<style scoped>
.q-page-container {
  height: 100vh;
  padding: 0 !important;
}
</style>
