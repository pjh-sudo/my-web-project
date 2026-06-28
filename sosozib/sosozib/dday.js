function calculateDday() {
    // 1. 사용자가 입력한 제목과 날짜를 가져옵니다.
    const titleInput = document.getElementById('dday-title').value;
    const dateInput = document.getElementById('dday-date').value;

    // 날짜를 선택하지 않았다면 경고창 띄우기
    if (!dateInput) {
        alert("디데이 날짜를 선택해주세요!");
        return;
    }

    // 2. 자바스크립트의 날짜(Date) 마법 꺼내기
    const targetDate = new Date(dateInput); // 사용자가 선택한 날짜
    const today = new Date();               // 현재 날짜와 시간

    // 정확한 일수 계산을 위해 자잘한 시간(시, 분, 초)은 모두 0으로 초기화합니다.
    targetDate.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);

    // 3. 두 날짜의 차이 계산하기 
    // getTime()을 쓰면 날짜를 '밀리초(1000분의 1초)'라는 엄청 큰 숫자로 바꿔줍니다.
    const diff = targetDate.getTime() - today.getTime();

    // 밀리초를 다시 우리가 아는 '일(Day)' 단위로 변환합니다.
    // 공식: (1000밀리초 * 60초 * 60분 * 24시간) 으로 나누기
    const diffDays = Math.ceil(diff / (1000 * 60 * 60 * 24));

    // 4. 결과 화면에 띄우기 준비
    let resultTitleText = titleInput ? titleInput : "목표일"; // 제목이 비어있으면 '목표일'로 표시
    let resultNumberText = "";

    // 날짜 차이에 따라 다르게 표시하기 (과거, 미래, 오늘)
    if (diffDays > 0) {
        resultTitleText += "까지";
        resultNumberText = "D - " + diffDays;
    } else if (diffDays === 0) {
        resultNumberText = "D-Day! 🎉";
    } else {
        resultTitleText += "로부터";
        // 과거인 경우 음수(-)가 나오므로 Math.abs()를 써서 양수로 바꿔줍니다.
        resultNumberText = "D + " + Math.abs(diffDays);
    }

    // 5. HTML 화면에 글자 집어넣기
    document.getElementById('result-title').innerText = resultTitleText;
    document.getElementById('result-number').innerText = resultNumberText;
    // 1. 페이지가 로드될 때 저장된 날짜가 있는지 확인하고 가져오기
}
