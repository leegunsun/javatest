export function getOpblockContext(opblock, spec) {
  const elSummary = opblock.querySelector(".opblock-summary");
  const elPath = elSummary?.querySelector(".opblock-summary-path");
  const elMethod = elSummary?.querySelector(".opblock-summary-method");
  const elDescWrapper = elSummary?.querySelector(".opblock-summary-description");

  if (!elPath || !elMethod) return null;

  const path = elPath.textContent;
  const method = elMethod.textContent.toLowerCase();
  const key = `${method.toUpperCase()} ${path}`;
  const operation = spec.paths?.[path]?.[method];
  if (!operation) return null;

  const text = `${operation.summary || ""} ${operation.description || ""}`;
  const usedPath = path.split("/");

  const setData = {
    rootTagName: operation.tags?.[0],
    subTagName: operation.operationId + usedPath[2],
    method,
    rootPath: usedPath[2],
    subPath: usedPath[3],
  };

  return {
    opblock,
    elSummary,
    elDescWrapper,
    path,
    method,
    key,
    operation,
    text,
    setData,
  };
}
