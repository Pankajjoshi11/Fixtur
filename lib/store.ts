// Shared in-memory store for backend
declare global {
  var activeMatchesStore: Map<string, any> | undefined;
  var fullMatchStates: Map<string, any> | undefined;
}

const activeMatches = global.activeMatchesStore || new Map<string, any>();
const matchStates = global.fullMatchStates || new Map<string, any>();

if (process.env.NODE_ENV !== 'production') {
  global.activeMatchesStore = activeMatches;
  global.fullMatchStates = matchStates;
}

export { activeMatches, matchStates };
