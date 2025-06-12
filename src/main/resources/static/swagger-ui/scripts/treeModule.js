import { loadSwagger, rawSpec, convertSpec, loadSwagger2 } from "./swaggerInit.js";

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

function findNodeByGroup(tree, group) {
  for (const node of tree) {
    if (node.group === group) return node;
    if (node.children?.length) {
      const found = findNodeByGroup(node.children, group);
      if (found) return found;
    }
  }
  return null;
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

function testCreateNode() {
  const findTestLi = document.querySelector(
    "#custom-api-tree > #custom-api-tree-main-test"
  );

  findTestLi.addEventListener("click", () => {
    loadSwagger2();
  });
}

/**
 * 각 노드를 <li>로 렌더링하고 클릭 시 loadSwagger 호출
 */
function createNode(node) {
  testCreateNode();

  const li = document.createElement("li");
  li.draggable = true;
  li.dataset.group = node.group;

  // 핸들러 + 제목 묶음 컨테이너
  const nodeWrapper = document.createElement("div");
  nodeWrapper.className = "node-wrapper";

  // 핸들러 아이콘
  const handlerIcon = document.createElement("span");
  handlerIcon.className = "node-drag-handler";
  handlerIcon.title = "드래그로 위치 변경";
  handlerIcon.innerText = "⋮⋮"; // or you can use '⠿', '≡', '⋮⋮'

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
  nodeWrapper.appendChild(handlerIcon);

  li.appendChild(nodeWrapper);

  // 자식 노드 처리
  if (node.children.length) {
    const ul = document.createElement("ul");
    ul.className = "children";
    node.children.forEach((child) => ul.appendChild(createNode(child)));
    li.appendChild(ul);
  }

  // 드래그 앤 드롭 이벤트 연결
  li.addEventListener("dragstart", onDragStart);
  li.addEventListener("dragover", onDragOver);
  li.addEventListener("drop", onDrop);
  li.addEventListener("dragleave", onDragLeave);

  return li;
}

/**
 * 사이드바(<ul id="api-tree">) 초기화 및 트리 렌더링
 */
export function renderSidebar(tree, container) {
  container.innerHTML = "";
  tree.forEach((node) => container.appendChild(createNode(node)));
}

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
      whiteSpace: "nowrap",
      overflow: "hidden",
      textOverflow: "ellipsis"
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
        subItem.style.whiteSpace = 'nowrap';
        subItem.style.overflow = 'hidden';
        subItem.style.textOverflow = 'ellipsis';

        // ✅ 선택된 항목이면 UI만 비활성화
        if (disabledSubcategories.has(item.subTagName)) {
          subItem.classList.add("subcategory-disabled");
        } else {
          subItem.onclick = () => addToSelection(item, subItem);
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


/**
 * 선택된 루트 카테고리 외 나머지를 비활성화 해제
 * @param {string} id - 선택된 rootTagName
 */
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
const disabledSubcategories = new Set();

/**
 * 서브카테고리를 선택 영역에 추가
 * @param {object} item - 선택된 아이템
 * @param {HTMLElement} domElement - 클릭된 DOM 요소
 */
function addToSelection(item, domElement = null) {
  // 중복 방지
  if (document.getElementById(item.subTagName)) {
    console.warn(`⚠️ 이미 존재하는 항목입니다: ${item.subTagName}`);
    return;
  }

  const container = document.getElementById('selected-subcategories');

  // convertSpec에 추가
  convertSpec.push(item);

  // DOM 추가
  const newItem = document.createElement('div');
  newItem.textContent = item.subPath;
  newItem.id = item.subTagName;
  newItem.classList.add('selected-subcategory-item');
  newItem.style.marginBottom = '4px';

  container.appendChild(newItem);

  // 선택 후 비활성화 상태로 기록
  disabledSubcategories.add(item.subTagName);

  // 해당 요소가 전달되었으면 UI 상태 업데이트
  if (domElement) {
    domElement.classList.add('subcategory-disabled');
  }
}
