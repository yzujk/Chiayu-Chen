/**
 * GUN Client Module
 * 初始化 GUN 實例與提供基本操作
 */

// Initialize GUN instance
// If using local GUN server, change the URL accordingly
const gun = GUN();

// Namespace for all poll-related data
const pollsDB = gun.get('polls');

/**
 * GUN 操作模組
 */
const GunClient = {
    /**
     * 保存投票到 GUN
     * @param {string} pollId - 投票 ID
     * @param {object} pollData - 投票數據
     * @returns {Promise}
     */
    savePoll(pollId, pollData) {
        return new Promise((resolve, reject) => {
            pollsDB.get(pollId).put(pollData, (ack) => {
                if (ack.err) {
                    reject(new Error(ack.err));
                } else {
                    resolve(ack);
                }
            });
        });
    },

    /**
     * 從 GUN 讀取投票
     * @param {string} pollId - 投票 ID
     * @returns {Promise}
     */
    getPoll(pollId) {
        return new Promise((resolve, reject) => {
            pollsDB.get(pollId).once((data) => {
                if (data && data.id) {
                    resolve(data);
                } else {
                    reject(new Error('Poll not found'));
                }
            }, (err) => {
                reject(err);
            });
        });
    },

    /**
     * 監聽投票變化（實時更新）
     * @param {string} pollId - 投票 ID
     * @param {function} callback - 回調函數
     * @returns {function} 取消監聽的函數
     */
    watchPoll(pollId, callback) {
        const ref = pollsDB.get(pollId).on((data) => {
            if (data && data.id) {
                callback(data);
            }
        });

        // 返回取消監聽函數
        return () => ref.off();
    },

    /**
     * 保存投票記錄
     * @param {string} pollId - 投票 ID
     * @param {string} voteId - 投票記錄 ID
     * @param {object} voteData - 投票記錄數據
     * @returns {Promise}
     */
    saveVote(pollId, voteId, voteData) {
        return new Promise((resolve, reject) => {
            pollsDB.get(pollId).get('votes').get(voteId).put(voteData, (ack) => {
                if (ack.err) {
                    reject(new Error(ack.err));
                } else {
                    resolve(ack);
                }
            });
        });
    },

    /**
     * 獲取投票的所有投票記錄
     * @param {string} pollId - 投票 ID
     * @returns {Promise}
     */
    getVotes(pollId) {
        return new Promise((resolve, reject) => {
            const votes = {};
            pollsDB.get(pollId).get('votes').map().once((vote) => {
                if (vote && vote.id) {
                    votes[vote.id] = vote;
                }
            });

            // 延遲以確保所有投票都被讀取
            setTimeout(() => {
                resolve(Object.values(votes));
            }, 500);
        });
    },

    /**
     * 刪除投票
     * @param {string} pollId - 投票 ID
     * @returns {Promise}
     */
    deletePoll(pollId) {
        return new Promise((resolve, reject) => {
            pollsDB.get(pollId).put(null, (ack) => {
                if (ack.err) {
                    reject(new Error(ack.err));
                } else {
                    resolve(ack);
                }
            });
        });
    },

    /**
     * 驗證連線狀態
     * @returns {boolean}
     */
    isConnected() {
        return gun._.on ? true : false;
    }
};

// 導出 GUN 實例和客戶端模組供全局使用
window.gunClient = GunClient;
window.gunInstance = gun;
window.pollsDB = pollsDB;
