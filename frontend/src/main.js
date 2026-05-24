import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';

if (typeof globalThis.Buffer === 'undefined') {
    globalThis.Buffer = {
        from(input, encoding) {
            if (encoding === 'base64') {
                const bin = atob(input);
                const bytes = new Uint8Array(bin.length);
                for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
                return bytes;
            }
            if (typeof input === 'string') {
                return new TextEncoder().encode(input);
            }
            return new Uint8Array(input);
        },
        isBuffer() { return false; },
    };
}

import './styles/common.css';
import 'quasar/dist/quasar.css';
import '@quasar/extras/roboto-font/roboto-font.css';
import '@quasar/extras/material-icons/material-icons.css';

import App from './App.vue'
import routes from './pages/';
import store from 'shared/stores/';
import { createPinia } from 'pinia';

import { Quasar } from 'quasar';
import {
	Dialog, LocalStorage, SessionStorage, Notify,
} from 'quasar';

import defaultSettings from 'settings/settings.js';
import defaultCssVariables from 'settings/cssVariables.js';

import Log from '../../shared/classes/Log.js';

const normalizedDefaultCSSVariables = {};
for (const [key, value] of Object.entries(defaultCssVariables)) {
	if (typeof value === 'string') {
		normalizedDefaultCSSVariables[`${key}`] = value;
	} else {
		normalizedDefaultCSSVariables[`${key}`] = value.default;
	}
}

const quasarSettings = {
		config: {
			dark: false,
			basePath: '/',// (process.env.BUILD_PREFIXED ? ('/'+process.env.BUILD_PREFIXED) : ''),
			brand: {
				title: defaultSettings.appName,
				// https://quasar.dev/style/theme-builder
				// Also take a look at ./styles/vars.css
				...normalizedDefaultCSSVariables,
			},
		},
		plugins: {
			Dialog,
			LocalStorage,
			SessionStorage,
			Notify,
		}
};

const router = createRouter({
	history: createWebHistory(quasarSettings.config.basePath),
	routes: routes,
});

const app = createApp(App).use(Quasar, quasarSettings);
app.use(createPinia());
app.use(router);

app.config.globalProperties.$store = store();
app.config.globalProperties.$log = Log;

app.mount('#app');

try {
	document.querySelector('.preloader').classList.add('ready');
	setTimeout(()=>{
		const preloaderElement = document.querySelector('.preloader');
		if (preloaderElement) {
			preloaderElement.remove();
		}
	}, 500);
} catch(e) {
	console.error(e);
}