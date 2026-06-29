const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const formatSelect = document.getElementById('format-select');
const resultList = document.getElementById('result-list');

// 1. 박스 클릭 시 파일 선택창 열기
uploadBox.addEventListener('click', () => fileInput.click());

// 2. 드래그 앤 드롭 효과 (파일을 끌어다 놓을 때)
uploadBox.addEventListener('dragover', (e) => {
    e.preventDefault();
    uploadBox.classList.add('dragover');
});
uploadBox.addEventListener('dragleave', () => {
    uploadBox.classList.remove('dragover');
});
uploadBox.addEventListener('drop', (e) => {
    e.preventDefault();
    uploadBox.classList.remove('dragover');
    handleFiles(e.dataTransfer.files);
});

// 파일 탐색기에서 선택 시
fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

// 3. 파일 처리 함수 (이미지만 걸러내기)
function handleFiles(files) {
    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            alert(`${file.name} 파일은 이미지가 아닙니다!`);
            return;
        }
        processImage(file);
    });
    fileInput.value = ''; // 초기화하여 같은 파일 또 올릴 수 있게 함
}

// 4. 용량을 예쁘게 표시하는 함수 (바이트 -> KB, MB)
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 5. 핵심! Canvas를 이용한 이미지 변환
function processImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // 보이지 않는 가상의 도화지(canvas)를 만듭니다
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            
            // 도화지에 원본 이미지를 그립니다
            ctx.drawImage(img, 0, 0);

            // 선택한 형식(WebP 등)으로 압축하여 저장합니다 (0.8은 80% 화질을 의미)
            const targetFormat = formatSelect.value;
            const ext = targetFormat.split('/')[1]; 
            const dataUrl = canvas.toDataURL(targetFormat, 0.8);
            
            // 변환된 용량 계산
            const base64str = dataUrl.split(',')[1];
            const decoded = atob(base64str);
            const newSize = decoded.length;

            // 화면에 결과물 카드 추가
            displayResult(file.name, img.src, file.size, newSize, dataUrl, ext);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 6. 결과물 카드를 화면에 그려주는 함수
function displayResult(originalName, imgSrc, oldSize, newSize, dataUrl, ext) {
    const newName = originalName.substring(0, originalName.lastIndexOf('.')) + '.' + ext;
    const percent = Math.round((1 - (newSize / oldSize)) * 100);
    
    // 용량이 줄었는지 늘었는지 화살표로 표시
    let percentText = percent > 0 ? `(<span style="color:#2ecc71;">${percent}% 감소 ⬇️</span>)` 
                                  : `(<span style="color:#e74c3c;">${Math.abs(percent)}% 증가 ⬆️</span>)`;

    const item = document.createElement('div');
    item.className = 'result-item';
    item.innerHTML = `
        <img src="${imgSrc}" alt="미리보기">
        <div class="result-info">
            <strong>${newName}</strong>
            <div class="size-info">
                원본: ${formatBytes(oldSize)} ➔ 변환: <strong>${formatBytes(newSize)}</strong> ${percentText}
            </div>
        </div>
        <a href="${dataUrl}" download="${newName}" class="download-btn">다운로드</a>
    `;
    
    // 가장 최근 변환한 파일이 리스트 맨 위에 오도록 prepend 사용
    resultList.prepend(item);
}