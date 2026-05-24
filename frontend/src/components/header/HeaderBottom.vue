<template>

	<div class="header_bottom">
        <div class="header_bottom_cpu" :style="{ height: currentMaxHeight + 'px' }" >
            <div class="header_bottom_header_swap" :class="{header_bottom_header_swap_active: (currentHeader == 1)}">
                <component :is="activeHeader1" ref="activeHeader1" @ready="onTextReady"></component>
            </div>
            <div class="header_bottom_header_swap" :class="{header_bottom_header_swap_active: (currentHeader == 2)}">
                <component :is="activeHeader2" ref="activeHeader2" @ready="onTextReady"></component>
            </div>

        </div>
    </div>

</template>

<script>
import { shallowRef } from 'vue';
import HeaderEmpty from './HeaderEmpty.vue';
import Header1 from './Header1.vue';
import Header2 from './Header2.vue';

export default {
	name: 'HeaderBottom',
	components: {
	},
	data() {
		return {
			activeHeader1: shallowRef(Header1),
			activeHeader2: shallowRef(Header2),

			currentHeader: 1,
			nextCurrentHeader: null,

			currentMaxHeight: 0,
		}
	},
	computed: {
		headerType: function() {
			if (this.$store.header.type || this.$store.header.type === null) {
                if (this.$store.header.type === null) {
                    return null;
                }

				return (''+this.$store.header.type);
			}

            return null;
		}
	},
	watch: {
		headerType: function() {
			this.$log.tag('HeaderBottom').info('switched to', this.headerType);
			this.updateType();
		},
	},
	methods: {
		onTextReady() {
			this.$nextTick(()=>{
				this.adjustMaxHeightToCurrent();
			});
		},
		adjustMaxHeightToCurrent() {
			const ref = this.$refs['activeHeader'+this.currentHeader];
			if (ref && ref.$el) {
				const br = ref.$el.getBoundingClientRect();
				this.currentMaxHeight = br.height;
			}
		},
		updateType() {
            this.$log.tag('HeaderBottom').info('updating to', '' + this.headerType);

			let component = null;
			if (this.headerType == '1') {
				component = shallowRef(Header1);
			} else if (this.headerType == '2') {
				component = shallowRef(Header2);
			} else {
                component = shallowRef(HeaderEmpty);
            }

			if (component) {
				if (this.currentHeader == 1) {
					this.activeHeader2 = component;
					this.nextCurrentHeader = 2;
					this.currentHeader = null;
				} else {
					this.activeHeader1 = component;
					this.nextCurrentHeader = 1;
					this.currentHeader = null;
				}
			}

            clearTimeout(this.__finishUpdateTimeout);
			this.__finishUpdateTimeout = setTimeout(() => {
				// this.adjustMaxHeightToCurrent();
				this.currentHeader = this.nextCurrentHeader;
				this.nextCurrentHeader = null;
				setTimeout(() => {
					this.adjustMaxHeightToCurrent();
				}, 10);
				setTimeout(() => {
					this.adjustMaxHeightToCurrent();
				}, 1000);
			}, 200);
		},
	},
	mounted() {
		window.addEventListener("resize", ()=>{
			this.adjustMaxHeightToCurrent();
		});

		this.__adjustHeightInterval = setInterval(()=>{
			this.adjustMaxHeightToCurrent();
		}, 1000);
	},
	beforeUnmount() {
		clearInterval(this.__adjustHeightInterval);
	},
    beforeMount() {
        this.updateType();
    },
}
</script>
<!-- Add "scoped" attribute to limit CSS to this component only -->
<style>

	.header_bottom {
        color: var(--q-over-portal-text-color);
        font-family: "Archivo", sans-serif;
    }

    .header_bottom .header_type_1 {
        margin: 0; padding: 0;
        font-size: 56px;
        line-height: 56px;
        font-weight: 700;
        font-family: "Archivo", sans-serif;
        padding-bottom: 16px;
    }

    .header_bottom .header_type_3 {
        margin: 0; padding: 0;
        font-size: 18px;
        line-height: 23px;
        font-weight: 300;
        font-family: "Archivo", sans-serif;
        padding-bottom: 16px;
    }


	.header_bottom_cpu {
		position: relative;
		transition: height .2s ease-in-out;
		height: 300px;
	}

	.header_bottom_header_swap {
		transition: transform .5s ease-in-out, opacity .3s ease-out;
		transform-origin: left top;
		transform: translateY(-1000px);
		opacity: 0;
		max-height: 0px;
		z-index: 1;
	}

	.header_bottom_header_swap_active {
		transform: translateY(0px);
		max-height: 1000px;
		opacity: 1;
		z-index: 2;
	}

	@media (max-width: 599px) {
		.header_bottom .header_type_1 {
			font-size: 46px;
			line-height: 46px;
		}
		.header_bottom .header_type_3 {
			font-size: 16px;
		}
	}

	@media (max-width: 499px) {
		.header_bottom .header_type_1 {
			font-size: 36px;
			line-height: 36px;
		}
		.header_bottom .header_type_3 {
			font-size: 14px;
		}
	}

	@media (max-width: 399px) {
		.header_bottom .header_type_1 {
			font-size: 26px;
			line-height: 26px;
		}
		.header_bottom .header_type_3 {
			font-size: 14px;
		}
	}
</style>