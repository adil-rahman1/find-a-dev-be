import path from "path";

/**
 * A helper function to find the absolute path to a desired file from a relative path.
 * @param relativePath - the relative path
 * @returns string
 */
const filePath = (relativePath: string): string =>
  path.join(__dirname, relativePath);

export default filePath;
