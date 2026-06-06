import { getAllCategoryFiles, loadCategoryFile } from "../utils/category";
import * as path from "path";

function printNode(node: any, level: number, maxDepth: number) {
  if (level >= maxDepth) {
    return;
  }
  const indent = "  ".repeat(level);
  console.log(`${indent}- ${node.name}`);

  if (node.subcategories) {
    for (const key in node.subcategories) {
      printNode(node.subcategories[key], level + 1, maxDepth);
    }
  }
}

export function print(opts: { depth: string }) {
  const maxDepth = parseInt(opts.depth, 10);
  const allFiles = getAllCategoryFiles();

  for (const file of allFiles) {
    console.log(`\n--- ${path.basename(file)} ---`);
    const categoryData = loadCategoryFile(path.basename(file));

    if (categoryData) {
      for (const key in categoryData) {
        printNode(categoryData[key], 0, maxDepth);
      }
    }
  }
}
