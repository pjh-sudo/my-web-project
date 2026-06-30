// --- 부가세 계산기 로직 ---
const vatInput = document.getElementById('vat-input');
const radioTypes = document.getElementsByName('vat-type');
const resSupply = document.getElementById('res-supply');
const resVat = document.getElementById('res-vat');
const resTotal = document.getElementById('res-total');

// 숫자에 콤마 찍어주는 함수
function formatNumber(num) {
    return Math.round(num).toLocaleString('ko-KR'); 
}

// 콤마 제거하고 순수 숫자로 바꾸는 함수
function getNumber(str) {
    return Number(str.replace(/,/g, '')) || 0;
}

// 부가세 계산 실행 함수
function calculateVAT() {
    let amount = getNumber(vatInput.value);
    
    // 입력창에 콤마가 실시간으로 찍히게 만듦
    if (amount > 0) {
        vatInput.value = amount.toLocaleString('ko-KR');
    } else {
        vatInput.value = '';
    }

    let type = document.querySelector('input[name="vat-type"]:checked').value;
    let supply = 0;
    let vat = 0;
    let total = 0;

    if (type === 'total') {
        // 합계금액 기준 (합계금액 = 입력값)
        total = amount;
        supply = total / 1.1;
        vat = total - supply;
    } else {
        // 공급가액 기준 (공급가액 = 입력값)
        supply = amount;
        vat = supply * 0.1;
        total = supply + vat;
    }

    resSupply.innerText = formatNumber(supply) + ' 원';
    resVat.innerText = formatNumber(vat) + ' 원';
    resTotal.innerText = formatNumber(total) + ' 원';
}

// 입력할 때마다, 기준(라디오버튼)을 바꿀 때마다 자동 계산
vatInput.addEventListener('input', calculateVAT);
radioTypes.forEach(radio => radio.addEventListener('change', calculateVAT));


// --- 퍼센트 계산기 로직 ---
const pctA = document.getElementById('pct-a');
const pctB = document.getElementById('pct-b');
const resPercent = document.getElementById('res-percent');

function calculatePercent() {
    let a = Number(pctA.value);
    let b = Number(pctB.value);
    
    if (a > 0 && b > 0) {
        let result = a * (b / 100);
        resPercent.innerText = result.toLocaleString('ko-KR');
    } else {
        resPercent.innerText = '0';
    }
}

pctA.addEventListener('input', calculatePercent);
pctB.addEventListener('input', calculatePercent);