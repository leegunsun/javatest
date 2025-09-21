import { loadSwagger, rawSpec, convertSpec } from "./swaggerInit.js";
import { setApiStatusMap, setApiCreatedDateMap } from "./state.js";

let draggedNodeEl = null;
let draggedGroup = null;
let fullTree = [];
let containerRef = null;

export function setTreeState(tree, container) {
  fullTree = tree;
  containerRef = container;
}

export function getTreeState() {
  return { fullTree, containerRef };
}

export function applyCustomTreeOrder(tree) {
  const savedOrder = JSON.parse(localStorage.getItem("apiTreeOrder") || "[]");

  // 루트 노드 기준으로만 정렬 (자식 노드는 별도 처리 필요)
  return tree.sort((a, b) => {
    const idxA = savedOrder.indexOf(a.group);
    const idxB = savedOrder.indexOf(b.group);

    if (idxA === -1 && idxB === -1) return 0;
    if (idxA === -1) return 1;
    if (idxB === -1) return -1;
    return idxA - idxB;
  });
}

function onDragStart(event) {
  draggedNodeEl = event.currentTarget;
  draggedGroup = draggedNodeEl.dataset.group;
  draggedNodeEl.classList.add("dragging");
  event.dataTransfer.setData("text/plain", draggedGroup);
}

function onDragOver(event) {
  event.preventDefault();
  const target = event.currentTarget;
  if (!target.classList.contains("drag-over")) {
    target.classList.add("drag-over");
  }
}

function onDrop(event) {
  event.preventDefault();
  const targetEl = event.currentTarget;
  const targetGroup = targetEl.dataset.group;

  // 정리
  document
    .querySelectorAll(".drag-over")
    .forEach((el) => el.classList.remove("drag-over"));
  if (draggedNodeEl) draggedNodeEl.classList.remove("dragging");

  if (!draggedGroup || draggedGroup === targetGroup) return;

  const nodeToMove = removeNodeFromTree(fullTree, draggedGroup);
  if (!nodeToMove) return;

  const insertToSameLevel = insertNodeBefore(fullTree, targetGroup, nodeToMove);
  if (!insertToSameLevel) {
    // fallback: append as root (should not happen unless invalid drop)
    fullTree.push(nodeToMove);
  }

  persistTree(fullTree);
  renderSidebar(fullTree, containerRef);
}

function insertNodeBefore(tree, targetGroup, nodeToInsert) {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];

    if (node.group === targetGroup) {
      tree.splice(i, 0, nodeToInsert);
      return true;
    }

    if (node.children?.length) {
      const inserted = insertNodeBefore(
        node.children,
        targetGroup,
        nodeToInsert
      );
      if (inserted) return true;
    }
  }
  return false;
}

function onDragLeave(event) {
  event.currentTarget.classList.remove("drag-over");
}

function persistTree(tree) {
  localStorage.setItem("apiTreeStructure", JSON.stringify(tree));
}

export function loadTreeFromStorage() {
  const raw = localStorage.getItem("apiTreeStructure");
  return raw ? JSON.parse(raw) : null;
}

function removeNodeFromTree(tree, group) {
  for (let i = 0; i < tree.length; i++) {
    const node = tree[i];
    if (node.group === group) {
      return tree.splice(i, 1)[0];
    }
    if (node.children?.length) {
      const result = removeNodeFromTree(node.children, group);
      if (result) return result;
    }
  }
  return null;
}

/**
 * groupedList를 트리 구조로 변환
 */
export function buildTree(list) {
  const map = {};
  const roots = [];

  list.forEach((item) => {
    map[item.group] = { ...item, children: [] };
  });

  list.forEach((item) => {
    const idx = item.group.lastIndexOf(".");
    if (idx > -1) {
      const parentKey = item.group.substring(0, idx);
      map[parentKey]?.children.push(map[item.group]);
    } else {
      roots.push(map[item.group]);
    }
  });

  return roots;
}


const findTestLi = document.querySelector(
"#custom-api-tree > #custom-api-tree-main-test"
);

findTestLi.addEventListener("click", () => {
loadSwagger();
});


/**
 * 각 노드를 <li>로 렌더링하고 클릭 시 loadSwagger 호출
 */
function createNode(node) {

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

// const apiTagList = document.querySelector(".modal-left#category-list");
// const vegetable = document.querySelector(".selectCategory#vegetable");

// apiTagList.addEventListener("click", () => {
//   selectCategory("어드민>운영관리>우리샵 가맹점");
// })

// vegetable.addEventListener("click", () => {
//   selectCategory("어드민 회원관리 주문내역");
// })


////

const disabledSubcategories = new Set();
/**
 * 
 * API를 커스텀 할 수 있는 모달의 좌, 우의 UI데이터를 만듭니다.
 * 
 * @param {*} rootTagName 
 */
export function selectCategory(selectedRootTagName) {
  const tagContainer = document.querySelector(".modal-left#category-list");
  tagContainer.innerHTML = "";

  const subContainer = document.getElementById("subcategory-list");
  subContainer.innerHTML = "";

  const uniqueRootTags = [...new Set(rawSpec.map(e => e.rootTagName))];

  uniqueRootTags.forEach(rootTagName => {
    const tagItem = document.createElement("div");
    tagItem.textContent = rootTagName;
    tagItem.dataset.rootTagName = rootTagName;
    tagItem.classList.add("selectCategory");

    Object.assign(tagItem.style, {
      cursor: "pointer",
//      whiteSpace: "nowrap",
//      overflow: "hidden",
//      textOverflow: "ellipsis"
    });

    tagItem.onclick = () => {
      selectSingleCategory(rootTagName);
      const subItems = rawSpec.filter(e => e.rootTagName === rootTagName);
      subContainer.innerHTML = "";

      subItems.forEach(item => {
        const subItem = document.createElement("div");
        subItem.textContent = item.subPath;
        subItem.classList.add("subcategory-item");
        subItem.style.cursor = "pointer";
//        subItem.style.whiteSpace = 'nowrap';
//        subItem.style.overflow = 'hidden';
//        subItem.style.textOverflow = 'ellipsis';

          // ✅ 클릭 이벤트는 무조건 부여
          subItem.onclick = () => addToSelection(item, subItem);

          // ✅ UI 스타일은 선택 여부에 따라 적용
          if (disabledSubcategories.has(item.subTagName)) {
            subItem.classList.add("subcategory-disabled");
          }

        subContainer.appendChild(subItem);
      });
    };

    tagContainer.appendChild(tagItem);
  });

  // 자동 초기 선택
  if (selectedRootTagName) {
    const first = [...tagContainer.children].find(el => el.dataset.rootTagName === selectedRootTagName);
    if (first) first.click();
  }
}

function selectSingleCategory(id) {
  const allCategories = document.querySelectorAll('.modal-left#category-list > div');

  allCategories.forEach(el => {
    if (el.dataset.rootTagName === id) {
      el.classList.add('selectCategory-disabled');
    } else {
      el.classList.remove('selectCategory-disabled');
    }
  });
}



export function addToSelection(item, domElement = null) {
  const container = document.getElementById("selected-subcategories");
    const existing = document.getElementById(item.subTagName);

    // 🔁 이미 선택된 항목이면 → 해제
    if (existing) {
      const rootGroup = document.getElementById(item.rootTagName);
      rootGroup.removeChild(existing);

      const index = convertSpec.findIndex(el => el.subTagName === item.subTagName);
      if (index !== -1) convertSpec.splice(index, 1);

      if (rootGroup.querySelectorAll(".custom_side_bar-subcategory").length === 0) {
        container.removeChild(rootGroup);
      }

      disabledSubcategories.delete(item.subTagName);

      if (domElement) {
        domElement.classList.remove("subcategory-disabled");
      }

      return;
    }

    // ✅ 아직 선택되지 않은 항목이면 → 추가
    let rootGroup = document.getElementById(item.rootTagName);
    if (!rootGroup) {
      rootGroup = document.createElement("div");
      rootGroup.id = item.rootTagName;
      rootGroup.classList.add("custom_side_bar-root-group");

      const containerTop = document.createElement("div");
      containerTop.classList.add("custom_side_bar-root-group-top");

      const title = document.createElement("h4");
      title.textContent = `📁 ${item.rootTagName}`;
      title.classList.add("custom_side_bar-root-group-title");

      containerTop.appendChild(title);
      rootGroup.appendChild(containerTop);
      container.appendChild(rootGroup);
    }

    const newItem = document.createElement("div");
    newItem.classList.add("custom_side_bar-subcategory");
    newItem.id = item.subTagName;

    const subText = document.createElement("span");
    subText.textContent = item.subPath;

    const subDelBtn = document.createElement("span");
    subDelBtn.classList.add("material-symbols-outlined", "custom_sub-delete-button");
    subDelBtn.textContent = "close";

    // ❌ 개별 삭제 버튼 동작
    subDelBtn.addEventListener("click", () => {
      rootGroup.removeChild(newItem);

      const index = convertSpec.findIndex(el => el.subTagName === item.subTagName);
      if (index !== -1) convertSpec.splice(index, 1);

      if (rootGroup.querySelectorAll(".custom_side_bar-subcategory").length === 0) {
        container.removeChild(rootGroup);
      }

      disabledSubcategories.delete(item.subTagName);
      if (domElement) {
        domElement.classList.remove("subcategory-disabled");
      }
    });

    newItem.appendChild(subText);
    newItem.appendChild(subDelBtn);
    rootGroup.appendChild(newItem);

    convertSpec.push(item);
    disabledSubcategories.add(item.subTagName);

    if (domElement) {
      domElement.classList.add("subcategory-disabled");
    }

    container.scrollTop = container.scrollHeight;
}





export function setSideBar(statusMap, createdMap, groupedList) {
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
}

