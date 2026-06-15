<template>
	<g class="isoBox">
		<!-- connector / line type (preempts box & billboard rendering) -->
		<template v-if="isConnector">
			<path
				:d="connectorPath.d"
				fill="none"
				:stroke="resolvedColor"
				:stroke-width="resolvedWidth"
				:stroke-opacity="connectorPath.alpha"
				:stroke-dasharray="connectorDash"
				:style="connectorFlowStyle"
				stroke-linecap="round"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
		</template>
		<template v-else>
		<!-- isometric body (skipped in straight / billboard mode) -->
		<template v-if="!straight">
		<!-- opaque occlusion fills (solid mode) — non-rounded faces -->
		<template v-if="resolvedSolid && !useFaces">
			<polygon :points="faces.top.pts" :fill="surfaceColor" />
			<polygon :points="faces.left.pts" :fill="surfaceColor" />
			<polygon v-if="faces.chamfer" :points="faces.chamfer.pts" :fill="surfaceColor" />
			<polygon :points="faces.right.pts" :fill="surfaceColor" />
		</template>

		<!-- faint translucent faces -->
		<polygon v-if="showFill && !useFaces" :points="faces.top.pts" :style="{ fill: resolvedColor, opacity: faces.top.op }" />
		<polygon v-if="showFill && !useFaces" :points="faces.left.pts" :style="{ fill: resolvedColor, opacity: faces.left.op }" />
		<polygon v-if="showFill && !useFaces && faces.chamfer" :points="faces.chamfer.pts" :style="{ fill: resolvedColor, opacity: faces.chamfer.op }" />
		<polygon v-if="showFill && !useFaces" :points="faces.right.pts" :style="{ fill: resolvedColor, opacity: faces.right.op }" />

		<!-- front/back faces (rounded card or hexagon) -->
		<template v-if="useFaces && !flatHex">
			<path
				:d="roundedGeo.back.d"
				fill="none"
				:stroke="resolvedColor"
				:stroke-width="resolvedWidth"
				:stroke-opacity="roundedGeo.back.alpha"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
			<path v-if="resolvedSolid" :d="roundedGeo.front.d" :fill="surfaceColor" stroke="none" />
			<path
				v-if="roundedGeo.frontFill > 0"
				:d="roundedGeo.front.d"
				:fill="resolvedColor"
				:fill-opacity="roundedGeo.frontFill"
				stroke="none"
			/>
			<path
				:d="roundedGeo.front.d"
				fill="none"
				:stroke="resolvedColor"
				:stroke-width="resolvedWidth"
				:stroke-opacity="roundedGeo.front.alpha"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
		</template>

		<!-- flat hexagon tile lying on the floor (thin hex prism) -->
		<template v-if="flatHex">
			<!-- skirt fills (solid) -->
			<polygon
				v-if="resolvedSolid"
				v-for="(s, i) in flatHexGeo.skirts"
				:key="'fxsf' + i"
				:points="s.pts"
				:fill="surfaceColor"
			/>
			<!-- back/bottom outline (faint) -->
			<path
				:d="flatHexGeo.bottom.d"
				fill="none"
				:stroke="resolvedColor"
				:stroke-width="resolvedWidth"
				:stroke-opacity="flatHexGeo.bottom.alpha"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
			<!-- vertical struts on the front rim -->
			<line
				v-for="(s, i) in flatHexGeo.struts"
				:key="'fxst' + i"
				:x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2"
				:stroke="resolvedColor"
				:stroke-width="resolvedWidth"
				stroke-linecap="round"
				:opacity="s.alpha"
				vector-effect="non-scaling-stroke"
			/>
			<!-- solid top fill -->
			<path v-if="resolvedSolid" :d="flatHexGeo.top.d" :fill="surfaceColor" stroke="none" />
			<!-- tinted top fill -->
			<path
				v-if="flatHexGeo.topFill > 0"
				:d="flatHexGeo.top.d"
				:fill="resolvedColor"
				:fill-opacity="flatHexGeo.topFill"
				stroke="none"
			/>
			<!-- top outline (bright) -->
			<path
				:d="flatHexGeo.top.d"
				fill="none"
				:stroke="resolvedColor"
				:stroke-width="resolvedWidth"
				:stroke-opacity="flatHexGeo.top.alpha"
				stroke-linejoin="round"
				vector-effect="non-scaling-stroke"
			/>
		</template>

		<!-- optional grid on the top face -->
		<line
			v-for="(s, i) in gridLines"
			:key="'g' + i"
			:x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2"
			:stroke="resolvedColor"
			:stroke-width="resolvedWidth"
			stroke-linecap="round"
			:opacity="s.alpha"
			vector-effect="non-scaling-stroke"
		/>

		<!-- hidden / back edges (optional, faint) -->
		<line
			v-for="(s, i) in hiddenSegs"
			:key="'h' + i"
			:x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2"
			:stroke="resolvedColor"
			:stroke-width="resolvedWidth"
			stroke-linecap="round"
			:stroke-dasharray="hiddenDash"
			:opacity="s.alpha * 0.28"
			vector-effect="non-scaling-stroke"
		/>

		<!-- visible wireframe edges (non-rounded) -->
		<line
			v-for="(s, i) in (useFaces ? [] : segments)"
			:key="i"
			:x1="s.x1" :y1="s.y1" :x2="s.x2" :y2="s.y2"
			:stroke="resolvedColor"
			:stroke-width="resolvedWidth"
			stroke-linecap="round"
			:opacity="s.alpha"
			vector-effect="non-scaling-stroke"
		/>
		<!-- optional rounded panel + icon on the front face -->
		<template v-if="icon || iconSrc">
			<path
				v-if="panel && !isHex && !topFace"
				:d="panelPath"
				fill="none"
				:stroke="resolvedColor"
				:stroke-width="resolvedWidth"
				stroke-linejoin="round"
				stroke-linecap="round"
				:opacity="iconAlpha * 0.9"
				vector-effect="non-scaling-stroke"
			/>
			<foreignObject
				:transform="iconGlyph.transform"
				:x="iconGlyph.x"
				:y="iconGlyph.y"
				:width="iconGlyph.box"
				:height="iconGlyph.box"
				:opacity="iconAlpha"
				style="overflow: visible;"
			>
				<img
					v-if="iconSrc"
					xmlns="http://www.w3.org/1999/xhtml"
					:src="iconSrc"
					:style="iconImgStyle"
				/>
				<div
					v-else
					xmlns="http://www.w3.org/1999/xhtml"
					class="material-icons"
					:style="glyphStyle"
				>{{ icon }}</div>
			</foreignObject>
		</template>
		</template>

		<!-- billboard mode: faces the viewer (front-above) -->
		<template v-if="straight">
			<!-- the face panel (outline/fill/top); set face=false to keep only icon/HTML -->
			<template v-if="face">
			<!-- rounded: front + back faces as rounded squares (like the rounded card) -->
			<template v-if="straightGeo.rounded">
				<path :d="straightGeo.back" fill="none" :stroke="resolvedColor" :stroke-width="resolvedWidth" :stroke-opacity="straightGeo.backAlpha" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
				<path v-if="resolvedSolid" :d="straightGeo.front" :fill="surfaceColor" stroke="none" />
				<path v-if="straightGeo.fill > 0" :d="straightGeo.front" :fill="resolvedColor" :fill-opacity="straightGeo.fill" stroke="none" />
				<path :d="straightGeo.front" fill="none" :stroke="resolvedColor" :stroke-width="resolvedWidth" :stroke-opacity="straightGeo.alpha" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
			</template>
			<!-- square: flat front + receding top face -->
			<template v-else>
				<template v-if="straightGeo.top">
					<path v-if="resolvedSolid" :d="straightGeo.top" :fill="surfaceColor" stroke="none" />
					<path v-if="straightGeo.topFill > 0" :d="straightGeo.top" :fill="resolvedColor" :fill-opacity="straightGeo.topFill" stroke="none" />
					<path :d="straightGeo.top" fill="none" :stroke="resolvedColor" :stroke-width="resolvedWidth" :stroke-opacity="straightGeo.alpha" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
				</template>
				<path v-if="resolvedSolid" :d="straightGeo.front" :fill="surfaceColor" stroke="none" />
				<path v-if="straightGeo.fill > 0" :d="straightGeo.front" :fill="resolvedColor" :fill-opacity="straightGeo.fill" stroke="none" />
				<path :d="straightGeo.front" fill="none" :stroke="resolvedColor" :stroke-width="resolvedWidth" :stroke-opacity="straightGeo.alpha" stroke-linejoin="round" vector-effect="non-scaling-stroke" />
			</template>
			</template>
			<!-- icon (front, upright) -->
			<foreignObject v-if="icon || iconSrc" :x="straightGeo.iconX" :y="straightGeo.iconY" :width="straightGeo.iconBox" :height="straightGeo.iconBox" :opacity="straightGeo.alpha" style="overflow: visible;">
				<img v-if="iconSrc" xmlns="http://www.w3.org/1999/xhtml" :src="iconSrc" :style="iconImgStyle" />
				<div v-else xmlns="http://www.w3.org/1999/xhtml" class="material-icons" :style="straightGlyphStyle">{{ icon }}</div>
			</foreignObject>
			<!-- arbitrary HTML rendered inside the (axis-aligned) front face -->
			<foreignObject v-if="$slots.default" :x="straightGeo.faceX" :y="straightGeo.faceY" :width="straightGeo.faceW" :height="straightGeo.faceH">
				<div xmlns="http://www.w3.org/1999/xhtml" class="isoBox_face" :style="faceContentStyle"><slot /></div>
			</foreignObject>
		</template>
		</template>
	</g>
</template>

<script>
export default {
	name: 'IsoBox',
	inject: { iso: { default: null } },
	props: {
		x: { type: Number, default: 0 },
		y: { type: Number, default: 0 },
		z: { type: Number, default: 0 },
		w: { type: Number, default: 4 },
		d: { type: Number, default: 4 },
		h: { type: Number, default: 1 },
		color: { type: String, default: null },
		strokeWidth: { type: Number, default: null },
		fillOpacity: { type: Number, default: null },
		hidden: { type: Boolean, default: false },
		// subdivisions drawn on the top face (0 = none)
		grid: { type: Number, default: 0 },
		// opacity of the grid lines relative to the stroke
		gridOpacity: { type: Number, default: 0.4 },
		// overall opacity multiplier for the whole brick (for ghost / reflection copies)
		opacity: { type: Number, default: 1 },
		// fill faces opaquely (with the inherited surface colour) so this box hides
		// what's behind it; null = inherit from the IsoStack `solid` prop
		solid: { type: Boolean, default: null },
		// Material icon ligature drawn on the front (vertical) face
		icon: { type: String, default: null },
		// image/SVG URL drawn on the face instead of a font glyph (e.g. a brand logo);
		// uses the same face projection / size / rotation as `icon`
		iconSrc: { type: String, default: null },
		// draw the rounded panel outline behind the icon
		panel: { type: Boolean, default: true },
		// icon glyph size, in grid units
		iconSize: { type: Number, default: 1.3 },
		// rotate the icon within the plane of the face it sits on (degrees, clockwise)
		iconRotation: { type: Number, default: 0 },
		// which vertical face the icon sits on: 'auto' (wider face) | 'left' (+y face) | 'right' (+x face)
		iconFace: { type: String, default: 'auto' },
		// panel corner radius, in grid units
		panelRadius: { type: Number, default: 0.4 },
		// round every visible corner of the box by this many grid units (0 = sharp)
		radius: { type: Number, default: 0 },
		// chamfer (crop) the nearest corner by this many grid units, leaving a flat
		// vertical wall facing the viewer (0 = sharp pointed corner)
		crop: { type: Number, default: 0 },
		// 'box' = rectangular prism (default); 'hex' = hexagonal front/back face
		shape: { type: String, default: 'box' },
		// when rounded, give the front/back faces a folder-tab profile on the top edge
		folder: { type: Boolean, default: false },
		// billboard mode: draw a flat, front-facing card (no isometric skew) with the
		// icon upright facing the viewer; positioned at the box's projected centre
		straight: { type: Boolean, default: false },
		// (straight only) foreshorten the face width by cos(angle) so it tracks a
		// front-facing wall / cropped edge as the scene angle changes; with
		// w = 2·crop it stays flush against a crop-chamfered platform front edge
		foreshorten: { type: Boolean, default: false },
		// (straight only) feather the front-face edges to transparent (0 = off, 1 = max)
		faceFade: { type: Number, default: 0 },
		// (straight only) draw the face panel (outline/fill/top); set false to render
		// only the icon / slot HTML with no visible box edges
		face: { type: Boolean, default: true },
		// ── connector / line type ──
		// explicit waypoints [[x,y,z], ...]; >=2 points switches to connector mode
		points: { type: Array, default: null },
		// convenience endpoints; when both set (and no `points`) an L-elbow is routed
		from: { type: Array, default: null },
		to: { type: Array, default: null },
		// which axis the auto-elbow turns on first: 'auto' | 'x' | 'y' | 'z'
		elbow: { type: String, default: 'auto' },
		// dashed (dotted) vs solid line
		dashed: { type: Boolean, default: false },
		// custom stroke-dasharray; when null and `dashed`, a round-cap dotted pattern is used
		dash: { type: String, default: null },
		// animate the dashes flowing along the path; magnitude = speed (dash
		// periods per second), sign = direction (0 = static). Needs `dashed`/`dash`.
		flow: { type: Number, default: 0 },
	},
	computed: {
		resolvedColor() {
			return this.color || (this.iso && this.iso.color.value) || 'currentColor';
		},
		resolvedWidth() {
			return this.strokeWidth != null
				? this.strokeWidth
				: (this.iso ? this.iso.strokeWidth.value : 1.5);
		},
		resolvedFill() {
			return this.fillOpacity != null
				? this.fillOpacity
				: (this.iso ? this.iso.fillOpacity.value : 0.05);
		},
		showFill() {
			return this.resolvedFill > 0;
		},
		hiddenDash() {
			return `${this.resolvedWidth * 2} ${this.resolvedWidth * 2.5}`;
		},
		// height contribution to depth: the projection's view direction is
		// (1, 1, 2·sin(angle)), so true nearness = x + y + 2·sin(angle)·z. Without
		// this, a high-z box (nearer the front-above camera) would be over-fogged.
		depthBias() {
			if (!this.iso) return 0;
			// project(1,1,0).y / screenScale == 2·sin(angle)
			const twoSin = this.iso.project(1, 1, 0)[1] / this.screenScale;
			return twoSin * (this.z + this.h / 2);
		},
		depthAlpha() {
			const fn = this.iso ? this.iso.depthAlpha : () => 1;
			const bias = this.depthBias;
			// call sites pass ground depth (x + y); fold in the box's height here
			return (depth) => fn(depth + bias);
		},
		resolvedSolid() {
			if (this.solid != null) return this.solid;
			return this.iso ? this.iso.solid.value : false;
		},
		isHex() {
			return this.shape === 'hex';
		},
		// a hex shorter than it is wide AND deep lies flat on the floor as a tile
		flatHex() {
			return this.isHex && this.h < this.w && this.h < this.d;
		},
		// render via front/back face outlines (rounded card or hexagon) vs full cuboid
		useFaces() {
			return this.radius > 0 || this.isHex;
		},
		surfaceColor() {
			return this.iso ? this.iso.surface.value : 'transparent';
		},
		screenScale() {
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			const a = project(0, 0, 0);
			const b = project(1, 0, 0);
			return Math.hypot(b[0] - a[0], b[1] - a[1]) || 1;
		},
		alphaTop() {
			const g = this.geo;
			return this.depthAlpha((g.dA + g.dB + g.dC + g.dD) / 4) * this.opacity;
		},
		alphaSkirt() {
			const g = this.geo;
			return this.depthAlpha((g.dB + g.dC + g.dD) / 3) * this.opacity;
		},
		alphaMid() {
			return this.depthAlpha(this.geo.dC) * this.opacity;
		},
		flatHexGeo() {
			if (!this.flatHex) return null;
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			const a = this.depthAlpha;
			const o = this.opacity;
			const d = this.radius * this.screenScale;
			const zb = this.z;
			const zt = this.z + this.h;
			// pointy-top hexagon in the ground plane: two edges run along the (1,1)
			// grid direction so they project to vertical screen edges (left & right).
			// (U,V) frame: U = gx+gy (screen-vertical), V = gx-gy (screen-horizontal)
			const Uh = this.d / 2;
			const Vh = this.w / 2;
			const pairs = [
				[-Uh, 0],        // top point
				[-Uh / 2, Vh],   // upper right
				[Uh / 2, Vh],    // lower right
				[Uh, 0],         // bottom point
				[Uh / 2, -Vh],   // lower left
				[-Uh / 2, -Vh],  // upper left
			];
			const grid = pairs.map(([U, V]) => [this.x + (U + V) / 2, this.y + (U - V) / 2]);
			const n = grid.length;
			const cx = this.x, cy = this.y;
			const top = grid.map(([gx, gy]) => project(gx, gy, zt));
			const bot = grid.map(([gx, gy]) => project(gx, gy, zb));
			const s = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;

			// front-facing edges: outward normal (edge midpoint - centre) points toward
			// the viewer, i.e. has a positive (1,1) component in grid space
			const struts = [];
			const skirts = [];
			const strutSeen = new Set();
			for (let i = 0; i < n; i++) {
				const j = (i + 1) % n;
				const [gx1, gy1] = grid[i];
				const [gx2, gy2] = grid[j];
				const mx = (gx1 + gx2) / 2 - cx;
				const my = (gy1 + gy2) / 2 - cy;
				const front = (mx + my) > 0.0001;
				if (!front) continue;
				const dep = (gx1 + gy1 + gx2 + gy2) / 2;
				skirts.push({ pts: [top[i], top[j], bot[j], bot[i]].map(s).join(' ') });
				for (const k of [i, j]) {
					if (strutSeen.has(k)) continue;
					strutSeen.add(k);
					struts.push({
						x1: top[k][0].toFixed(2), y1: top[k][1].toFixed(2),
						x2: bot[k][0].toFixed(2), y2: bot[k][1].toFixed(2),
						alpha: a(grid[k][0] + grid[k][1]) * o,
					});
				}
			}

			const centreDepth = cx + cy;
			const aTop = a(centreDepth) * o;
			const ff = this.showFill ? this.resolvedFill : 0;
			return {
				top: { d: this.roundPath(top, true, d), alpha: aTop },
				bottom: { d: this.roundPath(bot, true, d), alpha: aTop * 0.55 },
				struts,
				skirts,
				topFill: ff > 0 ? ff * 1.5 * aTop : 0,
			};
		},
		roundedGeo() {
			if (!this.radius && !this.isHex) return { back: { d: '', alpha: 0 }, front: { d: '', alpha: 0 }, frontFill: 0 };
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			const a = this.depthAlpha;
			const o = this.opacity;
			const d = this.radius * this.screenScale;
			const hw = this.w / 2;
			const hd = this.d / 2;
			const FW = this.faceW;
			const H = this.h;

			// face-local outline points (lx across the face, lz up)
			let localPts;
			if (this.isHex) {
				// flat-top hexagon: horizontal top & bottom edges, points at left & right
				const topW = FW * 0.5;
				localPts = [
					[-topW / 2, H],
					[topW / 2, H],
					[FW / 2, H / 2],
					[topW / 2, 0],
					[-topW / 2, 0],
					[-FW / 2, H / 2],
				];
			} else if (this.folder) {
				const tabW = FW * 0.55;
				const slant = FW * 0.1;
				const rise = Math.min(H * 0.09, FW * 0.11);
				// body keeps full height H; the tab stands out ABOVE the top edge
				localPts = [
					[-FW / 2, 0],
					[FW / 2, 0],
					[FW / 2, H],
					[-FW / 2 + tabW, H],
					[-FW / 2 + tabW - slant, H + rise],
					[-FW / 2, H + rise],
				];
			} else {
				localPts = [[-FW / 2, 0], [FW / 2, 0], [FW / 2, H], [-FW / 2, H]];
			}

			// project a face-local point onto the front or back depth plane
			const planeProj = (isFront) => {
				if (this.tall) {
					const xx = this.x + (isFront ? hw : -hw);
					return (lx, lz) => project(xx, this.y - lx, this.z + lz);
				}
				const yy = this.y + (isFront ? hd : -hd);
				return (lx, lz) => project(this.x + lx, yy, this.z + lz);
			};
			const toPath = (pj) => this.roundPath(localPts.map(([lx, lz]) => pj(lx, lz)), true, d);
			const front = toPath(planeProj(true));
			const back = toPath(planeProj(false));

			const depthFront = this.tall ? (this.x + hw + this.y) : (this.x + this.y + hd);
			const depthBack = this.tall ? (this.x - hw + this.y) : (this.x + this.y - hd);
			const aF = a(depthFront) * o;
			const aB = a(depthBack) * o;

			const ff = this.showFill ? this.resolvedFill : 0;
			return {
				back: { d: back, alpha: aB * 0.7 },
				front: { d: front, alpha: aF },
				frontFill: ff > 0 ? ff * 1.3 * aF : 0,
			};
		},
		// chamfer the nearest corner into a flat front wall
		cropped() {
			return this.crop > 0 && !this.useFaces && !this.flatHex;
		},
		geo() {
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			const hw = this.w / 2;
			const hd = this.d / 2;
			const bz = this.z;
			const tz = this.z + this.h;
			const A = [this.x - hw, this.y - hd];
			const B = [this.x + hw, this.y - hd];
			const C = [this.x + hw, this.y + hd];
			const D = [this.x - hw, this.y + hd];
			const P = (c, zz) => project(c[0], c[1], zz);
			// chamfer the nearest corner C into two points + a flat front wall
			const cr = Math.min(this.crop, this.w, this.d);
			const Cb = [this.x + hw, this.y + hd - cr];        // back along the B→C edge
			const Cd = [this.x + hw - cr, this.y + hd];        // back along the D→C edge
			// grid depth (x + y) per corner — higher = nearer the viewer
			return {
				A: P(A, bz), B: P(B, bz), C: P(C, bz), D: P(D, bz),
				A2: P(A, tz), B2: P(B, tz), C2: P(C, tz), D2: P(D, tz),
				Cb: P(Cb, bz), Cd: P(Cd, bz), Cb2: P(Cb, tz), Cd2: P(Cd, tz),
				dCb: Cb[0] + Cb[1], dCd: Cd[0] + Cd[1],
				dA: A[0] + A[1], dB: B[0] + B[1], dC: C[0] + C[1], dD: D[0] + D[1],
			};
		},
		segments() {
			const g = this.geo;
			const a = this.depthAlpha;
			const o = this.opacity;
			const seg = (p, q, depth) => ({
				x1: p[0].toFixed(2), y1: p[1].toFixed(2),
				x2: q[0].toFixed(2), y2: q[1].toFixed(2),
				alpha: a(depth) * o,
			});
			if (this.cropped) {
				return [
					// top pentagon
					seg(g.A2, g.B2, (g.dA + g.dB) / 2),
					seg(g.B2, g.Cb2, (g.dB + g.dCb) / 2),
					seg(g.Cb2, g.Cd2, (g.dCb + g.dCd) / 2),   // chamfer top edge
					seg(g.Cd2, g.D2, (g.dCd + g.dD) / 2),
					seg(g.D2, g.A2, (g.dD + g.dA) / 2),
					// front verticals (B, the two chamfer corners, D)
					seg(g.B, g.B2, g.dB),
					seg(g.Cb, g.Cb2, g.dCb),
					seg(g.Cd, g.Cd2, g.dCd),
					seg(g.D, g.D2, g.dD),
					// front-bottom edges
					seg(g.B, g.Cb, (g.dB + g.dCb) / 2),
					seg(g.Cb, g.Cd, (g.dCb + g.dCd) / 2),     // chamfer bottom edge
					seg(g.Cd, g.D, (g.dCd + g.dD) / 2),
				];
			}
			return [
				// top rhombus
				seg(g.A2, g.B2, (g.dA + g.dB) / 2),
				seg(g.B2, g.C2, (g.dB + g.dC) / 2),
				seg(g.C2, g.D2, (g.dC + g.dD) / 2),
				seg(g.D2, g.A2, (g.dD + g.dA) / 2),
				// front verticals
				seg(g.B, g.B2, g.dB),
				seg(g.C, g.C2, g.dC),
				seg(g.D, g.D2, g.dD),
				// front-bottom edges
				seg(g.B, g.C, (g.dB + g.dC) / 2),
				seg(g.C, g.D, (g.dC + g.dD) / 2),
			];
		},
		gridLines() {
			if (!this.grid || this.grid < 1 || this.useFaces) return [];
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			const a = this.depthAlpha;
			const o = this.opacity * this.gridOpacity;
			const hw = this.w / 2;
			const hd = this.d / 2;
			const tz = this.z + this.h;
			const n = Math.round(this.grid);
			// when the nearest corner (C: right + front) is chamfered, clip grid lines
			// to the chamfer line dx + dy = cr (dx/dy = distance from the right/front edge)
			const cr = this.cropped ? Math.min(this.crop, this.w, this.d) : 0;
			const xR = this.x + hw; // right edge (gx)
			const yF = this.y + hd; // front edge (gy)
			const out = [];
			const push = (p, q, depth) => out.push({
				x1: p[0].toFixed(2), y1: p[1].toFixed(2),
				x2: q[0].toFixed(2), y2: q[1].toFixed(2),
				alpha: a(depth) * o,
			});
			for (let i = 1; i < n; i++) {
				// line parallel to the depth (y) axis, at fixed gx
				const gx = this.x - hw + (this.w * i) / n;
				const dx = xR - gx;
				let gyEnd = yF;
				if (cr > 0 && dx < cr) gyEnd = yF - (cr - dx);
				if (gyEnd > this.y - hd + 1e-4) {
					push(project(gx, this.y - hd, tz), project(gx, gyEnd, tz), gx + this.y);
				}
				// line parallel to the width (x) axis, at fixed gy
				const gy = this.y - hd + (this.d * i) / n;
				const dy = yF - gy;
				let gxEnd = xR;
				if (cr > 0 && dy < cr) gxEnd = xR - (cr - dy);
				if (gxEnd > this.x - hw + 1e-4) {
					push(project(this.x - hw, gy, tz), project(gxEnd, gy, tz), this.x + gy);
				}
			}
			return out;
		},
		hiddenSegs() {
			if (!this.hidden) return [];
			const g = this.geo;
			const a = this.depthAlpha;
			const o = this.opacity;
			const seg = (p, q, depth) => ({
				x1: p[0].toFixed(2), y1: p[1].toFixed(2),
				x2: q[0].toFixed(2), y2: q[1].toFixed(2),
				alpha: a(depth) * o,
			});
			return [
				seg(g.A, g.A2, g.dA),
				seg(g.A, g.B, (g.dA + g.dB) / 2),
				seg(g.A, g.D, (g.dA + g.dD) / 2),
			];
		},
		faces() {
			const g = this.geo;
			const a = this.depthAlpha;
			const o = this.opacity;
			const s = (p) => `${p[0].toFixed(2)},${p[1].toFixed(2)}`;
			const f = this.resolvedFill;
			if (this.cropped) {
				return {
					top: {
						pts: [g.A2, g.B2, g.Cb2, g.Cd2, g.D2].map(s).join(' '),
						op: f * 1.6 * o * a((g.dA + g.dB + g.dCb + g.dCd + g.dD) / 5),
					},
					left: {
						pts: [g.D, g.Cd, g.Cd2, g.D2].map(s).join(' '),
						op: f * o * a((g.dD + g.dCd) / 2),
					},
					chamfer: {
						pts: [g.Cd, g.Cb, g.Cb2, g.Cd2].map(s).join(' '),
						op: f * 1.25 * o * a((g.dCb + g.dCd) / 2),
					},
					right: {
						pts: [g.B, g.Cb, g.Cb2, g.B2].map(s).join(' '),
						op: f * 0.55 * o * a((g.dB + g.dCb) / 2),
					},
				};
			}
			return {
				top: {
					pts: [g.A2, g.B2, g.C2, g.D2].map(s).join(' '),
					op: f * 1.6 * o * a((g.dA + g.dB + g.dC + g.dD) / 4),
				},
				left: {
					pts: [g.D, g.C, g.C2, g.D2].map(s).join(' '),
					op: f * o * a((g.dD + g.dC) / 2),
				},
				right: {
					pts: [g.B, g.C, g.C2, g.B2].map(s).join(' '),
					op: f * 0.55 * o * a((g.dB + g.dC) / 2),
				},
			};
		},
		// when the box is deeper than it is wide, face the card onto the
		// grid-y planes (the opposite visible side) instead of the grid-x planes
		tall() {
			return this.d > this.w;
		},
		faceW() {
			return this.tall ? this.d : this.w;
		},
		// which vertical face the ICON sits on. 'auto' follows `tall` (the wider face);
		// 'right' = the +x face (faces down-right), 'left' = the +y face (down-left).
		iconTall() {
			if (this.iconFace === 'right') return true;
			if (this.iconFace === 'left') return false;
			return this.tall;
		},
		iconFaceW() {
			return this.iconTall ? this.d : this.w;
		},
		// icon laid flat on the top face instead of a vertical face
		topFace() {
			return this.iconFace === 'top';
		},
		frontDepth() {
			return this.iconTall
				? this.x + this.w / 2 + this.y
				: this.x + this.y + this.d / 2;
		},
		// projector for the icon's front face: local (along-face, up) -> screen
		faceProj() {
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			if (this.iconTall) {
				const xF = this.x + this.w / 2;
				// negate the y axis so the glyph isn't mirrored on this face
				return (lx, lz) => project(xF, this.y - lx, this.z + lz);
			}
			const yF = this.y + this.d / 2;
			return (lx, lz) => project(this.x + lx, yF, this.z + lz);
		},
		iconAlpha() {
			const depth = (this.flatHex || this.topFace) ? (this.x + this.y) : this.frontDepth;
			return this.depthAlpha(depth) * this.opacity;
		},
		panelPath() {
			const fp = this.faceProj;
			const m = Math.min(this.iconFaceW, this.h) * 0.16;
			const lx = this.iconFaceW / 2 - m;
			const zb = m;
			const zt = this.h - m;
			const r = Math.min(this.panelRadius, lx, (zt - zb) / 2);
			const p = (a, b) => {
				const pt = fp(a, b);
				return `${pt[0].toFixed(2)} ${pt[1].toFixed(2)}`;
			};
			return (
				`M${p(-lx + r, zb)}` +
				`L${p(lx - r, zb)}` +
				`Q${p(lx, zb)} ${p(lx, zb + r)}` +
				`L${p(lx, zt - r)}` +
				`Q${p(lx, zt)} ${p(lx - r, zt)}` +
				`L${p(-lx + r, zt)}` +
				`Q${p(-lx, zt)} ${p(-lx, zt - r)}` +
				`L${p(-lx, zb + r)}` +
				`Q${p(-lx, zb)} ${p(-lx + r, zb)}` +
				`Z`
			);
		},
		iconTransform() {
			return this.iconGlyph.transform;
		},
		iconGlyph() {
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			let o, U, W;
			if (this.flatHex || this.topFace) {
				// lay the glyph flat on the top face (floor-decal): grid-x to the
				// right-and-down, grid-y to the left-and-down
				const zt = this.z + this.h;
				o = project(this.x, this.y, zt);
				const ux = project(this.x + 1, this.y, zt);
				const wy = project(this.x, this.y + 1, zt);
				U = [ux[0] - o[0], ux[1] - o[1]];
				W = [wy[0] - o[0], wy[1] - o[1]];
			} else {
				const fp = this.faceProj;
				const cz = this.h / 2;
				o = fp(0, cz);
				const ux = fp(1, cz);
				const wz = fp(0, cz - 1); // lower z -> downward on screen
				U = [ux[0] - o[0], ux[1] - o[1]];
				W = [wz[0] - o[0], wz[1] - o[1]];
			}
			const sc = Math.hypot(U[0], U[1]) || 1;
			const Uh = [U[0] / sc, U[1] / sc];
			const Wh = [W[0] / sc, W[1] / sc];
			const fontPx = this.iconSize * sc;
			const box = fontPx * 1.8;
			return {
				transform: `matrix(${Uh[0].toFixed(4)},${Uh[1].toFixed(4)},${Wh[0].toFixed(4)},${Wh[1].toFixed(4)},${o[0].toFixed(3)},${o[1].toFixed(3)})`,
				box: box.toFixed(2),
				x: (-box / 2).toFixed(2),
				y: (-box / 2).toFixed(2),
				fontPx,
			};
		},
		// ── connector / line type ──
		resolvedPoints() {
			if (Array.isArray(this.points) && this.points.length >= 2) return this.points;
			if (Array.isArray(this.from) && Array.isArray(this.to)) {
				return this.elbowPoints(this.from, this.to, this.elbow);
			}
			return null;
		},
		isConnector() {
			return !!this.resolvedPoints;
		},
		connectorDash() {
			if (!this.dashed) return null;
			if (this.dash) return this.dash;
			const w = this.resolvedWidth;
			// tiny dash + round cap => dots; gap scaled off the stroke width
			return `${(w * 0.01).toFixed(3)} ${(w * 2.6).toFixed(2)}`;
		},
		// length of one full dash cycle, so the flow animation can loop seamlessly
		// (shift the offset by exactly one period and the pattern repeats)
		dashPeriod() {
			if (!this.connectorDash) return 0;
			const nums = String(this.connectorDash).split(/[\s,]+/).map(Number).filter((n) => !isNaN(n));
			if (!nums.length) return 0;
			let sum = nums.reduce((a, b) => a + b, 0);
			if (nums.length % 2 === 1) sum *= 2; // odd-length arrays repeat → period doubles
			return sum;
		},
		// flow animation on the dashed connector (animates stroke-dashoffset);
		// speed = |flow| periods/sec, direction from the sign
		connectorFlowStyle() {
			if (!this.flow || !this.isConnector || !this.dashPeriod) return null;
			return {
				'--iso-dash-period': String(this.dashPeriod),
				animationName: 'isoBoxDashFlow',
				animationDuration: (1 / Math.abs(this.flow)).toFixed(4) + 's',
				animationTimingFunction: 'linear',
				animationIterationCount: 'infinite',
				animationDirection: this.flow < 0 ? 'reverse' : 'normal',
			};
		},
		// screen-space elbow: a true 90° corner on the viewport (corner placed at the
		// axis-aligned intersection of the projected endpoints), from/to only
		screenElbow() {
			return (this.elbow === 'screenH' || this.elbow === 'screenV')
				&& Array.isArray(this.from) && Array.isArray(this.to)
				&& !(Array.isArray(this.points) && this.points.length >= 2);
		},
		connectorPath() {
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			let screen;
			let depthPts;
			if (this.screenElbow) {
				const p0 = project(this.from[0], this.from[1], this.from[2] || 0);
				const p1 = project(this.to[0], this.to[1], this.to[2] || 0);
				// horizontal-first puts the bend at (p1.x, p0.y); vertical-first at (p0.x, p1.y)
				const corner = this.elbow === 'screenH' ? [p1[0], p0[1]] : [p0[0], p1[1]];
				screen = [p0, corner, p1];
				depthPts = [this.from, this.to];
			} else {
				const pts = this.resolvedPoints;
				if (!pts) return { d: '', alpha: 0 };
				screen = pts.map((p) => project(p[0], p[1], p[2] || 0));
				depthPts = pts;
			}
			let d;
			if (this.radius > 0) {
				d = this.roundPath(screen, false, this.radius * this.screenScale);
			} else {
				d = screen.map((p, i) => `${i === 0 ? 'M' : 'L'}${p[0].toFixed(2)} ${p[1].toFixed(2)}`).join('');
			}
			let sx = 0, sy = 0;
			for (const p of depthPts) { sx += p[0]; sy += p[1]; }
			const alpha = this.depthAlpha((sx + sy) / depthPts.length) * this.opacity;
			return { d, alpha };
		},
		// straight / billboard box: a flat front face that squarely faces the viewer,
		// plus a top face that recedes upward (we view the block from front-above, so
		// only the front + top are visible — no skewed left/right sides)
		straightGeo() {
			const project = this.iso ? this.iso.project : (gx, gy, gz) => [gx, gy - gz];
			const sc = this.screenScale;
			const c = project(this.x, this.y, this.z + this.h / 2);
			// optionally foreshorten width like a front-facing wall: project(1,0,0).x/sc = cos(angle)
			const wScale = this.foreshorten && this.iso ? Math.abs(project(1, 0, 0)[0] / sc) : 1;
			const halfW = (this.w * sc * wScale) / 2;
			const halfH = (this.h * sc) / 2;
			// vertical screen distance per grid unit of depth (≈ scale·sin(angle))
			const depthPerUnit = Math.abs(project(this.x, this.y + 1, this.z)[1] - project(this.x, this.y, this.z)[1]);
			const depthPx = this.d * depthPerUnit;
			const x0 = c[0] - halfW, x1 = c[0] + halfW;
			const yT = c[1] - halfH, yB = c[1] + halfH;
			const f = (v) => v.toFixed(2);
			const alpha = this.depthAlpha(this.x + this.y) * this.opacity;
			const ff = this.showFill ? this.resolvedFill : 0;
			const fontPx = this.iconSize * sc;
			const iconBox = fontPx * 1.8;
			const common = {
				alpha,
				fill: ff > 0 ? Math.min(ff * 1.3, 1) * alpha : 0,
				iconX: f(c[0] - iconBox / 2),
				iconY: f(c[1] - iconBox / 2),
				iconBox: iconBox.toFixed(2),
				fontPx,
				// front-face screen rect (axis-aligned) — used to host slotted HTML
				faceX: f(x0),
				faceY: f(yT),
				faceW: (halfW * 2).toFixed(2),
				faceH: (halfH * 2).toFixed(2),
				faceR: Math.min(this.radius * sc, halfW, halfH),
			};
			// rounded: show only the front + back faces as rounded squares (like the
			// non-straight rounded-card rendering), the back offset straight back/up
			if (this.radius > 0) {
				const r = Math.min(this.radius * sc, halfW, halfH);
				const card = (ay0, ay1) =>
					`M${f(x0 + r)} ${f(ay0)}` +
					`L${f(x1 - r)} ${f(ay0)}Q${f(x1)} ${f(ay0)} ${f(x1)} ${f(ay0 + r)}` +
					`L${f(x1)} ${f(ay1 - r)}Q${f(x1)} ${f(ay1)} ${f(x1 - r)} ${f(ay1)}` +
					`L${f(x0 + r)} ${f(ay1)}Q${f(x0)} ${f(ay1)} ${f(x0)} ${f(ay1 - r)}` +
					`L${f(x0)} ${f(ay0 + r)}Q${f(x0)} ${f(ay0)} ${f(x0 + r)} ${f(ay0)}Z`;
				return {
					...common,
					rounded: true,
					front: card(yT, yB),
					back: card(yT - depthPx, yB - depthPx),
					backAlpha: alpha * 0.7,
				};
			}
			// square: flat front face + a top face receding back/up
			const yBack = yT - depthPx;
			return {
				...common,
				rounded: false,
				front: `M${f(x0)} ${f(yT)}L${f(x1)} ${f(yT)}L${f(x1)} ${f(yB)}L${f(x0)} ${f(yB)}Z`,
				top: depthPx > 0.5
					? `M${f(x0)} ${f(yT)}L${f(x1)} ${f(yT)}L${f(x1)} ${f(yBack)}L${f(x0)} ${f(yBack)}Z`
					: '',
				topFill: ff > 0 ? Math.min(ff * 1.8, 1) * alpha : 0,
			};
		},
		// wrapper for slotted HTML on a straight box's front face
		faceContentStyle() {
			const g = this.straightGeo;
			const style = {
				width: g.faceW + 'px',
				height: g.faceH + 'px',
				boxSizing: 'border-box',
				overflow: 'hidden',
				borderRadius: g.faceR ? g.faceR.toFixed(2) + 'px' : null,
				color: this.resolvedColor,
				opacity: g.alpha,
			};
			// feather the edges to transparent (two intersecting linear masks → all 4 sides)
			if (this.faceFade > 0) {
				const e = Math.min(this.faceFade, 1) * 50;
				const mask =
					`linear-gradient(to right, transparent, #000 ${e}%, #000 ${100 - e}%, transparent), ` +
					`linear-gradient(to bottom, transparent, #000 ${e}%, #000 ${100 - e}%, transparent)`;
				style.maskImage = mask;
				style.webkitMaskImage = mask;
				style.maskComposite = 'intersect';
				style.webkitMaskComposite = 'source-in';
			}
			return style;
		},
		straightGlyphStyle() {
			const box = this.straightGeo.iconBox;
			return {
				width: box + 'px',
				height: box + 'px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: this.straightGeo.fontPx.toFixed(2) + 'px',
				lineHeight: '1',
				color: this.resolvedColor,
				transform: this.iconRotation ? `rotate(${this.iconRotation}deg)` : null,
			};
		},
		glyphStyle() {
			const box = this.iconGlyph.box;
			return {
				width: box + 'px',
				height: box + 'px',
				display: 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				fontSize: this.iconGlyph.fontPx.toFixed(2) + 'px',
				lineHeight: '1',
				color: this.resolvedColor,
				// rotate within the face-local (orthonormal) space; the foreignObject
				// matrix then projects it onto the face, so this reads as an in-plane spin
				transform: this.iconRotation ? `rotate(${this.iconRotation}deg)` : null,
			};
		},
		// <img> drawn on the face (fills the icon box; rotates in-plane like the glyph)
		iconImgStyle() {
			return {
				display: 'block',
				width: '100%',
				height: '100%',
				objectFit: 'contain',
				transform: this.iconRotation ? `rotate(${this.iconRotation}deg)` : null,
			};
		},
	},
	methods: {
		// route a single-bend L between two grid points; the corner advances along the
		// chosen axis first ('auto' = the axis with the largest delta)
		elbowPoints(a, b, mode) {
			let i;
			if (mode === 'x') i = 0;
			else if (mode === 'y') i = 1;
			else if (mode === 'z') i = 2;
			else {
				const deltas = [Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1]), Math.abs((b[2] || 0) - (a[2] || 0))];
				i = deltas.indexOf(Math.max(...deltas));
			}
			const corner = [a[0], a[1], a[2] || 0];
			corner[i] = b[i] || 0;
			return [[a[0], a[1], a[2] || 0], corner, [b[0], b[1], b[2] || 0]];
		},
		// build a corner-rounded path through screen-space points
		roundPath(pts, closed, d) {
			const n = pts.length;
			if (n < 2) return '';
			const f = (p) => `${p[0].toFixed(2)} ${p[1].toFixed(2)}`;
			const sub = (a, b) => [a[0] - b[0], a[1] - b[1]];
			const add = (a, b) => [a[0] + b[0], a[1] + b[1]];
			const mul = (a, s) => [a[0] * s, a[1] * s];
			const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
			const norm = (a) => {
				const l = Math.hypot(a[0], a[1]) || 1;
				return [a[0] / l, a[1] / l];
			};
			const parts = [];
			if (closed) {
				for (let i = 0; i < n; i++) {
					const V = pts[i];
					const P = pts[(i - 1 + n) % n];
					const N = pts[(i + 1) % n];
					const t = Math.min(d, dist(V, P) / 2, dist(V, N) / 2);
					const A = add(V, mul(norm(sub(P, V)), t));
					const B = add(V, mul(norm(sub(N, V)), t));
					parts.push(`${i === 0 ? 'M' : 'L'}${f(A)}`);
					parts.push(`Q${f(V)} ${f(B)}`);
				}
				parts.push('Z');
			} else {
				parts.push(`M${f(pts[0])}`);
				for (let i = 1; i < n - 1; i++) {
					const V = pts[i];
					const P = pts[i - 1];
					const N = pts[i + 1];
					const t = Math.min(d, dist(V, P) / 2, dist(V, N) / 2);
					const A = add(V, mul(norm(sub(P, V)), t));
					const B = add(V, mul(norm(sub(N, V)), t));
					parts.push(`L${f(A)}`);
					parts.push(`Q${f(V)} ${f(B)}`);
				}
				parts.push(`L${f(pts[n - 1])}`);
			}
			return parts.join('');
		},
	},
};
</script>

<!-- global (non-scoped) so the keyframe name matches the inline animationName -->
<style>
@keyframes isoBoxDashFlow {
	to { stroke-dashoffset: var(--iso-dash-period, 0); }
}

@media (prefers-reduced-motion: reduce) {
	[style*="isoBoxDashFlow"] { animation: none !important; }
}
</style>
