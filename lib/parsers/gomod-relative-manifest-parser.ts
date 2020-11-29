const GO_MOD_DELIMITER = ' => ';
const replaceSectionRegex = /replace\W?\(?(.*)\)?/s; // s as regex flag means . will match newlines too
const relativePathRegex = /^\.\.?\//;

export function parseGoModRelativeManifestReplaces(
  goModFileContent?: string,
): string[] {
  const [, replaceSection] = replaceSectionRegex.exec(goModFileContent!) || [];
  if (!replaceSection) {
    return [];
  }

  return replaceSection
    .split('\n') // now we got lines of "ModulePath" => "ModulePath" | "FilePath"
    .map((line) => line.trim().split(GO_MOD_DELIMITER)) // split lines by ' => '
    .filter(([, filePath]) => relativePathRegex.test(filePath))
    .map(([, filePath]) => filePath);
}
