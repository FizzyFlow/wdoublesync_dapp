<template>
    <div class="isoEditor">
        <q-toolbar class="isoEditor_toolbar">
            <q-btn-dropdown color="primary" icon="add" label="Add" no-caps unelevated>
                <q-list>
                    <q-item v-for="p in presets" :key="p.label" clickable v-close-popup @click="addPreset(p)">
                        <q-item-section avatar><q-icon :name="p.icon" /></q-item-section>
                        <q-item-section>{{ p.label }}</q-item-section>
                    </q-item>
                </q-list>
            </q-btn-dropdown>

            <q-btn flat dense icon="content_copy" class="q-ml-xs" :disable="!selectedBox" @click="duplicate">
                <q-tooltip>Duplicate</q-tooltip>
            </q-btn>
            <q-btn flat dense icon="delete" :disable="!selectedBox" @click="removeSelected">
                <q-tooltip>Delete</q-tooltip>
            </q-btn>

            <q-separator vertical inset class="q-mx-sm" />

            <q-toggle v-model="snapOn" label="Snap" dense />
            <q-input v-if="snapOn" v-model.number="snapStep" type="number" step="0.1" dense filled
                class="q-ml-sm" style="width: 84px" />

            <q-space />

            <q-btn flat dense icon="code" label="Export" no-caps @click="openExport" />
            <q-btn flat dense icon="restart_alt" @click="clearScene">
                <q-tooltip>Clear all boxes</q-tooltip>
            </q-btn>
        </q-toolbar>

        <q-splitter v-model="split" :limits="[40, 78]" class="isoEditor_body">
            <template #before>
                <div class="isoEditor_canvasWrap">
                    <EditorCanvas
                        :stack="scene.stack"
                        :boxes="scene.boxes"
                        :selected-id="selectedId"
                        :snap="snapOn ? snapStep : 0"
                        @select="selectedId = $event"
                    />
                    <div class="isoEditor_hint">
                        Drag a box's handle to move · hold <kbd>Shift</kbd> for up/down · arrow keys nudge
                    </div>
                </div>
            </template>

            <template #after>
                <q-tabs v-model="tab" dense align="justify" class="text-primary isoEditor_tabs">
                    <q-tab name="box" icon="category" label="Box" />
                    <q-tab name="scene" icon="grid_view" label="Scene" />
                    <q-tab name="layers" icon="layers" :label="`Layers (${scene.boxes.length})`" />
                </q-tabs>
                <q-separator />
                <q-tab-panels v-model="tab" animated class="isoEditor_panels">
                    <q-tab-panel name="box" class="q-pa-none">
                        <BoxInspector :box="selectedBox" />
                    </q-tab-panel>
                    <q-tab-panel name="scene" class="q-pa-none">
                        <SceneInspector :stack="scene.stack" />
                    </q-tab-panel>
                    <q-tab-panel name="layers" class="q-pa-none">
                        <LayerList
                            :boxes="scene.boxes"
                            :selected-id="selectedId"
                            @select="selectedId = $event"
                            @remove="removeId"
                            @toggle-hidden="toggleHidden"
                            @move-up="moveUp"
                            @move-down="moveDown"
                        />
                    </q-tab-panel>
                </q-tab-panels>
            </template>
        </q-splitter>

        <CodeExportDialog v-model="showExport" :code="exportCode" />
    </div>
</template>

<script>
import EditorCanvas from './EditorCanvas.vue';
import BoxInspector from './BoxInspector.vue';
import SceneInspector from './SceneInspector.vue';
import LayerList from './LayerList.vue';
import CodeExportDialog from './CodeExportDialog.vue';
import { initialScene, makeBox, genTemplate, PRESETS, loadScene, saveScene } from './sceneModel.js';

export default {
    name: 'IsoEditor',
    components: { EditorCanvas, BoxInspector, SceneInspector, LayerList, CodeExportDialog },
    data() {
        return {
            // restore the last session if present, otherwise a starter scene
            scene: loadScene() || initialScene(),
            selectedId: null,
            tab: 'box',
            split: 62,
            snapOn: true,
            snapStep: 0.5,
            showExport: false,
            exportCode: '',
            presets: PRESETS,
        };
    },
    computed: {
        selectedBox() {
            return this.scene.boxes.find((b) => b.id === this.selectedId) || null;
        },
    },
    methods: {
        addPreset(p) {
            const b = p.make();
            this.scene.boxes.push(b);
            this.selectedId = b.id;
            this.tab = 'box';
        },
        duplicate() {
            if (!this.selectedBox) return;
            const { id, ...rest } = this.selectedBox;
            // deep-clone so nested arrays (connector points/from/to) aren't shared
            const clone = JSON.parse(JSON.stringify(rest));
            const b = makeBox({ ...clone, x: clone.x + 1, y: clone.y + 1 });
            this.scene.boxes.push(b);
            this.selectedId = b.id;
        },
        removeId(id) {
            const i = this.scene.boxes.findIndex((b) => b.id === id);
            if (i >= 0) this.scene.boxes.splice(i, 1);
            if (this.selectedId === id) this.selectedId = null;
        },
        removeSelected() {
            if (this.selectedId) this.removeId(this.selectedId);
        },
        toggleHidden(id) {
            const b = this.scene.boxes.find((x) => x.id === id);
            if (b) b.hidden = !b.hidden;
        },
        moveUp(id) {
            const i = this.scene.boxes.findIndex((b) => b.id === id);
            if (i > 0) {
                const [b] = this.scene.boxes.splice(i, 1);
                this.scene.boxes.splice(i - 1, 0, b);
            }
        },
        moveDown(id) {
            const i = this.scene.boxes.findIndex((b) => b.id === id);
            if (i >= 0 && i < this.scene.boxes.length - 1) {
                const [b] = this.scene.boxes.splice(i, 1);
                this.scene.boxes.splice(i + 1, 0, b);
            }
        },
        openExport() {
            this.exportCode = genTemplate(this.scene);
            this.showExport = true;
        },
        clearScene() {
            this.scene.boxes = [];
            this.selectedId = null;
        },
        onKey(e) {
            const tag = (e.target && e.target.tagName) || '';
            if (/^(INPUT|TEXTAREA|SELECT)$/.test(tag) || e.target?.isContentEditable) return;
            const b = this.selectedBox;
            if ((e.ctrlKey || e.metaKey) && (e.key === 'd' || e.key === 'D')) {
                e.preventDefault();
                this.duplicate();
                return;
            }
            if (e.key === 'Delete' || e.key === 'Backspace') {
                if (b) { e.preventDefault(); this.removeSelected(); }
                return;
            }
            if (e.key === 'Escape') { this.selectedId = null; return; }
            if (b && e.key.startsWith('Arrow')) {
                e.preventDefault();
                const step = this.snapOn ? this.snapStep : 0.5;
                if (e.key === 'ArrowLeft') b.x -= step;
                else if (e.key === 'ArrowRight') b.x += step;
                else if (e.key === 'ArrowUp') (e.shiftKey ? (b.z += step) : (b.y -= step));
                else if (e.key === 'ArrowDown') (e.shiftKey ? (b.z -= step) : (b.y += step));
                b.x = Math.round(b.x * 100) / 100;
                b.y = Math.round(b.y * 100) / 100;
                b.z = Math.round(b.z * 100) / 100;
            }
        },
        scheduleSave() {
            clearTimeout(this._saveTimer);
            this._saveTimer = setTimeout(() => saveScene(this.scene), 300);
        },
    },
    watch: {
        scene: {
            handler: 'scheduleSave',
            deep: true,
        },
    },
    mounted() {
        window.addEventListener('keydown', this.onKey);
    },
    beforeUnmount() {
        window.removeEventListener('keydown', this.onKey);
        clearTimeout(this._saveTimer);
        saveScene(this.scene); // flush any pending change
    },
};
</script>

<style scoped>
.isoEditor {
    display: flex;
    flex-direction: column;
    height: 100%;
}

.isoEditor_toolbar {
    border-bottom: 1px solid color-mix(in srgb, currentColor 12%, transparent);
}

.isoEditor_body {
    flex: 1;
    min-height: 0;
}

.isoEditor_canvasWrap {
    padding: 16px;
}

.isoEditor_hint {
    margin-top: 10px;
    font-size: 12px;
    text-align: center;
    color: var(--q-text-muted, #888);
}

.isoEditor_hint kbd {
    font-family: var(--font-mono, monospace);
    font-size: 11px;
    padding: 1px 5px;
    border-radius: 3px;
    border: 1px solid color-mix(in srgb, currentColor 25%, transparent);
}

.isoEditor_panels {
    height: calc(100% - 48px);
    overflow-y: auto;
}
</style>
