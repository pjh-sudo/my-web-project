const textInput = document.getElementById('text-input');
const countWithSpaces = document.getElementById('count-with-spaces');
const countWithoutSpaces = document.getElementById('count-without-spaces');

// 1. 타자를 칠 때마다 실시간으로 글자 수 세기
textInput.addEventListener('input', function() {
    const text = textInput.value;

    // [공백 포함] 글자 수: 단순히 전체 길이를 구합니다.
    countWithSpaces.innerText = text.length;

    // [공백 제외] 글자 수: 정규식(/\s+/g)이라는 마법을 써서 띄어쓰기와 줄바꿈을 모두 없앤 뒤 길이를 구합니다.
    const textWithoutSpaces = text.replace(/\s+/g, '');
    countWithoutSpaces.innerText = textWithoutSpaces.length;
});

// 2. 전체 지우기 (초기화) 기능
function clearText() {
    // 텍스트 창 비우기
    textInput.value = ''; 
    
    // 화면에 표시된 숫자도 0으로 돌려놓기
    countWithSpaces.innerText = '0';
    countWithoutSpaces.innerText = '0';
    
    // 버튼을 누른 후 바로 다시 타이핑할 수 있도록 입력창에 커서를 깜빡이게 둡니다.
    textInput.focus(); 
}