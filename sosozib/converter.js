const unitType = document.getElementById('unit-type');
const inputFrom = document.getElementById('input-from');
const inputTo = document.getElementById('input-to');
const labelFrom = document.getElementById('label-from');
const labelTo = document.getElementById('label-to');
const resetBtn = document.getElementById('reset-btn'); // 초기화 버튼 가져오기

// 단위 종류별 환산 비율 및 공식 설정
const conversionData = {
    length: { nameFrom: '인치 (inch)', nameTo: '센티미터 (cm)', rate: 2.54 },
    area: { nameFrom: '평 (py)', nameTo: '제곱미터 (㎡)', rate: 3.305785 },
    weight: { nameFrom: '파운드 (lb)', nameTo: '킬로그램 (kg)', rate: 0.453592 },
    distance: { nameFrom: '킬로미터 (km)', nameTo: '마일 (mile)', rate: 0.621371 },
    temperature: { 
        nameFrom: '섭씨 (℃)', 
        nameTo: '화씨 (℉)', 
        // 온도는 단순 곱하기가 아니므로 전용 계산 함수를 만듭니다.
        calcTo: (c) => (c * 9/5) + 32, 
        calcFrom: (f) => (f - 32) * 5/9 
    }
};

// 1. 카테고리를 변경하면 라벨 이름을 바꾸고 입력창을 초기화합니다.
unitType.addEventListener('change', () => {
    const type = unitType.value;
    labelFrom.innerText = conversionData[type].nameFrom;
    labelTo.innerText = conversionData[type].nameTo;
    clearInputs(); // 카테고리가 바뀌면 깔끔하게 비워주기
});

// 2. 소수점을 예쁘게 처리해 주는 함수 (최대 4자리까지만 보여주고 끝자리 0은 제거)
function formatNumber(num) {
    return parseFloat(num.toFixed(4));
}

// 3. 왼쪽 입력창에 타이핑할 때 -> 오른쪽 자동 계산
inputFrom.addEventListener('input', () => {
    const type = unitType.value;
    const data = conversionData[type];
    const value = parseFloat(inputFrom.value);
    
    if (!isNaN(value)) {
        if (type === 'temperature') {
            inputTo.value = formatNumber(data.calcTo(value));
        } else {
            inputTo.value = formatNumber(value * data.rate);
        }
    } else {
        inputTo.value = ''; 
    }
});

// 4. 오른쪽 입력창에 타이핑할 때 -> 왼쪽 자동 계산
inputTo.addEventListener('input', () => {
    const type = unitType.value;
    const data = conversionData[type];
    const value = parseFloat(inputTo.value);
    
    if (!isNaN(value)) {
        if (type === 'temperature') {
            inputFrom.value = formatNumber(data.calcFrom(value));
        } else {
            // 이제 inputTo 값을 입력하면 역방향 연산을 통해 inputFrom 값을 업데이트합니다[cite: 738].
            inputFrom.value = formatNumber(value / data.rate); 
        }
    } else {
        inputFrom.value = '';
    }
});

// 5. 입력창 비우기 전용 함수
function clearInputs() {
    inputFrom.value = '';
    inputTo.value = '';
}

// 6. 초기화 버튼을 눌렀을 때의 동작
resetBtn.addEventListener('click', () => {
    clearInputs();
    inputFrom.focus(); // 지운 다음 바로 입력할 수 있도록 커서 깜빡이게 하기
});