<template>
	<component
		:is="href ? 'a' : 'button'"
		class="blobButton"
		:class="{ 'blobButton--block': block }"
		:style="cssVars"
		v-bind="href ? { href, target, rel: target === '_blank' ? 'noopener noreferrer' : undefined } : { type: 'button' }"
		@click="$emit('click', $event)"
	>
		<span class="blobButton_blobs" aria-hidden="true">
			<span class="blobButton_blob blobButton_blob--a"></span>
			<span class="blobButton_blob blobButton_blob--b"></span>
			<span class="blobButton_blob blobButton_blob--c"></span>
		</span>
		<span class="blobButton_sheen" aria-hidden="true"></span>
		<q-icon v-if="icon && iconPosition === 'left'" :name="icon" class="blobButton_icon blobButton_icon--left" :size="resolvedIconSize" />
		<span class="blobButton_label">
			<slot>{{ text }}</slot>
		</span>
		<q-icon v-if="icon && iconPosition === 'right'" :name="icon" class="blobButton_icon blobButton_icon--right" :size="resolvedIconSize" />
	</component>
</template>

<script>
export default {
	name: 'BlobButton',
	props: {
		text: { type: String, default: 'Launch Web App' },
		color: { type: String, default: 'primary' },
		icon: { type: String, default: 'arrow_forward' },
		iconSize: { type: String, default: null },
		// Where to render the icon relative to the label.
		iconPosition: {
			type: String,
			default: 'right',
			validator: (v) => ['left', 'right'].includes(v),
		},
		href: { type: String, default: null },
		target: { type: String, default: '_blank' },
		block: { type: Boolean, default: false },
		// Accepts any CSS length (e.g. '12px', '999px', '0.75rem') or a bare number (treated as px).
		borderRadius: { type: [String, Number], default: '12px' },
		// Quasar-style sizing: xs / sm / md / lg / xl. Custom CSS length also accepted (sets font-size).
		size: { type: String, default: 'md' },
		// Reduced vertical padding, à la Quasar's dense.
		dense: { type: Boolean, default: false },
		// Resting opacity of the floating blob layer (0–1).
		blobOpacity: { type: Number, default: 0.4 },
		// Opacity of the blob layer on hover/focus (0–1).
		blobHoverOpacity: { type: Number, default: 0.7 },
	},
	emits: ['click'],
	computed: {
		// Lets users pass either a token name ('primary', 'accent', 'positive') or
		// a raw CSS color. Map known token names to their --q-* var; otherwise treat
		// the value as a literal color.
		resolvedColor() {
			const tokenMap = {
				primary: 'var(--q-primary)',
				secondary: 'var(--q-secondary)',
				accent: 'var(--q-accent)',
				positive: 'var(--q-positive)',
				negative: 'var(--q-negative)',
				warning: 'var(--q-warning)',
				info: 'var(--q-info)',
			};
			return tokenMap[this.color] || this.color;
		},
		resolvedRadius() {
			const r = this.borderRadius;
			return typeof r === 'number' ? `${r}px` : r;
		},
		sizeSpec() {
			// Mirrors Quasar QBtn proportions, scaled for the chunkier blob look.
			const presets = {
				xs: { font: '11px', padX: '10px', padY: '4px',  minH: '24px', gap: '6px',  icon: '14px' },
				sm: { font: '13px', padX: '14px', padY: '6px',  minH: '32px', gap: '8px',  icon: '16px' },
				md: { font: '16px', padX: '22px', padY: '12px', minH: '46px', gap: '14px', icon: '20px' },
				lg: { font: '18px', padX: '28px', padY: '16px', minH: '56px', gap: '16px', icon: '22px' },
				xl: { font: '22px', padX: '34px', padY: '20px', minH: '68px', gap: '20px', icon: '26px' },
			};
			if (presets[this.size]) return presets[this.size];
			// Custom length — derive proportional values from md preset, override font-size.
			return { ...presets.md, font: this.size };
		},
		resolvedIconSize() {
			return this.iconSize || this.sizeSpec.icon;
		},
		cssVars() {
			const s = this.sizeSpec;
			// Dense halves vertical padding and tightens min-height.
			const padY = this.dense ? `calc(${s.padY} * 0.45)` : s.padY;
			const minH = this.dense ? `calc(${s.minH} - 12px)` : s.minH;
			return {
				'--blobBtn-color': this.resolvedColor,
				'--blobBtn-radius': this.resolvedRadius,
				'--blobBtn-font': s.font,
				'--blobBtn-padX': s.padX,
				'--blobBtn-padY': padY,
				'--blobBtn-minH': minH,
				'--blobBtn-gap': s.gap,
				'--blobBtn-blobOpacity': this.blobOpacity,
				'--blobBtn-blobHoverOpacity': this.blobHoverOpacity,
			};
		},
	},
};
</script>

<style scoped>
.blobButton {
	/* layout */
	position: relative;
	display: inline-flex;
	align-items: center;
	justify-content: center;
	gap: var(--blobBtn-gap);
	padding: var(--blobBtn-padY) var(--blobBtn-padX);
	min-height: var(--blobBtn-minH);

	/* shape */
	border-radius: var(--blobBtn-radius);
	border: 1px solid color-mix(in srgb, var(--blobBtn-color) 55%, transparent);
	background:
		linear-gradient(
			180deg,
			color-mix(in srgb, var(--blobBtn-color) 6%, var(--q-surface-0)) 0%,
			color-mix(in srgb, var(--blobBtn-color) 3%, var(--q-surface-0)) 100%
		);
	overflow: hidden;
	cursor: pointer;

	/* typography */
	font-family: var(--font-body);
	font-size: var(--blobBtn-font);
	font-weight: 400;
	color: color-mix(in srgb, var(--blobBtn-color) 85%, white);
	letter-spacing: 0.2px;

	/* effects — resting glow */
	box-shadow:
		0 0 0 1px color-mix(in srgb, var(--blobBtn-color) 18%, transparent),
		0 0 18px -4px color-mix(in srgb, var(--blobBtn-color) 25%, transparent),
		inset 0 0 24px -6px color-mix(in srgb, var(--blobBtn-color) 20%, transparent);

	transition:
		border-color var(--q-transition-normal) ease,
		box-shadow var(--q-transition-normal) ease,
		color var(--q-transition-normal) ease,
		transform var(--q-transition-fast) ease;

	text-decoration: none;
	-webkit-tap-highlight-color: transparent;
	user-select: none;
}

.blobButton--block {
	display: flex;
	width: 100%;
}

/* ---- hover / focus / active ---- */
.blobButton:hover,
.blobButton:focus-visible {
	border-color: color-mix(in srgb, var(--blobBtn-color) 75%, transparent);
	color: color-mix(in srgb, var(--blobBtn-color) 70%, white);
	box-shadow:
		0 0 0 1px color-mix(in srgb, var(--blobBtn-color) 30%, transparent),
		0 0 22px -4px color-mix(in srgb, var(--blobBtn-color) 30%, transparent),
		inset 0 0 28px -6px color-mix(in srgb, var(--blobBtn-color) 25%, transparent);
	outline: none;
}

.blobButton:active {
	transform: translateY(1px);
}

/* ---- blob layer ---- */
.blobButton_blobs {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 0;
	overflow: hidden;
	border-radius: inherit;
	opacity: var(--blobBtn-blobOpacity);
	transition: opacity var(--q-transition-normal, 0.2s) ease, filter var(--q-transition-normal, 0.2s) ease;
	filter: blur(10px);
}

.blobButton:hover .blobButton_blobs,
.blobButton:focus-visible .blobButton_blobs {
	opacity: var(--blobBtn-blobHoverOpacity);
	filter: blur(8px);
}

.blobButton_blob {
	position: absolute;
	border-radius: 50%;
	background: radial-gradient(
		circle at 50% 50%,
		color-mix(in srgb, var(--blobBtn-color) 65%, transparent) 0%,
		color-mix(in srgb, var(--blobBtn-color) 25%, transparent) 45%,
		transparent 75%
	);
	will-change: transform;
}

.blobButton_blob--a {
	width: 70%;
	height: 240%;
	left: -10%;
	top: -70%;
	animation: blobDriftA 11s ease-in-out infinite;
}

.blobButton_blob--b {
	width: 55%;
	height: 200%;
	right: -5%;
	top: -50%;
	background: radial-gradient(
		circle at 50% 50%,
		color-mix(in srgb, var(--blobBtn-color) 55%, transparent) 0%,
		color-mix(in srgb, var(--blobBtn-color) 18%, transparent) 50%,
		transparent 80%
	);
	animation: blobDriftB 14s ease-in-out infinite;
}

.blobButton_blob--c {
	width: 40%;
	height: 160%;
	left: 35%;
	top: -30%;
	background: radial-gradient(
		circle at 50% 50%,
		color-mix(in srgb, var(--blobBtn-color) 40%, transparent) 0%,
		color-mix(in srgb, var(--blobBtn-color) 12%, transparent) 55%,
		transparent 80%
	);
	animation: blobDriftC 9s ease-in-out infinite;
}

@keyframes blobDriftA {
	0%, 100% { transform: translate(0%, 0%) scale(1); }
	33%      { transform: translate(20%, 6%) scale(1.08); }
	66%      { transform: translate(8%, -4%) scale(0.95); }
}
@keyframes blobDriftB {
	0%, 100% { transform: translate(0%, 0%) scale(1); }
	40%      { transform: translate(-18%, 4%) scale(1.06); }
	70%      { transform: translate(-6%, -3%) scale(0.92); }
}
@keyframes blobDriftC {
	0%, 100% { transform: translate(0%, 0%) scale(1); }
	50%      { transform: translate(12%, 5%) scale(1.12); }
}

/* ---- sheen highlight (top inner edge) ---- */
.blobButton_sheen {
	position: absolute;
	inset: 0;
	pointer-events: none;
	z-index: 1;
	border-radius: inherit;
	background: linear-gradient(
		180deg,
		color-mix(in srgb, var(--blobBtn-color) 12%, transparent) 0%,
		transparent 35%,
		transparent 75%,
		color-mix(in srgb, var(--blobBtn-color) 6%, transparent) 100%
	);
	mix-blend-mode: screen;
}

/* ---- content ---- */
.blobButton_label,
.blobButton_icon {
	position: relative;
	z-index: 2;
}

.blobButton_label {
	text-shadow: 0 0 12px color-mix(in srgb, var(--blobBtn-color) 35%, transparent);
}

.blobButton_icon {
	transition: transform var(--q-transition-normal, 0.2s) ease;
}

.blobButton:hover .blobButton_icon--right,
.blobButton:focus-visible .blobButton_icon--right {
	transform: translateX(3px);
}

.blobButton:hover .blobButton_icon--left,
.blobButton:focus-visible .blobButton_icon--left {
	transform: translateX(-3px);
}

/* honor reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
	.blobButton_blob {
		animation: none !important;
	}
}
</style>
