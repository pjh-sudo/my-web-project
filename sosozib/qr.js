// '생성하기' 버튼을 누르면 실행될 명령어 묶음입니다.
function generateQR() {
    // 1. 사용자가 입력한 값과 QR코드가 그려질 빈 박스를 찾아옵니다.
    const inputElement = document.getElementById('qr-input');
    const qrBox = document.getElementById('qrcode-box');
    
    // 사용자가 입력한 진짜 텍스트 값
    const textValue = inputElement.value;

    // 2. 만약 아무것도 입력하지 않고 버튼을 눌렀다면? 경고창 띄우기
    if (textValue.trim() === "") {
        alert("변환할 링크나 텍스트를 입력해주세요!");
        return; // 여기서 명령어를 멈춥니다.
    }

    // 3. 이전에 만들어둔 QR코드가 남아있다면 싹 지워줍니다.
    qrBox.innerHTML = "";

    // 4. 미리 불러온 라이브러리(QRCode)를 사용해 마법을 부립니다.
    new QRCode(qrBox, {
        text: textValue,
        width: 200,      // QR코드 가로 크기
        height: 200,     // QR코드 세로 크기
        colorDark: "#000000", // QR코드 색상 (검정)
        colorLight: "#ffffff", // 배경 색상 (하양)
        correctLevel: QRCode.CorrectLevel.H
    });
}