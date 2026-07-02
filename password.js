// 옵션 패널의 요소들을 가져옵니다.
const lengthSlider = document.getElementById('length-slider');
const lengthVal = document.getElementById('length-val');
const incUppercase = document.getElementById('inc-uppercase');
const incLowercase = document.getElementById('inc-lowercase');
const incNumbers = document.getElementById('inc-numbers');
const incSymbols = document.getElementById('inc-symbols');
const excConfusing = document.getElementById('exc-confusing');

// 1. 슬라이더를 움직일 때마다 글자 수 숫자(16)가 실시간으로 변하게 하는 마법
lengthSlider.addEventListener('input', function() {
    lengthVal.innerText = lengthSlider.value;
});

// 2. 비밀번호 생성 기능
function generatePassword() {
    // 각각의 문자 재료들을 준비합니다.
    let upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let lower = "abcdefghijklmnopqrstuvwxyz";
    let numbers = "0123456789";
    let symbols = "!@#$%^&*()_+~`|}{[]:;?><,./-=";

    // 💡 헷갈리는 문자 제외 옵션이 켜져 있다면, 재료에서 해당 글자들을 싹 지워줍니다.
    if (excConfusing.checked) {
        const confusingChars = /[il1Lo0O]/g; // 정규식: 이 괄호 안의 글자들을 찾으라는 마법
        upper = upper.replace(confusingChars, '');
        lower = lower.replace(confusingChars, '');
        numbers = numbers.replace(confusingChars, '');
    }

    // 사용자가 체크한 옵션에 따라 최종 재료(charset)를 섞어줍니다.
    let charset = "";
    if (incUppercase.checked) charset += upper;
    if (incLowercase.checked) charset += lower;
    if (incNumbers.checked) charset += numbers;
    if (incSymbols.checked) charset += symbols;

    // 아무것도 체크하지 않았을 때의 방어막 (경고창 띄우기)
    if (charset === "") {
        alert("최소 한 가지 이상의 문자 종류를 선택해주세요!");
        return;
    }

    let password = "";
    const length = lengthSlider.value; // 슬라이더에서 설정한 길이를 가져옵니다.

    // 설정한 길이만큼 무작위 뽑기를 반복합니다.
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * charset.length);
        password += charset[randomIndex];
    }

    // 결과를 화면에 띄웁니다.
    document.getElementById('password-result').value = password;
}

// 3. 복사 기능 (기존 코드 유지)
function copyPassword() {
    const passwordInput = document.getElementById('password-result');
    const passwordText = passwordInput.value;

    if (passwordText === "") {
        alert("먼저 비밀번호를 생성해주세요!");
        return;
    }

    navigator.clipboard.writeText(passwordText).then(() => {
        alert('비밀번호가 클립보드에 복사되었습니다! 🚀');
    });
}