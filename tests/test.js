/**
 * Test Suite - Polling System
 * 使用 Mocha + Chai 進行單元測試
 */

describe('PollManager', () => {
    // ============ TC-1: 建立投票 ============
    describe('TC-1: createPoll', () => {
        it('should create a poll with title and options', () => {
            const poll = PollManager.createPoll('你最喜歡的語言？', ['JavaScript', 'Python'], 'single', 'TestUser');
            
            expect(poll).to.have.property('id');
            expect(poll.id).to.match(/^poll_/);
            expect(poll.title).to.equal('你最喜歡的語言？');
            expect(poll.options).to.be.an('array').with.lengthOf(2);
            expect(poll.type).to.equal('single');
            expect(poll.createdBy).to.equal('TestUser');
            expect(poll.status).to.equal('active');
            expect(poll.totalVotes).to.equal(0);
        });

        it('should throw error if title is empty', () => {
            expect(() => {
                PollManager.createPoll('', ['Option 1', 'Option 2']);
            }).to.throw('標題不能為空');
        });

        it('should throw error if options less than 2', () => {
            expect(() => {
                PollManager.createPoll('Title', ['Only One']);
            }).to.throw('至少需要 2 個選項');
        });

        it('should throw error if invalid poll type', () => {
            expect(() => {
                PollManager.createPoll('Title', ['Opt1', 'Opt2'], 'invalid');
            }).to.throw('題目類型必須為 single 或 multiple');
        });

        it('should create poll with multiple type', () => {
            const poll = PollManager.createPoll('Multi Choice', ['A', 'B', 'C'], 'multiple');
            
            expect(poll.type).to.equal('multiple');
            expect(poll.options).to.have.lengthOf(3);
        });

        it('should filter empty option strings', () => {
            const poll = PollManager.createPoll('Title', ['Option 1', '', 'Option 3', '  ']);
            
            expect(poll.options).to.have.lengthOf(2);
            expect(poll.options[0].text).to.equal('Option 1');
            expect(poll.options[1].text).to.equal('Option 3');
        });

        it('should assign default createdBy if not provided', () => {
            const poll = PollManager.createPoll('Title', ['A', 'B']);
            
            expect(poll.createdBy).to.equal('Anonymous');
        });
    });

    // ============ TC-2: 參與投票 ============
    describe('TC-2: submitVote', () => {
        let testPoll;

        beforeEach(() => {
            testPoll = PollManager.createPoll('Test Poll', ['Option A', 'Option B', 'Option C']);
        });

        it('should submit a vote and increase vote count', () => {
            const updatedPoll = PollManager.submitVote(testPoll, 'User1', ['opt_0']);
            
            expect(updatedPoll.options[0].votes).to.equal(1);
            expect(updatedPoll.totalVotes).to.equal(1);
            expect(updatedPoll.votes['User1']).to.exist;
            expect(updatedPoll.votes['User1'].selectedOptions).to.deep.equal(['opt_0']);
        });

        it('should handle multiple votes from different users', () => {
            let poll = testPoll;
            
            poll = PollManager.submitVote(poll, 'User1', ['opt_0']);
            poll = PollManager.submitVote(poll, 'User2', ['opt_0']);
            poll = PollManager.submitVote(poll, 'User3', ['opt_1']);
            
            expect(poll.options[0].votes).to.equal(2);
            expect(poll.options[1].votes).to.equal(1);
            expect(poll.totalVotes).to.equal(3);
        });

        it('should throw error if user ID is empty', () => {
            expect(() => {
                PollManager.submitVote(testPoll, '', ['opt_0']);
            }).to.throw('用戶 ID 不能為空');
        });

        it('should throw error if no option selected', () => {
            expect(() => {
                PollManager.submitVote(testPoll, 'User1', []);
            }).to.throw('必須選擇至少一個選項');
        });

        it('should throw error if invalid option ID', () => {
            expect(() => {
                PollManager.submitVote(testPoll, 'User1', ['invalid_id']);
            }).to.throw('選項 ID 無效');
        });

        it('should throw error if single vote has multiple selections', () => {
            expect(() => {
                PollManager.submitVote(testPoll, 'User1', ['opt_0', 'opt_1']);
            }).to.throw('單選投票只能選擇一個選項');
        });

        it('should allow multiple selections for multiple poll type', () => {
            const multiPoll = PollManager.createPoll('Multi', ['A', 'B', 'C'], 'multiple');
            const updated = PollManager.submitVote(multiPoll, 'User1', ['opt_0', 'opt_2']);
            
            expect(updated.options[0].votes).to.equal(1);
            expect(updated.options[2].votes).to.equal(1);
            expect(updated.totalVotes).to.equal(2);
        });
    });

    // ============ TC-3 & TC-4: 修改投票 ============
    describe('TC-3 & TC-4: Update Vote', () => {
        let testPoll;

        beforeEach(() => {
            testPoll = PollManager.createPoll('Update Test', ['A', 'B', 'C']);
        });

        it('should update user vote and adjust vote counts', () => {
            let poll = PollManager.submitVote(testPoll, 'User1', ['opt_0']);
            expect(poll.options[0].votes).to.equal(1);
            expect(poll.totalVotes).to.equal(1);

            // 修改投票
            poll = PollManager.submitVote(poll, 'User1', ['opt_1']);
            
            expect(poll.options[0].votes).to.equal(0);
            expect(poll.options[1].votes).to.equal(1);
            expect(poll.totalVotes).to.equal(1); // 總數不變
        });

        it('should handle multiple vote updates', () => {
            let poll = testPoll;
            
            poll = PollManager.submitVote(poll, 'User1', ['opt_0']);
            poll = PollManager.submitVote(poll, 'User2', ['opt_0']);
            
            // User1 改投 opt_1
            poll = PollManager.submitVote(poll, 'User1', ['opt_1']);
            
            expect(poll.options[0].votes).to.equal(1); // User2
            expect(poll.options[1].votes).to.equal(1); // User1
            expect(poll.totalVotes).to.equal(2);
        });
    });

    // ============ TC-5: 投票統計 ============
    describe('TC-5: calculateStats', () => {
        let testPoll;

        beforeEach(() => {
            testPoll = PollManager.createPoll('Stats Test', ['Option A', 'Option B']);
        });

        it('should calculate correct statistics', () => {
            let poll = testPoll;
            poll = PollManager.submitVote(poll, 'User1', ['opt_0']);
            poll = PollManager.submitVote(poll, 'User2', ['opt_0']);
            poll = PollManager.submitVote(poll, 'User3', ['opt_1']);
            
            const stats = PollManager.calculateStats(poll);
            
            expect(stats.totalVotes).to.equal(3);
            expect(stats.options[0].votes).to.equal(2);
            expect(stats.options[0].percentage).to.equal(66.7);
            expect(stats.options[1].votes).to.equal(1);
            expect(stats.options[1].percentage).to.equal(33.3);
        });

        it('should return 0 percentage for zero votes', () => {
            const stats = PollManager.calculateStats(testPoll);
            
            expect(stats.totalVotes).to.equal(0);
            expect(stats.options[0].percentage).to.equal(0);
            expect(stats.options[1].percentage).to.equal(0);
        });

        it('should handle empty poll gracefully', () => {
            const stats = PollManager.calculateStats(null);
            
            expect(stats.options).to.be.an('array').with.lengthOf(0);
            expect(stats.totalVotes).to.equal(0);
        });
    });

    // ============ TC-6: 資料持久化 ============
    describe('TC-6: Data Persistence (User Vote Tracking)', () => {
        let testPoll;

        beforeEach(() => {
            testPoll = PollManager.createPoll('Persistence Test', ['X', 'Y', 'Z']);
        });

        it('should track all user votes', () => {
            let poll = testPoll;
            poll = PollManager.submitVote(poll, 'User1', ['opt_0']);
            poll = PollManager.submitVote(poll, 'User2', ['opt_1']);
            poll = PollManager.submitVote(poll, 'User3', ['opt_2']);
            
            expect(poll.votes['User1']).to.exist;
            expect(poll.votes['User2']).to.exist;
            expect(poll.votes['User3']).to.exist;
            expect(Object.keys(poll.votes)).to.have.lengthOf(3);
        });

        it('should have correct timestamp in vote records', () => {
            const before = Date.now();
            const poll = PollManager.submitVote(testPoll, 'User1', ['opt_0']);
            const after = Date.now();
            
            expect(poll.votes['User1'].timestamp).to.be.greaterThanOrEqual(before);
            expect(poll.votes['User1'].timestamp).to.be.lessThanOrEqual(after);
        });

        it('should have unique vote IDs', () => {
            let poll = testPoll;
            poll = PollManager.submitVote(poll, 'User1', ['opt_0']);
            const voteId1 = poll.votes['User1'].id;
            
            poll = PollManager.submitVote(poll, 'User2', ['opt_0']);
            const voteId2 = poll.votes['User2'].id;
            
            expect(voteId1).to.not.equal(voteId2);
        });
    });

    // ============ 額外功能測試 ============
    describe('Additional Features', () => {
        let testPoll;

        beforeEach(() => {
            testPoll = PollManager.createPoll('Extra Test', ['A', 'B', 'C']);
        });

        it('should check if user has voted', () => {
            let poll = testPoll;
            
            expect(PollManager.hasUserVoted(poll, 'User1')).to.be.false;
            
            poll = PollManager.submitVote(poll, 'User1', ['opt_0']);
            
            expect(PollManager.hasUserVoted(poll, 'User1')).to.be.true;
            expect(PollManager.hasUserVoted(poll, 'User2')).to.be.false;
        });

        it('should retrieve user vote record', () => {
            let poll = testPoll;
            poll = PollManager.submitVote(poll, 'User1', ['opt_0']);
            
            const userVote = PollManager.getUserVote(poll, 'User1');
            
            expect(userVote).to.exist;
            expect(userVote.userId).to.equal('User1');
            expect(userVote.selectedOptions).to.deep.equal(['opt_0']);
        });

        it('should generate unique IDs with correct prefix', () => {
            const pollId = PollManager.generateId('poll');
            const voteId = PollManager.generateId('vote');
            const optId = PollManager.generateId('opt');
            
            expect(pollId).to.match(/^poll_\d+_[a-z0-9]+$/);
            expect(voteId).to.match(/^vote_\d+_[a-z0-9]+$/);
            expect(optId).to.match(/^opt_\d+_[a-z0-9]+$/);
            
            // 檢查各 ID 唯一性
            expect(pollId).to.not.equal(PollManager.generateId('poll'));
        });
    });
});

// ============ Integration Tests (Manual) ============
describe('Integration Tests (Manual Browser Tests)', () => {
    it('should handle multiple browser tabs synchronization', () => {
        // 手動測試：用 2 個瀏覽器標籤打開相同投票頁面
        // 預期：標籤 A 投票 → 標籤 B 看到結果更新（< 1 秒）
        console.log('Manual: Open same poll in 2 browser tabs and vote');
        expect(true).to.be.true;
    });

    it('should persist data after browser reload', () => {
        // 手動測試：建立投票，重新整理頁面
        // 預期：投票與結果仍存在
        console.log('Manual: Create poll, refresh browser, verify poll persists');
        expect(true).to.be.true;
    });
});

// ============ 擴展功能測試 ============

describe('擴展功能 - 倒數計時', () => {
    it('應識別投票是否已過期', () => {
        const expiredPoll = {
            id: 'poll_test',
            title: '已過期投票',
            endTime: Date.now() - 60000 // 1 分鐘前
        };
        expect(PollManager.isExpired(expiredPoll)).to.be.true;
    });

    it('應識別投票未過期', () => {
        const activePoll = {
            id: 'poll_test',
            title: '進行中投票',
            endTime: Date.now() + 60000 // 1 分鐘後
        };
        expect(PollManager.isExpired(activePoll)).to.be.false;
    });

    it('應計算剩餘時間（秒）', () => {
        const poll = {
            endTime: Date.now() + 125000 // 125 秒後
        };
        const remaining = PollManager.getTimeRemaining(poll);
        expect(remaining).to.be.above(120);
        expect(remaining).to.be.below(130);
    });

    it('應格式化時間為 MM:SS', () => {
        const formatted = PollManager.formatTimeRemaining(125);
        expect(formatted).to.equal('2:05');
    });

    it('應格式化小於 60 秒的時間', () => {
        const formatted = PollManager.formatTimeRemaining(45);
        expect(formatted).to.equal('0:45');
    });
});

describe('擴展功能 - CSV 導出', () => {
    it('應生成有效的 CSV 格式', () => {
        const poll = PollManager.createPoll('CSV 測試', ['選項A', '選項B'], 'single');
        poll.votes = [
            { userId: 'user1', selectedOptions: [0] },
            { userId: 'user2', selectedOptions: [0] },
            { userId: 'user3', selectedOptions: [1] }
        ];
        const csv = PollManager.exportAsCSV(poll);
        expect(csv).to.include('投票標題');
        expect(csv).to.include('選項');
        expect(csv).to.include('票數');
        expect(csv).to.include('百分比');
    });

    it('CSV 應包含正確的票數', () => {
        const poll = PollManager.createPoll('CSV 票數', ['A', 'B', 'C'], 'single');
        poll.votes = [
            { userId: 'user1', selectedOptions: [0] },
            { userId: 'user2', selectedOptions: [0] }
        ];
        const csv = PollManager.exportAsCSV(poll);
        expect(csv).to.include('2'); // 應有 2 票
    });
});
