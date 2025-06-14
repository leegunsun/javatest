import { getDisabledSubcategories } from "./categoryState.js";
import { addToSelection } from "./selectionHandler.js";

export function renderSubcategoryItems(subItems, subContainer) {
  subContainer.innerHTML = "";

  subItems.forEach(item => {
    const subItem = document.createElement("div");
    subItem.textContent = item.subPath;
    subItem.classList.add("subcategory-item");
    subItem.style.cursor = "pointer";

    if (getDisabledSubcategories().has(item.subTagName)) {
      subItem.classList.add("subcategory-disabled");
    } else {
      subItem.onclick = () => addToSelection(item, subItem);
    }

    subContainer.appendChild(subItem);
  });
}
