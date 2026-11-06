import { userPxToIsoUnits, type DiagramScene, type DiagramSceneNode } from '@westlane/isocanvas';
import {
  artboardUserSizeFromIso216Series,
  defaultLatticeStage,
  DIAGRAM_NODE_FOOTPRINT,
  planeRectsSpaceBetweenInRow,
  relayoutDiagramSceneNodesInPackedRows,
  type ArtboardUserSize,
} from '@westlane/isocanvas/layout';

import type { GeotypeTaxonomyDiagramCategory } from '../src/taxonomy-diagram.js';
import { vizTaxonomyPlaceLabelTwoLines } from '../src/viz/taxonomy-label-format.js';

export const TAXONOMY_VIZ_ARTBOARD_USER_SIZE: ArtboardUserSize =
  artboardUserSizeFromIso216Series(17, {
    landscape: true,
    longEdgePx: 1900,
  });

export const TAXONOMY_VIZ_GRID_COLS = 4;
export const TAXONOMY_VIZ_GRID_ROWS = 4;
export const TAXONOMY_VIZ_LATTICE_DIVISIONS = Math.max(
  TAXONOMY_VIZ_GRID_ROWS,
  TAXONOMY_VIZ_GRID_COLS,
);

/** Thin iso stack layers (see isocanvas card-stack demo). */
const PLACE_STACK_LAYER_HEIGHT_ISO = userPxToIsoUnits(6);

export { vizTaxonomyPlaceLabelTwoLines } from '../src/viz/taxonomy-label-format.js';

export type TaxonomyCubeColors = NonNullable<DiagramSceneNode['cubeFaceColors']>;

/** Scene for one extent × vertical cell; `cellId` prefixes node ids so cells sharing an archetype stay unique. */
export function buildTaxonomyVizDiagramScene(
  cellId: string,
  colors: TaxonomyCubeColors,
  categories: readonly GeotypeTaxonomyDiagramCategory[],
): DiagramScene {
  const latticeMeta = {
    divisions: TAXONOMY_VIZ_LATTICE_DIVISIONS,
    gridRows: TAXONOMY_VIZ_GRID_ROWS,
    gridCols: TAXONOMY_VIZ_GRID_COLS,
  };

  if (categories.length === 0) {
    return {
      nodes: [],
      ...latticeMeta,
      viewBox: {
        x: 0,
        y: 0,
        w: TAXONOMY_VIZ_ARTBOARD_USER_SIZE.width,
        h: TAXONOMY_VIZ_ARTBOARD_USER_SIZE.height,
      },
    };
  }

  const contentRows = Math.max(1, Math.ceil(categories.length / TAXONOMY_VIZ_GRID_COLS));
  const rowCount = Math.min(TAXONOMY_VIZ_GRID_ROWS, contentRows);
  const stage = defaultLatticeStage(TAXONOMY_VIZ_ARTBOARD_USER_SIZE);
  stage.divisions = TAXONOMY_VIZ_LATTICE_DIVISIONS;

  const footprint = DIAGRAM_NODE_FOOTPRINT;
  const nodes: DiagramSceneNode[] = [];

  for (let row = 0; row < rowCount; row += 1) {
    const slice = categories.slice(
      row * TAXONOMY_VIZ_GRID_COLS,
      (row + 1) * TAXONOMY_VIZ_GRID_COLS,
    );
    const rects = planeRectsSpaceBetweenInRow(row, slice.length, footprint, {
      stage,
      gridCols: TAXONOMY_VIZ_GRID_COLS,
      rowCount: TAXONOMY_VIZ_GRID_ROWS,
      rowSpan: TAXONOMY_VIZ_LATTICE_DIVISIONS,
    });
    for (let index = 0; index < slice.length; index += 1) {
      const category = slice[index]!;
      const rect = rects[index]!;
      const stackGroupId = category.id;
      const places = category.places;
      for (let layer = 0; layer < places.length; layer += 1) {
        const place = places[layer]!;
        const isTop = layer === places.length - 1;
        nodes.push({
          id: `${cellId}:${place.slug}`,
          stackGroupId,
          label: isTop ? vizTaxonomyPlaceLabelTwoLines(place.label) : '',
          omitCubeLabel: !isTop,
          x: rect.x,
          y: rect.y,
          w: footprint.widthPx,
          h: footprint.depthPx,
          elevation: layer * PLACE_STACK_LAYER_HEIGHT_ISO,
          extrusionHeight: PLACE_STACK_LAYER_HEIGHT_ISO,
          cubeFaceColors: colors,
        });
      }
    }
  }

  const relaid = relayoutDiagramSceneNodesInPackedRows(nodes, stage, {
    footprintUser: footprint,
    gridCols: TAXONOMY_VIZ_GRID_COLS,
    rowCount: TAXONOMY_VIZ_GRID_ROWS,
    rowSpan: TAXONOMY_VIZ_LATTICE_DIVISIONS,
  });

  return {
    viewBox: {
      x: stage.x ?? 0,
      y: stage.y ?? 0,
      w: stage.width,
      h: stage.height,
    },
    ...latticeMeta,
    nodes: relaid,
  };
}
