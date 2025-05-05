import { loadSwagger } from './swaggerInit.js';

/**
 * groupedList를 트리 구조로 변환
 */
export function buildTree(list) {
  const map = {};
  const roots = [];

  list.forEach(item => {
    map[item.group] = { ...item, children: [] };
  });

  list.forEach(item => {
    const idx = item.group.lastIndexOf('.');
    if (idx > -1) {
      const parentKey = item.group.substring(0, idx);
      map[parentKey]?.children.push(map[item.group]);
    } else {
      roots.push(map[item.group]);
    }
  });

  return roots;
}

/**
 * 각 노드를 <li>로 렌더링하고 클릭 시 loadSwagger 호출
 */
function createNode(node) {
  const li = document.createElement('li');
  const title = document.createElement('span');
  title.textContent = node.displayName;

  title.addEventListener('click', () => {
    loadSwagger(node.group);
    document.querySelectorAll('.sidebar li').forEach(el => el.classList.remove('active'));
    li.classList.add('active');
    if (node.children.length) li.classList.toggle('open');
  });

  li.appendChild(title);

  if (node.children.length) {
    const ul = document.createElement('ul');
    ul.className = 'children';
    node.children.forEach(child => ul.appendChild(createNode(child)));
    li.appendChild(ul);
  }

  return li;
}

/**
 * 사이드바(<ul id="api-tree">) 초기화 및 트리 렌더링
 */
export function renderSidebar(tree, container) {
  container.innerHTML = '';
  tree.forEach(node => container.appendChild(createNode(node)));
}
