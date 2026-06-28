// 1. 비밀번호 생성 기능
function generatePassword() {
    // 비밀번호 길이 설정 (기본 16자리)
    const length = 16; 
    
    // 비밀번호에 쓰일 재료들 (소문자, 대문자, 숫자, 특수기호)
    const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
    
    // 완성된 비밀번호를 담을 빈 바구니
    let password = "";

    // length(16번)만큼 반복해서 무작위로 글자를 뽑습니다.
    for (let i = 0; i < length; i++) {
        // charset의 전체 길이 안에서 무작위 숫자(위치)를 하나 고릅니다.
        const randomIndex = Math.floor(Math.random() * charset.length);
        // 고른 위치의 글자를 바구니에 추가합니다.
        password += charset[randomIndex];
    }

    // 완성된 비밀번호를 화면의 입력창에 띄워줍니다.
    document.getElementById('password-result').value = password;
}

// 2. 클립보드 복사 기능
function copyPassword() {
    const passwordInput = document.getElementById('password-result');

    // 빈칸인데 복사 버튼을 누른 경우 방지
    if (passwordInput.value === "") {
        alert("먼저 비밀번호를 생성해주세요!");
        return;
    }

    // 최신 자바스크립트 기능(navigator.clipboard)을 이용해 복사합니다.
    navigator.clipboard.writeText(passwordInput.value).then(function() {
        alert("비밀번호가 복사되었습니다! 원하는 곳에 붙여넣기 하세요.");
    });
}