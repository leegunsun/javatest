let fullTree = [];
let containerRef = null;
let isCollapsed = false;

export function getIsCollapsed() {
  return isCollapsed;
}

export function toggleIsCollapsed() {
  isCollapsed = !isCollapsed;
  return isCollapsed;
}


export function setTreeState(tree, container) {
  fullTree = tree;
  containerRef = container;
}

export function getTreeState() {
  return { fullTree, containerRef };
}
