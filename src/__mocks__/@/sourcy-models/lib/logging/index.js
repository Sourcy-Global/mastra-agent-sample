export function logQueryError(source, functionName, error) {
  console.error(`[${source}:${functionName}] ${error}`);
}