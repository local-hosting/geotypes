import {
  applyDefaultDiagramTheme,
  applyGridLinesMode,
  IC_PLANE_ROW_HOST_ATTR,
  Stage,
  whenDiagramHostCameraReady,
  type DiagramSceneNode,
} from '@westlane/isocanvas';

import { buildGeotypeTaxonomyDiagramArtboards } from '../src/taxonomy-diagram.js';
import type { PlaceArchetype } from '../src/types/place-layout.js';
import {
  buildTaxonomyVizDiagramScene,
  TAXONOMY_VIZ_ARTBOARD_USER_SIZE,
} from './taxonomy-scene.js';

const ARCHETYPE_CUBE_COLORS: Record<
  PlaceArchetype,
  NonNullable<DiagramSceneNode['cubeFaceColors']>
> = {
  single_level: {
    top: '#bae6fd',
    front: '#38bdf8',
    right: '#0ea5e9',
    left: '#0284c7',
    bottom: '#0369a1',
    labelFill: '#0c4a6e',
  },
  campus: {
    top: '#bbf7d0',
    front: '#4ade80',
    right: '#22c55e',
    left: '#16a34a',
    bottom: '#15803d',
    labelFill: '#14532d',
  },
  linear: {
    top: '#fde68a',
    front: '#fbbf24',
    right: '#f59e0b',
    left: '#d97706',
    bottom: '#b45309',
    labelFill: '#78350f',
  },
  indoor_stack: {
    top: '#ddd6fe',
    front: '#a78bfa',
    right: '#8b5cf6',
    left: '#7c3aed',
    bottom: '#6d28d9',
    labelFill: '#4c1d95',
  },
  open_area: {
    top: '#d9f99d',
    front: '#a3e635',
    right: '#84cc16',
    left: '#65a30d',
    bottom: '#4d7c0f',
    labelFill: '#365314',
  },
  network: {
    top: '#fecdd3',
    front: '#fb7185',
    right: '#f43f5e',
    left: '#e11d48',
    bottom: '#be123c',
    labelFill: '#881337',
  },
};

const viewportEl = document.getElementById('diagram-viewport');
if (!viewportEl) {
  throw new Error('geotypes viz: missing #diagram-viewport');
}

viewportEl.classList.add('ic-stage-viewport');

const themeManager = applyDefaultDiagramTheme();
const artboards = buildGeotypeTaxonomyDiagramArtboards();

const stageModel = Stage.create({
  layout: 'row',
  row: {
    continuous: true,
    grid: true,
    gapPx: 56,
    pitchDeg: 42,
    bearingDeg: 0,
    syncCamera: true,
  },
  surface: viewportEl,
  worldCamera: { fallbackAnchor: viewportEl },
});

viewportEl.replaceChildren(stageModel.container);

stageModel.mount(
  artboards.map((board) => ({
    id: board.id,
    label: board.label,
    gridSlot: board.gridSlot,
    scene: buildTaxonomyVizDiagramScene(board.id, ARCHETYPE_CUBE_COLORS[board.archetype], board.categories),
    embedDotGrid: false,
    contentId: `diagram-host-${board.id}`,
    userSize: TAXONOMY_VIZ_ARTBOARD_USER_SIZE,
  })),
  {
    colors: themeManager.getTheme().colors,
    registry: { createDefaults: { embedDotGrid: false } },
  },
);

for (const board of stageModel.handle.getArtboards()) {
  applyGridLinesMode(board.artboard.root, true);
  board.host.classList.add('diagram-host');
}

const FIT_VIEW_OPTIONS = { artboardPaddingPx: 32, contentPaddingRatio: 0.08 };

function resolvePlaneRowDiagramHost(): HTMLElement | null {
  const marked = stageModel.container.querySelector(
    `[${IC_PLANE_ROW_HOST_ATTR}="true"] .diagram-host`,
  );
  return marked instanceof HTMLElement ? marked : null;
}

function fitStageToView(): boolean {
  return stageModel.fitView(FIT_VIEW_OPTIONS);
}

function fitWhenReady(maxFrames = 60): void {
  const host = resolvePlaneRowDiagramHost();
  if (!host) {
    requestAnimationFrame(() => fitWhenReady(maxFrames));
    return;
  }
  whenDiagramHostCameraReady(host, () => fitStageToView(), { maxFrames });
}

stageModel.attachPanZoom({ surface: viewportEl });
fitWhenReady();

window.addEventListener('load', () => fitWhenReady(32), { once: true });

let didFitAfterViewportSized = false;
const resizeObserver = new ResizeObserver(() => {
  if (didFitAfterViewportSized) {
    return;
  }
  if (viewportEl.clientWidth < 1 || viewportEl.clientHeight < 1) {
    return;
  }
  didFitAfterViewportSized = true;
  fitWhenReady(32);
});
resizeObserver.observe(viewportEl);
