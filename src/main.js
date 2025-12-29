import "primeicons/primeicons.css";
import "./style.css";
import "./flags.css";

import { createApp } from "vue";
import PrimeVue from "primevue/config";
import ConfirmationService from 'primevue/confirmationservice'
import DialogService from 'primevue/dialogservice'
import ToastService from 'primevue/toastservice';
import Menu from "primevue/menu";
import Badge from "primevue/badge";
import Avatar from "primevue/avatar";
import Button from "primevue/button";
import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

import App from "./App.vue";

const app = createApp(App);

app.use(ConfirmationService);
app.use(ToastService);
app.use(DialogService);
app.component('Menu', Menu);
app.component('Badge', Badge);
app.component('Avatar', Avatar);
app.component('Button', Button);

app.use(PrimeVue, {
    theme: {
        preset: definePreset(Aura, {
        semantic: {
            primary: {
                50: '{surface.50}',
                100: '{surface.100}',
                200: '{surface.200}',
                300: '{surface.300}',
                400: '{surface.400}',
                500: '{surface.500}',
                600: '{surface.600}',
                700: '{surface.700}',
                800: '{surface.800}',
                900: '{surface.900}',
                950: '{surface.950}'
            },
            colorScheme: {
                light: {
                    primary: {
                    color: '{primary.950}',
                    contrastColor: '#ffffff',
                    hoverColor: '{primary.900}',
                    activeColor: '{primary.800}'
                    },
                    highlight: {
                    background: '{primary.950}',
                    focusBackground: '{primary.700}',
                    color: '#ffffff',
                    focusColor: '#ffffff'
                    },
                },
                dark: {
                    primary: {
                    color: '{primary.50}',
                    contrastColor: '{primary.950}',
                    hoverColor: '{primary.100}',
                    activeColor: '{primary.200}'
                    },
                    highlight: {
                    background: '{primary.50}',
                    focusBackground: '{primary.300}',
                    color: '{primary.950}',
                    focusColor: '{primary.950}'
                    }
                }
            }
        }
    }),
        options: {
            prefix: 'p',
            darkModeSelector: '.p-dark',
            cssLayer: false,
        }
    }
});


app.mount("#app");
