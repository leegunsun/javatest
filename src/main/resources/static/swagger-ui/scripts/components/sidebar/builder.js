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