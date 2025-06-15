import { deleteDisabledSubcategories, addDisabledSubcategories } from "./categoryState.js";
import { getSelectedContainer } from "./selectors.js";
import { pushConvertSpec, getConvertSpec } from "../../custominit/state.js";

export function addToSelection(item, domElement = null) {
  const container = getSelectedContainer();

  const path = item.path;
  const method = item.method;
  const createElId = `${item.operationId + "." + path + "." + method}`
  const rootTagName = item.tags?.[0];
  

  const existing = document.getElementById(createElId);
  const convertSpec = getConvertSpec();

  if (existing) {
    const rootGroup = document.getElementById(rootTagName);
    rootGroup.removeChild(existing);

    const index = convertSpec.findIndex(el => el === item); //
    if (index !== -1) convertSpec.splice(index, 1);

    if (rootGroup.querySelectorAll(".custom_side_bar-subcategory").length === 0) {
      container.removeChild(rootGroup);
    }

    deleteDisabledSubcategories(item);
    if (domElement) domElement.classList.remove("subcategory-disabled");
    return;
  }

  let rootGroup = document.getElementById(rootTagName);
  if (!rootGroup) {
    rootGroup = document.createElement("div");
    rootGroup.id = rootTagName;
    rootGroup.classList.add("custom_side_bar-root-group");

    const containerTop = document.createElement("div");
    containerTop.classList.add("custom_side_bar-root-group-top");

    const title = document.createElement("h4");
    title.textContent = `📁 ${rootTagName}`;
    title.classList.add("custom_side_bar-root-group-title");

    containerTop.appendChild(title);
    rootGroup.appendChild(containerTop);
    container.appendChild(rootGroup);
  }

  const newItem = document.createElement("div");
  newItem.classList.add("custom_side_bar-subcategory");
  newItem.id = createElId;

  const subText = document.createElement("span");
  subText.textContent = path;

  const subDelBtn = document.createElement("span");
  subDelBtn.classList.add("material-symbols-outlined", "custom_sub-delete-button");
  subDelBtn.textContent = "close";

  subDelBtn.addEventListener("click", () => {
    rootGroup.removeChild(newItem);

    const index = convertSpec.findIndex(el => el === item);
    if (index !== -1) convertSpec.splice(index, 1);

    if (rootGroup.querySelectorAll(".custom_side_bar-subcategory").length === 0) {
      container.removeChild(rootGroup);
    }

    deleteDisabledSubcategories(item);
    if (domElement) domElement.classList.remove("subcategory-disabled");
  });

  newItem.appendChild(subText);
  newItem.appendChild(subDelBtn);
  rootGroup.appendChild(newItem);

  pushConvertSpec(item);
  addDisabledSubcategories(item);

  if (domElement) domElement.classList.add("subcategory-disabled");
  container.scrollTop = container.scrollHeight;
}
