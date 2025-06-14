import { setApiStatusMap, setApiCreatedDateMap } from "./swaggerApiStatus.js";
import { fetchAll } from "./swaggerInitData.js";
import { buildTree } from "./components/sidebar/builder.js";
import { renderSidebar } from "./components/sidebar/renderer.js";
import { loadSwagger } from "./custominit/init.js";
import "./components/main-view/floating-components/btnRenderer.js"

window.onload = async () => {
  const { statusMap, createdMap, groupedList } = await fetchAll();

  setApiStatusMap(statusMap);
  setApiCreatedDateMap(createdMap);

  const tree = buildTree(groupedList);
  renderSidebar(tree, document.getElementById("api-tree"));

  // window.ui는 loadSwagger 내부에서 세팅되므로, 반환값 없이 호출만!
  loadSwagger(groupedList[0].group);
};
