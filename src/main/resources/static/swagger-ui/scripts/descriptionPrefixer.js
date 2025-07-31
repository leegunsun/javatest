import { apiCreatedDateMap } from './state.js';

export function addApiPrefixToDescription() {
  const targetNode = document.getElementById('swagger-ui');
  console.log("addApiPrefixToDescription 실행");

  if (!targetNode) {
    console.log('❌ #swagger-ui 요소를 찾지 못했습니다.');
    return;
  }

document.querySelectorAll('.opblock-summary').forEach(summary => {
  summary.addEventListener('click', () => {
    const opblock = summary.closest('.opblock');
    setTimeout(() => {
      applyPrefixToSingleOpblock(opblock);
    }, 50);
  });
});

  applyPrefixToDescriptions();
}

// ✅ opblock 단위로 작성자 적용
function applyPrefixToDescriptions() {
  const spec = window.ui.specSelectors.specJson().toJS();
  const paths = spec.paths;

  document.querySelectorAll('.opblock').forEach(opblock => {
    const elSummary = opblock.querySelector(".opblock-summary");
    const elPath = elSummary?.querySelector(".opblock-summary-path")?.textContent?.trim();
    const elMethod = elSummary?.querySelector(".opblock-summary-method")?.textContent?.toLowerCase();

    const operation = spec.paths?.[elPath]?.[elMethod];
    if (!operation) {
      console.log(`❌ Operation 정보 없음: ${elMethod} ${elPath}`);
      return;
    }

    const operationId = operation.operationId;
    const author = getAuthorByOperationId(operationId);

    const descWrapper = opblock.querySelector(".opblock-description-wrapper > div > div > p");
    if (descWrapper) {
      const originalText = descWrapper.textContent.trim();

      if (!originalText.startsWith(`${author} :`)) {  // 중복 방지
        descWrapper.textContent = `✎ ${author ?? '알 수 없음'} : ${originalText}`;
        // console.log(`📝 ${operationId} - 변경된 내용: ${descWrapper.textContent}`);
      }
    }
  });
}

// ✅ operationId 기반 작성자 조회
function getAuthorByOperationId(operationId) {
  console.log(`🔍 getAuthorByOperationId 호출됨: operationId=${operationId}`);

  for (const [controllerName, controllerData] of Object.entries(apiCreatedDateMap)) {
    const methods = controllerData.methods || {};
    if (methods.hasOwnProperty(operationId)) {
      const author = methods[operationId].author;
      console.log(`✅ 작성자 찾음: ${operationId} => ${author}`);
      return author;
    }
  }

  console.log(`❌ 작성자 없음: ${operationId}`);
  return null;
}

function applyPrefixToSingleOpblock(opblock) {
  const spec = window.ui.specSelectors.specJson().toJS();

  const elSummary = opblock.querySelector(".opblock-summary");
  const elPath = elSummary?.querySelector(".opblock-summary-path")?.textContent?.trim();
  const elMethod = elSummary?.querySelector(".opblock-summary-method")?.textContent?.toLowerCase();

  const operation = spec.paths?.[elPath]?.[elMethod];
  if (!operation) {
    console.log(`❌ Operation 정보 없음: ${elMethod} ${elPath}`);
    return;
  }

  const operationId = operation.operationId;
  const author = getAuthorByOperationId(operationId) ?? '알 수 없음';

  const descWrapper = opblock.querySelector(".opblock-description-wrapper > div > div > p");
  if (descWrapper) {
    const originalText = descWrapper.textContent.trim();

    // ✅ '✎ 작성자 :' 형태가 이미 포함된 경우 skip
    const authorPrefixRegex = new RegExp(`^✎\\s*${author}\\s*:`);

    if (!authorPrefixRegex.test(originalText)) {
      descWrapper.textContent = `✎ ${author} : ${originalText}`;
      console.log(`📝 ${operationId} - 변경된 내용: ${descWrapper.textContent}`);
    } else {
      console.log(`🔁 ${operationId} - 이미 작성자 포함됨: ${originalText}`);
    }
  }
}

