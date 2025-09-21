export let apiStatusMap = {};
export let apiCreatedDateMap = {};
export let swaggerUiObserver = null;

export function setApiStatusMap(map)   { apiStatusMap = map; }
export function setApiCreatedDateMap(m) { apiCreatedDateMap = m; }
export function setSwaggerUiObserver(o) { swaggerUiObserver = o; }

