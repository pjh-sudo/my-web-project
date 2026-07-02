// 1. DOM 요소 취득
const tabBase64 = document.getElementById('tab-base64');
const tabJson = document.getElementById('tab-json');
const contentBase64 = document.getElementById('content-base64');
const contentJson = document.getElementById('content-json');

// Base64 관련 요소
const base64Input = document.getElementById('base64-input');
const base64Output = document.getElementById('base64-output');
const btnB64Encode = document.getElementById('btn-b64-encode');
const btnB64Decode = document.getElementById('btn-b64-decode');
const btnB64Clear = document.getElementById('btn-b64-clear');
const btnB64Copy = document.getElementById('btn-b64-copy');

// JSON 관련 요소
const jsonInput = document.getElementById('json-input');
const jsonOutput = document.getElementById('json-output');
const btnJsonBeautify2 = document.getElementById('btn-json-beautify2');
const btnJsonBeautify4 = document.getElementById('btn-json-beautify4');
const btnJsonMinify = document.getElementById('btn-json-minify');
const btnJsonClear = document.getElementById('btn-json-clear');
const btnJsonCopy = document.getElementById('btn-json-copy');
const jsonError = document.getElementById('json-error');
const jsonErrorMsg = document.getElementById('json-error-msg');

// 2. 탭 전환 인터랙션
tabBase64.addEventListener('click', () => {
    tabBase64.classList.add('active');
    tabJson.classList.remove('active');
    contentBase64.classList.add('active');
    contentJson.classList.remove('active');
});

tabJson.addEventListener('click', () => {
    tabJson.classList.add('active');
    tabBase64.classList.remove('active');
    contentJson.classList.add('active');
    contentBase64.classList.remove('active');
});

// 3. UTF-8을 대응하는 Base64 인코더/디코더 함수
// 브라우저 기본 btoa/atob 함수는 ASCII 문자 전용이므로 한글 등 멀티바이트 문자가 들어가면 에러가 납니다.
// 따라서 TextEncoder와 TextDecoder를 사용해 바이트 단위로 안전하게 인코딩/디코딩합니다.
function utf8ToB64(str) {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary);
}

function b64ToUtf8(str) {
    const binary = window.atob(str);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
}

// 4. Base64 이벤트 핸들러
btnB64Encode.addEventListener('click', () => {
    const input = base64Input.value;
    if (!input.trim()) {
        alert('인코딩할 텍스트를 입력해 주세요!');
        return;
    }
    base64Output.value = utf8ToB64(input);
});

btnB64Decode.addEventListener('click', () => {
    const input = base64Input.value.trim();
    if (!input) {
        alert('디코딩할 Base64 문자열을 입력해 주세요!');
        return;
    }
    try {
        base64Output.value = b64ToUtf8(input);
    } catch (e) {
        alert('디코딩에 실패했습니다. 올바른 Base64 포맷이 아닙니다.\n오류 내용: ' + e.message);
    }
});

btnB64Clear.addEventListener('click', () => {
    base64Input.value = '';
    base64Output.value = '';
});

btnB64Copy.addEventListener('click', () => {
    copyToClipboard(base64Output, '인코딩/디코딩 결과가 복사되었습니다! 📋');
});

// 5. JSON 이벤트 핸들러
function processJson(formatSpaces) {
    const input = jsonInput.value.trim();
    if (!input) {
        alert('처리할 JSON 문자열을 입력해 주세요!');
        return;
    }
    
    // 에러 영역 초기화
    jsonError.style.display = 'none';
    jsonOutput.value = '';

    try {
        // 입력값을 객체로 파싱
        const parsed = JSON.parse(input);
        
        // 정렬 또는 압축 렌더링
        if (formatSpaces === null) {
            jsonOutput.value = JSON.stringify(parsed); // 압축 (Minify)
        } else {
            jsonOutput.value = JSON.stringify(parsed, null, formatSpaces); // 정렬 (Beautify)
        }
    } catch (e) {
        // 파싱 오류 발생 시 에러 블록 노출
        jsonError.style.display = 'block';
        jsonErrorMsg.innerText = e.message;
    }
}

btnJsonBeautify2.addEventListener('click', () => processJson(2));
btnJsonBeautify4.addEventListener('click', () => processJson(4));
btnJsonMinify.addEventListener('click', () => processJson(null));

btnJsonClear.addEventListener('click', () => {
    jsonInput.value = '';
    jsonOutput.value = '';
    jsonError.style.display = 'none';
});

btnJsonCopy.addEventListener('click', () => {
    copyToClipboard(jsonOutput, 'JSON 변환 결과가 복사되었습니다! 📋');
});

// 6. 클립보드 공통 복사 기능 함수
function copyToClipboard(textareaElement, successMessage) {
    const val = textareaElement.value;
    if (!val) {
        alert('복사할 결과 데이터가 없습니다!');
        return;
    }
    
    navigator.clipboard.writeText(val).then(() => {
        alert(successMessage);
    }).catch(err => {
        // 클립보드 API가 먹히지 않는 구형 환경/일부 앱 브라우저 대비 대체 로직
        textareaElement.select();
        try {
            document.execCommand('copy');
            alert(successMessage);
        } catch (e) {
            alert('복사에 실패했습니다. 결과창을 수동으로 전체 복사해 주세요.');
        }
    });
}
