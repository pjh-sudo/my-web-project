// 뽀모도로 & 집중 타이머 로직

// 1. 설정 및 상태 변수
const CONFIG = {
    work: 25 * 60, // 25분 (1500초)
    short: 5 * 60, // 5분 (300초)
    long: 15 * 60, // 15분 (900초)
};

// 💡 디버그 모드 감지 (URL에 ?debug=true 가 있으면 테스트용으로 시간 단축)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.get('debug') === 'true') {
    CONFIG.work = 10;   // 10초
    CONFIG.short = 3;   // 3초
    CONFIG.long = 5;    // 5초
    console.log("디버그 모드 활성화: 집중 10초, 짧은휴식 3초, 긴휴식 5초");
}

let currentMode = 'work'; // 'work', 'short', 'long'
let timeLeft = CONFIG[currentMode];
let timerId = null;
let isRunning = false;
let totalDuration = CONFIG[currentMode]; // 원형 진행바 백분율 계산용

// SVG 원형 둘레 (2 * Math.PI * radius -> 2 * 3.14159 * 110 = 691.15)
const CIRCLE_CIRCUMFERENCE = 691.15;

// 로컬 스토리지 데이터 로드
let tasks = JSON.parse(localStorage.getItem('pomodoro-tasks')) || [];
let stats = JSON.parse(localStorage.getItem('pomodoro-stats')) || {
    workCount: 0,
    workTime: 0, // 누적 분
    breakCount: 0,
    lastActiveDate: new Date().toLocaleDateString()
};

// 날짜가 변경되었으면 일일 통계 초기화
const todayStr = new Date().toLocaleDateString();
if (stats.lastActiveDate !== todayStr) {
    stats.workCount = 0;
    stats.workTime = 0;
    stats.breakCount = 0;
    stats.lastActiveDate = todayStr;
    saveStats();
}

// 2. DOM 요소 취득
const pomodoroCard = document.getElementById('pomodoro-card');
const timerTime = document.getElementById('timer-time');
const timerLabel = document.getElementById('timer-label');
const timerProgress = document.getElementById('timer-progress');
const btnPlay = document.getElementById('btn-play');
const btnReset = document.getElementById('btn-reset');
const btnSkip = document.getElementById('btn-skip');

const statWorkCount = document.getElementById('stat-work-count');
const statWorkTime = document.getElementById('stat-work-time');
const statBreakCount = document.getElementById('stat-break-count');
const btnResetStats = document.getElementById('btn-reset-stats');

const taskInput = document.getElementById('task-input');
const btnAddTask = document.getElementById('btn-add-task');
const taskList = document.getElementById('task-list');

const activeTaskBanner = document.getElementById('active-task-banner');
const activeTaskName = document.getElementById('active-task-name');

const tabs = {
    work: document.getElementById('tab-work'),
    short: document.getElementById('tab-short'),
    long: document.getElementById('tab-long')
};

// 3. Web Audio API를 활용한 알림음 합성 기능
function playAlarmSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const now = ctx.currentTime;
        
        // 맑은 4화음 멜로디 (도-미-솔-도 순서로 재생)
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, idx) => {
            const osc = ctx.createOscillator();
            const gainNode = ctx.createGain();
            
            osc.type = 'sine'; // 부드러운 사인파
            osc.frequency.value = freq;
            
            const startTime = now + (idx * 0.12);
            const duration = 0.5;
            
            gainNode.gain.setValueAtTime(0, startTime);
            gainNode.gain.linearRampToValueAtTime(0.25, startTime + 0.05); // 짧은 페이드인
            gainNode.gain.exponentialRampToValueAtTime(0.0001, startTime + duration); // 자연스러운 여운을 가지며 페이드아웃
            
            osc.connect(gainNode);
            gainNode.connect(ctx.destination);
            
            osc.start(startTime);
            osc.stop(startTime + duration);
        });
    } catch (e) {
        console.error("알림음 재생 중 오류:", e);
    }
}

// 4. 데스크톱 알림 기능
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

function sendNotification(title, body) {
    if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: 'favicon.png'
        });
    }
}

// 5. 타이머 기능 제어
function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

function updateTimerDisplay() {
    timerTime.textContent = formatTime(timeLeft);
    
    // 원형 프로그레스 바 갱신
    const progressFraction = timeLeft / totalDuration;
    const offset = CIRCLE_CIRCUMFERENCE - (progressFraction * CIRCLE_CIRCUMFERENCE);
    timerProgress.style.strokeDashoffset = offset;

    // 브라우저 탭 타이틀 실시간 연동
    const modeName = currentMode === 'work' ? '집중' : '휴식';
    document.title = `(${formatTime(timeLeft)}) ${modeName} - 소소집`;
}

function switchMode(mode, autoPlay = false) {
    // 기존 타이머 정지
    clearInterval(timerId);
    timerId = null;
    isRunning = false;
    btnPlay.textContent = '▶';

    currentMode = mode;
    timeLeft = CONFIG[mode];
    totalDuration = CONFIG[mode];

    // 바디 색상 클래스 조절 (모달 등의 전역 테마 상속용)
    document.body.classList.remove('mode-short', 'mode-long');
    if (mode === 'short') document.body.classList.add('mode-short');
    if (mode === 'long') document.body.classList.add('mode-long');

    // 탭 활성화 상태 변경
    Object.keys(tabs).forEach(k => {
        if (k === mode) {
            tabs[k].classList.add('active');
        } else {
            tabs[k].classList.remove('active');
        }
    });

    // 라벨 텍스트 변경
    if (mode === 'work') {
        timerLabel.textContent = '집중 시간';
    } else if (mode === 'short') {
        timerLabel.textContent = '짧은 휴식';
    } else {
        timerLabel.textContent = '긴 휴식';
    }

    updateTimerDisplay();

    if (autoPlay) {
        startTimer();
    } else {
        resetTabTitle();
    }
}

function resetTabTitle() {
    document.title = '뽀모도로 & 집중 타이머 - 소소집';
}

function startTimer() {
    requestNotificationPermission();
    isRunning = true;
    btnPlay.textContent = '⏸';
    btnPlay.title = '일시정지';

    timerId = setInterval(() => {
        timeLeft--;
        updateTimerDisplay();

        if (timeLeft <= 0) {
            clearInterval(timerId);
            timerId = null;
            isRunning = false;
            btnPlay.textContent = '▶';
            
            handleSessionComplete();
        }
    }, 1000);
}

function pauseTimer() {
    clearInterval(timerId);
    timerId = null;
    isRunning = false;
    btnPlay.textContent = '▶';
    btnPlay.title = '시작';
}

function handleSessionComplete() {
    playAlarmSound();

    let nextMode = 'work';
    let notifyTitle = '';
    let notifyBody = '';

    if (currentMode === 'work') {
        // 집중 완료
        stats.workCount++;
        // 디버그 모드일 때는 25분 대신 실제 집중한 비율 또는 그냥 25분 더하기
        const isDebug = urlParams.get('debug') === 'true';
        stats.workTime += isDebug ? 1 : 25;
        saveStats();
        updateStatsUI();

        notifyTitle = '집중 완료! 🍅';
        const activeTask = tasks.find(t => t.active);
        notifyBody = activeTask 
            ? `"${activeTask.text}" 작업을 성공적으로 마쳤습니다. 5분간 휴식하세요!` 
            : '집중 세션이 완료되었습니다! 5분간 휴식을 취해 보세요.';

        // 4의 배수 회차 집중 완료 시 긴 휴식 권장
        if (stats.workCount % 4 === 0 && stats.workCount > 0) {
            nextMode = 'long';
            notifyBody = '벌써 4번의 집중 세션을 끝내셨네요! 15분간 깊은 휴식을 취해보세요. ☕';
        } else {
            nextMode = 'short';
        }
    } else {
        // 휴식 완료
        stats.breakCount++;
        saveStats();
        updateStatsUI();

        notifyTitle = '휴식 완료! ⚡';
        notifyBody = '휴식 시간이 끝났습니다. 새로운 고도의 집중 세션을 시작해 보세요!';
        nextMode = 'work';
    }

    sendNotification(notifyTitle, notifyBody);

    // 알림과 경고창 띄우기
    setTimeout(() => {
        showAlertModal(notifyTitle, notifyBody, () => {
            switchMode(nextMode, false);
        });
    }, 100);
}

// 5.5. 커스텀 모달 알림 및 확인창 구현
function showConfirmModal(title, message, onConfirm) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const btnOk = document.getElementById('btn-confirm-ok');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    
    titleEl.textContent = title;
    msgEl.innerHTML = message;
    btnCancel.style.display = 'inline-block'; // 취소 버튼 보이기
    
    // 모달 테마 색상 적용
    btnOk.style.backgroundColor = 'var(--theme-color)';
    
    // 이벤트 리스너 제거 후 재생성
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    newBtnOk.addEventListener('click', () => {
        modal.style.display = 'none';
        if (onConfirm) onConfirm();
    });
    
    const newBtnCancel = btnCancel.cloneNode(true);
    btnCancel.parentNode.replaceChild(newBtnCancel, btnCancel);
    newBtnCancel.addEventListener('click', () => {
        modal.style.display = 'none';
    });
    
    modal.style.display = 'flex';
}

function showAlertModal(title, message, onClose) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('confirm-title');
    const msgEl = document.getElementById('confirm-message');
    const btnOk = document.getElementById('btn-confirm-ok');
    const btnCancel = document.getElementById('btn-confirm-cancel');
    
    titleEl.textContent = title;
    msgEl.innerHTML = message;
    btnCancel.style.display = 'none'; // 알림창이므로 취소 버튼 숨기기
    
    btnOk.style.backgroundColor = 'var(--theme-color)';
    
    const newBtnOk = btnOk.cloneNode(true);
    btnOk.parentNode.replaceChild(newBtnOk, btnOk);
    newBtnOk.addEventListener('click', () => {
        modal.style.display = 'none';
        if (onClose) onClose();
    });
    
    modal.style.display = 'flex';
}

// 6. 통계 제어
function saveStats() {
    localStorage.setItem('pomodoro-stats', JSON.stringify(stats));
}

function updateStatsUI() {
    statWorkCount.textContent = stats.workCount;
    statWorkTime.textContent = `${stats.workTime}분`;
    statBreakCount.textContent = stats.breakCount;
}

function resetStats() {
    showConfirmModal('통계 초기화 ⚠️', '오늘의 누적 집중 통계를 정말 초기화하시겠습니까?', () => {
        stats.workCount = 0;
        stats.workTime = 0;
        stats.breakCount = 0;
        saveStats();
        updateStatsUI();
    });
}

// 7. 할 일(Task) 관리 제어
function saveTasks() {
    localStorage.setItem('pomodoro-tasks', JSON.stringify(tasks));
}

function renderTasks() {
    taskList.innerHTML = '';
    
    if (tasks.length === 0) {
        taskList.innerHTML = '<div class="task-empty-msg">아직 등록된 집중 작업이 없습니다.</div>';
        activeTaskBanner.style.display = 'none';
        return;
    }

    let hasActive = false;

    tasks.forEach(task => {
        const item = document.createElement('div');
        item.className = 'task-item';
        if (task.checked) item.classList.add('checked-item');
        if (task.active) {
            item.classList.add('active-item');
            hasActive = true;
            
            // 현재 작업 배너 활성화
            activeTaskBanner.style.display = 'flex';
            activeTaskName.textContent = task.text;
        }

        item.innerHTML = `
            <div class="task-item-left" onclick="selectActiveTask(${task.id})">
                <div class="task-checkbox ${task.checked ? 'checked' : ''}" onclick="toggleTaskCheck(event, ${task.id})"></div>
                <span class="task-text">${escapeHtml(task.text)}</span>
            </div>
            <button class="task-delete-btn" onclick="deleteTask(event, ${task.id})" title="삭제">🗑️</button>
        `;
        taskList.appendChild(item);
    });

    if (!hasActive) {
        activeTaskBanner.style.display = 'none';
    }
}

function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, function(m) { return map[m]; });
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) return;

    const newTask = {
        id: Date.now(),
        text: text,
        checked: false,
        active: tasks.length === 0 // 첫 작업인 경우 자동 활성화
    };

    tasks.push(newTask);
    taskInput.value = '';
    saveTasks();
    renderTasks();
}

window.toggleTaskCheck = function(event, id) {
    event.stopPropagation(); // 카드 선택 이벤트 방지
    tasks = tasks.map(t => {
        if (t.id === id) {
            const newChecked = !t.checked;
            // 체크 해제 시에는 활성화 상태 유지, 체크 설정 시에는 활성화 해제
            return { 
                ...t, 
                checked: newChecked, 
                active: newChecked ? false : t.active 
            };
        }
        return t;
    });
    saveTasks();
    renderTasks();
};

window.selectActiveTask = function(id) {
    tasks = tasks.map(t => {
        // 이미 체크된 것은 활성화할 수 없음
        if (t.id === id && !t.checked) {
            return { ...t, active: !t.active }; // 토글
        }
        return { ...t, active: false }; // 다른 항목들은 비활성화
    });
    saveTasks();
    renderTasks();
};

window.deleteTask = function(event, id) {
    event.stopPropagation();
    tasks = tasks.filter(t => t.id !== id);
    saveTasks();
    renderTasks();
};

// 8. 이벤트 바인딩
btnPlay.addEventListener('click', () => {
    if (isRunning) {
        pauseTimer();
    } else {
        startTimer();
    }
});

btnReset.addEventListener('click', () => {
    showConfirmModal('타이머 초기화 🔄', '현재 타이머 진행 상황을 초기화하시겠습니까?', () => {
        switchMode(currentMode, false);
    });
});

btnSkip.addEventListener('click', () => {
    showConfirmModal('세션 건너뛰기 ⏭', '현재 세션을 종료하고 다음 단계로 넘어가시겠습니까?', () => {
        let nextMode = 'work';
        if (currentMode === 'work') {
            nextMode = (stats.workCount + 1) % 4 === 0 ? 'long' : 'short';
        }
        switchMode(nextMode, false);
    });
});

btnResetStats.addEventListener('click', resetStats);

btnAddTask.addEventListener('click', addTask);
taskInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') addTask();
});

// 모드 탭 클릭 이벤트
Object.keys(tabs).forEach(mode => {
    tabs[mode].addEventListener('click', () => {
        if (currentMode !== mode) {
            if (isRunning) {
                showConfirmModal('모드 변경 ⚠️', '타이머가 현재 동작 중입니다. 모드를 변경하시겠습니까?', () => {
                    switchMode(mode, false);
                });
            } else {
                switchMode(mode, false);
            }
        }
    });
});

// 9. 초기 구동
switchMode('work', false);
updateStatsUI();
renderTasks();
