<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from "vue";

const MODES = {
    FOCUS: 25 * 60,
    SHORT_BREAK: 5 * 60,
    LONG_BREAK: 15 * 60
};

const currentMode = ref('FOCUS');
const maxTime = ref(MODES.FOCUS);
const elapsedSeconds = ref(0);
const playing = ref(false);

let timerInterval = null;
let startTime = ref(null);
let lastElapsedValue = 0;

// --- Persistance Logic ---

const saveState = () => {
    const state = {
        currentMode: currentMode.value,
        elapsedSeconds: elapsedSeconds.value,
        playing: playing.value,
        startTime: startTime.value,
        lastElapsedValue: lastElapsedValue
    };
    localStorage.setItem("pomodoro_state", JSON.stringify(state));
};

const loadState = () => {
    const saved = localStorage.getItem("pomodoro_state");
    if (!saved) return;

    const state = JSON.parse(saved);
    currentMode.ref = state.currentMode; // Update refs
    currentMode.value = state.currentMode;
    maxTime.value = MODES[state.currentMode];
    playing.value = state.playing;
    startTime.value = state.startTime;
    lastElapsedValue = state.lastElapsedValue;

    if (playing.value && startTime.value) {
        // Calculate how much time passed while the tab was closed
        const deltaSinceClose = (Date.now() - startTime.value) / 1000;
        elapsedSeconds.value = lastElapsedValue + deltaSinceClose;
        
        // Resume the interval
        runTicker();
    } else {
        elapsedSeconds.value = state.elapsedSeconds;
    }
};

// --- Timer Logic ---

const setMode = (modeName) => {
    stopTimer();
    currentMode.value = modeName;
    maxTime.value = MODES[modeName];
    elapsedSeconds.value = 0;
    lastElapsedValue = 0;
    saveState();
};

const runTicker = () => {
    if (timerInterval) clearInterval(timerInterval);
    timerInterval = setInterval(() => {
        const delta = (Date.now() - startTime.value) / 1000;
        elapsedSeconds.value = lastElapsedValue + delta;

        if (elapsedSeconds.value >= maxTime.value) {
            stopTimer();
            elapsedSeconds.value = maxTime.value;
            alert("Session complete!");
        }
    }, 100);
};

const startTimer = () => {
    if (playing.value) return;
    playing.value = true;
    startTime.value = Date.now();
    lastElapsedValue = elapsedSeconds.value;
    runTicker();
    saveState();
};

const stopTimer = () => {
    playing.value = false;
    if (timerInterval) clearInterval(timerInterval);
    saveState();
};

const resetTime = () => {
    stopTimer();
    elapsedSeconds.value = 0;
    lastElapsedValue = 0;
    saveState();
};

// --- Lifecycle & Watchers ---

onMounted(() => {
    loadState();
});

onUnmounted(() => {
    if (timerInterval) clearInterval(timerInterval);
});

// Watch for mode changes to ensure maxTime stays synced
watch(currentMode, (val) => {
    maxTime.value = MODES[val];
});

const getRotation = computed(() => (elapsedSeconds.value / maxTime.value) * 360);

const getTimeLeftString = computed(() => {
    const remaining = Math.max(0, maxTime.value - elapsedSeconds.value);
    const minutes = Math.floor(remaining / 60);
    const seconds = Math.floor(remaining % 60);
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
});
</script>

<template>
    <div class="card p-4 mb-4">
        <h1 class="text-2xl font-bold">Pomodoro Timer</h1>
    </div>
    
    <div class="card p-4">
        <Toolbar class="mb-4">
            <template #start>
                <Button v-if="!playing" icon="pi pi-play" @click="startTimer" severity="success" text />
                <Button v-if="playing" icon="pi pi-pause" @click="stopTimer" severity="warning" text />
                <Button icon="pi pi-undo" @click="resetTime" severity="secondary" text />
                
                <span class="mx-2">|</span>

                <Button 
                    icon="pi pi-briefcase" label="Focus" 
                    :severity="currentMode === 'FOCUS' ? 'primary' : 'secondary'"
                    text @click="setMode('FOCUS')" 
                />
                <Button 
                    icon="pi pi-coffee" label="Short break" 
                    :severity="currentMode === 'SHORT_BREAK' ? 'primary' : 'secondary'"
                    text @click="setMode('SHORT_BREAK')" 
                />
                <Button 
                    icon="pi pi-clock" label="Long break" 
                    :severity="currentMode === 'LONG_BREAK' ? 'primary' : 'secondary'"
                    text @click="setMode('LONG_BREAK')" 
                />
            </template>
        </Toolbar>

        <div id="pomodoro-circle">
            <div id="pomodoro-time-pointer" :style="{
                background: `conic-gradient(var(--primary-color, #4facfe) 0% ${getRotation}deg, rgba(0, 0, 0, 0) ${getRotation}deg 100%)`
            }">
            </div>

            <div id="pomodoro-label">
                {{ getTimeLeftString }}
            </div>
        </div>
    </div>
</template>

<style scoped>
#pomodoro-circle {
    width: 300px;
    height: 300px;
    border-radius: 50%;
    background: #FFF1;
    margin: 0 auto;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 8px solid #FFF1;

    #pomodoro-time-pointer {
        position: absolute;
        inset: -8px;
        width: calc(100% + 16px); 
        height: calc(100% + 16px);
        border-radius: 50%;
    }

    #pomodoro-label {
        font-size: 3.5rem;
        font-weight: 800;
        z-index: 10;
        font-variant-numeric: tabular-nums;
    }
}
</style>