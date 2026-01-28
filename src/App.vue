
<template>
    <main>
        <Menu id="navigator" :model="items" class="w-full md:w-60">
            <template #start class="text-center">
                <div class="w-1/1 text-center">
                    <span class="text-xl font-semibold">DEVDASH</span>
                </div>
            </template>
            <template #submenulabel="{ item }">
                <span class="text-primary font-bold">{{ item.label }}</span>
            </template>
            <template #item="{ item, props }">
                <a v-ripple class="flex items-center" @click="openView(item.view)" v-bind="props.action">
                    <span :class="item.icon" />
                    <span>{{ item.label }}</span>
                    <Badge v-if="item.badge" class="ml-auto" :value="item.badge" />
                    <span v-if="item.shortcut" class="ml-auto border border-surface rounded bg-emphasis text-muted-color text-xs p-1">{{ item.shortcut }}</span>
                </a>
            </template>
            <template #end>
                <div class="w-1/1 text-center">
                    <span class="font-bold">V1.0</span>
                </div>
            </template>
        </Menu>

        <section>
            <template v-if="Object.keys(views).includes(currentView)">
                <component :is="views[currentView]" />
            </template>

            <div v-else class="card">
                <h1 class="text-xl">
                    Internal error: No view named '{{ currentView }}'
                </h1>
            </div>
        </section>
    </main>
</template>

<script setup>
import { ref } from "vue";

import Home from '@/views/Home.vue';
import Settings from '@/views/Settings.vue';
import Pomodoro from "./views/Pomodoro.vue";

const currentView = ref('home');

const openView = (view) => {
    currentView.value = view;
};

const views = {
    home: Home,
    settings: Settings,
    pomodoro: Pomodoro
};

const items = ref([
    {
        label: 'General',
        items: [
            {
                label: 'Home',
                icon: 'pi pi-home',
                view: 'home'
            },
            {
                label: 'Settings',
                icon: 'pi pi-cog',
                view: 'settings'
            }
        ]
    },
    {
        separator: true
    },
    {
        label: 'Tools',
        items: [
            {
                label: 'Pomodoro',
                icon: 'pi pi-stopwatch',
                view: 'pomodoro'
            },
            // {
            //     label: 'Credentials',
            //     icon: 'pi pi-lock',
            //     view: 'credentials'
            // }
        ]
    }
]);
</script>
