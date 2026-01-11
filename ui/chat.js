/**
 * DimStar Demo - 聊天界面逻辑
 */

class ChatUI {
    constructor() {
        this.messagesEl = document.getElementById('messages');
        this.inputEl = document.getElementById('input');
        this.sendBtn = document.getElementById('send-btn');
        this.logsEl = document.getElementById('logs');
        this.statsEl = document.getElementById('stats');
        this.apiKeyInput = document.getElementById('api-key');
        this.thresholdInput = document.getElementById('threshold');

        this.init();
    }

    init() {
        // 设置引擎日志回调
        window.engine.setLogCallback((msg) => this.addLog(msg));

        // 绑定事件
        this.sendBtn.addEventListener('click', () => this.send());
        this.inputEl.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                this.send();
            }
        });

        // 加载保存的 API Key
        const savedKey = window.api.getApiKey();
        if (savedKey) {
            this.apiKeyInput.value = savedKey;
        }

        this.apiKeyInput.addEventListener('change', () => {
            window.api.setApiKey(this.apiKeyInput.value);
        });
    }

    addMessage(role, content) {
        const div = document.createElement('div');
        div.className = `message ${role}`;
        div.innerHTML = `
            <div class="message-role">${role === 'user' ? '👤 你' : '🤖 DimStar'}</div>
            <div class="message-content">${this.formatContent(content)}</div>
        `;
        this.messagesEl.appendChild(div);
        this.messagesEl.scrollTop = this.messagesEl.scrollHeight;
    }

    formatContent(content) {
        // 简单的 Markdown 渲染
        return content
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/\n/g, '<br>')
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/`(.*?)`/g, '<code>$1</code>');
    }

    addLog(message) {
        const div = document.createElement('div');
        div.className = 'log-entry';
        div.textContent = `[${new Date().toLocaleTimeString()}] ${message}`;
        this.logsEl.appendChild(div);
        this.logsEl.scrollTop = this.logsEl.scrollHeight;
    }

    updateStats(stats) {
        this.statsEl.innerHTML = `
            <div>轮次: ${stats.rounds || 0}</div>
            <div>调用: ${stats.callCount || 0}</div>
            <div>质量: ${(stats.quality || 0).toFixed(2)}</div>
        `;
    }

    async send() {
        const input = this.inputEl.value.trim();
        if (!input) return;

        const apiKey = this.apiKeyInput.value.trim();
        if (!apiKey) {
            alert('请先输入 API Key');
            return;
        }
        window.api.setApiKey(apiKey);

        // 显示用户消息
        this.addMessage('user', input);
        this.inputEl.value = '';

        // 禁用发送
        this.sendBtn.disabled = true;
        this.sendBtn.textContent = '思考中...';
        this.logsEl.innerHTML = '';

        try {
            this.addLog('🚀 开始 Self-Eval 融合迭代处理...');
            const startTime = Date.now();

            // 使用融合后的引擎 (原框架 + Self-Eval)
            window.engine.setLogCallback((msg) => this.addLog(msg));
            const result = await window.engine.run(input, 50);

            const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
            this.addLog(`⏱️ 总耗时: ${elapsed} 分钟`);

            // 显示结果
            this.addMessage('assistant', result.result);
            this.updateStats(result);

        } catch (error) {
            this.addLog(`❌ 错误: ${error.message}`);
            this.addMessage('assistant', `发生错误: ${error.message}`);
        }

        this.sendBtn.disabled = false;
        this.sendBtn.textContent = '发送';
    }
}

document.addEventListener('DOMContentLoaded', () => {
    window.chatUI = new ChatUI();
});
