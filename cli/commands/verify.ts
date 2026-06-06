import * as path from "path";
import { getAllCategoryFiles, walkSchema } from "../utils/category";
import {
  FoursquareCategory,
  getFoursquareCategoriesFlat,
} from "../utils/foursquare";

type Issue = {
  file: string;
  message: string;
};

export async function verify() {
  console.log("Verifying category files...");
  const issues: Issue[] = [];

  // Fetch and prepare Foursquare data
  console.log("Fetching Foursquare category data for verification...");
  const fsqCategoriesFlat = await getFoursquareCategoriesFlat();
  const fsqIdMap = new Map<string, FoursquareCategory>(
    fsqCategoriesFlat.map((c) => [c.id, c]),
  );
  console.log("...Foursquare data fetched.");

  const allFiles = getAllCategoryFiles();
  const seenIds = new Map<string, string>(); // Map from ID to file path

  for (const file of allFiles) {
    walkSchema(file, (category, subCategory, context) => {
      const fileName = path.basename(context.filePath);
      const node = subCategory || category;
      const nodeKey = context.subCategoryKey || context.categoryKey;

      // 1. Verify required fields
      if (!node.name) {
        issues.push({
          file: fileName,
          message: `Node '${nodeKey}' is missing a name.`,
        });
      }

      // 2. Verify against Foursquare data if ID exists
      if (node.id) {
        // 2a. Check for local duplicates
        if (seenIds.has(node.id)) {
          const originalFile = seenIds.get(node.id);
          issues.push({
            file: fileName,
            message: `Duplicate ID '${node.id}' on node '${nodeKey}'. First seen in ${originalFile}.`,
          });
        } else {
          seenIds.set(node.id, fileName);
        }

        // 2b. Check against Foursquare
        const fsqMatch = fsqIdMap.get(node.id);
        if (!fsqMatch) {
          issues.push({
            file: fileName,
            message: `ID '${node.id}' for node '${node.name}' not found in Foursquare.`,
          });
        } else if (fsqMatch.name.toLowerCase() !== node.name.toLowerCase()) {
          issues.push({
            file: fileName,
            message: `Name mismatch for ID '${node.id}'. Local: '${node.name}', Foursquare: '${fsqMatch.name}'.`,
          });
        }
      }
    });
  }

  if (issues.length > 0) {
    console.error("\nCategory verification failed. Issues found:");
    issues.forEach((issue) =>
      console.error(`- [${issue.file}] ${issue.message}`),
    );
    throw new Error(`Verification failed with ${issues.length} issues`);
  } else {
    console.log("Category verification successful. All files are valid.");
  }
}
