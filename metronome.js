// 소소집 메트로놈 & 탭 BPM 로직

// 1. 설정 및 상태 변수
let bpm = 120;
let beatsPerMeasure = 4;
let subdivision = 1; // 1 = 4분음표, 2 = 8분음표, 3 = 셋잇단음표, 4 = 16분음표
let soundType = 'cowbell'; // 'cowbell', 'sine', 'woodblock', 'tick'
let volume = 0.8;
let isPlaying = false;
let isMuted = false;

// 2. Web Audio API 스케줄러 변수
let audioCtx = null;
let nextNoteTime = 0.0;        // 다음 비트가 연주될 절대 오디오 시각(초)
let currentBeatInMeasure = 0;  // 마디 안에서의 현재 박자 (0 ~ beatsPerMeasure-1)
let currentSubdivisionIndex = 0; // 박자 안에서의 현재 세분박자 (0 ~ subdivision-1)
const lookahead = 25.0;        // 스케줄러 호출 빈도(ms)
const scheduleAheadTime = 0.1; // 스케줄러가 오디오를 예약해둘 미래 구간(초)
let schedulerTimerID = null;

// 3. 비주얼 애니메이션 동기화 변수
let lastAudioTime = 0.0;
let pendulumPhase = 0.0;
const maxAngle = 35; // 메트로놈 추가 스윙할 최대 각도(도)
let lastAnimationFrameID = null;
let notesInQueue = []; // 오디오 재생 시간과 화면 업데이트 시각을 동기화하기 위한 큐

// 4. 탭 BPM 변수
let tapTimes = [];

// 5. 클래식 템포 기호 사전 정의
const TEMPOS = [
    { name: "Largo (아주 느리게)", min: 40, max: 60, defaultBpm: 50 },
    { name: "Adagio (느리게)", min: 60, max: 76, defaultBpm: 68 },
    { name: "Andante (느리게 걷는 빠르기로)", min: 76, max: 108, defaultBpm: 92 },
    { name: "Moderato (보통 빠르게)", min: 108, max: 120, defaultBpm: 114 },
    { name: "Allegro (빠르게)", min: 120, max: 168, defaultBpm: 144 },
    { name: "Presto (아주 빠르게)", min: 168, max: 200, defaultBpm: 184 },
    { name: "Prestissimo (성급하게 빠르게)", min: 200, max: 280, defaultBpm: 240 }
];

// 6. DOM 요소 취득
const bpmDisplay = document.getElementById('bpm-display');
const tempoName = document.getElementById('tempo-name');
const bpmSlider = document.getElementById('bpm-slider');
const btnPlayPause = document.getElementById('btn-play-pause');
const playPauseIcon = document.getElementById('play-pause-icon');
const playPauseText = document.getElementById('play-pause-text');
const btnTap = document.getElementById('btn-tap');
const selectBeats = document.getElementById('select-beats');
const selectSubdivision = document.getElementById('select-subdivision');
const selectSound = document.getElementById('select-sound');
const volumeSlider = document.getElementById('volume-slider');
const btnMute = document.getElementById('btn-mute');
const beatIndicators = document.getElementById('beat-indicators');
const tempoTableBody = document.getElementById('tempo-table-body');
const metronomeCard = document.getElementById('metronome-card');

// 7. 초기화 실행
function init() {
    renderBeatIndicators();
    renderTempoTable();
    updateBpm(bpm, false); // 슬라이더와 텍스트 연동
    setupEventListeners();
}

// 8. LED 박자 표시기 그리기
function renderBeatIndicators() {
    beatIndicators.innerHTML = '';
    for (let i = 0; i < beatsPerMeasure; i++) {
        const dot = document.createElement('div');
        dot.classList.add('beat-dot');
        if (i === 0) {
            dot.classList.add('accent-type'); // 첫 박 강세 표시용
        }
        dot.id = `beat-dot-${i}`;
        beatIndicators.appendChild(dot);
    }
}

// 9. 클래식 속도 사전 테이블 렌더링
function renderTempoTable() {
    tempoTableBody.innerHTML = '';
    TEMPOS.forEach(tempo => {
        const row = document.createElement('tr');
        row.id = `tempo-row-${tempo.min}`;
        row.innerHTML = `
            <td style="font-weight: 700; color: var(--point-color);">${tempo.name.split(' ')[0]}</td>
            <td style="color: var(--text-sub);">${tempo.name.split('(')[1].replace(')', '')}</td>
            <td style="font-family: monospace; font-weight: 600;">${tempo.min} ~ ${tempo.max} BPM</td>
            <td><button class="apply-tempo-btn" data-bpm="${tempo.defaultBpm}">적용</button></td>
        `;
        tempoTableBody.appendChild(row);
    });
    
    // 테이블 내 '적용' 버튼 이벤트 핸들러 바인딩
    const applyBtns = tempoTableBody.querySelectorAll('.apply-tempo-btn');
    applyBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const targetBpm = parseInt(e.target.getAttribute('data-bpm'));
            updateBpm(targetBpm);
        });
    });
}

// 10. BPM 변경 및 UI 동기화
function updateBpm(newBpm, shouldSave = true) {
    bpm = Math.max(20, Math.min(280, newBpm));
    
    // UI 표시 업데이트
    bpmDisplay.textContent = bpm;
    bpmSlider.value = bpm;
    
    // 템포 기호 텍스트 갱신
    let matchedTempoText = "Moderato (보통 빠르게)";
    const currentTempo = TEMPOS.find(t => bpm >= t.min && bpm <= t.max);
    if (currentTempo) {
        matchedTempoText = currentTempo.name;
    } else if (bpm < 40) {
        matchedTempoText = "Grave (가장 느리고 장중하게)";
    }
    tempoName.textContent = matchedTempoText;
    
    // 테이블 내 행 하이라이팅
    const rows = tempoTableBody.querySelectorAll('tr');
    rows.forEach(r => r.classList.remove('active-row'));
    if (currentTempo) {
        const activeRow = document.getElementById(`tempo-row-${currentTempo.min}`);
        if (activeRow) activeRow.classList.add('active-row');
    }
}

// 11. Web Audio API 신디사이저: 비트 소리 생성
function playSound(time, isAccent, isSubBeat) {
    if (isMuted || volume === 0) return;
    
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    // 음 높이 설정 (Accent Beat: 고음, Regular Beat: 중음, Subdivision: 저음)
    let frequency = 587.33; // 기본: D5
    if (isAccent) {
        frequency = 880.00; // 강박: A5
    } else if (isSubBeat) {
        frequency = 440.00; // 분할박: A4
    }
    
    // 볼륨 조절
    let currentVolume = volume;
    if (isSubBeat) {
        currentVolume *= 0.35; // 분할박은 조용하게
    } else if (!isAccent) {
        currentVolume *= 0.65; // 일반 박은 강박의 65% 볼륨
    }
    
    gainNode.gain.setValueAtTime(0, time);
    
    if (soundType === 'cowbell') {
        // 1) 전자식 카우벨: 불협화 화음을 스퀘어파로 합성하여 밴드패스 필터를 통과
        const osc2 = audioCtx.createOscillator();
        const bandpass = audioCtx.createBiquadFilter();
        
        bandpass.type = 'bandpass';
        bandpass.frequency.value = frequency * 1.5;
        bandpass.Q.value = 3;
        
        osc.type = 'square';
        osc.frequency.value = frequency;
        
        osc2.type = 'square';
        osc2.frequency.value = frequency * 1.48; // 불협화음 간격
        
        osc.disconnect(gainNode);
        osc.connect(bandpass);
        osc2.connect(bandpass);
        bandpass.connect(gainNode);
        
        osc.start(time);
        osc2.start(time);
        
        osc.stop(time + 0.15);
        osc2.stop(time + 0.15);
        
        gainNode.gain.linearRampToValueAtTime(currentVolume * 0.5, time + 0.003);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.12);
        
    } else if (soundType === 'woodblock') {
        // 2) 우드블록: 사인파를 고주파 영역에서 극도로 짧게 방출
        osc.type = 'sine';
        osc.frequency.value = frequency * 2.2;
        
        osc.start(time);
        osc.stop(time + 0.07);
        
        gainNode.gain.linearRampToValueAtTime(currentVolume * 0.75, time + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.04);
        
    } else if (soundType === 'tick') {
        // 3) 아날로그 클릭: 삼각형파에 하이패스 필터를 씌워 기계식 째깍 소리 구현
        osc.type = 'triangle';
        osc.frequency.value = frequency * 0.8;
        
        const filter = audioCtx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 1500;
        filter.Q.value = 2.5;
        
        osc.disconnect(gainNode);
        osc.connect(filter);
        filter.connect(gainNode);
        
        osc.start(time);
        osc.stop(time + 0.03);
        
        gainNode.gain.linearRampToValueAtTime(currentVolume * 0.9, time + 0.001);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.015);
        
    } else {
        // 4) 사인 비프: 맑고 정직한 컴퓨터 알림음
        osc.type = 'sine';
        osc.frequency.value = frequency;
        
        osc.start(time);
        osc.stop(time + 0.1);
        
        gainNode.gain.linearRampToValueAtTime(currentVolume * 0.6, time + 0.004);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
    }
}

// 12. 스케줄링 메커니즘
function nextNote() {
    // 1분(60초)당 비트 수에 세분박을 곱하여 간격을 계산
    const secondsPerSubdivision = (60.0 / bpm) / subdivision;
    nextNoteTime += secondsPerSubdivision;
    
    // 세분박 인덱스 증가
    currentSubdivisionIndex++;
    if (currentSubdivisionIndex >= subdivision) {
        currentSubdivisionIndex = 0;
        
        // 메인 박자 인덱스 증가
        currentBeatInMeasure++;
        if (currentBeatInMeasure >= beatsPerMeasure) {
            currentBeatInMeasure = 0;
        }
    }
}

function scheduleNote(beatIndex, subIndex, time) {
    const isAccent = (beatIndex === 0 && subIndex === 0);
    const isSubBeat = (subIndex > 0);
    
    // 오디오 합성음 예약 실행
    playSound(time, isAccent, isSubBeat);
    
    // 애니메이션 큐에 저장 (시각적 업데이트 타이밍 맞추기 위함)
    notesInQueue.push({
        beat: beatIndex,
        subBeat: subIndex,
        isAccent: isAccent,
        isSubBeat: isSubBeat,
        time: time
    });
}

function scheduler() {
    // 스케줄러가 주기적으로 돌면서 미래의 비트들을 예약
    while (nextNoteTime < audioCtx.currentTime + scheduleAheadTime) {
        scheduleNote(currentBeatInMeasure, currentSubdivisionIndex, nextNoteTime);
        nextNote();
    }
}

// 13. 프레임 단위 시각 동기화 그리기 루프
function drawAnimation() {
    if (!isPlaying) return;
    
    const currentAudioTime = audioCtx.currentTime;
    
    // 오디오 시간 기준 큐를 순회하며 이미 예약시간이 도래한 비트에 대해 시각 피드백 발동
    while (notesInQueue.length && notesInQueue[0].time < currentAudioTime) {
        const note = notesInQueue.shift();
        triggerVisualBeat(note.beat, note.subBeat, note.isAccent, note.isSubBeat);
    }
    
    // 펜듈럼 (추) 물리 움직임 계산 및 렌더링
    updatePendulumVisual(currentAudioTime);
    
    lastAudioTime = currentAudioTime;
    lastAnimationFrameID = requestAnimationFrame(drawAnimation);
}

// 14. 펜듈럼 추 갱신 (위상 고정형으로 속도 변경 시 끊김 방지)
function updatePendulumVisual(currentAudioTime) {
    let dt = currentAudioTime - lastAudioTime;
    if (dt > 0.1) dt = 0.1; // 비정상 프레임 지연 제한
    if (dt < 0) dt = 0;
    
    // 1회 왕복 진동 주기 = 2비트
    // 각속도 w = 2 * PI * (bpm / 120) = PI * bpm / 60
    const omega = (Math.PI * bpm) / 60;
    
    pendulumPhase += dt * omega;
    if (pendulumPhase > Math.PI * 2) {
        pendulumPhase -= Math.PI * 2;
    }
    
    const angle = Math.cos(pendulumPhase) * maxAngle;
    const arm = document.getElementById('pendulum-arm');
    if (arm) {
        arm.style.transform = `rotate(${angle}deg)`;
    }
}

// 15. 시각적 비트 반응 효과
function triggerVisualBeat(beatIndex, subIndex, isAccent, isSubBeat) {
    // 메인 정박(subIndex === 0)에만 LED 전구를 켬
    if (subIndex === 0) {
        const dots = beatIndicators.querySelectorAll('.beat-dot');
        dots.forEach((dot, idx) => {
            if (idx === beatIndex) {
                dot.classList.add('active');
                
                // 템포가 빠르면 깜빡임 속도도 비례해서 빠르게 복구
                const flashDuration = Math.min(150, (30000 / bpm));
                setTimeout(() => {
                    dot.classList.remove('active');
                }, flashDuration);
            } else {
                dot.classList.remove('active');
            }
        });
        
        // 카드 배경에 미세한 섬광 효과 부여
        const flashColor = isAccent ? 'rgba(255, 146, 43, 0.04)' : 'rgba(116, 143, 252, 0.02)';
        metronomeCard.style.backgroundColor = flashColor;
        setTimeout(() => {
            metronomeCard.style.backgroundColor = '';
        }, 80);
    }
}

// 16. 메트로놈 제어 함수 (시작 / 정지)
function togglePlayPause() {
    // 오디오 컨텍스트 초기 생성 및 해제 방지
    if (!audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioCtx = new AudioContext();
    }
    
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    
    if (isPlaying) {
        // 정지 모드
        isPlaying = false;
        document.body.classList.remove('playing');
        btnPlayPause.classList.remove('playing');
        playPauseIcon.textContent = '▶';
        playPauseText.textContent = 'START';
        
        clearInterval(schedulerTimerID);
        cancelAnimationFrame(lastAnimationFrameID);
        notesInQueue = [];
        
        // 펜듈럼 중앙 복귀
        const arm = document.getElementById('pendulum-arm');
        if (arm) {
            arm.style.transform = 'rotate(0deg)';
        }
        pendulumPhase = 0.0;
        
        // LED 인디케이터 초기화
        const dots = beatIndicators.querySelectorAll('.beat-dot');
        dots.forEach(d => d.classList.remove('active'));
    } else {
        // 시작 모드
        isPlaying = true;
        document.body.classList.add('playing');
        btnPlayPause.classList.add('playing');
        playPauseIcon.textContent = '⏸';
        playPauseText.textContent = 'STOP';
        
        currentBeatInMeasure = 0;
        currentSubdivisionIndex = 0;
        nextNoteTime = audioCtx.currentTime + 0.05;
        
        // 애니메이션 프레임 초기화
        lastAudioTime = audioCtx.currentTime;
        
        // 정밀 타이머 시작 및 렌더 큐 가동
        schedulerTimerID = setInterval(scheduler, lookahead);
        lastAnimationFrameID = requestAnimationFrame(drawAnimation);
    }
}

// 17. 탭 BPM 알고리즘
function handleTap() {
    const now = Date.now();
    
    // 버튼 클릭 피드백 애니메이션
    btnTap.classList.remove('tapped');
    void btnTap.offsetWidth; // 리플로우 강제 유도
    btnTap.classList.add('tapped');
    setTimeout(() => btnTap.classList.remove('tapped'), 150);
    
    // 입력 정체 시 탭 히스토리 초기화 (2.5초 기준)
    if (tapTimes.length > 0 && now - tapTimes[tapTimes.length - 1] > 2500) {
        tapTimes = [];
    }
    
    tapTimes.push(now);
    
    if (tapTimes.length > 1) {
        let sum = 0;
        for (let i = 1; i < tapTimes.length; i++) {
            sum += (tapTimes[i] - tapTimes[i - 1]);
        }
        
        const avgInterval = sum / (tapTimes.length - 1);
        let tappedBpm = Math.round(60000 / avgInterval);
        
        // 최소/최대 속도 범위 제한
        tappedBpm = Math.max(20, Math.min(280, tappedBpm));
        updateBpm(tappedBpm);
    }
}

// 18. 이벤트 리스너 세팅
function setupEventListeners() {
    // 플레이 / 일시정지 버튼
    btnPlayPause.addEventListener('click', togglePlayPause);
    
    // 탭 BPM 버튼
    btnTap.addEventListener('click', handleTap);
    
    // 스페이스바를 누를 시 탭 BPM이 되도록 설정 (기본 스크롤 동작 방지 필수)
    window.addEventListener('keydown', (e) => {
        if (e.code === 'Space') {
            e.preventDefault();
            handleTap();
        }
    });
    
    // BPM 슬라이더 이벤트
    bpmSlider.addEventListener('input', (e) => {
        updateBpm(parseInt(e.target.value));
    });
    
    // 증감 세그먼트 버튼들 (+1, -1, +5, -5 등)
    const stepBtns = document.querySelectorAll('.step-btn');
    stepBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const change = parseInt(e.target.getAttribute('data-change'));
            updateBpm(bpm + change);
        });
    });
    
    // 설정 변경 (박자, 세분박, 사운드종류)
    selectBeats.addEventListener('change', (e) => {
        beatsPerMeasure = parseInt(e.target.value);
        renderBeatIndicators();
    });
    
    selectSubdivision.addEventListener('change', (e) => {
        subdivision = parseInt(e.target.value);
        // 연주 중 레이턴시로 인한 큐 엉킴 방지를 위해 큐 청소
        notesInQueue = [];
    });
    
    selectSound.addEventListener('change', (e) => {
        soundType = e.target.value;
    });
    
    // 볼륨 조절
    volumeSlider.addEventListener('input', (e) => {
        volume = parseFloat(e.target.value) / 100;
        
        // 볼륨 아이콘 뮤트 표시 전환
        if (volume === 0) {
            btnMute.textContent = '🔇';
            isMuted = true;
        } else {
            btnMute.textContent = volume > 0.5 ? '🔊' : '🔉';
            isMuted = false;
        }
    });
    
    // 뮤트 버튼 토글
    btnMute.addEventListener('click', () => {
        isMuted = !isMuted;
        if (isMuted) {
            btnMute.textContent = '🔇';
            volumeSlider.value = 0;
        } else {
            volume = 0.8;
            volumeSlider.value = 80;
            btnMute.textContent = '🔊';
        }
    });
}

// 19. 페이지가 완전히 실행되면 초기화 발동
document.addEventListener('DOMContentLoaded', init);
