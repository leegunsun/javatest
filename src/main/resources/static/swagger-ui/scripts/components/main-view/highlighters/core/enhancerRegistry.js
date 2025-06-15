const enhancers = [];

export function registerEnhancer(fn) {
  enhancers.push(fn);
}

export function applyEnhancersToAll(spec) {
  const opblocks = document.querySelectorAll(".opblock");
  opblocks.forEach((opblock) => {
    const ctx = getOpblockContext(opblock, spec);
    if (!ctx) return;
    enhancers.forEach((enhancer) => enhancer(ctx));
  });
}

import { getOpblockContext } from "./opblockProcessor.js";
