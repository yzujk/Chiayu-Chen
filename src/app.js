/**
 * Main Application Module
 * 主應用邏輯與 UI 互動
 */

let currentPoll = null;
let pollUnwatcher = null;

// ============ UI Utilities ============

/**
 * 顯示建立投票表單，隱藏投票區域
 */
function showCreatePollForm() {
    document.getElementById('createPollSection').style.display = 'block';
    document.getElementById('voteSectionContainer').style.display = 'none';
    currentPoll = null;
}

/**
 * 隱藏建立投票表單，顯示投票區域
 */
function showVoteSection(poll) {
    document.getElementById('createPollSection').style.display = 'none';
    document.getElementById('voteSectionContainer').style.display = 'block';
    
    // 更新投票標題
    document.getElementById('votePollTitle').textContent = poll.title;
    
    // 渲染投票選項
    renderVoteOptions(poll);
    
    // 渲染結果
    renderResults(poll);
}

/**
 * 新增選項輸入框
 */
function addOption() {
    const container = document.getElementById('optionsContainer');
    const newOption = document.createElement('div');
    newOption.className = 'input-group mb-2';
    newOption.innerHTML = `
        <input type="text" class="form-control poll-option" placeholder="選項 ${container.children.length + 1}">
        <button class="btn btn-outline-danger" type="button" onclick="removeOption(this)">移除</button>
    `;
    container.appendChild(newOption);
}

/**
 * 移除選項輸入框
 */
function removeOption(button) {
    const container = document.getElementById('optionsContainer');
    if (container.children.length > 2) {
        button.parentElement.remove();
    } else {
        alert('至少需要 2 個選項');
    }
}

/**
 * 渲染投票選項 (單選或多選)
 */
function renderVoteOptions(poll) {
    const container = document.getElementById('voteOptionsContainer');
    container.innerHTML = '';

    poll.options.forEach(option => {
        const inputType = poll.type === 'single' ? 'radio' : 'checkbox';
        const inputName = `option_${poll.id}`;
        const inputId = `option_${option.id}`;

        const optionDiv = document.createElement('div');
        optionDiv.className = 'form-check';
        optionDiv.innerHTML = `
            <input class="${inputType === 'radio' ? 'form-check-input' : 'form-check-input'}" 
                   type="${inputType}" 
                   name="${inputName}" 
                   id="${inputId}" 
                   value="${option.id}">
            <label class="form-check-label" for="${inputId}">
                ${option.text}
            </label>
        `;
        container.appendChild(optionDiv);
    });
}

/**
 * 渲染投票結果
 */
function renderResults(poll) {
    const container = document.getElementById('resultsContainer');
    container.innerHTML = '';

    const stats = PollManager.calculateStats(poll);

    stats.options.forEach(option => {
        const resultDiv = document.createElement('div');
        resultDiv.className = 'result-item';
        resultDiv.innerHTML = `
            <div class="result-option-name">${option.text}</div>
            <div class="result-bar-container">
                <div class="result-bar" style="width: ${option.percentage}%">
                    ${option.percentage > 5 ? option.percentage + '%' : ''}
                </div>
            </div>
            <div class="result-stats">
                <span>票數: ${option.votes}</span>
                <span>百分比: ${option.percentage}%</span>
            </div>
        `;
        container.appendChild(resultDiv);
    });

    // 顯示總投票數
    const totalDiv = document.createElement('div');
    totalDiv.className = 'alert alert-info mt-3';
    totalDiv.textContent = `總投票數: ${stats.totalVotes}`;
    container.appendChild(totalDiv);
}

// ============ Event Listeners ============

/**
 * 建立投票表單提交
 */
document.getElementById('createPollForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const title = document.getElementById('pollTitle').value;
    const type = document.getElementById('pollType').value;
    const optionInputs = document.querySelectorAll('.poll-option');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(value => value !== '');

    if (options.length < 2) {
        alert('請至少輸入 2 個選項');
        return;
    }

    try {
        // 建立投票物件
        currentPoll = PollManager.createPoll(title, options, type, 'Creator');
        
        // 保存到 GUN
        gunClient.savePoll(currentPoll.id, currentPoll)
            .then(() => {
                console.log('投票已建立:', currentPoll.id);
                
                // 清除表單
                document.getElementById('createPollForm').reset();
                document.getElementById('optionsContainer').innerHTML = `
                    <div class="input-group mb-2">
                        <input type="text" class="form-control poll-option" placeholder="選項 1">
                        <button class="btn btn-outline-danger" type="button" onclick="removeOption(this)">移除</button>
                    </div>
                    <div class="input-group mb-2">
                        <input type="text" class="form-control poll-option" placeholder="選項 2">
                        <button class="btn btn-outline-danger" type="button" onclick="removeOption(this)">移除</button>
                    </div>
                `;
                
                // 顯示投票區域
                showVoteSection(currentPoll);
                
                // 監聽投票變化
                watchPollChanges();
                
                // 提示成功
                alert(`投票已建立！投票 ID: ${currentPoll.id}`);
            })
            .catch(err => {
                console.error('建立投票失敗:', err);
                alert('建立投票失敗：' + err.message);
            });
    } catch (err) {
        alert('錯誤: ' + err.message);
    }
});

/**
 * 投票表單提交
 */
document.getElementById('voteForm').addEventListener('submit', function(e) {
    e.preventDefault();

    const userName = document.getElementById('userName').value.trim();
    if (!userName) {
        alert('請輸入暱稱');
        return;
    }

    // 獲取選中的選項
    const inputType = currentPoll.type === 'single' ? 'radio' : 'checkbox';
    const checkedInputs = document.querySelectorAll(`input[type="${inputType}"]:checked`);
    const selectedOptions = Array.from(checkedInputs).map(input => input.value);

    if (selectedOptions.length === 0) {
        alert('請選擇選項');
        return;
    }

    try {
        // 提交投票
        const updatedPoll = PollManager.submitVote(currentPoll, userName, selectedOptions);
        
        // 保存到 GUN
        gunClient.savePoll(updatedPoll.id, updatedPoll)
            .then(() => {
                console.log('投票已提交');
                currentPoll = updatedPoll;
                
                // 清除表單
                document.getElementById('voteForm').reset();
                
                // 重新渲染結果
                renderResults(currentPoll);
                
                alert('感謝投票！');
            })
            .catch(err => {
                console.error('提交投票失敗:', err);
                alert('提交投票失敗：' + err.message);
            });
    } catch (err) {
        alert('錯誤: ' + err.message);
    }
});

/**
 * 監聽投票變化（即時更新）
 */
function watchPollChanges() {
    if (currentPoll && currentPoll.id) {
        if (pollUnwatcher) {
            pollUnwatcher();
        }

        pollUnwatcher = gunClient.watchPoll(currentPoll.id, (updatedPoll) => {
            currentPoll = updatedPoll;
            console.log('投票已更新:', updatedPoll);
            
            // 重新渲染結果、倒數和圖表
            renderResults(currentPoll);
            renderCountdown(currentPoll);
            renderChart(currentPoll);
        });
    }
}

// ============ 擴展功能：倒數計時 ============

/**
 * 渲染倒數計時
 */
function renderCountdown(poll) {
    const container = document.getElementById('countdownContainer');
    if (!container) return;
    
    if (!poll.endTime) {
        container.innerHTML = '';
        return;
    }

    const remaining = PollManager.getTimeRemaining(poll);
    if (remaining <= 0) {
        container.innerHTML = '<div class="alert alert-warning">⏰ 投票已結束</div>';
        return;
    }

    container.innerHTML = `
        <div class="alert alert-info">
            ⏱️ 剩餘時間：<strong>${PollManager.formatTimeRemaining(remaining)}</strong>
        </div>
    `;

    // 每秒更新
    setTimeout(() => {
        if (currentPoll) renderCountdown(currentPoll);
    }, 1000);
}

// ============ 擴展功能：圖表展示 ============

/**
 * 渲染圖表（柱狀圖）
 */
function renderChart(poll) {
    const chartSection = document.getElementById('chartSection');
    if (!chartSection) return;

    // 顯示圖表區域
    chartSection.style.display = 'block';

    const stats = PollManager.calculateStats(poll);
    const labels = stats.options.map(o => o.text);
    const data = stats.options.map(o => o.votes);

    // 檢查 Chart.js 是否載入
    if (typeof Chart === 'undefined') {
        console.warn('Chart.js 未載入');
        return;
    }

    // 清除舊圖表
    const existingChart = Chart.helpers.getChart('pollChart');
    if (existingChart) existingChart.destroy();

    const ctx = document.getElementById('pollChart')?.getContext('2d');
    if (!ctx) return;

    new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: '票數',
                data: data,
                backgroundColor: [
                    'rgba(102, 126, 234, 0.8)',
                    'rgba(118, 75, 162, 0.8)',
                    'rgba(72, 187, 120, 0.8)',
                    'rgba(245, 101, 101, 0.8)',
                    'rgba(237, 100, 166, 0.8)',
                    'rgba(251, 146, 60, 0.8)'
                ],
                borderColor: [
                    'rgba(102, 126, 234, 1)',
                    'rgba(118, 75, 162, 1)',
                    'rgba(72, 187, 120, 1)',
                    'rgba(245, 101, 101, 1)',
                    'rgba(237, 100, 166, 1)',
                    'rgba(251, 146, 60, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: true,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { stepSize: 1 }
                }
            },
            plugins: {
                legend: { display: true, position: 'top' },
                title: { display: true, text: '投票結果圖表' }
            }
        }
    });
}

// ============ 擴展功能：導出 CSV ============

/**
 * 導出投票結果為 CSV
 */
function exportToCSV(poll) {
    if (!poll) {
        alert('無投票資料');
        return;
    }

    const csvContent = PollManager.exportAsCSV(poll);
    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `投票結果_${poll.id.substring(0, 20)}.csv`);
    link.click();
    alert('✅ 投票結果已導出');
}

// ============ 擴展功能：分享投票 ============

/**
 * 複製分享連結到剪貼簿
 */
function copyShareLink(pollId) {
    const link = `${window.location.origin}${window.location.pathname}?pollId=${pollId}`;
    navigator.clipboard.writeText(link).then(() => {
        alert('✅ 分享連結已複製到剪貼簿！\n\n' + link);
    }).catch(() => {
        alert('複製失敗，請手動複製：\n' + link);
    });
}

/**
 * 顯示分享二維碼
 */
function showQRCode(pollId) {
    const qrContainer = document.getElementById('qrContainer');
    if (!qrContainer) return;

    // 檢查 QRCode 庫是否載入
    if (typeof QRCode === 'undefined') {
        alert('二維碼庫未載入，請稍候重試');
        return;
    }

    const link = `${window.location.origin}${window.location.pathname}?pollId=${pollId}`;
    
    // 清除舊二維碼
    qrContainer.innerHTML = '';

    // 生成新二維碼
    QRCode.toCanvas(link, {
        errorCorrectionLevel: 'H',
        type: 'image/png',
        width: 200,
        margin: 1,
        color: {
            dark: '#667eea',
            light: '#ffffff'
        }
    }, (err, canvas) => {
        if (err) {
            console.error('QR Code 生成失敗:', err);
            qrContainer.innerHTML = '<p class="text-danger">二維碼生成失敗</p>';
        } else {
            qrContainer.appendChild(canvas);
        }
    });
}

// ============ Initialization ============

/**
 * 應用初始化
 */
window.addEventListener('DOMContentLoaded', function() {
    console.log('應用已初始化');
    console.log('GUN 連線狀態:', gunClient.isConnected());
    
    // 檢查 URL 參數是否有投票 ID
    const urlParams = new URLSearchParams(window.location.search);
    const pollId = urlParams.get('pollId');
    
    if (pollId) {
        // 加載現有投票
        gunClient.getPoll(pollId)
            .then(poll => {
                currentPoll = poll;
                showVoteSection(poll);
                watchPollChanges();
            })
            .catch(err => {
                console.error('加載投票失敗:', err);
                alert('無法找到投票');
                showCreatePollForm();
            });
    } else {
        showCreatePollForm();
    }
});

// 清理
window.addEventListener('beforeunload', function() {
    if (pollUnwatcher) {
        pollUnwatcher();
    }
});
