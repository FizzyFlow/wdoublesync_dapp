
// import { useSessionUserStore } from './sessionUser.js';
// import { useApiStore } from './api.js';
// import { useColorStore } from './color.js';
import { useSuiStore } from './sui.js';
// import { useCPUStore } from './cpu.js';
// import { useContentStore } from './content.js';
// import { useHeaderStore } from './header.js';

export default () => {
	return {
		// color: useColorStore(),
		sui: useSuiStore(),
		// cpu: useCPUStore(),
		// content: useContentStore(),
		// header: useHeaderStore(),
		// sessionUser: useSessionUserStore(),
		// settings: useSettingsStore(),
	}
};