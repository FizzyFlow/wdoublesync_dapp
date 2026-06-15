<template>
	<div class="isoStack" :style="rootStyle">
		<svg
			class="isoStack_svg"
			:viewBox="viewBox"
			preserveAspectRatio="xMidYMid meet"
			role="img"
			:aria-label="ariaLabel"
		>
			<g class="isoStack_scene" :style="sceneStyle">
				<slot>
					<!-- default scene: three stacked platforms + a vault -->
					<IsoBox :x="0" :y="0" :z="0"    :w="10"  :d="10"  :h="0.85" />
					<IsoBox :x="0" :y="0" :z="0.85" :w="6.4" :d="6.4" :h="1.0" />
					<IsoBox :x="0" :y="0" :z="1.85" :w="3.5" :d="3.5" :h="1.35" />
				</slot>
			</g>
		</svg>
	</div>
</template>

<script>
import { computed } from 'vue';
import IsoBox from './IsoBox.vue';

export default {
	name: 'IsoStack',
	components: { IsoBox },
	props: {
		// stroke colour — any CSS colour or theme var (defaults to theme primary)
		color: { type: String, default: 'var(--q-primary)' },
		// stroke width in screen pixels (non-scaling)
		strokeWidth: { type: Number, default: 1.4 },
		// faint face fill opacity (0 = pure wireframe)
		fillOpacity: { type: Number, default: 0.06 },
		// soft outer glow radius in px (0 disables)
		glow: { type: Number, default: 7 },
		// atmospheric fade strength (0 = off, 1 = far side dissolves fully)
		fog: { type: Number, default: 0 },
		// grid-depth (x + y) treated as nearest / farthest for the fog ramp
		fogNear: { type: Number, default: 6 },
		fogFar: { type: Number, default: -8 },
		// pixels-per-grid-unit
		scale: { type: Number, default: 20 },
		// isometric angle in degrees
		angle: { type: Number, default: 30 },
		// when true, boxes fill their faces opaquely (with `surface`) so front
		// blocks hide what is behind them instead of being see-through
		solid: { type: Boolean, default: false },
		// the opaque colour used for occlusion fills in solid mode
		surface: { type: String, default: 'var(--q-surface-1)' },
		// SVG viewBox framing the scene; override for taller / wider compositions
		viewBox: { type: String, default: '-190 -150 380 270' },
		ariaLabel: { type: String, default: 'Isometric vault illustration' },
	},
	provide() {
		const self = this;
		return {
			iso: {
				project: (gx, gy, gz) => self.project(gx, gy, gz),
				color: computed(() => self.color),
				strokeWidth: computed(() => self.strokeWidth),
				fillOpacity: computed(() => self.fillOpacity),
				// opacity multiplier for a given grid depth (x + y); nearer = brighter
				depthAlpha: (depth) => self.depthAlpha(depth),
				solid: computed(() => self.solid),
				surface: computed(() => self.surface),
			},
		};
	},
	computed: {
		rootStyle() {
			return { color: this.color };
		},
		sceneStyle() {
			if (!this.glow) return {};
			const c = this.color;
			return {
				filter: `drop-shadow(0 0 ${this.glow}px ${c}) drop-shadow(0 0 ${this.glow * 2.4}px ${c})`,
			};
		},
	},
	methods: {
		depthAlpha(depth) {
			if (!this.fog) return 1;
			const span = this.fogNear - this.fogFar || 1;
			let t = (depth - this.fogFar) / span; // 0 at far, 1 at near
			t = Math.max(0, Math.min(1, t));
			t = t * t * (3 - 2 * t); // smoothstep
			return 1 - this.fog * (1 - t);
		},
		project(gx, gy, gz) {
			const s = this.scale;
			const a = (this.angle * Math.PI) / 180;
			const cos = Math.cos(a);
			const sin = Math.sin(a);
			const sx = (gx - gy) * cos * s;
			const sy = ((gx + gy) * sin - gz) * s;
			return [sx, sy];
		},
	},
};
</script>

<style scoped>
.isoStack {
	display: block;
	width: 100%;
}

.isoStack_svg {
	display: block;
	width: 100%;
	height: 100%;
	overflow: visible;
}
</style>
