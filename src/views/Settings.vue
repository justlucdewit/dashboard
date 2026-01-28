<script setup>
import { ref, onMounted, onUnmounted } from 'vue';

const settings = ref({
    general: {
        theme: 'default-dark',
        sidebar: 'wide',
    },
    home: {
        welcomeMessage: 'Welcome to devdash'
    }
});

const loadSettingsFromMemory = () => {
    // Loading settings from local storage
};
</script>

<template>
    <div class="card p-4 mb-4">
        <h1 class="text-2xl font-bold mb-4">
            Configuration
        </h1>

        <Toolbar>
            <template #start>
                <IconField>
                    <InputIcon>
                        <i class="pi pi-search" />
                    </InputIcon>
                    <InputText placeholder="Search for a setting" />
                </IconField>
                <Button icon="pi pi-save" severity="secondary" text />
                <Button icon="pi pi-undo" severity="secondary" text />
            </template>

            <template #end>
                <Button icon="pi pi-download" class="mr-2" severity="secondary" text />
                <Button icon="pi pi-upload" severity="secondary" text />
                <Button icon="pi pi-copy" severity="secondary" text />
            </template>
        </Toolbar>

        <Accordion :value="['0', '1']" multiple="">
            <AccordionPanel value="0">
                <AccordionHeader>General settings</AccordionHeader>
                <AccordionContent>
                    <div class="flex items-center justify-between mb-2">
                        <label>Theme</label>
                        <Select v-model="settings.general.theme" :options="['default-dark', 'default-light']" class="w-full md:w-56" />
                    </div>

                    <div class="flex items-center justify-between mb-2">
                        <label>Sidebar</label>
                        <Select v-model="settings.general.sidebar" :options="['wide', 'narrow', 'icons-only']"  class="w-full md:w-56" />
                    </div>
                </AccordionContent>
            </AccordionPanel>

            <AccordionPanel value="1">
                <AccordionHeader>Home</AccordionHeader>
                <AccordionContent>
                    <div class="flex items-center justify-between mb-2">
                        <label>Welcome message</label>
                        <InputText v-model="settings.home.welcomeMessage" placeholder="Welcome to devdash" class="w-full md:w-56" />
                    </div>
                </AccordionContent>
            </AccordionPanel>
        </Accordion>
    </div>
</template>

<style scoped>

</style>







        
