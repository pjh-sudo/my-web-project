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
    
    // 이미지 요소와 캔버스 요소를 모두 찾습니다.
    const qrImage = qrBox.querySelector('img'); 
    const qrCanvas = qrBox.querySelector('canvas'); 

    let imageURI = "";

    // 플랜 A: 이미지가 정상적으로 생성되었고 src 속성(데이터)이 있는 경우 (주로 PC)
    if (qrImage && qrImage.getAttribute('src')) {
        imageURI = qrImage.getAttribute('src');
    }
    // 플랜 B: 이미지는 아직 없지만 캔버스(스케치북)가 있는 경우 (주로 모바일)
    // 캔버스에 그려진 그림을 직접 PNG 이미지 데이터로 변환해서 가져옵니다.
    else if (qrCanvas) {
        imageURI = qrCanvas.toDataURL("image/png");
    }

    // 성공적으로 이미지 데이터를 가져왔다면 다운로드 실행
    if (imageURI) {
        const downloadLink = document.createElement('a');
        downloadLink.href = imageURI; 
        downloadLink.download = 'sosozib_qrcode.png'; 
        downloadLink.click(); 
    } else {
        alert("QR 코드를 먼저 생성해주세요!");
    }
}