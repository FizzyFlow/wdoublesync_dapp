// Scene model + helpers for the IsoStack editor.
// Keeps the prop defaults in sync with IsoBox.vue / IsoStack.vue so the code
// generator can omit anything left at its default for clean, minimal output.

let _idCounter = 0;
export function nextId() {
    return `box_${++_idCounter}`;
}

// Mirror of IsoBox.vue prop defaults.
export const ISOBOX_DEFAULTS = {
    x: 0, y: 0, z: 0,
    w: 4, d: 4, h: 1,
    color: null,
    strokeWidth: null,
    fillOpacity: null,
    hidden: false,
    grid: 0,
    gridOpacity: 0.4,
    opacity: 1,
    solid: null,
    icon: null,
    iconSrc: null,
    panel: true,
    iconSize: 1.3,
    iconRotation: 0,
    iconFace: 'auto',
    panelRadius: 0.4,
    radius: 0,
    crop: 0,
    shape: 'box',
    folder: false,
    straight: false,
    foreshorten: false,
    faceFade: 0,
    face: true,
    points: null,
    from: null,
    to: null,
    elbow: 'auto',
    dashed: false,
    dash: null,
    flow: 0,
};

// Mirror of IsoStack.vue prop defaults.
export const ISOSTACK_DEFAULTS = {
    color: 'var(--q-primary)',
    strokeWidth: 1.4,
    fillOpacity: 0.06,
    glow: 7,
    fog: 0,
    fogNear: 6,
    fogFar: -8,
    scale: 20,
    angle: 30,
    solid: false,
    surface: 'var(--q-surface-1)',
    viewBox: '-190 -150 380 270',
    ariaLabel: 'Isometric vault illustration',
};

// A fresh box. Geometry/appearance defaults here are editor-friendly (a visible
// solid-ish cube) rather than the bare component defaults.
export function makeBox(overrides = {}) {
    return {
        id: nextId(),
        x: 0, y: 0, z: 0,
        w: 3, d: 3, h: 3,
        color: null,
        strokeWidth: null,
        fillOpacity: 0.1,
        opacity: 1,
        hidden: false,
        grid: 0,
        gridOpacity: 0.4,
        solid: null,
        icon: null,
        iconSrc: null,
        panel: true,
        iconSize: 1.3,
        iconRotation: 0,
        iconFace: 'auto',
        panelRadius: 0.4,
        radius: 0,
        crop: 0,
        shape: 'box',
        folder: false,
        straight: false,
        foreshorten: false,
        faceFade: 0,
        face: true,
        points: null,
        from: null,
        to: null,
        elbow: 'auto',
        dashed: false,
        dash: null,
        flow: 0,
        // editor-only: HTML rendered inside a straight box's front face (slot content)
        html: '',
        ...overrides,
    };
}

// Quick-add presets for the toolbar.
export const PRESETS = [
    { label: 'Cube', icon: 'view_in_ar', make: () => makeBox({ w: 3, d: 3, h: 3, fillOpacity: 0.1 }) },
    { label: 'Platform', icon: 'crop_landscape', make: () => makeBox({ w: 8, d: 8, h: 0.6, grid: 3, fillOpacity: 0.05 }) },
    { label: 'Hex tile', icon: 'hexagon', make: () => makeBox({ shape: 'hex', w: 4, d: 4, h: 0.1, radius: 0.25, icon: 'hub', iconSize: 1.2, fillOpacity: 0.12 }) },
    { label: 'Folder card', icon: 'folder', make: () => makeBox({ w: 2.6, d: 1.2, h: 3.2, radius: 0.4, folder: true, icon: 'folder', fillOpacity: 0.12 }) },
    { label: 'Icon tile', icon: 'code', make: () => makeBox({ w: 2.2, d: 0.7, h: 2, radius: 0.3, icon: 'code', fillOpacity: 0.1 }) },
    { label: 'Connector', icon: 'timeline', make: () => makeBox({ from: [0, 0, 0], to: [4, 0, 3], elbow: 'auto', dashed: true, radius: 0.6 }) },
    { label: 'Connector (90°)', icon: 'turn_right', make: () => makeBox({ from: [0, 0, 0], to: [4, 0, 3], elbow: 'screenH', dashed: true, radius: 0.6 }) },
    { label: 'Flow connector', icon: 'animation', make: () => makeBox({ from: [0, 0, 0], to: [4, 0, 3], elbow: 'auto', dashed: true, radius: 0.6, flow: 1 }) },
];

export function initialScene() {
    return {
        stack: { ...ISOSTACK_DEFAULTS, color: '#5b9bff', scale: 18, glow: 8, fog: 0.25 },
        boxes: [
            makeBox({ w: 8, d: 8, h: 0.6, grid: 3, fillOpacity: 0.05 }),
            makeBox({ z: 0.6, w: 2.4, d: 2.4, h: 2.4, fillOpacity: 0.12 }),
        ],
    };
}

// ── persistence (localStorage) ───────────────────────────────────
export const STORAGE_KEY = 'isoEditor.scene.v1';

export function saveScene(scene) {
    try {
        if (typeof window !== 'undefined' && window.localStorage) {
            window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scene));
        }
    } catch (e) {
        /* ignore quota / serialization errors */
    }
}

export function loadScene() {
    try {
        if (typeof window === 'undefined' || !window.localStorage) return null;
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || !parsed.stack || !Array.isArray(parsed.boxes)) return null;
        // merge over current defaults (so older saves gain any new props) and
        // re-issue ids so the counter advances past the restored boxes
        return {
            stack: { ...ISOSTACK_DEFAULTS, ...parsed.stack },
            boxes: parsed.boxes.map((b) => {
                const base = makeBox();
                return { ...base, ...b, id: base.id };
            }),
        };
    } catch (e) {
        return null;
    }
}

// ── code generation ──────────────────────────────────────────────
const BOX_KEY_ORDER = [
    'x', 'y', 'z', 'w', 'd', 'h',
    'shape', 'radius', 'crop', 'folder', 'straight', 'foreshorten', 'faceFade', 'face',
    'color', 'fillOpacity', 'opacity', 'strokeWidth', 'grid', 'gridOpacity', 'hidden', 'solid',
    'icon', 'iconSrc', 'iconSize', 'iconRotation', 'iconFace', 'panel', 'panelRadius',
    'points', 'from', 'to', 'elbow', 'dashed', 'dash', 'flow',
];
const STACK_KEY_ORDER = [
    'color', 'scale', 'angle', 'strokeWidth', 'fillOpacity', 'glow', 'fog', 'fogNear', 'fogFar',
    'solid', 'surface', 'viewBox', 'ariaLabel',
];

function attr(key, val) {
    if (Array.isArray(val)) return `:${key}="${JSON.stringify(val)}"`;
    if (typeof val === 'boolean') return val ? key : `:${key}="false"`;
    if (typeof val === 'number') return `:${key}="${val}"`;
    return `${key}="${val}"`;
}

function emitAttrs(obj, defaults, order) {
    const out = [];
    for (const k of order) {
        const v = obj[k];
        if (v === undefined || v === null) continue;
        if (v === defaults[k]) continue;
        out.push(attr(k, v));
    }
    return out;
}

// connectors only emit line-relevant props (not w/d/h/shape/etc.)
const CONNECTOR_KEY_ORDER = ['points', 'from', 'to', 'elbow', 'radius', 'color', 'strokeWidth', 'opacity', 'dashed', 'dash', 'flow'];

function isConnector(b) {
    return (Array.isArray(b.points) && b.points.length >= 2)
        || (Array.isArray(b.from) && Array.isArray(b.to));
}

export function genTemplate(scene) {
    const stackAttrs = emitAttrs(scene.stack, ISOSTACK_DEFAULTS, STACK_KEY_ORDER);
    const open = `<IsoStack${stackAttrs.length ? ' ' + stackAttrs.join(' ') : ''}>`;
    const rows = scene.boxes.map((b) => {
        const order = isConnector(b) ? CONNECTOR_KEY_ORDER : BOX_KEY_ORDER;
        const a = emitAttrs(b, ISOBOX_DEFAULTS, order);
        const open = `<IsoBox${a.length ? ' ' + a.join(' ') : ''}`;
        // straight boxes can carry HTML slot content
        if (b.straight && b.html && b.html.trim()) {
            const body = b.html.trim().split('\n').map((l) => `        ${l}`).join('\n');
            return `    ${open}>\n${body}\n    </IsoBox>`;
        }
        return `    ${open} />`;
    });
    return [open, ...rows, '</IsoStack>'].join('\n');
}
