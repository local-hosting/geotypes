import type { PlaceArchetype } from './types/place-layout.js';

export function assertPlaceArchetype(value: string, context: string): PlaceArchetype {
  if (
    value === 'indoor_stack' ||
    value === 'single_level' ||
    value === 'campus' ||
    value === 'linear'
  ) {
    return value;
  }
  throw new Error(`invalid archetype "${value}" (${context})`);
}
