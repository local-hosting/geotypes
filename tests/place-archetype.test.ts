import { describe, expect, it } from 'vitest';

import {
  isAssetGeotype,
  placeAxesForSlug,
  placeDecorationsForSlug,
  placeScaffoldForGeotypeRef,
  placeScaffoldForSlug,
  suggestBuildingImportForSlug,
} from '../src/place-archetype.js';

describe('placeScaffoldForSlug (map-first)', () => {
  it('maps shopping_mall to indoor_stack (stacked retail interior)', () => {
    const scaffold = placeScaffoldForSlug('shopping_mall');
    expect(scaffold).toEqual({
      archetype: 'indoor_stack',
      authoring_scale: {
        linear_unit: 'm',
        h3_resolution: 10,
        space_granularity: 'room',
      },
    });
  });

  it('maps linestring geotypes to linear archetype', () => {
    const scaffold = placeScaffoldForSlug('creek');
    expect(scaffold?.archetype).toBe('linear');
    expect(scaffold?.authoring_scale.space_granularity).toBe('zone');
  });

  it('maps airport to campus archetype', () => {
    expect(placeScaffoldForSlug('airport')?.archetype).toBe('campus');
  });

  it('suggests building import only for campus archetype slugs', () => {
    expect(suggestBuildingImportForSlug('airport')).toBe(true);
    expect(suggestBuildingImportForSlug('university')).toBe(true);
    expect(suggestBuildingImportForSlug('shopping_mall')).toBe(false);
    expect(suggestBuildingImportForSlug('public_park')).toBe(false);
  });

  it('maps public_park to open_area', () => {
    expect(placeScaffoldForSlug('public_park')?.archetype).toBe('open_area');
  });

  it('exposes materialized axes per slug', () => {
    expect(placeAxesForSlug('hotel')).toEqual({ extent: 'footprint', vertical: 'stacked', movement: 'free' });
    expect(placeAxesForSlug('not_a_real_type')).toBeNull();
  });

  it('assigns events and decoration layers per slug', () => {
    expect(placeDecorationsForSlug('creek')).toEqual({
      events: ['dam-release', 'flood', 'litter-pollution'],
      layers: ['sensors', 'visits'],
    });
    expect(placeDecorationsForSlug('substation')?.events).toEqual([
      'power-outage',
      'flood',
      'severe-weather',
    ]);
    expect(placeDecorationsForSlug('stadium')?.events).toEqual(['severe-weather', 'transit-disruption']);
    expect(placeDecorationsForSlug('retail_bank')?.events).toEqual(['severe-weather']);
    expect(placeDecorationsForSlug('food_truck')).toEqual({ events: [], layers: ['assets'] });
    expect(placeDecorationsForSlug('not_a_real_type')).toBeNull();
  });

  it('treats point assets as asset kinds, not places', () => {
    for (const slug of ['fire_hydrant', 'utility_pole', 'stop_sign', 'traffic_light']) {
      expect(isAssetGeotype(slug), slug).toBe(true);
      expect(placeScaffoldForSlug(slug), slug).toBeNull();
      expect(placeDecorationsForSlug(slug), slug).toBeNull();
    }
    expect(isAssetGeotype('church')).toBe(false);
    expect(placeScaffoldForSlug('church')?.archetype).toBe('single_level');
  });

  it('resolves from geotype ref', () => {
    expect(placeScaffoldForGeotypeRef('shopping_mall')?.archetype).toBe('indoor_stack');
  });

  it('returns null for unknown slug', () => {
    expect(placeScaffoldForSlug('not_a_real_type')).toBeNull();
  });
});
