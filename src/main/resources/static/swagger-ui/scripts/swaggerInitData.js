export async function fetchAll() {
  const [statusRes, metaRes, groupRes] = await Promise.all([
    fetch("/swagger-status/api-status.json"),
    fetch("/swagger-status/api-meta.json"),
    fetch("/swagger-status/grouped-openapi-list")
  ]);
  return {
    statusMap: await statusRes.json(),
    createdMap: await metaRes.json(),
    groupedList: await groupRes.json()
  };
}

export function loadTreeFromStorage() {
  const raw = localStorage.getItem("apiTreeStructure");
  return raw ? JSON.parse(raw) : null;
}

export function getLocalStorageUsedPath () {
  return localStorage.getItem("usedPath");
}

export function setLocalStorageUsedPath (setData) {
  return localStorage.setItem("usedPath", setData);
}

export function getLocalStorageInitDropDownBtn () {
  return localStorage.getItem("initDropDownBtn");
}

export function setLocalStorageInitDropDownBtn (setData) {
  return localStorage.setItem("initDropDownBtn", setData);
}