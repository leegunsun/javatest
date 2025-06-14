var rawSpec = [];
var convertSpec = [];


export function setConvertSpec(setData) {
  convertSpec = setData;
}

export function getConvertSpec() {
  return convertSpec;
}

export function setRawSpec(setData) {
  rawSpec = setData;
}

export function pushRawSpec(setData) {
  rawSpec.push(setData);
}

export function getRawSpec() {
  return rawSpec;
}
