import { setApiStatusMap, setApiCreatedDateMap } from './state.js';
import { fetchAll }      from './dataService.js';
import { buildTree, renderSidebar } from './treeModule.js';
import { loadSwagger }   from './swaggerInit.js';
import './observerService.js';
import './uiControls.js';

window.onload = async () => {
  const { statusMap, createdMap, groupedList } = await fetchAll();

  setApiStatusMap(statusMap);
  setApiCreatedDateMap(createdMap);

  const tree = buildTree(groupedList);
  renderSidebar(tree, document.getElementById('api-tree'));

  // window.ui는 loadSwagger 내부에서 세팅되므로, 반환값 없이 호출만!
  loadSwagger(groupedList[0].group);
};
