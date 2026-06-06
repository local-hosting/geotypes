import * as fs from "fs";
import * as path from "path";
import * as yaml from "js-yaml";
import {
  fetchFoursquareCategoryHierarchy,
  FoursquareCategory,
} from "../utils/foursquare";
import { getAllCategoryFiles, loadCategoryFile } from "../utils/category";

/**
 * Recursively traverses the local category tree and the Foursquare category tree,
 * updating missing IDs on local nodes. It can handle custom intermediate nodes
 * in the local tree that don't exist in the Foursquare hierarchy.
 *
 * @param localNode - The current node in the local category structure.
 * @param fsqCategories - The list of Foursquare categories to search for a match.
 * @returns {boolean} - True if any IDs were updated, otherwise false.
 */
function updateMissingIds(
  localNode: any,
  fsqCategories: FoursquareCategory[],
): boolean {
  let changed = false;

  // Find a Foursquare category that matches the current local node by name.
  const fsqMatch = fsqCategories.find(
    (c) => c.name.toLowerCase() === localNode.name.toLowerCase(),
  );

  if (fsqMatch) {
    // Match found. Update the local ID if it's missing.
    if (!localNode.id && fsqMatch.id) {
      console.log(`  - Found and added ID for "${localNode.name}"`);
      localNode.id = fsqMatch.id;
      changed = true;
    }

    // Now, process the children. The subcategories of the local node should be
    // matched against the subcategories of the matched Foursquare node.
    if (localNode.subcategories && fsqMatch.categories) {
      for (const key in localNode.subcategories) {
        const localChild = localNode.subcategories[key];
        if (updateMissingIds(localChild, fsqMatch.categories)) {
          changed = true;
        }
      }
    }
  } else {
    // No match found for the current local node at this level.
    // This means it's a custom grouping node (e.g., "Entertainment Venues").
    // Its children should be matched against the *same* list of Foursquare categories.
    if (localNode.subcategories) {
      for (const key in localNode.subcategories) {
        const localChild = localNode.subcategories[key];
        if (updateMissingIds(localChild, fsqCategories)) {
          changed = true;
        }
      }
    }
  }

  return changed;
}

export async function populate() {
  console.log("Checking for and populating missing Foursquare IDs...");

  const fsqHierarchy = await fetchFoursquareCategoryHierarchy();
  const localFiles = getAllCategoryFiles();
  let totalFilesChanged = 0;

  for (const filePath of localFiles) {
    const categoryData = loadCategoryFile(path.basename(filePath));
    if (!categoryData) continue;

    const categoryKey = Object.keys(categoryData)[0];
    const rootCategory = categoryData[categoryKey];

    console.log(`\nProcessing ${path.basename(filePath)}...`);
    if (updateMissingIds(rootCategory, fsqHierarchy)) {
      console.log(`+ Updating IDs in ${path.basename(filePath)}`);
      fs.writeFileSync(
        filePath,
        yaml.dump(categoryData, {
          indent: 2,
          noArrayIndent: true,
          lineWidth: -1,
        }),
        "utf8",
      );
      totalFilesChanged++;
    } else {
      console.log("  No missing IDs found.");
    }
  }

  if (totalFilesChanged > 0) {
    console.log(`\nPopulation complete. ${totalFilesChanged} file(s) updated.`);
  } else {
    console.log("\nAll files are already up-to-date.");
  }
}
