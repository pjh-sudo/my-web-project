// 1. '생성하기' 버튼을 누르면 실행될 명령어
function generateQR() {
    const inputElement = document.getElementById('qr-input');
    const qrBox = document.getElementById('qrcode-box');
    const downloadBtn = document.getElementById('download-btn'); // 다운로드 버튼 찾기
    const textValue = inputElement.value;

    if (textValue.trim() === "") {
        alert("변환할 링크나 텍스트를 입력해주세요!");
        return; 
    }

    qrBox.innerHTML = ""; // 기존 QR 지우기

    // 라이브러리를 사용해 QR코드 생성
    new QRCode(qrBox, {
        text: textValue,
        width: 200,      
        height: 200,     
        colorDark: "#000000", 
        colorLight: "#ffffff", 
        correctLevel: QRCode.CorrectLevel.H
    });

    // 💡 QR 코드가 만들어졌으니 숨겨뒀던 다운로드 버튼을 짠! 하고 보여줍니다.
    // 약간의 시간 차(0.1초)를 두어 QR 코드가 완전히 그려진 후 나타나게 합니다.
    setTimeout(() => {
        downloadBtn.style.display = 'block';
    }, 100);
}

// 2. 🚀 새롭게 추가된 '다운로드' 기능
function downloadQR() {
    const qrBox = document.getElementById('qrcode-box');
    
    // qrcode.js 라이브러리는 우리 몰래 <img> 태그 안에 QR코드를 그립니다. 그 이미지를 찾아옵니다.
    const qrImage = qrBox.querySelector('img'); 

    if (qrImage && qrImage.src) {
        // 다운로드를 위한 임시 하이퍼링크(<a> 태그)를 자바스크립트로 몰래 만듭니다.
        const downloadLink = document.createElement('a');
        downloadLink.href = qrImage.src; // 이미지 주소 복사
        downloadLink.download = 'sosozib_qrcode.png'; // 저장될 파일 이름 설정
        
        // 사용자가 링크를 클릭한 것처럼 컴퓨터가 대신 클릭하게 만듭니다!
        downloadLink.click(); 
    } else {
        alert("QR 코드를 먼저 생성해주세요!");
    }
}