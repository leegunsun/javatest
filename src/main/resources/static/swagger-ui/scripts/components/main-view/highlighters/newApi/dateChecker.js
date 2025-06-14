import { apiCreatedDateMap } from "../../../../swaggerApiStatus.js";

export function isApiRecentlyCreated(operationId, now = new Date(), thresholdDays = 5) {
  for (const controllerData of Object.values(apiCreatedDateMap)) {
    if (controllerData.methods?.[operationId]) {
      const createdDate = new Date(controllerData.methods[operationId].date);
      const diffDays = Math.floor((now - createdDate) / (1000 * 60 * 60 * 24));
      return diffDays >= 0 && diffDays <= thresholdDays;
    }
  }
  return false;
}
