import { applyEnhancersToAll } from "../core/enhancerRegistry.js";
import "../enhancers/newApiEnhancer.js";
import "../enhancers/statusEnhancer.js";
import "../enhancers/bookmarkEnhancer.js";

export function highlightAll() {
  console.log("🧹 highlightAll 실행");
  const spec = window.ui.specSelectors.specJson().toJS();
  applyEnhancersToAll(spec);
}
