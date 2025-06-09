import { setApiStatusMap, setApiCreatedDateMap } from "./state.js";
import { fetchAll } from "./dataService.js";
import {
  buildTree,
  renderSidebar,
  applyCustomTreeOrder,
  loadTreeFromStorage,
  setTreeState,
  getTreeState,
} from "./treeModule.js";
import { loadSwagger } from "./swaggerInit.js";
import "./observerService.js";
import "./uiControls.js";

let name = "모듈";

window.onload = async () => {
  const { statusMap, createdMap, groupedList } = await fetchAll();

  setApiStatusMap(statusMap);
  setApiCreatedDateMap(createdMap);

  const savedTree = loadTreeFromStorage();
  const container = document.getElementById("api-tree");

  if (savedTree) {
    setTreeState(savedTree, container);
    renderSidebar(savedTree, container);
  } else {
    const tree = buildTree(groupedList);
    const sorted = applyCustomTreeOrder(tree);
    setTreeState(sorted, container);
    renderSidebar(sorted, container);
  }

  // window.ui는 loadSwagger 내부에서 세팅되므로, 반환값 없이 호출만!
  loadSwagger(groupedList[0].group);
};
