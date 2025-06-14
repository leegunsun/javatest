import { loadSwagger } from "../../custominit/init.js";

/**
 * 각 노드를 <li>로 렌더링하고 클릭 시 loadSwagger 호출
 */
export function createNode(node) {
  const li = document.createElement("li");
  li.draggable = true;
  li.dataset.group = node.group;

  // 핸들러 + 제목 묶음 컨테이너
  const nodeWrapper = document.createElement("div");
  nodeWrapper.className = "node-wrapper";

  // 타이틀 영역
  const title = document.createElement("span");
  title.className = "node-title";
  title.textContent = node.displayName;

  // 클릭 시 Swagger 문서 로드
  title.addEventListener("click", () => {
    loadSwagger(node.group);
    document
      .querySelectorAll(".sidebar li")
      .forEach((el) => el.classList.remove("active"));
    li.classList.add("active");
    if (node.children.length) li.classList.toggle("open");
  });

  nodeWrapper.appendChild(title);

  li.appendChild(nodeWrapper);

  return li;
}

/**
 * 사이드바(<ul id="api-tree">) 초기화 및 트리 렌더링
 */
export function renderSidebar(tree, container) {
  container.innerHTML = "";
  tree.forEach((node) => container.appendChild(createNode(node)));
}

