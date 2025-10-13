/**
 * Swagger UI 커스텀 스크립트
 * - 각 API 엔드포인트에 파라미터 초기화 버튼 추가
 */

/**
 * JSON 객체의 값을 초기화한다 (키는 유지)
 * @param {*} obj - 초기화할 객체
 * @returns {*} 값이 초기화된 객체
 */
function clearJsonValues(obj) {
  if (obj === null || obj === undefined) {
    return null;
  }

  if (Array.isArray(obj)) {
    // 배열의 경우: 첫 번째 요소만 유지하고 값 초기화
    if (obj.length > 0) {
      return [clearJsonValues(obj[0])];
    }
    return [];
  }

  if (typeof obj === 'object') {
    // 객체의 경우: 모든 키를 유지하고 값만 초기화
    const cleared = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const value = obj[key];

        if (value === null || value === undefined) {
          cleared[key] = null;
        } else if (typeof value === 'string') {
          cleared[key] = '';
        } else if (typeof value === 'number') {
          cleared[key] = 0;
        } else if (typeof value === 'boolean') {
          cleared[key] = false;
        } else if (Array.isArray(value)) {
          cleared[key] = clearJsonValues(value);
        } else if (typeof value === 'object') {
          cleared[key] = clearJsonValues(value);
        } else {
          cleared[key] = null;
        }
      }
    }
    return cleared;
  }

  // 기본값 처리
  if (typeof obj === 'string') return '';
  if (typeof obj === 'number') return 0;
  if (typeof obj === 'boolean') return false;

  return null;
}

// Swagger UI가 완전히 로드될 때까지 대기
window.addEventListener('load', function () {
  // MutationObserver를 사용하여 DOM 변경 감지
  const observer = new MutationObserver(function (mutations) {
    addResetButtons();
  });

  // Swagger UI 컨테이너 감시
  const swaggerContainer = document.querySelector('#swagger-ui');
  if (swaggerContainer) {
    observer.observe(swaggerContainer, {
      childList: true,
      subtree: true,
    });
  }

  // 초기 로드 시에도 버튼 추가
  setTimeout(addResetButtons, 1000);
});

/**
 * 파라미터 초기화 버튼을 추가한다
 */
function addResetButtons() {
  // Try it out 버튼이 있는 모든 operation 찾기
  const operations = document.querySelectorAll('.opblock');

  operations.forEach((operation) => {
    // 이미 초기화 버튼이 있는지 확인
    if (operation.querySelector('.reset-params-btn')) {
      return;
    }

    // Try it out 버튼 찾기
    const tryOutSection = operation.querySelector('.try-out');
    if (!tryOutSection) {
      return;
    }

    // 파라미터 섹션 찾기
    const parametersSection = operation.querySelector('.parameters-container');
    if (!parametersSection) {
      return;
    }

    // 초기화 버튼 생성
    const resetButton = document.createElement('button');
    resetButton.className = 'btn reset-params-btn';
    resetButton.textContent = '🔄 파라미터 초기화';
    resetButton.style.cssText = `
      margin-left: 10px;
      padding: 5px 15px;
      background-color: #f8f9fa;
      border: 1px solid #d1d5da;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      color: #24292e;
      transition: all 0.2s;
    `;

    // 호버 효과
    resetButton.addEventListener('mouseenter', function () {
      this.style.backgroundColor = '#e9ecef';
      this.style.borderColor = '#adb5bd';
    });

    resetButton.addEventListener('mouseleave', function () {
      this.style.backgroundColor = '#f8f9fa';
      this.style.borderColor = '#d1d5da';
    });

    // 클릭 이벤트: 모든 입력 필드 초기화
    resetButton.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();

      // Request body 먼저 초기화 (JSON editor) - key는 유지하고 value만 비움
      const bodyTextarea = operation.querySelector('.body-param__text');
      if (bodyTextarea && bodyTextarea.value) {
        try {
          const jsonBody = JSON.parse(bodyTextarea.value);
          const clearedBody = clearJsonValues(jsonBody);
          bodyTextarea.value = JSON.stringify(clearedBody, null, 2);

          // React/Vue 등의 프레임워크를 위한 이벤트 트리거
          const event = new Event('input', { bubbles: true });
          bodyTextarea.dispatchEvent(event);
        } catch (e) {
          // JSON 파싱 실패 시 키 구조 유지 시도
          console.warn('JSON 파싱 실패, body 초기화 스킵:', e);
        }
      }

      // 나머지 입력 필드 초기화 (Request Body textarea 제외)
      const inputs = operation.querySelectorAll(
        'input[type="text"], input[type="number"], input[type="password"], select',
      );

      inputs.forEach((input) => {
        if (input.tagName === 'SELECT') {
          input.selectedIndex = 0;
        } else {
          input.value = '';
        }

        // React/Vue 등의 프레임워크를 위한 이벤트 트리거
        const event = new Event('input', { bubbles: true });
        input.dispatchEvent(event);
      });

      // 체크박스 초기화
      const checkboxes = operation.querySelectorAll('input[type="checkbox"]');
      checkboxes.forEach((checkbox) => {
        checkbox.checked = false;
        const event = new Event('change', { bubbles: true });
        checkbox.dispatchEvent(event);
      });

      // 피드백 제공
      const originalText = resetButton.textContent;
      resetButton.textContent = '✓ 초기화 완료!';
      resetButton.style.backgroundColor = '#d4edda';
      resetButton.style.borderColor = '#c3e6cb';
      resetButton.style.color = '#155724';

      setTimeout(() => {
        resetButton.textContent = originalText;
        resetButton.style.backgroundColor = '#f8f9fa';
        resetButton.style.borderColor = '#d1d5da';
        resetButton.style.color = '#24292e';
      }, 1500);
    });

    // 초기화 버튼을 일관된 위치에 배치
    const bodyParamWrapper = document.createElement('div');
    bodyParamWrapper.className = 'reset-button-wrapper';
    bodyParamWrapper.style.cssText = `
      display: flex;
      justify-content: flex-end;
      padding: 10px 15px;
      border-bottom: 1px solid #e8e8e8;
      margin-bottom: 10px;
      background-color: #fafafa;
    `;
    bodyParamWrapper.appendChild(resetButton);

    // 우선순위: body-param > parameters-container > execute-wrapper
    const bodyParamSection = operation.querySelector('.body-param');
    const parametersContainer = operation.querySelector(
      '.parameters-container',
    );
    const executeWrapper = operation.querySelector('.execute-wrapper');

    if (bodyParamSection) {
      // POST/PUT/PATCH 등 Request Body가 있는 경우
      bodyParamSection.insertBefore(
        bodyParamWrapper,
        bodyParamSection.firstChild,
      );
    } else if (parametersContainer) {
      // GET 등 파라미터만 있는 경우 - parameters 바로 아래에 배치
      parametersContainer.parentNode.insertBefore(
        bodyParamWrapper,
        parametersContainer.nextSibling,
      );
    } else if (executeWrapper) {
      // 파라미터도 없는 경우 - execute wrapper 위에 배치
      executeWrapper.parentNode.insertBefore(bodyParamWrapper, executeWrapper);
    }
  });
}

/**
 * 전역 초기화 버튼 추가 (선택사항)
 */
function addGlobalResetButton() {
  const infoContainer = document.querySelector('.information-container');
  if (!infoContainer || document.querySelector('.global-reset-btn')) {
    return;
  }

  const globalResetButton = document.createElement('button');
  globalResetButton.className = 'btn global-reset-btn';
  globalResetButton.textContent = '🔄 모든 파라미터 초기화';
  globalResetButton.style.cssText = `
    margin: 20px 0;
    padding: 10px 20px;
    background-color: #fff3cd;
    border: 1px solid #ffc107;
    border-radius: 4px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 600;
    color: #856404;
    transition: all 0.2s;
  `;

  globalResetButton.addEventListener('mouseenter', function () {
    this.style.backgroundColor = '#ffe69c';
  });

  globalResetButton.addEventListener('mouseleave', function () {
    this.style.backgroundColor = '#fff3cd';
  });

  globalResetButton.addEventListener('click', function () {
    const allResetButtons = document.querySelectorAll('.reset-params-btn');
    allResetButtons.forEach((btn) => btn.click());

    const originalText = globalResetButton.textContent;
    globalResetButton.textContent = '✓ 모든 파라미터 초기화 완료!';
    globalResetButton.style.backgroundColor = '#d4edda';
    globalResetButton.style.borderColor = '#c3e6cb';
    globalResetButton.style.color = '#155724';

    setTimeout(() => {
      globalResetButton.textContent = originalText;
      globalResetButton.style.backgroundColor = '#fff3cd';
      globalResetButton.style.borderColor = '#ffc107';
      globalResetButton.style.color = '#856404';
    }, 2000);
  });

  infoContainer.appendChild(globalResetButton);
}

// 전역 초기화 버튼도 추가 (선택사항)
window.addEventListener('load', function () {
  setTimeout(addGlobalResetButton, 1500);
});
