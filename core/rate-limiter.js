/**
 * DimStar Demo - 速率限制器
 * 防止超过 NVIDIA API 限制
 */

class RateLimiter {
    constructor(maxCallsPerMinute = 5) {
        this.maxCalls = maxCallsPerMinute;
        this.calls = [];
        this.waiting = false;
    }

    async wait() {
        const now = Date.now();
        const oneMinuteAgo = now - 60000;

        // 清理一分钟前的调用记录
        this.calls = this.calls.filter(t => t > oneMinuteAgo);

        // 如果达到限制，等待
        if (this.calls.length >= this.maxCalls) {
            const oldestCall = this.calls[0];
            const waitTime = oldestCall + 60000 - now + 1000; // 多等1秒

            if (waitTime > 0) {
                window.engine?.log(`⏳ 速率限制: 等待 ${Math.ceil(waitTime / 1000)} 秒...`);
                await new Promise(resolve => setTimeout(resolve, waitTime));
            }

            // 清理过期记录
            this.calls = this.calls.filter(t => t > Date.now() - 60000);
        }

        this.calls.push(Date.now());
    }

    getStatus() {
        const oneMinuteAgo = Date.now() - 60000;
        const recentCalls = this.calls.filter(t => t > oneMinuteAgo).length;
        return {
            usedThisMinute: recentCalls,
            remaining: this.maxCalls - recentCalls
        };
    }
}

// 全局速率限制器，每分钟最多 20 次调用
window.rateLimiter = new RateLimiter(20);
console.log('[RateLimiter] 速率限制器已加载，每分钟最多 20 次调用');
