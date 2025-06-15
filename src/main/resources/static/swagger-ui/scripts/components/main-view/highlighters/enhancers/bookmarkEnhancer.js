import { insertBookmarkToggle } from "../state/bookmarkToggle.js";
import { registerEnhancer } from "../core/enhancerRegistry.js";

function bookmarkEnhancer({ elSummary, setData }) {
  insertBookmarkToggle(setData, elSummary);
}

registerEnhancer(bookmarkEnhancer);
