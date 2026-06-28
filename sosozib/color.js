// 1. 랜덤한 색상 코드(HEX)를 만들어내는 마법의 주문입니다.
function getRandomHex() {
    // 16진수(0~f)로 이루어진 6자리 색상 코드를 무작위로 생성합니다.
    return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
}

// 2. 팔레트에 5가지 색상을 칠해주는 메인 기능
// 2. 팔레트에 색상을 칠해주는 메인 기능 (잠금 기능 추가!)
function generatePalette() {
    const container = document.getElementById('palette-container');

    // 💡 핵심 1: 기둥이 하나도 없을 때(처음 로딩 시)만 5개의 빈 기둥을 만듭니다.
    if (container.children.length === 0) {
        for(let i = 0; i < 5; i++) {
            const box = document.createElement('div');
            box.className = 'color-box';

            // 자물쇠 버튼 만들기
            const lockBtn = document.createElement('button');
            lockBtn.className = 'lock-btn';
            lockBtn.innerText = '🔓'; // 기본은 열린 자물쇠

            // 자물쇠를 클릭했을 때의 기능
            lockBtn.onclick = (event) => {
                // 💡 핵심 2: 클릭이 부모(기둥)로 번져서 색상이 '복사'되는 것을 막아줍니다! (이벤트 전파 중단)
                event.stopPropagation(); 
                
                // 기둥에 'locked'라는 이름표를 붙였다 뗐다 합니다.
                box.classList.toggle('locked'); 
                // 이름표가 있으면 잠긴 아이콘, 없으면 열린 아이콘으로 변경
                lockBtn.innerText = box.classList.contains('locked') ? '🔒' : '🔓'; 
            };

            // 색상 코드 라벨 만들기
            const codeLabel = document.createElement('span');
            codeLabel.className = 'color-code';

            // 기둥 클릭 시 복사 기능
            box.onclick = () => copyColor(codeLabel.innerText);

            // 기둥 안에 자물쇠와 라벨을 넣고, 팔레트에 기둥을 넣습니다.
            box.appendChild(lockBtn);
            box.appendChild(codeLabel);
            container.appendChild(box);
        }
    }

    // 💡 핵심 3: 만들어진 5개의 기둥을 돌면서, 'locked' 이름표가 없는 기둥만 색을 바꿉니다.
    const boxes = container.children;
    for(let i = 0; i < 5; i++) {
        const box = boxes[i];
        
        // 기둥이 안 잠겼다면(!box.classList.contains('locked'))
        if (!box.classList.contains('locked')) {
            const randomColor = getRandomHex();
            box.style.backgroundColor = randomColor; // 배경색 새로 칠하기
            box.querySelector('.color-code').innerText = randomColor; // 라벨 글자 새로 바꾸기
        }
    }
}

// 3. 클릭한 색상 코드를 클립보드에 복사하는 기능
function copyColor(colorCode) {
    navigator.clipboard.writeText(colorCode).then(() => {
        // 💡 기존의 딱딱한 alert 창은 지우거나 주석 처리했습니다!
        // alert(colorCode + ' 색상이 복사되었습니다!🎨');

        // HTML에 만들어둔 토스트 박스를 찾아옵니다.
        const toast = document.getElementById('toast');
        
        // 안에 들어갈 글자를 방금 복사한 색상 코드로 바꿔줍니다.
        toast.innerText = colorCode + ' 색상이 복사되었습니다! 🎨'; 
        
        // CSS에서 만들어둔 'show' 클래스를 붙여서 화면에 나타나게 합니다.
        toast.classList.add('show'); 

        // 💡 핵심: 2초(2000밀리초) 뒤에 다시 'show' 클래스를 떼어서 스르륵 사라지게 합니다.
        setTimeout(() => {
            toast.classList.remove('show');
        }, 2000);
    });
}

// 4. 페이지가 처음 열릴 때 자동으로 한 번 실행해서 빈 화면이 안 나오게 해줍니다.
generatePalette();

// 5. 키보드 스페이스바 이벤트 감지하기
document.addEventListener('keydown', function(event) {
    // 사용자가 누른 키가 스페이스바('Space')인지 확인합니다.
    if (event.code === 'Space') {
        // 스페이스바를 누를 때 웹페이지가 밑으로 스크롤되는 기본 동작을 막아줍니다.
        event.preventDefault(); 
        
        // 색상을 새로 칠하는 기존 함수를 다시 실행합니다.
        generatePalette(); 
    }
});