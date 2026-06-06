#!/usr/bin/env tsx

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface Feature {
  id: string;
  name: string;
  description: string;
  geometry_type: string;
  tags?: string;
  category?: string;
  mappings?: Record<string, any>;
}

interface GeometryRecommendation {
  feature: Feature;
  currentGeometry: string;
  recommendedGeometry: string;
  confidence: number;
  reasoning: string[];
}

// Keywords that strongly indicate specific geometry types
const POINT_KEYWORDS = [
  // Buildings and facilities
  'office', 'shop', 'store', 'restaurant', 'cafe', 'bar', 'pub', 'club', 'gym', 'studio',
  'bank', 'atm', 'pharmacy', 'hospital', 'clinic', 'school', 'university', 'library',
  'museum', 'theater', 'cinema', 'hotel', 'motel', 'inn', 'bed and breakfast',
  'gas station', 'car wash', 'auto repair', 'mechanic', 'salon', 'spa',
  'post office', 'police station', 'fire station', 'church', 'temple', 'mosque',
  'stadium', 'arena', 'field', 'court', 'track', 'pool', 'golf course',
  'park', 'playground', 'zoo', 'aquarium', 'botanical garden',
  'airport', 'train station', 'bus station', 'subway station', 'ferry terminal',
  'marina', 'dock', 'pier', 'lighthouse', 'tower', 'monument', 'statue',
  'bench', 'fountain', 'clock', 'phone booth', 'mailbox', 'trash can',
  'vending machine', 'kiosk', 'stand', 'booth', 'cart', 'truck',
  'company', 'firm', 'agency', 'center', 'facility', 'complex',
  'venue', 'attraction', 'landmark', 'point of interest',
  'stop', 'station', 'terminal', 'depot', 'hub', 'center', 'daycare center',
  'outlet', 'branch', 'location', 'site', 'place'
];

const LINESTRING_KEYWORDS = [
  // Transportation
  'road', 'street', 'avenue', 'highway', 'freeway', 'expressway', 'parkway',
  'lane', 'drive', 'way', 'boulevard', 'circle', 'court', 'place',
  'bridge', 'tunnel', 'overpass', 'underpass', 'ramp', 'exit', 'entrance',
  'railroad', 'railway', 'track', 'line', 'route', 'path', 'trail',
  'walkway', 'sidewalk', 'footpath', 'bikepath', 'bike lane', 'trail',
  'river', 'stream', 'creek', 'canal', 'channel', 'ditch', 'pipeline',
  'power line', 'transmission line', 'cable', 'wire', 'fiber optic',
  'border', 'boundary', 'fence', 'wall', 'barrier', 'dividing line',
  'corridor', 'passage', 'aisle', 'hallway', 'walkway', 'promenade'
];

const POLYGON_KEYWORDS = [
  // Areas and regions
  'park', 'forest', 'woodland', 'garden', 'orchard', 'vineyard', 'farm',
  'field', 'meadow', 'pasture', 'grassland', 'wetland', 'marsh', 'swamp',
  'lake', 'pond', 'reservoir', 'bay', 'harbor', 'cove', 'inlet',
  'island', 'peninsula', 'cape', 'beach', 'shore', 'coast', 'coastline',
  'mountain', 'hill', 'valley', 'canyon', 'gorge', 'cliff', 'ridge',
  'desert', 'tundra', 'savanna', 'prairie', 'steppe', 'jungle', 'rainforest',
  'neighborhood', 'district', 'zone', 'area', 'region', 'territory',
  'campus', 'complex', 'compound', 'facility', 'installation', 'base',
  'industrial park', 'business park', 'office park', 'shopping center',
  'mall', 'plaza', 'square', 'marketplace', 'bazaar', 'fairground',
  'stadium', 'arena', 'field', 'track', 'course', 'range', 'ground',
  'cemetery', 'graveyard', 'memorial', 'monument', 'landmark',
  'residential area', 'housing development', 'subdivision', 'community',
  'village', 'town', 'city', 'municipality', 'county', 'state', 'province',
  'country', 'nation', 'territory', 'colony', 'dependency',
  'protected area', 'reserve', 'sanctuary', 'refuge', 'wildlife area',
  'recreation area', 'campground', 'resort', 'spa', 'retreat',
  'industrial area', 'commercial area', 'downtown', 'uptown', 'suburb',
  // Construction and development
  'construction site', 'construction', 'development site', 'development',
  'building site', 'work site', 'project site', 'excavation',
  'demolition', 'renovation', 'expansion', 'addition'
];

// Category-based rules
const CATEGORY_GEOMETRY_RULES: Record<string, string> = {
  'transportation_logistics': 'linestring', // Roads, railways, etc.
  'natural_resources': 'polygon', // Forests, farms, etc.
  'community_residential': 'point', // Most residential buildings
  'commercial_services': 'point', // Most commercial buildings
  'entertainment_gaming': 'point', // Most entertainment venues
  'sports_fitness': 'point', // Most sports facilities
  'health_and_medicine': 'point', // Most health facilities
  'financial_services': 'point', // Most financial institutions
  'legal_professional': 'point', // Most professional offices
  'technology_media': 'point', // Most tech companies
  'construction_real_estate': 'point', // Most construction/real estate
  'energy_oil_gas': 'polygon', // Most energy facilities are areas
  'manufacturing_industrial': 'polygon', // Most industrial facilities
  'utilities_infrastructure': 'polygon', // Most utility facilities
};

// Tag-based rules
const TAG_GEOMETRY_RULES: Record<string, string> = {
  'roads_streets': 'linestring',
  'railways': 'linestring',
  'waterways': 'linestring',
  'boundaries': 'linestring',
  'agriculture_farming': 'polygon',
  'forests_parks': 'polygon',
  'water_bodies': 'polygon',
  'residential_housing': 'point',
  'commercial_buildings': 'point',
  'institutional_buildings': 'point',
  'recreation_entertainment': 'point',
  'healthcare_facilities': 'point',
  'educational_institutions': 'point',
  'financial_institutions': 'point',
  'professional_services': 'point',
  'transportation_hubs': 'point',
  'landmarks_attractions': 'point',
};

function analyzeFeature(feature: Feature): GeometryRecommendation {
  const name = typeof feature.name === 'string' ? feature.name : '';
  const description = typeof feature.description === 'string' ? feature.description : '';
  const text = `${name} ${description}`.toLowerCase();
  const tags = feature.tags?.toLowerCase() || '';
  const category = feature.category?.toLowerCase() || '';
  
  let pointScore = 0;
  let linestringScore = 0;
  let polygonScore = 0;
  const reasoning: string[] = [];

  // Check keywords in name and description
  for (const keyword of POINT_KEYWORDS) {
    if (text.includes(keyword)) {
      pointScore += 1;
      reasoning.push(`Contains point keyword: "${keyword}"`);
    }
  }

  for (const keyword of LINESTRING_KEYWORDS) {
    if (text.includes(keyword)) {
      linestringScore += 1;
      reasoning.push(`Contains linestring keyword: "${keyword}"`);
    }
  }

  for (const keyword of POLYGON_KEYWORDS) {
    if (text.includes(keyword)) {
      polygonScore += 1;
      reasoning.push(`Contains polygon keyword: "${keyword}"`);
    }
  }

  // Check category rules
  for (const [cat, geometry] of Object.entries(CATEGORY_GEOMETRY_RULES)) {
    if (category.includes(cat)) {
      if (geometry === 'point') pointScore += 3;
      else if (geometry === 'linestring') linestringScore += 3;
      else if (geometry === 'polygon') polygonScore += 3;
      reasoning.push(`Category rule: "${cat}" suggests ${geometry}`);
    }
  }

  // Check tag rules
  for (const [tag, geometry] of Object.entries(TAG_GEOMETRY_RULES)) {
    if (tags.includes(tag)) {
      if (geometry === 'point') pointScore += 2;
      else if (geometry === 'linestring') linestringScore += 2;
      else if (geometry === 'polygon') polygonScore += 2;
      reasoning.push(`Tag rule: "${tag}" suggests ${geometry}`);
    }
  }

  // Special cases based on name patterns
  if (name.includes('road') || name.includes('street') || 
      name.includes('highway') || name.includes('avenue')) {
    linestringScore += 5;
    reasoning.push('Name suggests road/street (linestring)');
  }

  if (name.includes('building') || name.includes('office') || 
      name.includes('shop') || name.includes('store')) {
    pointScore += 5;
    reasoning.push('Name suggests building/facility (point)');
  }

  if (name.includes('park') || name.includes('forest') || 
      name.includes('field') || name.includes('area')) {
    polygonScore += 5;
    reasoning.push('Name suggests area/region (polygon)');
  }

  // Construction sites are always polygons
  if (name.includes('construction') || description.includes('construction site')) {
    polygonScore += 8;
    reasoning.push('Construction site detected - should be polygon');
  }

  // Determine recommended geometry
  let recommendedGeometry = feature.geometry_type;
  let confidence = 0.5; // Default confidence

  if (pointScore > linestringScore && pointScore > polygonScore) {
    recommendedGeometry = 'point';
    confidence = Math.min(0.95, 0.5 + (pointScore * 0.1));
  } else if (linestringScore > pointScore && linestringScore > polygonScore) {
    recommendedGeometry = 'linestring';
    confidence = Math.min(0.95, 0.5 + (linestringScore * 0.1));
  } else if (polygonScore > pointScore && polygonScore > linestringScore) {
    recommendedGeometry = 'polygon';
    confidence = Math.min(0.95, 0.5 + (polygonScore * 0.1));
  }

  // If scores are close, lower confidence
  const maxScore = Math.max(pointScore, linestringScore, polygonScore);
  const scores = [pointScore, linestringScore, polygonScore].filter(s => s > 0);
  if (scores.length > 1) {
    const secondHighest = Math.max(...scores.filter(s => s < maxScore));
    if (maxScore - secondHighest < 2) {
      confidence *= 0.7;
      reasoning.push('Close scores between geometry types - lower confidence');
    }
  }

  return {
    feature,
    currentGeometry: feature.geometry_type,
    recommendedGeometry,
    confidence,
    reasoning
  };
}

function loadYamlFile(filePath: string): any {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    return yaml.load(content);
  } catch (error) {
    console.error(`Error loading ${filePath}:`, error);
    return null;
  }
}

function saveYamlFile(filePath: string, data: any): void {
  try {
    const content = yaml.dump(data, { 
      indent: 2, 
      lineWidth: 120,
      noRefs: true 
    });
    fs.writeFileSync(filePath, content, 'utf8');
  } catch (error) {
    console.error(`Error saving ${filePath}:`, error);
  }
}

function updateYamlFiles(recommendations: GeometryRecommendation[], confidenceThreshold: number = 0.8): void {
  const featuresFile = path.join(process.cwd(), 'data', 'features.yml');
  
  // Load the features file
  const data = loadYamlFile(featuresFile);
  if (!data || !Array.isArray(data)) {
    console.error('❌ Features file is not a valid YAML array');
    return;
  }
  
  // Find features that need updates
  const updates: GeometryRecommendation[] = [];
  data.forEach((feature: any) => {
    if (feature && feature.id) {
      const recommendation = recommendations.find(r => r.feature.id === feature.id);
      if (recommendation && recommendation.confidence >= confidenceThreshold) {
        updates.push(recommendation);
      }
    }
  });
  
  // Apply updates
  let totalUpdated = 0;
  data.forEach((feature: any) => {
    const update = updates.find(u => u.feature.id === feature.id);
    if (update && feature.geometry_type !== update.recommendedGeometry) {
      feature.geometry_type = update.recommendedGeometry;
      totalUpdated++;
      console.log(`  ✅ Updated ${feature.name} (${feature.id}): ${update.currentGeometry} → ${update.recommendedGeometry}`);
    }
  });
  
  if (totalUpdated > 0) {
    saveYamlFile(featuresFile, data);
    console.log(`💾 Updated features.yml with ${totalUpdated} geometry changes`);
  }
  
  console.log(`\n🎉 Total features updated: ${totalUpdated}`);
}

export async function geometryRecommend(opts: { apply?: boolean, json?: boolean }) {
  const featuresFile = path.join(process.cwd(), 'data', 'features.yml');
  const outputFile = path.join(process.cwd(), 'scripts', 'geometry_recommendations.json');
  const shouldUpdate = !!opts.apply;
  const shouldWriteJson = !!opts.json;
  const confidenceThreshold = 0.8; // Only update high-confidence recommendations

  console.log('🔍 Analyzing geometry types for all features...\n');

  // Load features from the single YAML file
  const data = loadYamlFile(featuresFile);
  if (!data || !Array.isArray(data)) {
    throw new Error('❌ Features file is not a valid YAML array');
  }

  const allFeatures: Feature[] = [];

  // Process each feature
  data.forEach((feature: any, idx: number) => {
    if (!feature || typeof feature !== 'object' || !feature.id || !feature.name || !feature.geometry_type) {
      console.warn(`\n❗ Problematic entry in features.yml [index ${idx}]:`);
      console.warn('  Entry:', JSON.stringify(feature, null, 2));
    } else {
      allFeatures.push(feature as Feature);
    }
  });

  console.log(`📊 Loaded ${allFeatures.length} features from features.yml\n`);

  // Analyze each feature
  const recommendations: GeometryRecommendation[] = [];
  const mismatches: GeometryRecommendation[] = [];

  for (const feature of allFeatures) {
    const recommendation = analyzeFeature(feature);
    recommendations.push(recommendation);
    if (recommendation.currentGeometry !== recommendation.recommendedGeometry) {
      mismatches.push(recommendation);
    }
  }

  // Sort mismatches by confidence (highest first)
  mismatches.sort((a, b) => b.confidence - a.confidence);

  // Display results
  console.log(`🎯 Found ${mismatches.length} potential geometry mismatches out of ${allFeatures.length} features\n`);

  if (mismatches.length > 0) {
    console.log('🔴 HIGH CONFIDENCE MISMATCHES (>80%):');
    const highConfidence = mismatches.filter(m => m.confidence > 0.8);
    highConfidence.forEach(m => {
      console.log(`\n${m.feature.name} (${m.feature.id})`);
      console.log(`  Current: ${m.currentGeometry} → Recommended: ${m.recommendedGeometry} (${Math.round(m.confidence * 100)}%)`);
      console.log(`  Description: ${m.feature.description}`);
      console.log(`  Reasoning: ${m.reasoning.slice(0, 3).join(', ')}`);
    });

    console.log('\n🟡 MEDIUM CONFIDENCE MISMATCHES (60-80%):');
    const mediumConfidence = mismatches.filter(m => m.confidence > 0.6 && m.confidence <= 0.8);
    mediumConfidence.forEach(m => {
      console.log(`\n${m.feature.name} (${m.feature.id})`);
      console.log(`  Current: ${m.currentGeometry} → Recommended: ${m.recommendedGeometry} (${Math.round(m.confidence * 100)}%)`);
      console.log(`  Description: ${m.feature.description}`);
    });

    console.log('\n🟢 LOW CONFIDENCE MISMATCHES (<60%):');
    const lowConfidence = mismatches.filter(m => m.confidence <= 0.6);
    lowConfidence.forEach(m => {
      console.log(`\n${m.feature.name} (${m.feature.id})`);
      console.log(`  Current: ${m.currentGeometry} → Recommended: ${m.recommendedGeometry} (${Math.round(m.confidence * 100)}%)`);
    });
  }

  // Save detailed results to file (only if --json is passed)
  if (shouldWriteJson) {
    const results = {
      summary: {
        totalFeatures: allFeatures.length,
        mismatches: mismatches.length,
        highConfidenceMismatches: mismatches.filter(m => m.confidence > 0.8).length,
        mediumConfidenceMismatches: mismatches.filter(m => m.confidence > 0.6 && m.confidence <= 0.8).length,
        lowConfidenceMismatches: mismatches.filter(m => m.confidence <= 0.6).length
      },
      recommendations: recommendations,
      mismatches: mismatches
    };

    fs.writeFileSync(outputFile, JSON.stringify(results, null, 2));
    console.log(`\n💾 Detailed results saved to: ${outputFile}`);
  }

  // Apply updates if requested
  if (shouldUpdate) {
    const highConfidenceMismatches = mismatches.filter(m => m.confidence >= confidenceThreshold);
    if (highConfidenceMismatches.length > 0) {
      console.log(`\n🚀 Applying ${highConfidenceMismatches.length} high-confidence geometry updates...`);
      updateYamlFiles(recommendations, confidenceThreshold);
    } else {
      console.log('\n✅ No high-confidence updates to apply');
    }
  } else {
    const highConfidenceCount = mismatches.filter(m => m.confidence >= confidenceThreshold).length;
    if (highConfidenceCount > 0) {
      console.log(`\n💡 To apply ${highConfidenceCount} high-confidence updates, run:`);
      console.log(`   npm run proto geometry -- --apply`);
    }
  }

  // Generate summary statistics
  const geometryCounts = {
    point: { current: 0, recommended: 0 },
    linestring: { current: 0, recommended: 0 },
    polygon: { current: 0, recommended: 0 }
  };

  recommendations.forEach(r => {
    // Only count known geometry types
    if (geometryCounts[r.currentGeometry as keyof typeof geometryCounts]) {
      geometryCounts[r.currentGeometry as keyof typeof geometryCounts].current++;
    } else {
      console.warn(`⚠️  Unknown geometry_type for feature '${r.feature.name}' (id: ${r.feature.id}): '${r.currentGeometry}'`);
    }
    if (geometryCounts[r.recommendedGeometry as keyof typeof geometryCounts]) {
      geometryCounts[r.recommendedGeometry as keyof typeof geometryCounts].recommended++;
    } else {
      console.warn(`⚠️  Unknown recommended geometry_type for feature '${r.feature.name}' (id: ${r.feature.id}): '${r.recommendedGeometry}'`);
    }
  });

  console.log('\n📈 GEOMETRY TYPE DISTRIBUTION:');
  console.log('Current vs Recommended:');
  Object.entries(geometryCounts).forEach(([type, counts]) => {
    console.log(`  ${type}: ${counts.current} → ${counts.recommended}`);
  });
} 