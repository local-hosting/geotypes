import {
  applyDefaultDiagramTheme,
  applyGridLinesMode,
  IC_PLANE_ROW_HOST_ATTR,
  Stage,
  whenDiagramHostCameraReady,
  type DiagramScene,
  type DiagramSceneNode,
} from '@westlane/isocanvas';
import {
  artboardUserSizeFromIso216Series,
  DEFAULT_ARTBOARD_GRID_DIVISIONS,
  defaultLatticeStage,
  DIAGRAM_NODE_FOOTPRINT,
  planeRectsSpaceBetweenInRow,
  relayoutDiagramSceneNodesInPackedRows,
} from '@westlane/isocanvas/layout';

import {
  buildGeotypeTaxonomyDiagramArtboards,
  type GeotypeTaxonomyDiagramCategory,
} from '../src/taxonomy-diagram.js';
import type { PlaceArchetype } from '../src/types/place-layout.js';

/** Landscape columns — merged on one continuous plane row (single SVG / single camera). */
const VIZ_ARTBOARD_USER_SIZE = artboardUserSizeFromIso216Series(17, {
  landscape: true,
  longEdgePx: 1900,
});

const GRID_COLS = 4;

/** 2×2 continuous plane grid (one merged SVG / single camera). */
const ARCHETYPE_GRID_SLOT: Record<
  PlaceArchetype,
  { col: number; row: number }
> = {
  single_level: { col: 0, row: 0 },
  campus: { col: 1, row: 0 },
  linear: { col: 0, row: 1 },
  indoor_stack: { col: 1, row: 1 },
};

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
};

function diagramSceneForCategories(
  archetype: PlaceArchetype,
  categories: readonly GeotypeTaxonomyDiagramCategory[],
): DiagramScene {
  if (categories.length === 0) {
    return {
      nodes: [],
      viewBox: {
        x: 0,
        y: 0,
        w: VIZ_ARTBOARD_USER_SIZE.width,
        h: VIZ_ARTBOARD_USER_SIZE.height,
      },
    };
  }

  const rowCount = Math.max(1, Math.ceil(categories.length / GRID_COLS));
  const divisions = Math.max(rowCount, GRID_COLS, DEFAULT_ARTBOARD_GRID_DIVISIONS);
  const stage = defaultLatticeStage(VIZ_ARTBOARD_USER_SIZE);
  stage.divisions = divisions;

  const footprint = DIAGRAM_NODE_FOOTPRINT;
  const nodes: DiagramSceneNode[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    const slice = categories.slice(row * GRID_COLS, (row + 1) * GRID_COLS);
    const rects = planeRectsSpaceBetweenInRow(row, slice.length, footprint, {
      stage,
      gridCols: GRID_COLS,
      rowCount,
      rowSpan: divisions,
    });
    for (let index = 0; index < slice.length; index += 1) {
      const category = slice[index]!;
      const rect = rects[index]!;
      nodes.push({
        id: category.id,
        label: `${category.label}\n(${category.slugCount})`,
        x: rect.x,
        y: rect.y,
        w: footprint.widthPx,
        h: footprint.depthPx,
        cubeFaceColors: ARCHETYPE_CUBE_COLORS[archetype],
      });
    }
  }

  const relaid = relayoutDiagramSceneNodesInPackedRows(nodes, stage, {
    footprintUser: footprint,
    gridCols: GRID_COLS,
    rowCount,
    rowSpan: divisions,
  });

  return {
    viewBox: {
      x: stage.x ?? 0,
      y: stage.y ?? 0,
      w: stage.width,
      h: stage.height,
    },
    divisions: stage.divisions,
    nodes: relaid,
  };
}

const viewportEl = document.getElementById('diagram-viewport');
if (!viewportEl) {
  throw new Error('geotypes viz: missing #diagram-viewport');
}

viewportEl.classList.add('ic-stage-viewport');

const themeManager = applyDefaultDiagramTheme();
const artboards = buildGeotypeTaxonomyDiagramArtboards();

/** One merged diagram on the plane-row host (2×2 grid → single pan/zoom camera). */
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
    gridSlot: ARCHETYPE_GRID_SLOT[board.id],
    scene: diagramSceneForCategories(board.id, board.categories),
    embedDotGrid: false,
    contentId: `diagram-host-${board.id}`,
    userSize: VIZ_ARTBOARD_USER_SIZE,
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
