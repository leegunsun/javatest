import { getRawSpec } from "../../custominit/state.js";
import { renderSubcategoryItems } from "./renderSubcategories.js";
import { getTagContainer, getSubContainer } from "./selectors.js";

export function renderCategoryList(selectedRootTagName) {
  const tagContainer = getTagContainer();
  const subContainer = getSubContainer();
  const rawSpec = getRawSpec();

  tagContainer.innerHTML = "";
  subContainer.innerHTML = "";

  const uniqueRootTags = [...new Set(rawSpec.map(e => e.rootTagName))];

  uniqueRootTags.forEach(rootTagName => {
    const tagItem = document.createElement("div");
    tagItem.textContent = rootTagName;
    tagItem.dataset.rootTagName = rootTagName;
    tagItem.classList.add("selectCategory");
    tagItem.style.cursor = "pointer";

    tagItem.onclick = () => {
      highlightSelectedRootCategory(rootTagName);
      const subItems = rawSpec.filter(e => e.rootTagName === rootTagName);
      renderSubcategoryItems(subItems, subContainer);
    };

    tagContainer.appendChild(tagItem);
  });

  if (selectedRootTagName) {
    const first = [...tagContainer.children].find(
      el => el.dataset.rootTagName === selectedRootTagName
    );
    if (first) first.click();
  }
}

function highlightSelectedRootCategory(id) {
  const allCategories = document.querySelectorAll(".modal-left#category-list > div");
  allCategories.forEach(el => {
    el.classList.toggle("selectCategory-disabled", el.dataset.rootTagName === id);
  });
}
