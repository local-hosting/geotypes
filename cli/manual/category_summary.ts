#!/usr/bin/env tsx

import { loadFeatureCatalog } from '../../scripts/feature-catalog.ts';

interface Feature {
  id: string;
  name: string;
  description: string;
  geometry_type: string;
  mappings: Record<string, any>;
  tags: string;
  category: string;
}

function analyzeCategories() {
  const features = loadFeatureCatalog(process.cwd()).map((entry) => entry.feature as Feature);
  console.log('Reading venue and resource feature catalogs...');
  
  console.log(`Analyzing ${features.length} features...`);
  
  // Count features by category
  const categoryCounts: Record<string, number> = {};
  const categoryFeatures: Record<string, string[]> = {};
  
  features.forEach(feature => {
    const category = feature.category;
    
    if (!categoryCounts[category]) {
      categoryCounts[category] = 0;
      categoryFeatures[category] = [];
    }
    
    categoryCounts[category]++;
    categoryFeatures[category].push(`${feature.id} (${feature.name})`);
  });
  
  // Sort categories by count (descending)
  const sortedCategories = Object.entries(categoryCounts)
    .sort(([,a], [,b]) => b - a);
  
  console.log('\n📊 Category Distribution:');
  console.log('========================');
  
  sortedCategories.forEach(([category, count]) => {
    const percentage = ((count / features.length) * 100).toFixed(1);
    console.log(`${category}: ${count} features (${percentage}%)`);
  });
  
  console.log(`\n📋 Total categories: ${sortedCategories.length}`);
  console.log(`📋 Total features: ${features.length}`);
  
  // Show examples for each category
  console.log('\n📝 Examples by Category:');
  console.log('=======================');
  
  sortedCategories.forEach(([category, count]) => {
    const examples = categoryFeatures[category].slice(0, 3);
    console.log(`\n${category} (${count} features):`);
    examples.forEach(example => {
      console.log(`  - ${example}`);
    });
    if (count > 3) {
      console.log(`  ... and ${count - 3} more`);
    }
  });
}

// Run the script
try {
  analyzeCategories();
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} 