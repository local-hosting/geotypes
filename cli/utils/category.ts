import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";

// --- Type Definitions ---
export interface SubCategory {
  id?: string;
  name: string;
  subcategories?: { [key: string]: SubCategory };
}

export interface Category {
  id?: string;
  name: string;
  subcategories?: { [key: string]: SubCategory };
}

export interface SchemaFile {
    [categoryKey: string]: Category;
}

export type WalkSchemaCallback = (
  category: any,
  subCategory: any | undefined,
  context: {
    filePath: string;
    categoryKey: string;
    subCategoryKey?: string;
  },
) => void;

export function walkSchema(filePath: string, callback: WalkSchemaCallback) {
  const schemaData = loadCategoryFile(path.basename(filePath));

  if (!schemaData) {
    console.warn(`Could not load schema file: ${filePath}`);
    return;
  }

  for (const categoryKey in schemaData) {
    const category = schemaData[categoryKey];
    const context = { filePath, categoryKey };

    callback(category, undefined, context);

    if (category.subcategories) {
      walkSubcategories(category, category.subcategories, callback, context);
                }
            }
}

function walkSubcategories(
  category: any,
  subcategories: any,
  callback: WalkSchemaCallback,
  context: any,
) {
  for (const subCategoryKey in subcategories) {
    const subCategory = subcategories[subCategoryKey];
    const newContext = { ...context, subCategoryKey };

    callback(category, subCategory, newContext);

    if (subCategory.subcategories) {
      walkSubcategories(
        category,
        subCategory.subcategories,
        callback,
        newContext,
      );
        }
  }
}

export function buildCategoryToSubCategoryMap(): Map<string, Set<string>> {
  const categoryMap = new Map<string, Set<string>>();
  const allFiles = getAllCategoryFiles();

  for (const file of allFiles) {
    walkSchema(file, (category, subCategory) => {
      if (category && category.name) {
        if (!categoryMap.has(category.name)) {
          categoryMap.set(category.name, new Set<string>());
            }
      }
      if (subCategory && subCategory.name) {
        categoryMap.get(category.name)?.add(subCategory.name);
        }
    });
  }

  return categoryMap;
}

export function getFlatSubCategoryList(): { id: string, name: string, parent: string }[] {
    const subCategoryList: { id: string, name: string, parent: string }[] = [];
    const allFiles = getAllCategoryFiles();

    for (const file of allFiles) {
        walkSchema(file, (category, subCategory) => {
            if (subCategory && subCategory.id && subCategory.name && category && category.name) {
                subCategoryList.push({
                    id: subCategory.id,
                    name: subCategory.name,
                    parent: category.name,
                });
            }
        });
    }
    return subCategoryList;
}

export function loadCategoryFile(fileName: string): Record<string, any> | null {
  const filePath = path.join(process.cwd(), "data", "category", fileName);
  if (fs.existsSync(filePath)) {
    const fileContent = fs.readFileSync(filePath, "utf8");
    return yaml.load(fileContent) as Record<string, any>;
  }
  return null;
}

export function getAllCategoryFiles(): string[] {
  const categoryDir = path.join(process.cwd(), "data", "category");
  const files = fs.readdirSync(categoryDir);
  return files
    .filter((file) => file.endsWith(".yml") || file.endsWith(".yaml"))
    .map((file) => path.join(categoryDir, file));
}
