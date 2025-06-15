var rawSpec = []; // 처음에 시작할 때, 가져오는 모든 'API'의 값
var convertSpec = []; // 처음에 가져온 값중에서 '사용할 API 값'


export function setConvertSpec(setData) {
  convertSpec = setData;
}

export function getConvertSpec() {
  return convertSpec;
}

export function pushConvertSpec(setData) {
  convertSpec.push(setData);
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
