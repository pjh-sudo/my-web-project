const container = document.getElementById('palette-container');
let isHexFormat = true; // 현재 코드 형식이 HEX인지 기억하는 변수
let colors = []; // 5개의 색상 데이터를 저장하는 주머니
let locked = [false, false, false, false, false]; // 5개 기둥의 잠금 상태

// 💡 기능 2: HEX 코드를 RGB 코드로 변환해 주는 마법 공식
function hexToRgb(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${r}, ${g}, ${b})`;
}

// 1. 처음 화면 세팅 (5개의 기둥과 기능들을 조립)
function initPalette() {
    container.innerHTML = '';
    for (let i = 0; i < 5; i++) {
        const colorBox = document.createElement('div');
        colorBox.classList.add('color-box');

        // 자물쇠 버튼 (기존 기능)
        const lockBtn = document.createElement('button');
        lockBtn.classList.add('lock-btn');
        lockBtn.innerText = '🔓';
        lockBtn.onclick = (e) => {
            e.stopPropagation(); // 클릭 번짐 방지
            locked[i] = !locked[i];
            lockBtn.innerText = locked[i] ? '🔒' : '🔓';
        };

        // 색상 글자
        const colorText = document.createElement('h2');
        colorText.classList.add('color-text');

        // 💡 기능 1: 원하는 색상을 직접 지정하는 컬러 피커
        const colorInput = document.createElement('input');
        colorInput.type = 'color';
        colorInput.classList.add('color-picker');
        colorInput.title = "클릭해서 원하는 색상을 직접 골라보세요!";
        colorInput.onclick = (e) => e.stopPropagation(); // 색상 고를 때 복사 안 되게 막기
        colorInput.oninput = (e) => {
            colors[i] = e.target.value; // 고른 색상으로 데이터 업데이트
            locked[i] = true; // 사용자가 직접 골랐으니 자동으로 잠금(🔒) 처리!
            lockBtn.innerText = '🔒';
            updateDisplay(); // 화면 새로고침
        };

        // 기둥 클릭 시 개별 색상 복사
        colorBox.onclick = () => copyColor(i);

        colorBox.appendChild(lockBtn);
        colorBox.appendChild(colorText);
        colorBox.appendChild(colorInput);
        container.appendChild(colorBox);
    }
    generatePalette(); // 세팅이 끝났으니 첫 번째 색상 뽑기
}

// 2. 잠기지 않은 기둥에만 무작위 색상 채워넣기
function generatePalette() {
    for (let i = 0; i < 5; i++) {
        if (!locked[i]) {
            colors[i] = '#' + Math.random().toString(16).slice(2, 8).padEnd(6, '0');
        }
    }
    updateDisplay();
}

// 3. 데이터를 바탕으로 화면(색상, 글자)을 싹 바꿔주는 함수
function updateDisplay() {
    const boxes = document.querySelectorAll('.color-box');
    boxes.forEach((box, i) => {
        const hex = colors[i];
        box.style.backgroundColor = hex; // 배경색 칠하기

        const textEl = box.querySelector('.color-text');
        textEl.innerText = isHexFormat ? hex.toUpperCase() : hexToRgb(hex); // HEX/RGB 형식에 맞춰 글자 쓰기

        const pickerEl = box.querySelector('.color-picker');
        pickerEl.value = hex; // 동그란 색상 선택기 색상도 맞춰주기
    });
}

// 💡 기능 2: HEX / RGB 포맷 전환 버튼
function toggleFormat() {
    isHexFormat = !isHexFormat;
    updateDisplay(); // 형식을 바꾸고 화면 다시 그리기
}

// 개별 색상 복사
function copyColor(index) {
    const textToCopy = isHexFormat ? colors[index].toUpperCase() : hexToRgb(colors[index]);
    executeCopy(textToCopy);
}

// 💡 기능 3: 5가지 전체 조합 한 번에 복사하기
function copyAllColors() {
    // 5개의 색상을 모아서 쉼표(,)로 연결해 줍니다.
    const allColors = colors.map(hex => isHexFormat ? hex.toUpperCase() : hexToRgb(hex));
    executeCopy(allColors.join(', '));
}

// 복사 실행 및 예쁜 토스트(Toast) 알림 띄우기
function executeCopy(text) {
    navigator.clipboard.writeText(text).then(() => {
        const toast = document.getElementById('toast');
        toast.innerText = text + ' 복사 완료! 🎨';
        toast.classList.add('show');
        setTimeout(() => toast.classList.remove('show'), 2000);
    });
}

// 스페이스바 감지 기능 (기존 기능)
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') {
        e.preventDefault();
        generatePalette();
    }
});

// 자바스크립트가 로드되면 팔레트 세팅을 시작합니다!
initPalette();