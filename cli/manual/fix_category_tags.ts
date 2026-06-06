#!/usr/bin/env tsx

import { readFileSync, writeFileSync } from 'fs';
import { load } from 'js-yaml';
import { dump } from 'js-yaml';

interface Feature {
  id: string;
  name: string;
  description: string;
  geometry_type: string;
  mappings: Record<string, any>;
  tags: string;
  category: string;
}

function fixCategoryTags(inputFile: string, outputFile: string) {
  console.log(`Reading features from ${inputFile}...`);
  
  // Read the YAML file
  const yamlContent = readFileSync(inputFile, 'utf8');
  const features = load(yamlContent) as Feature[];
  
  console.log(`Processing ${features.length} features...`);
  
  // Process each feature to remove the first tag from tags field
  const updatedFeatures = features.map(feature => {
    // Split tags and get the first one (which should match category)
    const tagArray = feature.tags.split(',').map(tag => tag.trim());
    const firstTag = tagArray[0];
    
    // Verify that the first tag matches the category
    if (firstTag !== feature.category) {
      console.warn(`⚠️  Warning: Category mismatch for ${feature.id} (${feature.name}):`);
      console.warn(`   Category: "${feature.category}"`);
      console.warn(`   First tag: "${firstTag}"`);
    }
    
    // Remove the first tag from the tags array
    const remainingTags = tagArray.slice(1);
    
    // Join the remaining tags back together
    const updatedTags = remainingTags.join(', ');
    
    return {
      ...feature,
      tags: updatedTags
    };
  });
  
  // Write the updated features back to YAML
  const updatedYaml = dump(updatedFeatures, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
  
  writeFileSync(outputFile, updatedYaml, 'utf8');
  
  console.log(`✅ Successfully updated ${updatedFeatures.length} features`);
  console.log(`📁 Output written to ${outputFile}`);
  
  // Show some examples
  console.log('\n📋 Examples of updated tags:');
  updatedFeatures.slice(0, 5).forEach(feature => {
    console.log(`  ${feature.id} (${feature.name}):`);
    console.log(`    Category: ${feature.category}`);
    console.log(`    Tags: ${feature.tags || '(none)'}`);
  });
}

// Run the script
const inputFile = 'schema/all_features.tagged.yml';
const outputFile = 'schema/all_features.tagged.yml';

try {
  fixCategoryTags(inputFile, outputFile);
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} 