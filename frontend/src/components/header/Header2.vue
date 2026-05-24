<template>

<div class="row justify-center header_2">
        <div class="col-12 col-md-5 header_2_over">
            <h1 class="header_type_1"><CPUContentViewer slug="header_title_2" notitle @ready="onTextReady" /></h1>
            <h3 class="header_type_3">
                <CPUContentViewer slug="header_text_2" notitle @ready="onTextReady" />
            </h3>
            <q-btn type="a" outline href="https://cpuso-proof-editor-8ab03d9e6dc9.herokuapp.com/"  color="over-portal-text-color">Get Started</q-btn>
        </div>
        <div class="col-12 col-md-1"></div>
        <div class="col-12 col-md-6">

            <div class="header_2_blocks">
                <div class="header_2_block">
                    <CPUContentViewer slug="header_2_block_1_text" @ready="onTextReady" nocolor />
                </div>
                <div class="header_2_block">
                    <CPUContentViewer slug="header_2_block_2_text" @ready="onTextReady" nocolor />
                </div>
                <div class="header_2_block">
                    <CPUContentViewer slug="header_2_block_3_text" @ready="onTextReady" nocolor />
                </div>
                <div class="header_2_block">
                    <CPUContentViewer slug="header_2_block_4_text" @ready="onTextReady" nocolor />
                </div>
            </div>


        </div>
    </div>

</template>
    
<script>
import CPUContentViewer from 'shared/components/CPU/CPUContentViewer.vue';
    
export default {
    name: 'Header2',
    emits: ['ready'],
    components: {
        CPUContentViewer,
    },
    data() {
        return {
        }
    },
    methods: {
        signUp: function() {
            this.$store.sessionUser.doRegister();
        },
        onTextReady() {
            this.$emit('ready');
        },
    },
    mounted() {
    },
    computed: {
    }
}

</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

    .header_2 {

    }

    .header_2_over {
        z-index: 2;
    }

    .body--dark .header_2 {
        filter: brightness(50%);
    }

    .header_2 .header_type_1 {

    }
    .header_2 .header_type_3 {
        padding: 22px 0 22px 0;
    }

    .header_2 .q-btn {
        margin-bottom: 32px;
    }

    .header_2_blocks {
        display: grid;
        grid-template-columns: repeat(2, 1fr); /* or simply "1fr 1fr;" */
        grid-row-gap: 10px; 
        grid-column-gap: 10px;
        margin-bottom: 32px;
    }

    .header_2_block {
        background: #D9D9D9;
        color: #000000;
        border-radius: 15px;
        padding: 20px;
    }

    .header_2_block {
        font-size: 22px !important;
        line-height: 20px;

    }

    .header_2_block h5 {
        color: #000000;
        font-size: 18px !important;
        line-height: 20px;
    }

    @media (max-width: 1023px) {
    }
</style>