const uploadBox = document.getElementById('upload-box');
const fileInput = document.getElementById('file-input');
const formatSelect = document.getElementById('format-select');
const resultList = document.getElementById('result-list');
const downloadZipBtn = document.getElementById('download-zip-btn'); // 🚀 ZIP 버튼
const qualitySlider = document.getElementById('quality-slider');
const qualityInput = document.getElementById('quality-input');
// 기존 변수들 아래에 추가
const resizeSelect = document.getElementById('resize-select');

let convertedFiles = []; // 🚀 변환된 파일들을 모아둘 빈 바구니

qualitySlider.addEventListener('input', () => {
    qualityInput.value = qualitySlider.value;
});

// 2. 입력창에 숫자를 타이핑하는 '도중'에는 100 초과만 막기
qualityInput.addEventListener('input', () => {
    let val = parseInt(qualityInput.value);
    
    // 숫자가 아니거나 비어있으면 일단 무시 (지우는 과정 허용)
    if (isNaN(val)) return; 
    
    // 100이 넘는 숫자만 입력 즉시 100으로 고정
    if (val > 100) qualityInput.value = 100;
    
    qualitySlider.value = qualityInput.value;
});

// 3. 입력을 '완전히 마쳤을 때(바깥 클릭 or 엔터)' 최소값(10) 강제 적용
qualityInput.addEventListener('change', () => {
    let val = parseInt(qualityInput.value);
    
    // 비어있거나 10 미만인 숫자를 최종 입력했다면 10으로 강제 고정
    if (isNaN(val) || val < 10) {
        qualityInput.value = 10;
        qualitySlider.value = 10;
    }
});

// 1. 박스 클릭 시 파일 선택창 열기
uploadBox.addEventListener('click', () => fileInput.click());

// 2. 드래그 앤 드롭 효과
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

fileInput.addEventListener('change', (e) => handleFiles(e.target.files));

// 3. 파일 처리 함수 (바구니 초기화 추가)
function handleFiles(files) {
    // 🚀 새 파일들을 올리면 기존 바구니와 결과 리스트를 비웁니다 (깔끔하게 새로 시작)
    convertedFiles = [];
    resultList.innerHTML = '';
    downloadZipBtn.style.display = 'none';

    Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) {
            alert(`${file.name} 파일은 이미지가 아닙니다!`);
            return;
        }
        processImage(file);
    });
    fileInput.value = ''; 
}

// 4. 용량을 예쁘게 표시하는 함수
function formatBytes(bytes) {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// 5. 이미지 변환 및 바구니에 담기
function processImage(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            
            // 🚀 핵심: 선택한 축소 비율(1, 0.75, 0.5 등)을 가져옵니다.
            const scale = parseFloat(resizeSelect.value);
            
            // 도화지의 가로세로 크기를 비율만큼 줄여서 만듭니다.
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            
            const ctx = canvas.getContext('2d');
            
            // 🚀 줄어든 도화지 크기(canvas.width, height)에 꽉 차게 원본 이미지를 압축해서 그립니다!
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            const targetFormat = formatSelect.value;
            const ext = targetFormat.split('/')[1]; 
            const quality = parseInt(qualityInput.value) / 100;
            const dataUrl = canvas.toDataURL(targetFormat, quality);
            
            const base64str = dataUrl.split(',')[1];
            const decoded = atob(base64str);
            const newSize = decoded.length;

            const newName = file.name.substring(0, file.name.lastIndexOf('.')) + '.' + ext;

            // 🚀 변환된 파일 데이터를 바구니에 담기
            convertedFiles.push({ name: newName, data: base64str });

            // 🚀 파일이 하나라도 변환되면 ZIP 다운로드 버튼 보여주기
            downloadZipBtn.style.display = 'inline-block';

            displayResult(newName, img.src, file.size, newSize, dataUrl);
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// 6. 결과물 카드 그리기
function displayResult(newName, imgSrc, oldSize, newSize, dataUrl) {
    const percent = Math.round((1 - (newSize / oldSize)) * 100);
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
    resultList.prepend(item);
}

// 🚀 7. 핵심! ZIP 버튼 클릭 시 압축해서 다운로드하기
downloadZipBtn.addEventListener('click', () => {
    const zip = new JSZip(); // 빈 압축 파일 생성
    
    // 바구니에 있는 파일들을 압축 파일 안에 하나씩 넣기
    convertedFiles.forEach(file => {
        zip.file(file.name, file.data, {base64: true});
    });
    
    // 압축 완료 후 브라우저에서 다운로드 실행
    zip.generateAsync({type:"blob"}).then(function(content) {
        const link = document.createElement('a');
        link.href = URL.createObjectURL(content);
        link.download = "sosozib_images.zip"; // 다운로드될 압축파일 이름
        link.click();
    });
});