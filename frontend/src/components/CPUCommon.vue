<template>

    <div></div>

</template>
<script>
// Common CPU component for the client app (template), initilizing common site properties, css vars etc.
import EditorCommunicator from 'shared/classes/EditorCommunicator.js';
import { shallowRef, toRaw } from 'vue';

export default {
	name: 'CPUCommon',
	components: {
	},
	data() {
		return {
            publicPath: import.meta.env.BASE_URL,
            communicator: shallowRef(null),
		}
	},
	methods: {
        attachCommunicatorToIframe() {
            const targetWindow = window.parent;
            if (targetWindow) {
				const editorOrigin = import.meta.env.VITE_EDITOR_ORIGIN;
                this.communicator = new EditorCommunicator({
                    targetWindow: targetWindow,
					targetOrigin: editorOrigin,
                });
                this.communicator.subscribeToEventsFromTargetWindow();
                this.communicator.checkIfTargetWindowIsAvailable();

				const replyTo = [
					'getCSSVariables',
					'getSiteSettings',
					'isEditModeOn',
					'switchEditMode',
					'live',
					'setDbIdForTheSession', // for editing custom db in the editor
					'highlightBlock',
				];
				for (const msgType of replyTo) {
					this.communicator.onMessage(msgType, (payload, reply) => {
						this[`replyTo${msgType.charAt(0).toUpperCase() + msgType.slice(1)}`](payload)
							.then(response => {
								reply(response);
							})
							.catch(err => {
								this.$log.error(`Error replying to message ${msgType}:`, err);
								reply(null, (err.message || String(err)) );
							});
					});
				}
            }
        },
		async replyToHighlightBlock(payload) {
			this.$store.cpu.highlightBlock(payload.slug);
			return { success: true };
		},
		async replyToSetDbIdForTheSession(payload) {
			// @todo: check for iframe here too?
			if (payload && payload.dbId) {
				this.$store.cpu.setDbIdForTheSession(payload.dbId);
				return { success: true };
			} else {
				throw new Error('Invalid payload for setDbIdForTheSession');
			}
		},
		async replyToLive(payload) {
			this.applyLiveData(payload);
			return { success: true };
		},
		async replyToGetCSSVariables(payload) {
			return this.$store.cpu.getCSSVariablesSettings();
		},
		async replyToGetSiteSettings(payload) {
			await this.$store.cpu.initializeStore();
			return this.$store.cpu.getSiteSettings();
		},
		async replyToIsEditModeOn(payload) {
			const contentStore = this.$store.content;
			return { editMode: contentStore.editMode };
		},
		async replyToSwitchEditMode(payload) {
			const contentStore = this.$store.content;
			if (payload && payload.editMode) {
				contentStore.switchEditModeOn();
			} else {
				contentStore.switchEditModeOff();
			}

			return { editMode: contentStore.editMode };
		},
		async sendBlockClickedToEditor(slug) {
			if (this.communicator) {
				const blockSettings = await this.$store.cpu.getBlockSettings(slug);
				await this.communicator.sendMessage('blockClicked', {
					slug: slug,
					settings: toRaw(blockSettings),
				});
			}
		},
		async sendContentItemToEditor(slug, title, body) {
			if (this.communicator) {
				await this.communicator.sendMessage('contentItem', {
					slug: slug,
					title: title,
					body: body,
				});
			}
		},
		async initializeStore() {
			await this.$store.cpu.initializeStore();
			this.$store.content.$onAction(({ name, args, after, onError }) => {
				if (name == 'sendToEditor') {
					after(() => {
						this.sendContentItemToEditor(...args);
					});
				}
			});
			this.$store.cpu.$onAction(({ name, args, after, onError }) => {
				if (name == 'blockClicked') {
					after(() => {
						this.sendBlockClickedToEditor(...args);
					});
				}
			});
		},
		applyLiveData(data) {
			this.$store.cpu.setLivePreviewData(data);
		}
	},
	mounted() {
		this.initializeStore();
		this.attachCommunicatorToIframe();
	},
	unmounted() {
		if (this.communicator) {
			this.communicator.destroy();
		}	
	},
	computed: {
	},
	watch: {
	}
}
</script>