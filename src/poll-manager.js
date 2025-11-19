/**
 * Poll Manager Module
 * 投票業務邏輯層
 */

const PollManager = {
    /**
     * 生成唯一 ID
     * @returns {string}
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    },

    /**
     * 建立投票
     * @param {string} title - 投票標題
     * @param {array} optionTexts - 選項文字陣列
     * @param {string} type - 題目類型 ('single' 或 'multiple')
     * @param {string} createdBy - 建立者 (暱稱)
     * @returns {object} 新投票物件
     */
    createPoll(title, optionTexts, type = 'single', createdBy = 'Anonymous') {
        if (!title || title.trim() === '') {
            throw new Error('標題不能為空');
        }

        if (!optionTexts || optionTexts.length < 2) {
            throw new Error('至少需要 2 個選項');
        }

        if (!['single', 'multiple'].includes(type)) {
            throw new Error('題目類型必須為 single 或 multiple');
        }

        const pollId = this.generateId('poll');
        const options = optionTexts
            .filter(text => text && text.trim() !== '')
            .map((text, index) => ({
                id: `opt_${index}`,
                text: text.trim(),
                votes: 0
            }));

        const poll = {
            id: pollId,
            title: title.trim(),
            type: type,
            options: options,
            createdAt: Date.now(),
            createdBy: createdBy || 'Anonymous',
            status: 'active',
            totalVotes: 0,
            votes: {}
        };

        return poll;
    },

    /**
     * 驗證投票記錄
     * @param {object} poll - 投票物件
     * @param {string} userId - 用戶 ID
     * @param {array} selectedOptions - 已選選項 ID 陣列
     * @returns {object} 投票記錄
     */
    validateAndCreateVote(poll, userId, selectedOptions) {
        if (!poll || !poll.id) {
            throw new Error('投票物件無效');
        }

        if (!userId || userId.trim() === '') {
            throw new Error('用戶 ID 不能為空');
        }

        if (!selectedOptions || selectedOptions.length === 0) {
            throw new Error('必須選擇至少一個選項');
        }

        // 檢查選項是否有效
        const validOptionIds = poll.options.map(opt => opt.id);
        const isValid = selectedOptions.every(optId => validOptionIds.includes(optId));

        if (!isValid) {
            throw new Error('選項 ID 無效');
        }

        // 單選只能選一個
        if (poll.type === 'single' && selectedOptions.length > 1) {
            throw new Error('單選投票只能選擇一個選項');
        }

        return {
            id: this.generateId('vote'),
            pollId: poll.id,
            userId: userId.trim(),
            selectedOptions: selectedOptions,
            timestamp: Date.now()
        };
    },

    /**
     * 提交投票
     * @param {object} poll - 投票物件
     * @param {string} userId - 用戶 ID
     * @param {array} selectedOptions - 已選選項 ID 陣列
     * @returns {object} 更新後的投票物件
     */
    submitVote(poll, userId, selectedOptions) {
        const vote = this.validateAndCreateVote(poll, userId, selectedOptions);

        // 複製投票物件以避免修改原始物件
        const updatedPoll = JSON.parse(JSON.stringify(poll));

        // 檢查該用戶是否已投票，如果有則先撤銷舊投票
        if (updatedPoll.votes && updatedPoll.votes[userId]) {
            const oldVote = updatedPoll.votes[userId];
            oldVote.selectedOptions.forEach(optId => {
                const option = updatedPoll.options.find(opt => opt.id === optId);
                if (option && option.votes > 0) {
                    option.votes--;
                    updatedPoll.totalVotes--;
                }
            });
        }

        // 計算新投票
        selectedOptions.forEach(optId => {
            const option = updatedPoll.options.find(opt => opt.id === optId);
            if (option) {
                option.votes++;
                updatedPoll.totalVotes++;
            }
        });

        // 記錄投票
        if (!updatedPoll.votes) {
            updatedPoll.votes = {};
        }
        updatedPoll.votes[userId] = vote;

        return updatedPoll;
    },

    /**
     * 計算投票統計
     * @param {object} poll - 投票物件
     * @returns {object} 統計結果 { options: [], totalVotes: number }
     */
    calculateStats(poll) {
        if (!poll || !poll.options) {
            return { options: [], totalVotes: 0 };
        }

        const stats = {
            totalVotes: poll.totalVotes || 0,
            options: poll.options.map(option => {
                const percentage = poll.totalVotes > 0 
                    ? ((option.votes / poll.totalVotes) * 100).toFixed(1) 
                    : 0;
                return {
                    ...option,
                    percentage: parseFloat(percentage)
                };
            })
        };

        return stats;
    },

    /**
     * 檢查用戶是否已投票
     * @param {object} poll - 投票物件
     * @param {string} userId - 用戶 ID
     * @returns {boolean}
     */
    hasUserVoted(poll, userId) {
        return poll && poll.votes && poll.votes[userId] ? true : false;
    },

    /**
     * 獲取用戶的投票紀錄
     * @param {object} poll - 投票物件
     * @param {string} userId - 用戶 ID
     * @returns {object|null} 投票紀錄或 null
     */
    getUserVote(poll, userId) {
        if (!poll || !poll.votes) {
            return null;
        }
        return poll.votes[userId] || null;
    },

    /**
     * 判斷投票是否已截止
     * @param {object} poll - 投票物件
     * @returns {boolean}
     */
    isExpired(poll) {
        if (!poll || !poll.endTime) return false;
        return Date.now() > poll.endTime;
    },

    /**
     * 獲取剩餘時間（秒）
     * @param {object} poll - 投票物件
     * @returns {number} 剩餘秒數
     */
    getTimeRemaining(poll) {
        if (!poll || !poll.endTime) return Infinity;
        const remaining = poll.endTime - Date.now();
        return remaining > 0 ? remaining : 0;
    },

    /**
     * 格式化倒數時間（MM:SS）
     * @param {number} seconds - 秒數
     * @returns {string} 格式化時間
     */
    formatTimeRemaining(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds) % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    },

    /**
     * 導出投票結果為 CSV 格式的字符串
     * @param {object} poll - 投票物件
     * @returns {string} CSV 內容
     */
    exportAsCSV(poll) {
        const stats = this.calculateStats(poll);
        let csvContent = '投票標題,選項,票數,百分比\n';
        
        stats.options.forEach((opt, idx) => {
            const row = [
                idx === 0 ? poll.title : '',
                `"${opt.text}"`,
                opt.votes,
                `${opt.percentage}%`
            ].join(',');
            csvContent += row + '\n';
        });
        
        return csvContent;
    }
};

// 導出到全局作用域
window.PollManager = PollManager;
