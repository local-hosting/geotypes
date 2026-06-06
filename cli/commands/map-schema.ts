import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import { getFlatSubCategoryList } from "../utils/category";

// Optional import for AI features
let pipeline: any, cos_sim: any, Tensor: any, PipelineType: any;
try {
  const transformers = await import("@xenova/transformers");
  pipeline = transformers.pipeline;
  cos_sim = transformers.cos_sim;
  Tensor = transformers.Tensor;
  PipelineType = transformers.PipelineType;
} catch (error) {
  // Package not available - will show error when used
}

// --- AI-powered Semantic Similarity ---

// 1. Singleton class to manage the feature extraction pipeline.
//    This ensures we only load the model into memory once.
class Pipeline {
  static task = "feature-extraction";
  static model = "Xenova/all-MiniLM-L6-v2";
  static instance: any = null;

  static async getInstance(progress_callback?: Function) {
    if (!pipeline) {
      throw new Error("AI features require @xenova/transformers package. Install with: npm install @xenova/transformers");
    }
    
    if (this.instance === null) {
      // Set a local cache directory to avoid permission issues
      process.env.TRANSFORMERS_CACHE = path.join(process.cwd(), ".cache");

      console.log(
        "Loading sentence-similarity model... (This may take a moment on first run)",
      );
      this.instance = await pipeline(this.task, this.model, {
        progress_callback,
      });
    }
    return this.instance;
  }
}

// 2. Function to generate embeddings for a list of sentences.
async function getEmbeddings(sentences: string[]): Promise<any> {
  const extractor = await Pipeline.getInstance();
  return await extractor(sentences, { pooling: "mean", normalize: true });
}

export async function mapSchema(opts: { threshold?: string }) {
  const threshold = parseFloat(opts.threshold || '0.7');
  
  // 1. Load legacy features from the main features file
  const allFeaturesPath = path.join(process.cwd(), 'schema', 'all_features.yml');
  if (!fs.existsSync(allFeaturesPath)) {
    throw new Error(`Error: The features file does not exist at: ${allFeaturesPath}`);
  }
  const allFeatures = yaml.load(fs.readFileSync(allFeaturesPath, 'utf8')) as any[];
  const legacyItemsRaw = allFeatures.map((f: any) => ({
    name: f.name,
    description: f.description || '',
    tags: f.tags || ''
  }));
  const legacyItems = legacyItemsRaw.map(f => `Feature: "${f.name}", described as "${f.description}", used in categories like: ${f.tags}`);
  
  // 2. Load the new Foursquare-aligned taxonomy
  const newTaxonomy = getFlatSubCategoryList();
  const newItems = newTaxonomy.map(item => `Category: "${item.name}", part of the "${item.parent}" group.`);

  // 3. Generate embeddings for both sets
  console.log('Generating embeddings for legacy features...');
  const legacyEmbeddingsTensor = await getEmbeddings(legacyItems);
  const legacyEmbeddings = legacyEmbeddingsTensor.tolist();

  console.log('Generating embeddings for new taxonomy items...');
  const newEmbeddingsTensor = await getEmbeddings(newItems);
  const newEmbeddings = newEmbeddingsTensor.tolist();
  
  // 4. Find and print the best matches
  console.log('\n--- AI-Powered Mappings (Legacy Schema -> New Taxonomy) ---');
  let matchesFound = 0;

  for (let i = 0; i < legacyItemsRaw.length; i++) {
    const legacyItem = legacyItemsRaw[i];
    const legacyEmbedding = legacyEmbeddings[i];
    let bestMatch = { index: -1, score: -1 };

    for (let j = 0; j < newItems.length; j++) {
      const newEmbedding = newEmbeddings[j];
      const score = cos_sim(legacyEmbedding, newEmbedding);

      if (score > bestMatch.score) {
        bestMatch = { index: j, score };
      }
    }

    if (bestMatch.score >= threshold) {
      matchesFound++;
      const newMatch = newTaxonomy[bestMatch.index];
      console.log(`- ${legacyItem.name} -> ${newMatch.name} (Score: ${bestMatch.score.toFixed(2)})`);
    }
  }

  if (matchesFound === 0) {
    console.log(`No matches found with a threshold of ${threshold}. Try a lower value.`);
  }
}
