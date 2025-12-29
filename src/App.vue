
<template>
    <div>
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
                <a v-ripple class="flex items-center" v-bind="props.action">
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
    </div>
</template>

<script setup>
import { ref } from "vue";

const items = ref([
    {
        label: 'General',
        items: [
            {
                label: 'Home',
                icon: 'pi pi-home'
            },
            {
                label: 'Settings',
                icon: 'pi pi-cog'
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
                label: 'Timer',
                icon: 'pi pi-clock'
            },
            {
                label: 'Credentials',
                icon: 'pi pi-lock'
            }
        ]
    }
]);
</script>
