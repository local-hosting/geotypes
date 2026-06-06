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
  category?: string;
}

function addCategoryAttribute(inputFile: string, outputFile: string) {
  console.log(`Reading features from ${inputFile}...`);
  
  // Read the YAML file
  const yamlContent = readFileSync(inputFile, 'utf8');
  const features = load(yamlContent) as Feature[];
  
  console.log(`Processing ${features.length} features...`);
  
  // Process each feature to add the category attribute
  const updatedFeatures = features.map(feature => {
    // Extract the first tag from the tags field
    const firstTag = feature.tags.split(',')[0].trim();
    
    // Add the category attribute
    return {
      ...feature,
      category: firstTag
    };
  });
  
  // Write the updated features back to YAML
  const updatedYaml = dump(updatedFeatures, {
    lineWidth: 120,
    noRefs: true,
    sortKeys: false
  });
  
  writeFileSync(outputFile, updatedYaml, 'utf8');
  
  console.log(`✅ Successfully added category attribute to ${updatedFeatures.length} features`);
  console.log(`📁 Output written to ${outputFile}`);
  
  // Show some examples
  console.log('\n📋 Examples of added categories:');
  updatedFeatures.slice(0, 5).forEach(feature => {
    console.log(`  ${feature.id} (${feature.name}): ${feature.category}`);
  });
}

// Run the script
const inputFile = 'schema/all_features.tagged.yml';
const outputFile = 'schema/all_features.tagged.yml';

try {
  addCategoryAttribute(inputFile, outputFile);
} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
} 