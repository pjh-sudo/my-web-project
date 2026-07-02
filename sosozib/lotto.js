// DOM 요소 취득
const gameCountSelect = document.getElementById('game-count');
const numberGrid = document.getElementById('number-grid');
const clearSelectionsBtn = document.getElementById('clear-selections-btn');
const drawBtn = document.getElementById('draw-btn');
const lottoResults = document.getElementById('lotto-results');
const copyAllBtn = document.getElementById('copy-all-btn');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');

// 고정수 및 제외수 관리를 위한 Set
const fixedNumbers = new Set();
const excludedNumbers = new Set();

// 1. 숫자판 생성 및 클릭 이벤트 등록
function initNumberGrid() {
    numberGrid.innerHTML = '';
    for (let i = 1; i <= 45; i++) {
        const btn = document.createElement('button');
        btn.className = 'num-btn';
        btn.innerText = i;
        btn.setAttribute('data-num', i);
        
        btn.addEventListener('click', () => {
            handleNumberClick(i, btn);
        });
        
        numberGrid.appendChild(btn);
    }
}

// 2. 번호 클릭 시 상태 순환 (일반 -> 고정 -> 제외 -> 일반)
function handleNumberClick(num, btn) {
    if (fixedNumbers.has(num)) {
        // 고정 -> 제외
        fixedNumbers.delete(num);
        if (excludedNumbers.size < 39) {
            excludedNumbers.add(num);
            btn.className = 'num-btn excluded';
        } else {
            // 제외수 제한 도달 시 일반으로 복귀
            btn.className = 'num-btn';
        }
    } else if (excludedNumbers.has(num)) {
        // 제외 -> 일반
        excludedNumbers.delete(num);
        btn.className = 'num-btn';
    } else {
        // 일반 -> 고정 (최대 5개) 혹은 제외 (최대 39개)
        if (fixedNumbers.size < 5) {
            fixedNumbers.add(num);
            btn.className = 'num-btn fixed';
        } else if (excludedNumbers.size < 39) {
            excludedNumbers.add(num);
            btn.className = 'num-btn excluded';
        } else {
            alert('추첨을 위해 최소 6개의 번호는 남겨두어야 합니다! (제외수는 최대 39개까지)');
        }
    }
}

// 3. 숫자판 선택 상태 초기화
function clearSelections() {
    fixedNumbers.clear();
    excludedNumbers.clear();
    const buttons = numberGrid.querySelectorAll('.num-btn');
    buttons.forEach(btn => {
        btn.className = 'num-btn';
    });
}

// 4. 로또 번호대별 공 색상 클래스 반환
function getBallColorClass(num) {
    if (num >= 1 && num <= 10) return 'yellow';
    if (num >= 11 && num <= 20) return 'blue';
    if (num >= 21 && num <= 30) return 'red';
    if (num >= 31 && num <= 40) return 'gray';
    return 'green';
}

// 5. 무작위 셔플 알고리즘
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// 6. 번호 추첨 실행
function drawLotto() {
    const gameCount = parseInt(gameCountSelect.value);
    const results = [];
    
    // 유효성 체크
    if (excludedNumbers.size > 39) {
        alert('제외수가 너무 많습니다. 최대 39개까지만 제외할 수 있습니다.');
        return;
    }
    
    for (let g = 0; g < gameCount; g++) {
        // 고정수와 제외수를 뺀 나머지 번호 풀(pool) 구성
        const pool = [];
        for (let i = 1; i <= 45; i++) {
            if (!fixedNumbers.has(i) && !excludedNumbers.has(i)) {
                pool.push(i);
            }
        }
        
        // 풀 무작위 셔플
        shuffle(pool);
        
        // 필요한 개수만큼 추출 (6 - 고정수 개수)
        const neededCount = 6 - fixedNumbers.size;
        const picked = pool.slice(0, neededCount);
        
        // 고정수와 추출된 수 합치기 후 정렬
        const finalGame = [...fixedNumbers, ...picked];
        finalGame.sort((a, b) => a - b);
        results.push(finalGame);
    }
    
    // 결과 화면 출력
    renderResults(results);
    
    // 로컬스토리지 기록 저장
    saveToHistory(results);
}

// 7. 결과 렌더링 (통통 튀는 애니메이션 적용)
let copyTextContent = ''; // 전체 복사용 텍스트 임시 저장
function renderResults(results) {
    lottoResults.innerHTML = '';
    copyAllBtn.style.display = 'none';
    copyTextContent = '';
    
    results.forEach((game, gameIdx) => {
        const row = document.createElement('div');
        row.className = 'lotto-row';
        
        const label = document.createElement('div');
        label.className = 'game-label';
        label.innerText = `제 ${gameIdx + 1}게임`;
        row.appendChild(label);
        
        const ballContainer = document.createElement('div');
        ballContainer.className = 'ball-container';
        
        game.forEach((num, numIdx) => {
            const ball = document.createElement('div');
            ball.className = `lotto-ball ball-${getBallColorClass(num)}`;
            ball.innerText = num;
            
            // 각 공마다 시차를 두어 통통 튀어 나오게 애니메이션 딜레이 설정
            const delay = (gameIdx * 6 + numIdx) * 60;
            ball.style.animationDelay = `${delay}ms`;
            
            ballContainer.appendChild(ball);
        });
        
        row.appendChild(ballContainer);
        lottoResults.appendChild(row);
        
        // 복사용 텍스트 누적
        copyTextContent += `제 ${gameIdx + 1}게임: ${game.join(', ')}\n`;
    });
    
    // 모든 공 애니메이션이 완료될 즈음 복사 버튼 보이기
    const totalDelay = results.length * 6 * 60;
    setTimeout(() => {
        copyAllBtn.style.display = 'block';
    }, totalDelay + 100);
}

// 8. 클립보드 복사
function copyAllResults() {
    if (!copyTextContent) return;
    
    navigator.clipboard.writeText(copyTextContent.trim()).then(() => {
        alert('모든 조합 번호가 클립보드에 복사되었습니다! 📋');
    }).catch(err => {
        // 구형 브라우저 혹은 일부 인앱 브라우저 호환성 대비 fallback
        const textArea = document.createElement('textarea');
        textArea.value = copyTextContent.trim();
        document.body.appendChild(textArea);
        textArea.select();
        try {
            document.execCommand('copy');
            alert('모든 조합 번호가 클립보드에 복사되었습니다! 📋');
        } catch (e) {
            alert('복사에 실패했습니다. 번호를 직접 복사해 주세요.');
        }
        document.body.removeChild(textArea);
    });
}

// 9. 로컬스토리지 기록 가져오기
function getHistory() {
    const history = localStorage.getItem('sosozib_lotto_history');
    return history ? JSON.parse(history) : [];
}

// 10. 로컬스토리지 기록 저장
function saveToHistory(results) {
    let history = getHistory();
    const newRecord = {
        timestamp: new Date().toLocaleString('ko-KR', { hour12: false }),
        games: results,
        fixed: Array.from(fixedNumbers),
        excluded: Array.from(excludedNumbers)
    };
    
    history.unshift(newRecord);
    if (history.length > 5) {
        history = history.slice(0, 5); // 최근 5개만 저장
    }
    
    localStorage.setItem('sosozib_lotto_history', JSON.stringify(history));
    renderHistory();
}

// 11. 로컬스토리지 기록 화면 출력
function renderHistory() {
    const history = getHistory();
    
    if (history.length === 0) {
        historyList.innerHTML = '<p class="empty-history">아직 추첨한 내역이 없습니다.</p>';
        clearHistoryBtn.style.display = 'none';
        return;
    }
    
    clearHistoryBtn.style.display = 'inline-block';
    historyList.innerHTML = '';
    
    history.forEach((record) => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        // 날짜 & 조건 요약 정보
        const info = document.createElement('div');
        info.className = 'history-info';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'history-time';
        timeSpan.innerText = record.timestamp;
        info.appendChild(timeSpan);
        
        if (record.fixed.length > 0 || record.excluded.length > 0) {
            const condSpan = document.createElement('span');
            condSpan.className = 'history-cond';
            let condText = '';
            if (record.fixed.length > 0) {
                condText += `고정: [${record.fixed.sort((a,b)=>a-b).join(',')}]`;
            }
            if (record.excluded.length > 0) {
                if (condText) condText += ' ';
                condText += `제외: [${record.excluded.sort((a,b)=>a-b).join(',')}]`;
            }
            condSpan.innerText = ` (${condText})`;
            info.appendChild(condSpan);
        }
        item.appendChild(info);
        
        // 게임 리스트
        const gamesContainer = document.createElement('div');
        gamesContainer.className = 'history-games';
        
        record.games.forEach((game, gameIdx) => {
            const gameRow = document.createElement('div');
            gameRow.className = 'history-game-row';
            
            const gameLabel = document.createElement('span');
            gameLabel.className = 'history-game-label';
            gameLabel.innerText = `게임 ${gameIdx + 1}`;
            gameRow.appendChild(gameLabel);
            
            const numbersContainer = document.createElement('div');
            numbersContainer.className = 'history-numbers';
            
            game.forEach(num => {
                const numSpan = document.createElement('span');
                numSpan.className = `history-num-ball ball-${getBallColorClass(num)}`;
                numSpan.innerText = num;
                numbersContainer.appendChild(numSpan);
            });
            
            gameRow.appendChild(numbersContainer);
            gamesContainer.appendChild(gameRow);
        });
        
        item.appendChild(gamesContainer);
        historyList.appendChild(item);
    });
}

// 12. 전체 기록 삭제
function clearHistory() {
    if (confirm('최근 추첨 내역을 모두 삭제하시겠습니까? 🗑️')) {
        localStorage.removeItem('sosozib_lotto_history');
        renderHistory();
    }
}

// 13. 초기 이벤트 바인딩 및 실행
clearSelectionsBtn.addEventListener('click', clearSelections);
drawBtn.addEventListener('click', drawLotto);
copyAllBtn.addEventListener('click', copyAllResults);
clearHistoryBtn.addEventListener('click', clearHistory);

// 초기화 호출
initNumberGrid();
renderHistory();
