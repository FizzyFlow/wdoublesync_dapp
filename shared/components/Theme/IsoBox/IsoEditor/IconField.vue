<template>
    <q-select
        :model-value="modelValue"
        @update:model-value="(v) => $emit('update:modelValue', v)"
        :options="options"
        label="Icon"
        dense filled clearable
        use-input
        input-debounce="0"
        @filter="filterFn"
        hint="Material icon name"
    >
        <template #prepend>
            <q-icon :name="modelValue || 'image_not_supported'" />
        </template>
        <template #option="scope">
            <q-item v-bind="scope.itemProps">
                <q-item-section avatar>
                    <q-icon :name="scope.opt" />
                </q-item-section>
                <q-item-section>{{ scope.opt }}</q-item-section>
            </q-item>
        </template>
        <template #no-option>
            <q-item><q-item-section class="text-grey">No icons</q-item-section></q-item>
        </template>
    </q-select>
</template>

<script>
const ICONS = [
    'folder', 'folder_open', 'description', 'article', 'image', 'photo', 'code', 'data_object',
    'lock', 'lock_open', 'key', 'vpn_key', 'shield', 'verified', 'verified_user', 'security',
    'gpp_good', 'fingerprint', 'visibility', 'visibility_off',
    'cloud', 'cloud_upload', 'cloud_download', 'backup', 'storage', 'dns', 'database', 'memory',
    'lan', 'hub', 'account_tree', 'schema', 'api', 'http', 'https', 'cable', 'router',
    'bolt', 'flash_on', 'water_drop', 'local_fire_department', 'ac_unit', 'eco', 'park', 'pets',
    'star', 'favorite', 'bookmark', 'label', 'tag', 'flag', 'grade',
    'home', 'person', 'group', 'settings', 'build', 'extension', 'widgets', 'dashboard', 'grid_view',
    'view_in_ar', 'deployed_code', 'layers', 'category', 'token', 'hexagon', 'crop_square',
    'rocket_launch', 'science', 'biotech', 'psychology', 'smart_toy', 'bug_report',
    'terminal', 'smartphone', 'laptop', 'computer', 'devices', 'desktop_windows',
    'public', 'language', 'wifi', 'bluetooth', 'sync', 'autorenew', 'cached', 'history', 'restore',
    'schedule', 'alarm', 'event', 'mail', 'send', 'chat', 'notifications', 'link', 'share',
    'add', 'remove', 'check', 'close', 'edit', 'delete', 'save', 'download', 'upload',
    'search', 'tune', 'filter_alt', 'sort', 'menu', 'more_horiz',
    'account_balance', 'paid', 'savings', 'shopping_cart', 'store', 'inventory_2', 'qr_code',
];

export default {
    name: 'IconField',
    props: {
        modelValue: { type: String, default: null },
    },
    emits: ['update:modelValue'],
    data() {
        return { options: ICONS.slice() };
    },
    methods: {
        filterFn(val, update) {
            update(() => {
                const needle = (val || '').toLowerCase();
                this.options = needle ? ICONS.filter((i) => i.includes(needle)) : ICONS.slice();
            });
        },
    },
};
</script>
