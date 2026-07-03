// 소소집 해빗 트래커 & 데일리 루틴 달력 로직

// 1. 상태 변수 및 로컬스토리지 연동
let habits = [];
let selectedEmoji = '💧'; // 기본 이모지

// 2. 날짜 유틸리티 함수들
function getLocalDateString(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getDayName(date) {
    const week = ['일', '월', '화', '수', '목', '금', '토'];
    return week[date.getDay()];
}

// 최근 7일(오늘 포함) 날짜 정보 배열 획득
function getLast7Days() {
    const days = [];
    for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        days.push(d);
    }
    return days;
}

// 3. 스트릭(연속 달성일수) 계산 알고리즘
function updateHabitStreaks(habit) {
    const historySet = new Set(habit.history);
    const todayStr = getLocalDateString(new Date());
    
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = getLocalDateString(yesterday);
    
    // 오늘이나 어제 둘 다 수행하지 않았다면 현재 스트릭은 0
    if (!historySet.has(todayStr) && !historySet.has(yesterdayStr)) {
        habit.streak = 0;
    } else {
        let currentStreak = 0;
        let checkDate = new Date();
        
        // 오늘 체크 안 했으면 어제부터 시작해서 과거로 추적
        if (!historySet.has(todayStr)) {
            checkDate.setDate(checkDate.getDate() - 1);
        }
        
        while (true) {
            const checkStr = getLocalDateString(checkDate);
            if (historySet.has(checkStr)) {
                currentStreak++;
                checkDate.setDate(checkDate.getDate() - 1);
            } else {
                break;
            }
        }
        habit.streak = currentStreak;
    }
    
    // 역대 최장 스트릭(maxStreak) 갱신
    if (habit.streak > (habit.maxStreak || 0)) {
        habit.maxStreak = habit.streak;
    }
}

// 4. 로컬 스토리지 저장 및 불러오기
function saveToLocalStorage() {
    try {
        localStorage.setItem('sosozib-habits', JSON.stringify(habits));
    } catch (e) {
        console.error("로컬 스토리지 저장 실패: ", e);
    }
}

function loadFromLocalStorage() {
    try {
        const savedData = localStorage.getItem('sosozib-habits');
        if (savedData) {
            habits = JSON.parse(savedData);
            // 스트릭 보정 (새로운 날이 밝았을 때 끊어진 스트릭 감지용)
            habits.forEach(habit => updateHabitStreaks(habit));
            saveToLocalStorage();
        } else {
            // 최초 접속 시 더미 습관 3개 세팅
            initializeDummyHabits();
        }
    } catch (e) {
        console.error("로컬 스토리지 읽기 실패: ", e);
        initializeDummyHabits();
    }
}

function initializeDummyHabits() {
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const dayBefore = new Date();
    dayBefore.setDate(today.getDate() - 2);

    habits = [
        {
            id: 'dummy-1',
            name: '하루 물 2L 마시기',
            emoji: '💧',
            createdAt: getLocalDateString(dayBefore),
            history: [getLocalDateString(dayBefore), getLocalDateString(yesterday)],
            streak: 2,
            maxStreak: 2
        },
        {
            id: 'dummy-2',
            name: '독서 15분 하기',
            emoji: '📚',
            createdAt: getLocalDateString(yesterday),
            history: [getLocalDateString(yesterday)],
            streak: 1,
            maxStreak: 1
        },
        {
            id: 'dummy-3',
            name: '스트레칭 & 명상',
            emoji: '🧘',
            createdAt: getLocalDateString(today),
            history: [],
            streak: 0,
            maxStreak: 0
        }
    ];
    saveToLocalStorage();
}

// 5. DOM 요소 관리 및 렌더링
const habitsContainer = document.getElementById('habits-container');
const habitEmptyMsg = document.getElementById('habit-empty-msg');
const progressText = document.getElementById('dashboard-progress-text');
const progressBarFill = document.getElementById('dashboard-progress-bar');
const dashboardMessage = document.getElementById('dashboard-message');
const btnEmojiSelect = document.getElementById('btn-emoji-select');
const emojiDropdown = document.getElementById('emoji-dropdown');
const habitNameInput = document.getElementById('habit-name-input');
const btnAddHabit = document.getElementById('btn-add-habit');
const btnClearHabits = document.getElementById('btn-clear-habits');

// 오늘의 대시보드 진행률 바 갱신
function updateDashboard() {
    if (habits.length === 0) {
        progressText.textContent = "0 / 0 완료 (0%)";
        progressBarFill.style.width = "0%";
        dashboardMessage.textContent = "새로운 습관을 등록하고 오늘 하루도 활기차게 시작해 보세요!";
        return;
    }

    const todayStr = getLocalDateString(new Date());
    const completedTodayCount = habits.filter(h => h.history.includes(todayStr)).length;
    const ratio = Math.round((completedTodayCount / habits.length) * 100);

    progressText.textContent = `${completedTodayCount} / ${habits.length} 완료 (${ratio}%)`;
    progressBarFill.style.width = `${ratio}%`;

    // 달성 비율별 격려 메시지 변경
    if (ratio === 100) {
        dashboardMessage.textContent = "🎉 대단해요! 오늘 목표한 모든 습관을 성공적으로 완료하셨습니다!";
        dashboardMessage.style.color = "var(--theme-color)";
    } else if (ratio >= 70) {
        dashboardMessage.textContent = "🔥 거의 다 왔어요! 목표 달성이 눈앞에 있습니다.";
        dashboardMessage.style.color = "var(--point-color)";
    } else if (ratio >= 40) {
        dashboardMessage.textContent = "👍 훌륭합니다. 이 속도대로 차근차근 이어나가 볼까요?";
        dashboardMessage.style.color = "";
    } else if (completedTodayCount > 0) {
        dashboardMessage.textContent = "🌱 첫 단추를 채웠네요! 아주 잘하고 있습니다.";
        dashboardMessage.style.color = "";
    } else {
        dashboardMessage.textContent = "🏃 시작이 반입니다! 오늘 목표한 습관들을 완수해 보세요.";
        dashboardMessage.style.color = "";
    }
}

// 6. 날짜 토글 처리 기능 (핵심)
function toggleHabitDate(habitId, dateStr) {
    const habit = habits.find(h => h.id === habitId);
    if (!habit) return;

    const index = habit.history.indexOf(dateStr);
    if (index === -1) {
        // 완료 추가
        habit.history.push(dateStr);
    } else {
        // 완료 제거
        habit.history.splice(index, 1);
    }

    // 스트릭 수치 갱신
    updateHabitStreaks(habit);
    saveToLocalStorage();
    renderHabits();
}

// 7. 개별 습관 카드 렌더링
function renderHabits() {
    // 빈 영역 메시지 처리
    if (habits.length === 0) {
        habitsContainer.innerHTML = '';
        habitsContainer.appendChild(habitEmptyMsg);
        habitEmptyMsg.style.display = 'block';
        updateDashboard();
        return;
    }
    habitEmptyMsg.style.display = 'none';

    // 렌더링 시 기존의 오픈된 월간 달력 상태(ID 목록)를 보존하여 깜빡임 최소화
    const openGridIds = Array.from(document.querySelectorAll('.monthly-grid-wrapper.open'))
        .map(el => el.getAttribute('data-habit-id'));

    habitsContainer.innerHTML = '';

    const todayStr = getLocalDateString(new Date());
    const last7Days = getLast7Days();

    habits.forEach(habit => {
        const isCompletedToday = habit.history.includes(todayStr);
        
        // 카드 아이템 껍데기
        const card = document.createElement('div');
        card.classList.add('habit-card-item');
        if (isCompletedToday) {
            card.classList.add('fully-done');
        }

        // 1) 카드 상단부 (아이콘, 제목, 체크버튼)
        const mainRow = document.createElement('div');
        mainRow.classList.add('habit-card-main');

        const infoDiv = document.createElement('div');
        infoDiv.classList.add('habit-info');

        const iconDiv = document.createElement('div');
        iconDiv.classList.add('habit-icon');
        iconDiv.textContent = habit.emoji;

        const detailsDiv = document.createElement('div');
        detailsDiv.classList.add('habit-details');

        const titleSpan = document.createElement('span');
        titleSpan.classList.add('habit-title-text');
        titleSpan.textContent = habit.name;

        const streakBadge = document.createElement('div');
        streakBadge.classList.add('habit-streak-badge');
        streakBadge.innerHTML = `🔥 <span>${habit.streak || 0}일 연속</span> <span style="font-size:10px; color:var(--text-sub); font-weight:normal; margin-left:4px;">(최고: ${habit.maxStreak || 0}일)</span>`;

        detailsDiv.appendChild(titleSpan);
        detailsDiv.appendChild(streakBadge);
        infoDiv.appendChild(iconDiv);
        infoDiv.appendChild(detailsDiv);

        // 오늘 날짜 원버튼 체크
        const checkBtn = document.createElement('button');
        checkBtn.classList.add('habit-check-btn');
        if (isCompletedToday) {
            checkBtn.classList.add('checked');
            checkBtn.innerHTML = '✓';
        } else {
            checkBtn.innerHTML = '';
        }
        checkBtn.addEventListener('click', () => {
            toggleHabitDate(habit.id, todayStr);
        });

        mainRow.appendChild(infoDiv);
        mainRow.appendChild(checkBtn);
        card.appendChild(mainRow);

        // 2) 카드 하단부 (주간 요일 바 및 옵션)
        const footer = document.createElement('div');
        footer.classList.add('habit-card-footer');

        const weeklyBar = document.createElement('div');
        weeklyBar.classList.add('weekly-tracker');

        last7Days.forEach(day => {
            const dayStr = getLocalDateString(day);
            const isCompleted = habit.history.includes(dayStr);
            const isToday = (dayStr === todayStr);

            const chip = document.createElement('div');
            chip.classList.add('weekly-day-chip');
            if (isCompleted) chip.classList.add('completed');
            if (isToday) chip.classList.add('today');

            const nameSpan = document.createElement('span');
            nameSpan.classList.add('day-name');
            nameSpan.textContent = getDayName(day);

            const circle = document.createElement('div');
            circle.classList.add('day-circle');
            circle.textContent = day.getDate();

            chip.appendChild(nameSpan);
            chip.appendChild(circle);

            // 과거 특정 날짜 클릭 시 기록 보정 토글 가능!
            chip.addEventListener('click', () => {
                toggleHabitDate(habit.id, dayStr);
            });

            weeklyBar.appendChild(chip);
        });

        footer.appendChild(weeklyBar);

        // 3) 월간 잔디 캘린더 그리드 영역 생성
        const monthlyGridWrapper = document.createElement('div');
        monthlyGridWrapper.classList.add('monthly-grid-wrapper');
        monthlyGridWrapper.setAttribute('data-habit-id', habit.id);
        
        // 이전 루프에서 열려 있었다면 상태 보존
        if (openGridIds.includes(habit.id)) {
            monthlyGridWrapper.classList.add('open');
        }

        const now = new Date();
        const year = now.getFullYear();
        const month = now.getMonth();

        const gridTitle = document.createElement('div');
        gridTitle.classList.add('monthly-grid-title');
        gridTitle.innerHTML = `📅 <strong>${year}년 ${month + 1}월</strong> 습관 달력 (해당 날짜 클릭 시 상태 전환)`;

        const monthlyGrid = generateMonthlyGrid(habit, year, month);

        monthlyGridWrapper.appendChild(gridTitle);
        monthlyGridWrapper.appendChild(monthlyGrid);
        footer.appendChild(monthlyGridWrapper);

        // 4) 토글 컨트롤 버튼 및 삭제 버튼 행
        const toggleRow = document.createElement('div');
        toggleRow.classList.add('grid-toggle-row');

        const toggleBtn = document.createElement('button');
        toggleBtn.classList.add('btn-toggle-grid');
        const isOpen = monthlyGridWrapper.classList.contains('open');
        toggleBtn.innerHTML = isOpen ? '▲ 달력 접기' : '▼ 캘린더 잔디 보기';
        toggleBtn.addEventListener('click', () => {
            const openNow = monthlyGridWrapper.classList.toggle('open');
            toggleBtn.innerHTML = openNow ? '▲ 달력 접기' : '▼ 캘린더 잔디 보기';
        });

        const deleteBtn = document.createElement('button');
        deleteBtn.classList.add('btn-delete-habit');
        deleteBtn.textContent = '삭제';
        deleteBtn.addEventListener('click', () => {
            if (confirm(`'${habit.name}' 습관을 정말 삭제하시겠습니까?\n달성 데이터가 함께 영구 삭제됩니다.`)) {
                deleteHabit(habit.id);
            }
        });

        toggleRow.appendChild(toggleBtn);
        toggleRow.appendChild(deleteBtn);
        footer.appendChild(toggleRow);

        card.appendChild(footer);
        habitsContainer.appendChild(card);
    });

    updateDashboard();
}

// 8. 월간 달력 그리드 컴포넌트 생성 기능
function generateMonthlyGrid(habit, year, month) {
    const gridContainer = document.createElement('div');
    gridContainer.classList.add('monthly-grid');
    
    // 이번 달 1일이 시작하는 요일과 일 수 계산
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0(일) ~ 6(토)
    
    // 시작 요일 정렬을 위한 공백 칸 채우기
    for (let i = 0; i < firstDayOfWeek; i++) {
        const emptyCell = document.createElement('div');
        emptyCell.classList.add('grid-cell', 'empty');
        gridContainer.appendChild(emptyCell);
    }
    
    const historySet = new Set(habit.history);
    const todayStr = getLocalDateString(new Date());
    
    // 1일부터 말일까지 셀 생성
    for (let day = 1; day <= daysInMonth; day++) {
        const cellDate = new Date(year, month, day);
        const cellDateStr = getLocalDateString(cellDate);
        
        const cell = document.createElement('div');
        cell.classList.add('grid-cell');
        cell.textContent = day;
        
        if (historySet.has(cellDateStr)) {
            cell.classList.add('completed');
        }
        if (cellDateStr === todayStr) {
            cell.classList.add('today');
        }
        
        // 특정 날짜 셀 클릭 시 완료 상태 토글
        cell.addEventListener('click', (e) => {
            e.stopPropagation();
            toggleHabitDate(habit.id, cellDateStr);
        });
        
        gridContainer.appendChild(cell);
    }
    
    return gridContainer;
}

// 9. 새로운 습관 추가 및 삭제 처리
function addHabit() {
    const name = habitNameInput.value.trim();
    if (!name) return;

    const newHabit = {
        id: 'habit-' + Date.now(),
        name: name,
        emoji: selectedEmoji,
        createdAt: getLocalDateString(new Date()),
        history: [],
        streak: 0,
        maxStreak: 0
    };

    habits.push(newHabit);
    saveToLocalStorage();
    
    // 인풋 폼 리셋
    habitNameInput.value = '';
    selectedEmoji = '💧';
    btnEmojiSelect.textContent = selectedEmoji;
    
    renderHabits();
}

function deleteHabit(habitId) {
    habits = habits.filter(h => h.id !== habitId);
    saveToLocalStorage();
    renderHabits();
}

// 10. 이모지 선택창 토글 및 매핑
function setupEmojiSelector() {
    btnEmojiSelect.addEventListener('click', (e) => {
        e.stopPropagation();
        const display = emojiDropdown.style.display;
        emojiDropdown.style.display = display === 'none' ? 'block' : 'none';
    });

    document.addEventListener('click', () => {
        emojiDropdown.style.display = 'none';
    });

    const emojiOptions = emojiDropdown.querySelectorAll('.emoji-option');
    emojiOptions.forEach(opt => {
        opt.addEventListener('click', (e) => {
            selectedEmoji = e.target.textContent;
            btnEmojiSelect.textContent = selectedEmoji;
            emojiDropdown.style.display = 'none';
        });
    });
}

// 11. 초기 이벤트 바인딩 및 앱 로드
function init() {
    loadFromLocalStorage();
    renderHabits();
    setupEmojiSelector();

    // 습관 추가 클릭 이벤트
    btnAddHabit.addEventListener('click', addHabit);

    // 폼 엔터키 작동 방어 및 바인딩
    habitNameInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            addHabit();
        }
    });

    // 전체 삭제 버튼 작동
    btnClearHabits.addEventListener('click', () => {
        if (confirm("정말로 등록된 모든 습관을 삭제하시겠습니까?\n모든 달성 기록이 지워지고 초기 상태로 복구됩니다.")) {
            habits = [];
            saveToLocalStorage();
            renderHabits();
        }
    });
}

// 페이지 로드 완료 시 구동
document.addEventListener('DOMContentLoaded', init);
