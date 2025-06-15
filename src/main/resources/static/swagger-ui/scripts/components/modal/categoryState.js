var disabledSubcategories = new Set();
// var convertSpec = [];


// export function getConvertSpec() {
//   return convertSpec;
// }

// export function pushConvertSpec(setData) {
//   return convertSpec.push(setData);
// }

// export function setConvertSpec(setData) {
//   convertSpec = setData;
// }

export function getDisabledSubcategories() {
  return disabledSubcategories;
}

export function deleteDisabledSubcategories(setData) {
  return disabledSubcategories.delete(setData);
}

export function addDisabledSubcategories(setData) {
  return disabledSubcategories.add(setData);
}


export function setDisabledSubcategories(setData) {
  disabledSubcategories = setData;
}
