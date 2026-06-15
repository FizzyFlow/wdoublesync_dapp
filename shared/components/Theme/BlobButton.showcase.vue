<template>
    <div class="jShowcase_row jShowcase_column">

        <div class="jShowcase_info">
            A glowing, animated call-to-action button. <code>color</code> accepts either a Quasar
            token name (<code>primary</code>, <code>accent</code>, <code>positive</code>, …) or any
            raw CSS color (<code>#ff5ca2</code>, <code>rebeccapurple</code>). All other props mirror
            Quasar's <code>QBtn</code> sizing conventions.
        </div>

        <!-- Default -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Default</span>
            <div class="jShowcase_items">
                <BlobButton />
            </div>
        </div>

        <!-- Colors -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Colors (tokens + raw CSS)</span>
            <div class="jShowcase_items">
                <BlobButton color="primary" text="Primary" />
                <BlobButton color="secondary" text="Secondary" />
                <BlobButton color="accent" text="Accent" />
                <BlobButton color="positive" text="Positive" />
                <BlobButton color="negative" text="Negative" />
                <BlobButton color="info" text="Info" />
                <BlobButton color="warning" text="Warning" />
                <BlobButton color="#ff5ca2" text="Raw color" />
            </div>
        </div>

        <!-- Sizes -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Sizes</span>
            <div class="jShowcase_items">
                <BlobButton size="xs" text="xs" />
                <BlobButton size="sm" text="sm" />
                <BlobButton size="md" text="md" />
                <BlobButton size="lg" text="lg" />
                <BlobButton size="xl" text="xl" />
            </div>
        </div>

        <!-- Icons -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Icons</span>
            <div class="jShowcase_items">
                <BlobButton text="Icon right" icon="arrow_forward" icon-position="right" />
                <BlobButton text="Icon left" icon="rocket_launch" icon-position="left" />
                <BlobButton text="Big icon" icon="bolt" icon-size="28px" />
                <BlobButton text="No icon" :icon="null" />
            </div>
        </div>

        <!-- States & shape -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">States &amp; shape</span>
            <div class="jShowcase_items">
                <BlobButton text="Dense" dense />
                <BlobButton text="Pill" border-radius="999px" />
                <BlobButton text="Square" border-radius="0" />
            </div>
        </div>

        <!-- Block -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Block (full width)</span>
            <div class="jShowcase_items">
                <BlobButton text="Block button" icon="open_in_new" block />
            </div>
        </div>

        <!-- Blob tuning -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Blob opacity</span>
            <div class="jShowcase_items">
                <BlobButton color="accent" text="Subtle" :blob-opacity="0.15" :blob-hover-opacity="0.35" />
                <BlobButton color="accent" text="Intense" :blob-opacity="0.6" :blob-hover-opacity="0.95" />
            </div>
        </div>

        <!-- Slot -->
        <div class="jShowcase_group">
            <span class="jShowcase_title">Default slot</span>
            <div class="jShowcase_items">
                <BlobButton color="positive" icon="favorite">
                    <strong>Custom</strong>&nbsp;slot content
                </BlobButton>
            </div>
        </div>

    </div>
</template>

<script>
import BlobButton from './BlobButton.vue';

const apiJson = {
    props: {
        text: {
            type: 'String',
            desc: 'Label text. Ignored when the default slot is used.',
            default: 'Launch Web App',
        },
        color: {
            type: 'String',
            desc: "Quasar color token (primary, secondary, accent, positive, negative, warning, info) or any raw CSS color.",
            default: 'primary',
        },
        icon: {
            type: 'String',
            desc: 'Material icon name. Pass null/empty to render no icon.',
            default: 'arrow_forward',
        },
        iconSize: {
            type: 'String',
            desc: 'Overrides the icon size (any CSS length). Defaults to a value derived from size.',
            default: 'null',
        },
        iconPosition: {
            type: 'String',
            desc: 'Where the icon renders relative to the label.',
            values: ['left', 'right'],
            default: 'right',
        },
        block: {
            type: 'Boolean',
            desc: 'Stretch the button to full width.',
            default: 'false',
        },
        borderRadius: {
            type: ['String', 'Number'],
            desc: 'Corner radius. Any CSS length, or a bare number treated as px.',
            default: '12px',
        },
        size: {
            type: 'String',
            desc: 'Quasar-style sizing (xs, sm, md, lg, xl). A custom CSS length sets the font-size directly.',
            values: ['xs', 'sm', 'md', 'lg', 'xl'],
            default: 'md',
        },
        dense: {
            type: 'Boolean',
            desc: 'Reduced vertical padding and min-height.',
            default: 'false',
        },
        blobOpacity: {
            type: 'Number',
            desc: 'Resting opacity of the floating blob layer (0–1).',
            default: '0.4',
        },
        blobHoverOpacity: {
            type: 'Number',
            desc: 'Opacity of the blob layer on hover/focus (0–1).',
            default: '0.7',
        },
    },
    events: {
        click: {
            desc: 'Emitted when the button is clicked.',
            params: {
                evt: {
                    type: 'Object',
                    desc: 'The native click event object.',
                },
            },
        },
    },
    slots: {
        default: {
            desc: 'Custom button content, replacing the text prop.',
        },
    },
};

export default {
    name: 'BlobButtonShowcase',
    label: 'Blob Button',
    icon: 'bubble_chart',
    components: { BlobButton },
    apiJson,
    importName: 'BlobButton',
    importFrom: 'shared/components/Theme/BlobButton.vue',
};
</script>

<style scoped>
</style>
