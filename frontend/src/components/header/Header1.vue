<template>

    <div class="row justify-center header_1">
        <div class="col-12 col-md-5 header_1_over">
            <h1 class="header_type_1"><CPUContentViewer slug="header_title_1" notitle @ready="onTextReady" /></h1>
            <h3 class="header_type_3">
                <CPUContentViewer slug="header_text_1" notitle  @ready="onTextReady" />
            </h3>
            <q-btn type="a" href="https://cpuso-proof-editor-8ab03d9e6dc9.herokuapp.com/" outline color="over-portal-text-color">Get Started</q-btn>
        </div>
        <div class="col-12 col-md-1"></div>
        <div class="col-12 col-md-6">
        </div>

        <div class="horse_overflow"></div>
    </div>

</template>

<script>
import CPUContentViewer from 'shared/components/CPU/CPUContentViewer.vue';

export default {
	name: 'Header1',
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
<style scoped>
    .header_1 {

    }


    .header_1_over {
        z-index: 2;
    }

    .horse_overflow {
        margin-top: -400px;
        height: 400px;
        width: 100%;
		mask: url('/header_1.png') no-repeat;
        mask-position: bottom -80px right 100px;
        mask-size: contain;
        background:  var(--q-logo-color); /* any RGB you want */
        z-index: 1;
    }

    .body--dark .horse_overflow {
        filter: brightness(50%);
    }

    .body--dark .header_1_over {
        filter: brightness(50%);
    }

    .header_type_1 {

    }
    .header_type_3 {
        padding: 24px 0 24px 0;
    }
    .q-btn {
        margin-bottom: 32px;
    }


	@media (max-width: 1023px) {
        .horse_overflow {
            opacity: 0.6;
        }
    }
	@media (max-width: 599px) {
        
    }
</style>