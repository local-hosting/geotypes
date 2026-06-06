import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

// --- Type Definitions ---
export interface Feature {
  id: string;
  name: string;
  feature_code: number;
  [key: string]: any;
}

export interface SubCategory {
  subcategory_code: number;
  description: string;
  features: { [key: string]: Feature };
  name?: string;
  [key: string]: any;
}

export interface Category {
  category_code: number;
  description: string;
  name?: string;
  [key: string]: SubCategory | number | string | undefined;
}

export interface SchemaFile {
  [categoryKey: string]: Category;
}

/**
 * Loads all schema files from the 'schema' directory.
 * @returns {Map<string, SchemaFile>} A map where keys are filenames and values are the parsed YAML content.
 */
export function loadSchemas(): Map<string, SchemaFile> {
  const schemaDir = path.join(process.cwd(), "schema");
  const files = fs.readdirSync(schemaDir).filter((f) => f.endsWith(".yml"));
  const schemas = new Map<string, SchemaFile>();

  for (const file of files) {
    const filePath = path.join(schemaDir, file);
    const content = fs.readFileSync(filePath, "utf8");
    try {
      const schema = yaml.load(content) as SchemaFile;
      schemas.set(file, schema);
    } catch (e) {
      console.error(`Error parsing YAML file: ${file}`, e);
    }
  }
  return schemas;
}

export function walkSchema(
  schemas: Map<string, SchemaFile>,
  callbacks: {
    onCategory?: (
      category: any,
      categoryName: string,
      filePath: string,
    ) => void;
    onSubCategory?: (
      subcategory: any,
      subcategoryName: string,
      category: any,
      categoryName: string,
      filePath: string,
    ) => void;
    onFeature?: (
      feature: any,
      featureName: string,
      subcategory: any,
      subcategoryName: string,
      category: any,
      categoryName: string,
      filePath: string,
    ) => void;
  },
) {
  function recurseSubcategories(
    subcategories: { [key: string]: SubCategory },
    parentCategory: Category,
    parentCategoryKey: string,
    filePath: string,
  ) {
    for (const subcategoryKey in subcategories) {
      const subcategory = subcategories[subcategoryKey];
      if (!subcategory) continue;

      callbacks.onSubCategory?.(
        subcategory,
        subcategoryKey,
        parentCategory,
        parentCategoryKey,
        filePath,
      );

      if (subcategory.features && typeof subcategory.features === "object") {
        for (const featureKey in subcategory.features) {
          const feature = subcategory.features[featureKey] as Feature;
          callbacks.onFeature?.(
            feature,
            featureKey,
            subcategory,
            subcategoryKey,
            parentCategory,
            parentCategoryKey,
            filePath,
          );
        }
      }

      if (
        subcategory.subcategories &&
        typeof subcategory.subcategories === "object"
      ) {
        // Here is the recursive call for nested subcategories
        recurseSubcategories(
          subcategory.subcategories as any,
          parentCategory,
          parentCategoryKey,
          filePath,
        );
      }
    }
  }

  for (const [file, schema] of schemas.entries()) {
    const categoryKey = Object.keys(schema)[0];
    const category = schema[categoryKey] as Category;
    callbacks.onCategory?.(category, categoryKey, file);

    if (category.subcategories && typeof category.subcategories === "object") {
      recurseSubcategories(category.subcategories, category, categoryKey, file);
    }
  }
}

/**
 * Loads all feature names from the local schema files.
 * @returns {Set<string>} A set of local feature names.
 */
export function getLocalFeatureNames(): Set<string> {
  const schemas = loadSchemas();
  const localFeatures = new Set<string>();

  walkSchema(schemas, {
    onFeature: (feature) => {
      localFeatures.add(feature.name.toLowerCase().replace(/_/g, " "));
    },
  });

  return localFeatures;
}

/**
 * Creates a nested map representing the local category -> subcategory -> feature hierarchy.
 * @returns {Map<string, Map<string, string[]>>} The map representing the local hierarchy.
 */
export function getLocalCategoryHierarchy(): Map<
  string,
  Map<string, string[]>
> {
  const schemas = loadSchemas();
  const categoryHierarchy = new Map<string, Map<string, string[]>>();

  walkSchema(schemas, {
    onSubCategory: (subcategory, subcategoryKey, category, categoryKey) => {
      const categoryName = category.name || categoryKey;
      if (!categoryHierarchy.has(categoryName)) {
        categoryHierarchy.set(categoryName, new Map<string, string[]>());
      }
      const subcategoryMap = categoryHierarchy.get(categoryName)!;

      const subcategoryDisplayName =
        subcategory.name || subcategoryKey.replace(/_/g, " ");

      if (!subcategoryMap.has(subcategoryDisplayName)) {
        subcategoryMap.set(subcategoryDisplayName, []);
      }
    },
    onFeature: (
      feature,
      featureKey,
      subcategory,
      subcategoryKey,
      category,
      categoryKey,
    ) => {
      const categoryName = category.name || categoryKey;
      const subcategoryMap = categoryHierarchy.get(categoryName);
      if (subcategoryMap) {
        const subcategoryDisplayName =
          subcategory.name || subcategoryKey.replace(/_/g, " ");

        const featureList = subcategoryMap.get(subcategoryDisplayName);
        if (featureList) {
          featureList.push(feature.name);
        }
      }
    },
  });

  return categoryHierarchy;
}

/**
 * Creates a map where each category name is a key and the value is a Set of all significant words
 * found in that category's description, subcategories, and features.
 * @returns {Map<string, Set<string>>} A map where keys are category names and values are sets of feature names.
 */
export function getCategoryFeatureMap(
  schemas: Map<string, SchemaFile>,
): Map<string, Set<string>> {
  const categoryFeatureMap = new Map<string, Set<string>>();

  for (const schema of schemas.values()) {
    const categoryKey = Object.keys(schema)[0];
    const category = schema[categoryKey] as Category;
    const categoryName = category.name || categoryKey;

    if (!categoryFeatureMap.has(categoryName)) {
      categoryFeatureMap.set(categoryName, new Set<string>());
    }

    if (category.subcategories && typeof category.subcategories === "object") {
      for (const subcategoryKey in category.subcategories) {
        const subcategory = category.subcategories[
          subcategoryKey
        ] as SubCategory;
        if (subcategory.features && typeof subcategory.features === "object") {
          for (const featureKey in subcategory.features) {
            const feature = subcategory.features[featureKey] as Feature;
            if (feature.name) {
              categoryFeatureMap.get(categoryName)!.add(feature.name);
            }
          }
        }
      }
    }
  }

  return categoryFeatureMap;
}

export function getAllSchemaFiles(): string[] {
  const schemaDir = path.join(process.cwd(), "schema");
  const files = fs.readdirSync(schemaDir);
  return files
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => path.join(schemaDir, file));
}
