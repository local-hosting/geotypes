import axios from "axios";

// --- Foursquare V2 API Configuration ---
const FOURSQUARE_CLIENT_ID = process.env.FOURSQUARE_CLIENT_ID;
const FOURSQUARE_CLIENT_SECRET = process.env.FOURSQUARE_CLIENT_SECRET;
const FOURSQUARE_API_URL = "https://api.foursquare.com/v2/venues/categories";
const API_VERSION = "20240101"; // Foursquare requires a version parameter

export interface FoursquareCategory {
  id: string;
  name: string;
  pluralName: string;
  shortName: string;
  categories: FoursquareCategory[];
}

/**
 * Recursively extracts all category names from the Foursquare hierarchy.
 * @param {FoursquareCategory[]} categories - The array of categories to parse.
 * @param {Set<string>} allNames - The set to store the extracted names.
 */
function extractCategoryNames(
  categories: FoursquareCategory[],
  allNames: Set<string>,
) {
  for (const category of categories) {
    allNames.add(category.name.toLowerCase());
    if (category.categories && category.categories.length > 0) {
      extractCategoryNames(category.categories, allNames);
    }
  }
}

/**
 * Fetches the raw Foursquare category hierarchy from the v2 API.
 * @returns {Promise<FoursquareCategory[]>} A promise that resolves to the raw array of categories.
 */
export async function fetchFoursquareCategoryHierarchy(): Promise<
  FoursquareCategory[]
> {
  const apiKey = getFoursquareApiKey();
  if (!FOURSQUARE_CLIENT_ID || !FOURSQUARE_CLIENT_SECRET) {
    throw new Error(
      "Foursquare v2 credentials (CLIENT_ID, CLIENT_SECRET) are missing. Please check your .env file.",
    );
  }
  console.log("Fetching full Foursquare category hierarchy from the v2 API...");
  try {
    const { data } = await axios.get(FOURSQUARE_API_URL, {
      params: {
        client_id: FOURSQUARE_CLIENT_ID,
        client_secret: FOURSQUARE_CLIENT_SECRET,
        v: API_VERSION,
      },
    });
    if (!data.response || !data.response.categories) {
      throw new Error("Invalid response structure from Foursquare v2 API.");
    }
    return data.response.categories;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const responseData = JSON.stringify(error.response?.data, null, 2);
      console.error(
        `API Error: Received status code ${status}\nResponse: ${responseData}`,
      );
    } else {
      console.error("An unexpected error occurred:", error);
    }
    return []; // Return an empty array on failure
  }
}

/**
 * Fetches the full Foursquare category hierarchy from the v2 API and flattens it into a set of names.
 * @returns {Promise<Set<string>>} A set of all Foursquare category names.
 */
export async function fetchFoursquareCategories(): Promise<Set<string>> {
  const hierarchy = await fetchFoursquareCategoryHierarchy();
  if (hierarchy.length === 0) {
    console.log("Could not fetch category hierarchy.");
    return new Set<string>();
  }

  const allNames = new Set<string>();
  extractCategoryNames(hierarchy, allNames);

  console.log(
    `\nSuccessfully fetched and parsed ${allNames.size} unique Foursquare categories.`,
  );
  return allNames;
}

export async function findSimilarCategories(
  localHierarchy: Map<string, Map<string, string[]>>,
): Promise<Map<string, string>> {
  const fsqHierarchy = await fetchFoursquareCategoryHierarchy();
  const suggestions = new Map<string, string>();

  const fsqCategories = new Set<string>();
  fsqHierarchy.forEach((cat) => {
    fsqCategories.add(cat.name);
    cat.categories.forEach((sub) => fsqCategories.add(sub.name));
  });

  for (const localCategory of localHierarchy.keys()) {
    let bestMatch: { name: string; score: number } | null = null;
    for (const fsqCategory of fsqCategories) {
      const score = similarity(localCategory, fsqCategory);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { name: fsqCategory, score: score };
      }
    }
    if (bestMatch && bestMatch.score > 0.5) {
      // Threshold
      suggestions.set(localCategory, bestMatch.name);
    }
  }

  return suggestions;
}

export async function findSimilarFoursquareFeatures(
  localFeatures: Set<string>,
  threshold: number,
): Promise<{ name: string; similarity: number }[]> {
  const allFsqNames = await getAllFoursquareCategoryNames();
  const similarFeatures: { name: string; similarity: number }[] = [];

  for (const fsqName of allFsqNames) {
    let bestMatch: { name: string; score: number } | null = null;
    for (const localFeature of localFeatures) {
      const score = similarity(fsqName, localFeature);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { name: localFeature, score };
      }
    }
    if (bestMatch && bestMatch.score > threshold) {
      similarFeatures.push({ name: fsqName, similarity: bestMatch.score });
    }
  }

  return similarFeatures.sort((a, b) => b.similarity - a.similarity);
}

// A simple string similarity function (Jaro-Winkler)
function similarity(s1: string, s2: string): number {
  let m = 0;
  const range = Math.floor(Math.max(s1.length, s2.length) / 2) - 1;
  const s1Matches = new Array(s1.length).fill(false);
  const s2Matches = new Array(s2.length).fill(false);

  for (let i = 0; i < s1.length; i++) {
    const start = Math.max(0, i - range);
    const end = Math.min(i + range + 1, s2.length);
    for (let j = start; j < end; j++) {
      if (!s2Matches[j] && s1[i] === s2[j]) {
        s1Matches[i] = true;
        s2Matches[j] = true;
        m++;
        break;
      }
    }
  }

  if (m === 0) return 0;

  let t = 0;
  let k = 0;
  for (let i = 0; i < s1.length; i++) {
    if (s1Matches[i]) {
      while (!s2Matches[k]) k++;
      if (s1[i] !== s2[k]) t++;
      k++;
    }
  }

  const jaro = (m / s1.length + m / s2.length + (m - t / 2) / m) / 3;
  const p = 0.1;
  let l = 0;
  if (jaro > 0.7) {
    while (s1[l] === s2[l] && l < 4) l++;
  }

  return jaro + l * p * (1 - jaro);
}

function flattenFoursquareHierarchy(
  categories: FoursquareCategory[],
): FoursquareCategory[] {
  let flat: FoursquareCategory[] = [];
  for (const category of categories) {
    const { categories: children, ...rest } = category;
    flat.push(rest as FoursquareCategory);
    if (children && children.length > 0) {
      flat = flat.concat(flattenFoursquareHierarchy(children));
    }
  }
  return flat;
}

export async function getFoursquareCategoriesFlat(): Promise<
  FoursquareCategory[]
> {
  const hierarchy = await fetchFoursquareCategoryHierarchy();
  return flattenFoursquareHierarchy(hierarchy);
}

export async function getAllFoursquareCategoryNames(): Promise<Set<string>> {
  const hierarchy = await fetchFoursquareCategoryHierarchy();
  const names = new Set<string>();

  function recurse(categories: FoursquareCategory[]) {
    for (const category of categories) {
      names.add(category.name);
      if (category.categories?.length > 0) {
        recurse(category.categories);
      }
    }
  }

  recurse(hierarchy);
  return names;
}

export function getFoursquareApiKey(): string {
  const apiKey = process.env.FOURSQUARE_API_KEY;
  if (!apiKey) {
    throw new Error("FOURSQUARE_API_KEY environment variable is not set.");
  }
  return apiKey;
}
