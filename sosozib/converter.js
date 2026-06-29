const unitType = document.getElementById('unit-type');
const inputFrom = document.getElementById('input-from');
const inputTo = document.getElementById('input-to');
const labelFrom = document.getElementById('label-from');
const labelTo = document.getElementById('label-to');

// 단위 종류별 환산 비율 (기준점) 설정
const conversionRates = {
    length: { nameFrom: '인치 (inch)', nameTo: '센티미터 (cm)', rate: 2.54 },
    area: { nameFrom: '평 (py)', nameTo: '제곱미터 (㎡)', rate: 3.305785 },
    weight: { nameFrom: '파운드 (lb)', nameTo: '킬로그램 (kg)', rate: 0.453592 },
};

// 1. 카테고리를 변경하면 라벨 이름을 바꾸고 입력창을 초기화합니다.
unitType.addEventListener('change', () => {
    const type = unitType.value;
    labelFrom.innerText = conversionRates[type].nameFrom;
    labelTo.innerText = conversionRates[type].nameTo;
    inputFrom.value = '';
    inputTo.value = '';
});

// 2. 소수점을 예쁘게 처리해 주는 함수 (최대 4자리까지만 보여주고 끝자리 0은 제거)
function formatNumber(num) {
    return parseFloat(num.toFixed(4));
}

// 3. 왼쪽 입력창에 타이핑할 때 -> 오른쪽 자동 계산
inputFrom.addEventListener('input', () => {
    const rate = conversionRates[unitType.value].rate;
    const value = parseFloat(inputFrom.value);
    
    if (!isNaN(value)) {
        inputTo.value = formatNumber(value * rate);
    } else {
        inputTo.value = ''; // 숫자가 아니면 빈칸 처리
    }
});

// 4. 오른쪽 입력창에 타이핑할 때 -> 왼쪽 자동 계산
inputTo.addEventListener('input', () => {
    const rate = conversionRates[unitType.value].rate;
    const value = parseFloat(inputTo.value);
    
    if (!isNaN(value)) {
        inputFrom.value = formatNumber(value / rate);
    } else {
        inputFrom.value = '';
    }
});