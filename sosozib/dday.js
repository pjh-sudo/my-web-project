let ddays = JSON.parse(localStorage.getItem('myDdays')) || [];

function saveDday() {
    const title = document.getElementById('dday-title').value;
    const date = document.getElementById('dday-date').value;
    const isAnniversary = document.getElementById('anniversary-mode').checked;

    if (!title || !date) return alert("제목과 날짜를 입력해주세요!");

    const newDday = { id: Date.now(), title, date, isAnniversary };
    ddays.push(newDday);
    localStorage.setItem('myDdays', JSON.stringify(ddays));
    renderDdays();
}

function renderDdays() {
    const list = document.getElementById('dday-list');
    list.innerHTML = '';
    
    ddays.forEach(d => {
        const target = new Date(d.date);
        const today = new Date();
        // 기념일 모드 보정
        const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24)) + (d.isAnniversary ? 1 : 0);
        
        const item = document.createElement('div');
        item.className = 'dday-item';
        item.innerHTML = `
            <div>
                <strong>${d.title}</strong><br>
                <span style="font-size: 1.5em; font-weight: bold;">D${diff <= 0 ? '+' + Math.abs(diff) : '-' + diff}</span>
             <div class="anniversary-box">목표일: ${d.date}</div>
             </div>
            <button onclick="deleteDday(${d.id})">삭제</button>
        `;
        list.appendChild(item);
    });
}

function deleteDday(id) {
    ddays = ddays.filter(d => d.id !== id);
    localStorage.setItem('myDdays', JSON.stringify(ddays));
    renderDdays();
}

renderDdays();