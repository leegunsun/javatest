import { getDisabledSubcategories } from "./categoryState.js";
import { addToSelection } from "./selectionHandler.js";

export function renderSubcategoryItems(subItems, subContainer) {
  subContainer.innerHTML = "";

    Object.entries(subItems).forEach(([index, item]) => {
      const subItem = document.createElement("div");
      subItem.textContent = item.path;
      subItem.classList.add("subcategory-item");
      subItem.style.cursor = "pointer";

      // if (getDisabledSubcategories().has(item.tags?.[0])) {
      if (getDisabledSubcategories().has(item)) {
        subItem.classList.add("subcategory-disabled");
      } else {
        subItem.onclick = () => addToSelection(item, subItem);
      }

      subContainer.appendChild(subItem);
    });
}
