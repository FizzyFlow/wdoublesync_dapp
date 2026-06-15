<template>
    <JComponentShowcaseWithContent :components="components" />
</template>

<script>
import BlobButtonShowcase from 'shared/components/Theme/BlobButton.showcase.vue';
import IsoStackShowcase from 'shared/components/Theme/IsoBox/IsoStack.showcase.vue';
import IsoBoxShowcase from 'shared/components/Theme/IsoBox/IsoBox.showcase.vue';

export default {
    name: 'Showcase',
    path: '/showcase',
    computed: {
        components() {
            return {
                'Theme': [BlobButtonShowcase, IsoStackShowcase, IsoBoxShowcase],
            };
        },
    },
}
</script>
