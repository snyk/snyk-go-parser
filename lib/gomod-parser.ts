import { InvalidUserInputError } from './errors';
import {
  GoMod,
  ModuleAndVersion,
  Require,
  ModulePseudoVersion,
  ModuleExactVersion,
  ModuleVersion,
  ModuleAndMaybeVersion,
} from './types';

// go.mod file format:
// https://tip.golang.org/cmd/go/#hdr-The_go_mod_file

// See https://tip.golang.org/cmd/go/#hdr-Pseudo_versions
// Subgroups: baseVersion, suffix, timestamp, hash
const rePseudoVersion = /(v\d+\.\d+\.\d+)-(.*?)(\d{14})-([0-9a-f]{12})/;
const reIndirect = /\/\/ indirect/;
const reExactVersion = /^(.*?)(\+incompatible)?$/;

type Verb = 'module' | 'go' | 'require' | 'exclude'| 'replace';

const reStatementWord = /^(module|go|require|replace|exclude) (\(?)/;

const reLineWithComments = /^(.*?)(\/\/.*)?$/;

function parseModuleAndMaybeVersion(lineRemainder: string): ModuleAndMaybeVersion {
  const [moduleName, versionString] = lineRemainder.trim().split(' ');
  if (!versionString) {
    return {moduleName};
  }
  return {moduleName, version: parseVersion(versionString)};
}

function parseModuleAndVersion(lineRemainder: string): ModuleAndVersion {
  const [moduleName, versionString] = lineRemainder.trim().split(' ');
  if (!moduleName || !versionString) {
    throw new Error(`could not split "${lineRemainder}" into moduleName and version`);
  }
  return {moduleName, version: parseVersion(versionString)};
}

function parseVersion(versionString: string): ModuleVersion {
  const maybeRegexMatch = rePseudoVersion.exec(versionString);
  if (maybeRegexMatch) {
    const [baseVersion, suffix, timestamp, hash] = maybeRegexMatch.slice(1);
    return {baseVersion, suffix, timestamp, hash};
  } else {
    // No pseudo version recognized, assuming the provided version string is exact
    const [exactVersion, incompatibleStr] = reExactVersion.exec(versionString)!.slice(1);
    return {exactVersion, incompatible: !!incompatibleStr};
  }
}

interface ParserState {
  inMultilineDirective: boolean;
  currentVerb: Verb | null;
}

// Takes the current parser state and an input line;
// returns the new parser state and the line remainder to be processed
// according to the current directive (verb).
function updateParserState(line: string, state: ParserState): ParserState & {lineRemainder: string | null} {
  if (!state.inMultilineDirective) {
    const maybeStatement = reStatementWord.exec(line);
    if (maybeStatement) {
      const currentVerb = maybeStatement[1] as Verb;
      const inMultilineDirective = !!maybeStatement[2]; // whether we found "("
      if (inMultilineDirective) {
        return {inMultilineDirective, currentVerb, lineRemainder: null};
      } else {
        return {inMultilineDirective, currentVerb,
          lineRemainder: line.substr(currentVerb.length + 1).trim()};
      }
    } else {
      const lineNoComment = reLineWithComments.exec(line)![1].trim();
      if (lineNoComment) {
        throw new Error('Unrecognized statement: ' + line);
      }
      return {inMultilineDirective: false, currentVerb: null, lineRemainder: null};
    }
  } else if (line === ')') {
    return {inMultilineDirective: false, currentVerb: null, lineRemainder: null};
  } else {
    return {inMultilineDirective: true, currentVerb: state.currentVerb, lineRemainder: line};
  }
}

function processLineForDirective(verb: Verb, lineRemainder: string, res: GoMod, lineNumber: number) {
  try {
    switch (verb) {
    case 'module':
      res.moduleName = lineRemainder;
      break;
    case 'go':
      res.golangVersion = lineRemainder;
      break;
    case 'require':
      const req = parseModuleAndVersion(lineRemainder) as Require;
      req.indirect = reIndirect.test(lineRemainder);
      res.requires.push(req);
      break;
    case 'exclude':
      res.excludes.push(parseModuleAndVersion(lineRemainder));
      break;
    case 'replace':
      const [oldMod, newMod] = lineRemainder.split('=>');
      if (!oldMod || !newMod) {
        throw new Error('could not split the line in two on "=>"');
      }
      res.replaces.push({
        oldMod: parseModuleAndMaybeVersion(oldMod),
        newMod: parseModuleAndMaybeVersion(newMod),
      });
      break;
    default:
      throw new Error(`Attempting to process unknown verb: ${verb}, line remainder: ${lineRemainder}`);
    }
  } catch (e) {
    throw new InvalidUserInputError(
      `Could not parse line ${lineNumber} as ${verb} directive:
${lineRemainder}
because of error: ${e}`);
  }
}

export function parseGoMod(goModStr: string): GoMod {
  try {
    const lines = goModStr.split('\n');

    const res: GoMod = {
      moduleName: '',
      requires: [],
      replaces: [],
      excludes: [],
    };

    let state: ParserState = {inMultilineDirective: false, currentVerb: null};

    let i = 0;
    for (let line of lines) {
      i++;
      line = line.trim();

      const stateAndRemainder = updateParserState(line, state);
      state = stateAndRemainder;

      if (stateAndRemainder.lineRemainder) {
        processLineForDirective(state.currentVerb!, stateAndRemainder.lineRemainder, res, i);
      }

    }

    if (!res.moduleName) {
      throw new InvalidUserInputError('No module name specified in go.mod file');
    }

    return res;
  } catch (e) {
    if (e.name === 'InvalidUserInputError') {
      throw e;
    } else {
      throw new InvalidUserInputError('go.mod parsing failed with error: ' + e.message);
    }
  }
}

export function toSnykVersion(v: ModuleVersion): string {
  const hash = (v as ModulePseudoVersion).hash;
  if (hash) {
    return '#' + hash;
  } else {
    return (v as ModuleExactVersion).exactVersion;
  }
}
