import { describe, expect, it } from 'vitest';

import {
  GEOTYPE_LAYOUT_META_BY_SLUG,
  PLACE_ARCHETYPE_CONFIG,
} from '../src/generated/place-archetype-data.js';
import {
  archetypeForAxes,
  PLACE_ARCHETYPE_AXES,
  resolvePlaceArchetype,
  resolvePlaceAxes,
  resolvePlaceDecorations,
} from '../src/place-archetype-resolve.js';
import { resolvePlaceArchetypeForSlug } from '../src/place-archetype.js';

describe('resolvePlaceArchetype (map-first)', () => {
  it('maps linestrings to linear', () => {
    expect(
      resolvePlaceArchetype(
        'creek',
        { category: 'natural_resources', geometry_type: 'linestring' },
        PLACE_ARCHETYPE_CONFIG,
      ),
    ).toBe('linear');
  });

  it('maps map pins to single_level even when category defaults to campus', () => {
    expect(
      resolvePlaceArchetype(
        'police_station',
        { category: 'community_and_government', geometry_type: 'point' },
        PLACE_ARCHETYPE_CONFIG,
      ),
    ).toBe('single_level');
  });

  it('maps site polygons to campus', () => {
    expect(
      resolvePlaceArchetype(
        'theme_park',
        { category: 'arts_and_entertainment', geometry_type: 'polygon' },
        PLACE_ARCHETYPE_CONFIG,
      ),
    ).toBe('campus');
  });

  it('maps one-building polygons in single_level categories to single_level', () => {
    expect(
      resolvePlaceArchetype(
        'car_dealership',
        { category: 'retail', geometry_type: 'polygon' },
        PLACE_ARCHETYPE_CONFIG,
      ),
    ).toBe('single_level');
  });

  it('honors slug overrides over geometry', () => {
    expect(resolvePlaceArchetypeForSlug('shopping_mall', {
      category: 'retail',
      geometry_type: 'polygon',
    })).toBe('campus');
    expect(resolvePlaceArchetypeForSlug('hotel', {
      category: 'travel_and_transportation',
      geometry_type: 'point',
    })).toBe('indoor_stack');
  });
});

describe('resolvePlaceAxes', () => {
  it('maps open-land polygons to area / open_area', () => {
    const input = { category: 'natural_resources', geometry_type: 'polygon' };
    expect(resolvePlaceAxes('agricultural_field', input, PLACE_ARCHETYPE_CONFIG)).toEqual({
      extent: 'area',
      vertical: 'flat',
      movement: 'free',
    });
    expect(resolvePlaceArchetype('agricultural_field', input, PLACE_ARCHETYPE_CONFIG)).toBe('open_area');
  });

  it('overrides one axis at a time (hospital site with floors stays campus)', () => {
    const input = { category: 'health_and_medicine', geometry_type: 'point' };
    expect(resolvePlaceAxes('hospital', input, PLACE_ARCHETYPE_CONFIG)).toEqual({
      extent: 'site',
      vertical: 'stacked',
      movement: 'free',
    });
    expect(resolvePlaceArchetype('hospital', input, PLACE_ARCHETYPE_CONFIG)).toBe('campus');
  });

  it('maps a rail yard linestring to linear and an intermodal polygon to campus', () => {
    expect(
      resolvePlaceArchetype(
        'rail_yard',
        { category: 'transportation_logistics', geometry_type: 'linestring' },
        PLACE_ARCHETYPE_CONFIG,
      ),
    ).toBe('linear');
    expect(
      resolvePlaceArchetype(
        'intermodal_facility',
        { category: 'transportation_logistics', geometry_type: 'polygon' },
        PLACE_ARCHETYPE_CONFIG,
      ),
    ).toBe('campus');
  });

  it('fails fast on unsupported geometry', () => {
    expect(() =>
      resolvePlaceAxes('x', { category: 'retail', geometry_type: 'geometrycollection' }, PLACE_ARCHETYPE_CONFIG),
    ).toThrow(/unsupported geometry_type/);
  });
});

describe('archetypeForAxes', () => {
  it('round-trips every archetype axes row', () => {
    for (const [archetype, rule] of Object.entries(PLACE_ARCHETYPE_AXES)) {
      const vertical = rule.vertical === 'any' ? 'flat' : rule.vertical;
      expect(archetypeForAxes({ ...rule, vertical })).toBe(archetype);
    }
  });

  it('rejects combinations no base covers', () => {
    expect(() => archetypeForAxes({ extent: 'route', vertical: 'stacked', movement: 'sequenced' })).toThrow(
      /invalid place axes/,
    );
    expect(() => archetypeForAxes({ extent: 'footprint', vertical: 'flat', movement: 'sequenced' })).toThrow(
      /invalid place axes/,
    );
  });
});

describe('materialized slug archetypes', () => {
  it('matches resolver for every registry slug', () => {
    for (const [slug, meta] of Object.entries(GEOTYPE_LAYOUT_META_BY_SLUG)) {
      const input = { category: meta.category, geometry_type: meta.geometry_type };
      const axes = resolvePlaceAxes(slug, input, PLACE_ARCHETYPE_CONFIG);
      expect({ extent: meta.extent, vertical: meta.vertical, movement: meta.movement }, slug).toEqual(axes);
      expect(meta.archetype, slug).toBe(archetypeForAxes(axes));
      const decorations = resolvePlaceDecorations(slug, input, meta.archetype, PLACE_ARCHETYPE_CONFIG);
      expect({ situations: meta.situations, layers: meta.layers }, slug).toEqual(decorations);
    }
  });

  it('only suggests catalog situations', () => {
    const catalog = new Set(PLACE_ARCHETYPE_CONFIG.situations);
    for (const [slug, meta] of Object.entries(GEOTYPE_LAYOUT_META_BY_SLUG)) {
      for (const situation of meta.situations) expect(catalog.has(situation), `${slug}: ${situation}`).toBe(true);
    }
  });
});
