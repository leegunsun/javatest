export function findMatchingOpblocks(path, method) {
  const opblocks = document.querySelectorAll(".opblock");
  return Array.from(opblocks).filter((opblock) => {
    const elSummary = opblock.querySelector(".opblock-summary");
    const elPath = elSummary?.querySelector(".opblock-summary-path")?.textContent;
    const elMethod = elSummary?.querySelector(".opblock-summary-method")?.textContent?.toLowerCase();
    return elPath === path && elMethod === method;
  });
}