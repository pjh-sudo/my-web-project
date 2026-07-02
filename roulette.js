// 룰렛 돌리기 기능 구현
document.addEventListener('DOMContentLoaded', () => {
    // 기본 선택지 목록
    let options = ['짜장면', '짬뽕', '피자', '치킨', '삼겹살'];
    
    // 예쁘고 조화로운 파스텔/모던 컬러 팔레트
    const colors = [
        '#ff6b6b', // 빨강 계열
        '#4dabf7', // 파랑 계열
        '#fcc419', // 노랑 계열
        '#20c997', // 민트 계열
        '#9b59b6', // 보라 계열
        '#ff922b', // 주황 계열
        '#15aabf', // 청록 계열
        '#ff8787', // 핑크 계열
        '#82c91e'  // 연두 계열
    ];

    const canvas = document.getElementById('roulette-canvas');
    const ctx = canvas.getContext('2d');
    const optionInput = document.getElementById('option-input');
    const addOptionBtn = document.getElementById('add-option-btn');
    const optionListContainer = document.getElementById('option-list-container');
    const spinBtn = document.getElementById('spin-btn');
    const resetBtn = document.getElementById('reset-btn');
    const resultDisplay = document.getElementById('result-display');
    const resultValue = document.getElementById('result-value');

    let currentRotation = 0; // 현재 회전 각도 (라디안)
    let isSpinning = false;
    let audioCtx = null; // 오디오 컨텍스트 (클릭음용)

    // 소리 재생용 오디오 초기화
    function initAudio() {
        if (!audioCtx) {
            audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        }
    }

    // 룰렛 돌아갈 때 째깍거리는 효과음 생성 (Web Audio API)
    function playTickSound() {
        try {
            initAudio();
            if (audioCtx.state === 'suspended') {
                audioCtx.resume();
            }
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime); // 고주파수 클릭음
            osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.05);
            
            gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
            gain.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.05);
            
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } catch (e) {
            console.log('Audio Context Error:', e);
        }
    }

    // 룰렛 그리기 함수
    function drawRoulette(rotationAngle = 0) {
        const N = options.length;
        const cx = canvas.width / 2;
        const cy = canvas.height / 2;
        const r = Math.min(cx, cy) - 15; // 외곽선 패딩

        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (N === 0) {
            // 선택지가 없을 때 빈 화면
            ctx.beginPath();
            ctx.arc(cx, cy, r, 0, 2 * Math.PI);
            ctx.fillStyle = '#f1f3f5';
            ctx.fill();
            ctx.strokeStyle = '#dee2e6';
            ctx.lineWidth = 5;
            ctx.stroke();
            
            ctx.fillStyle = '#adb5bd';
            ctx.font = 'bold 20px Pretendard, sans-serif';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('선택지를 추가해 주세요', cx, cy);
            return;
        }

        const arc = 2 * Math.PI / N;

        for (let i = 0; i < N; i++) {
            const startAngle = i * arc + rotationAngle;
            const endAngle = (i + 1) * arc + rotationAngle;

            // 1. 부채꼴 그리기
            ctx.beginPath();
            ctx.moveTo(cx, cy);
            ctx.arc(cx, cy, r, startAngle, endAngle);
            ctx.fillStyle = colors[i % colors.length];
            ctx.fill();

            // 흰색 구분선 그리기
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
            ctx.stroke();

            // 2. 텍스트 배치
            ctx.save();
            ctx.translate(cx, cy);
            
            // 글자 각도 정렬 (부채꼴의 중앙을 향하도록 설정)
            const textAngle = startAngle + arc / 2;
            ctx.rotate(textAngle);

            // 글씨 크기는 칸 수가 많아질수록 작아지게 반응형 조절
            const fontSize = Math.max(14, Math.min(24, 28 - Math.floor(N * 0.8)));
            ctx.font = `bold ${fontSize}px Pretendard, sans-serif`;
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'right';
            ctx.textBaseline = 'middle';

            // 그림자 효과로 글씨 가독성 업
            ctx.shadowColor = 'rgba(0, 0, 0, 0.25)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            // 텍스트를 부채꼴 바깥쪽으로 배치 (r - 40 위치)
            const text = options[i];
            
            // 텍스트가 너무 길면 말줄임표 처리
            let renderedText = text;
            if (text.length > 7) {
                renderedText = text.substring(0, 6) + '..';
            }
            
            ctx.fillText(renderedText, r - 35, 0);
            ctx.restore();
        }

        // 테두리 입체 효과용 바깥 고리
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, 2 * Math.PI);
        ctx.strokeStyle = '#2b3a55';
        ctx.lineWidth = 6;
        ctx.stroke();
    }

    // 선택지 태그 UI 렌더링
    function renderOptionList() {
        optionListContainer.innerHTML = '';
        
        if (options.length === 0) {
            optionListContainer.innerHTML = '<span class="options-empty-msg">선택지가 비어 있습니다. 항목을 추가해 보세요!</span>';
            return;
        }

        options.forEach((option, idx) => {
            const tag = document.createElement('div');
            tag.className = 'option-tag';
            tag.innerHTML = `
                <span>${option}</span>
                <button class="remove-btn" data-index="${idx}">&times;</button>
            `;
            optionListContainer.appendChild(tag);
        });

        // 삭제 버튼 이벤트
        document.querySelectorAll('.remove-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (isSpinning) return;
                const index = parseInt(e.target.getAttribute('data-index'));
                options.splice(index, 1);
                renderOptionList();
                drawRoulette(currentRotation);
            });
        });
    }

    // 선택지 추가
    function addOption() {
        if (isSpinning) return;
        
        const value = optionInput.value.trim();
        if (!value) {
            alert('내용을 입력해 주세요.');
            return;
        }
        
        if (options.length >= 24) {
            alert('선택지는 최대 24개까지만 등록 가능합니다.');
            return;
        }

        options.push(value);
        optionInput.value = '';
        renderOptionList();
        drawRoulette(currentRotation);
        optionInput.focus();
    }

    // 추가 버튼 및 엔터키 연결
    addOptionBtn.addEventListener('click', addOption);
    optionInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            addOption();
        }
    });

    // 룰렛 돌리기 애니메이션
    function spin() {
        if (isSpinning) return;
        if (options.length < 2) {
            alert('최소 2개 이상의 선택지가 필요합니다.');
            return;
        }

        initAudio(); // 클릭음 초기화
        isSpinning = true;
        spinBtn.disabled = true;
        resetBtn.disabled = true;
        optionInput.disabled = true;
        addOptionBtn.disabled = true;
        resultDisplay.style.display = 'none';

        // 회전 가속도 및 무작위 설정
        const startRotation = currentRotation % (2 * Math.PI);
        const randomSpins = 4 + Math.random() * 4; // 바퀴 도는 수 (4~8 바퀴)
        const targetRotation = startRotation + randomSpins * 2 * Math.PI + (Math.random() * 2 * Math.PI);
        
        const duration = 3500; // 3.5초
        let startTime = null;
        let lastTickAngle = 0; // 지난 째깍음의 누적 회전 각도

        function animate(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Ease-Out Cubic 감속 공식 적용
            const easeOut = 1 - Math.pow(1 - progress, 3);
            currentRotation = startRotation + (targetRotation - startRotation) * easeOut;

            // 째깍 째깍 소리 타이밍 체크 (일정 각도 넘어갈 때마다 재생)
            const arc = 2 * Math.PI / options.length;
            const totalDiff = currentRotation - lastTickAngle;
            if (totalDiff >= arc) {
                playTickSound();
                lastTickAngle = currentRotation;
            }

            drawRoulette(currentRotation);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                finishSpin();
            }
        }

        requestAnimationFrame(animate);
    }

    // 회전 완료 후 결과 도출
    function finishSpin() {
        isSpinning = false;
        spinBtn.disabled = false;
        resetBtn.disabled = false;
        optionInput.disabled = false;
        addOptionBtn.disabled = false;

        const N = options.length;
        const arc = 2 * Math.PI / N;
        
        // 룰렛의 지시침 화살표는 맨 위쪽인 12시 방향 (Math.PI * 1.5)에 고정되어 있음.
        // 현재 각도에서 화살표에 걸린 인덱스를 계산하는 공식:
        // 바늘의 기준점은 Math.PI * 1.5
        let theta = (Math.PI * 1.5 - currentRotation) % (2 * Math.PI);
        if (theta < 0) {
            theta += 2 * Math.PI;
        }

        const winnerIndex = Math.floor(theta / arc) % N;
        const winner = options[winnerIndex];

        // 결과 표시
        resultValue.innerText = winner;
        resultDisplay.style.display = 'block';
        
        // 간단한 팡파레 클릭음 재생
        playWinEffect();
    }

    // 당첨 연출 소리
    function playWinEffect() {
        try {
            if (!audioCtx) return;
            const notes = [523.25, 659.25, 783.99, 1046.50]; // 도-미-솔-도 코드음
            notes.forEach((freq, i) => {
                setTimeout(() => {
                    const osc = audioCtx.createOscillator();
                    const gain = audioCtx.createGain();
                    osc.connect(gain);
                    gain.connect(audioCtx.destination);
                    osc.type = 'sine';
                    osc.frequency.setValueAtTime(freq, audioCtx.currentTime);
                    gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
                    gain.gain.linearRampToValueAtTime(0.001, audioCtx.currentTime + 0.3);
                    osc.start();
                    osc.stop(audioCtx.currentTime + 0.3);
                }, i * 100);
            });
        } catch (e) {
            console.log(e);
        }
    }

    // 초기화 (모든 선택지 삭제)
    resetBtn.addEventListener('click', () => {
        if (isSpinning) return;
        if (confirm('등록된 모든 선택지를 삭제하시겠습니까?')) {
            options = [];
            currentRotation = 0;
            resultDisplay.style.display = 'none';
            renderOptionList();
            drawRoulette(currentRotation);
        }
    });

    // 돌리기 버튼 이벤트 바인딩
    spinBtn.addEventListener('click', spin);

    // 최초 렌더링
    renderOptionList();
    drawRoulette(currentRotation);
});
