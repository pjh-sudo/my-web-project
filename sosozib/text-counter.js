// 1. HTML에서 조작할 요소들(입력창, 결과 숫자들)을 찾아옵니다.
const textInput = document.getElementById('text-input');
const countTotal = document.getElementById('count-total');
const countNoSpace = document.getElementById('count-nospace');

// 2. 'input' 이벤트: 사용자가 키보드를 칠 때마다 실시간으로 이 안의 명령어들이 실행됩니다!
textInput.addEventListener('input', function() {
    // 현재 입력창에 적힌 전체 글자 가져오기
    const text = textInput.value;

    // [기능 A] 공백 포함 글자 수: 단순히 가져온 글자의 길이(.length)를 잽니다.
    countTotal.textContent = text.length;

    // [기능 B] 공백 제외 글자 수: 띄어쓰기와 줄바꿈을 모두 찾아서 ''(빈칸)으로 지워버린 후 길이를 잽니다.
    // (정규표현식 이라는 문법으로 \s 가 모든 형태의 공백을 의미합니다)
    const textWithoutSpace = text.replace(/\s/g, '');
    countNoSpace.textContent = textWithoutSpace.length;
});