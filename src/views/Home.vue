<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const currentTime = ref('');
const currentDate = ref('');

const updateTime = () => {
    const now = new Date();
    // Format the time (e.g., 14:30:05)
    currentTime.value = now.toLocaleTimeString();
    // Format the date (e.g., Monday, January 1, 2024)
    currentDate.value = now.toLocaleDateString(undefined, { year: 'numeric', month: 'numeric', day: 'numeric' }).replaceAll('-', ' / ');
};

onMounted(() => {
    updateTime(); // Set initial time immediately
    const timer = setInterval(updateTime, 1000); // Update every 1 second
    
    // Clean up the timer if the component is destroyed
    onUnmounted(() => clearInterval(timer));
});

const browser = window.navigator.userAgent;
</script>

<template>
    <div class="card p-4 mb-4">
        <h1 class="text-2xl font-bold">
            Welcome to devdash
        </h1>
    </div>
    
    <div class="grid grid-cols-2 gap-4">
        <div class="card p-4">
            <h1 class="text-xl font-bold text-surface-500 dark:text-surface-400 mb-2">
                Today:
            </h1>
            <p class="font-mono text-gray-300 font-semibold text-primary mb-3">
                {{ currentDate }}
            </p>
            <p class="font-mono text-gray-300 font-semibold text-primary">
                {{ currentTime }}
            </p>
        </div>

        <div class="card p-4">
            <h1 class="text-xl font-bold text-surface-500 dark:text-surface-400 mb-2">
                System:
            </h1>
            <p class="text-gray-300 font-semibold mb-3">version 1.0</p>
            <p class="text-gray-300 font-semibold mb-3">browser {{ browser }}</p>
        </div>
    </div>
</template>

<style scoped>

</style>