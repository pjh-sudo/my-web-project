// 1. 조작할 HTML 요소들 가져오기
const previewBox = document.getElementById('preview-box');
const inputX = document.getElementById('input-x');
const inputY = document.getElementById('input-y');
const inputBlur = document.getElementById('input-blur');
const inputColor = document.getElementById('input-color');
const inputOpacity = document.getElementById('input-opacity');

// 2. 숫자가 표시될 텍스트 요소들 가져오기
const valX = document.getElementById('val-x');
const valY = document.getElementById('val-y');
const valBlur = document.getElementById('val-blur');

// 3. 코드 출력 및 복사 버튼
const cssCode = document.getElementById('css-code');
const copyBtn = document.getElementById('copy-btn');

// 💡 색상 변환기 (Hex 코드를 RGB 숫자로 바꿔주는 마법의 함수)
function hexToRgb(hex) {
    let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// 🚀 핵심: 그림자를 만들고 화면에 적용하는 함수
function updateShadow() {
    // 1) 현재 슬라이더들의 값을 가져옵니다.
    const x = inputX.value;
    const y = inputY.value;
    const blur = inputBlur.value;
    const opacity = inputOpacity.value;
    
// 🚀 수정된 부분: span의 텍스트가 아니라 input의 value로 넣어줍니다.
    valX.value = x;
    valY.value = y;
    valBlur.value = blur;

    // 3) 색상과 투명도를 합쳐서 rgba 코드로 만듭니다.
    const rgb = hexToRgb(inputColor.value);
    const rgbaColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacity})`;

    // 4) 최종 CSS box-shadow 속성값을 완성합니다.
    const shadowString = `${x}px ${y}px ${blur}px ${rgbaColor}`;

    // 5) 미리보기 상자에 그림자를 적용합니다!
    previewBox.style.boxShadow = shadowString;

    // 6) 아래쪽 코드 박스에 완성된 코드를 찍어줍니다.
    cssCode.innerText = `box-shadow: ${shadowString};`;
}

// 🎉 이벤트 연결: 슬라이더나 색상을 '움직일 때마다(input)' 업데이트 함수 실행!
[inputX, inputY, inputBlur, inputColor, inputOpacity].forEach(element => {
    element.addEventListener('input', updateShadow);
});

// 📋 복사 버튼 기능
copyBtn.addEventListener('click', () => {
    // 텍스트를 클립보드에 복사합니다.
    navigator.clipboard.writeText(cssCode.innerText).then(() => {
        // 복사 성공 시 버튼 텍스트와 색상을 잠시 바꿨다가 돌려놓기 (UX 디테일!)
        const originalText = copyBtn.innerText;
        copyBtn.innerText = '복사 완료! ✔️';
        copyBtn.style.backgroundColor = '#2ecc71'; // 초록색
        copyBtn.style.color = 'white';

        setTimeout(() => {
            copyBtn.innerText = originalText;
            copyBtn.style.backgroundColor = '#61afef'; // 원래 파란색
            copyBtn.style.color = '#282c34';
        }, 1500);
    });
});

// 페이지가 처음 열렸을 때 기본 설정값으로 그림자를 한 번 그려줍니다.
updateShadow();

// ... (기존 복사 버튼 코드 아래에 추가)

// 🚀 입력창에 숫자를 직접 타이핑할 때 슬라이더와 그림자 동기화
const inputs = [
    { numberInput: valX, slider: inputX },
    { numberInput: valY, slider: inputY },
    { numberInput: valBlur, slider: inputBlur }
];

inputs.forEach(item => {
    item.numberInput.addEventListener('input', () => {
        // 타이핑한 숫자를 슬라이더의 위치(value)에 덮어씌움
        item.slider.value = item.numberInput.value;
        // 변경된 슬라이더 값을 바탕으로 그림자 갱신
        updateShadow();
    });
});