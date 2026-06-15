<template>
    <div class="isoEditorPage">
        <IsoEditor />
    </div>
</template>

<script>
import IsoEditor from 'shared/components/Theme/IsoBox/IsoEditor/IsoEditor.vue';

export default {
    name: 'IsoEditorPage',
    path: '/iso-editor',
    components: {
        IsoEditor,
    },
};
</script>

<style scoped>
.isoEditorPage {
    height: 100vh;
}
</style>
