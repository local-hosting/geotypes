#!/usr/bin/env node

import { Command } from "commander";
import { generateTagsEnum } from "./commands/generate-tags-enum";
import { verify } from "./commands/verify";
import { print } from "./commands/print";
import { populate } from "./commands/populate";

const program = new Command();

program
  .name("category")
  .description("Category and taxonomy management commands")
  .version("1.0.0");

// Generate tags enum from category files
program
  .command("generate-tags-enum")
  .description("Generate TypeScript enum from category files")
  .action(async () => {
    try {
      await generateTagsEnum();
    } catch (error) {
      console.error("Error generating tags enum:", error);
      process.exit(1);
    }
  });

// Verify category files
program
  .command("verify")
  .description("Verify category files against Foursquare data")
  .action(async () => {
    try {
      await verify();
    } catch (error) {
      console.error("Error verifying categories:", error);
      process.exit(1);
    }
  });

// Print taxonomy hierarchy
program
  .command("print")
  .description("Print category taxonomy hierarchy")
  .option("-d, --depth <number>", "Maximum depth to print", "3")
  .action((options) => {
    try {
      print(options);
    } catch (error) {
      console.error("Error printing taxonomy:", error);
      process.exit(1);
    }
  });

// Populate missing Foursquare IDs
program
  .command("populate")
  .description("Populate missing Foursquare IDs in category files")
  .action(async () => {
    try {
      await populate();
    } catch (error) {
      console.error("Error populating IDs:", error);
      process.exit(1);
    }
  });

program.parse(); 
