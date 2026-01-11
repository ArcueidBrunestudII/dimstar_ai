/**
 * DimStar Demo - API 模块
 * 封装 NVIDIA API 调用
 */

const API_ENDPOINT = 'https://integrate.api.nvidia.com/v1';

// 需要思考链的模型
const THINKING_MODELS = ['openai/gpt-oss-120b', 'qwen/qwen3-235b-a22b'];

class DimStarAPI {
    constructor() {
        this.apiKey = localStorage.getItem('dimstar_api_key') || '';
    }

    setApiKey(key) {
        this.apiKey = key;
        localStorage.setItem('dimstar_api_key', key);
    }

    getApiKey() {
        return this.apiKey;
    }

    async chat(messages, model) {
        if (!this.apiKey) {
            throw new Error('API Key 未设置');
        }

        // 速率限制
        if (window.rateLimiter) {
            await window.rateLimiter.wait();
        }

        // 构建请求体
        const requestBody = {
            model: model,
            messages: messages,
            stream: false,
            max_tokens: 4096,
            temperature: 0.7
        };

        // 非 DeepSeek 模型需要开启思考链
        if (THINKING_MODELS.includes(model)) {
            requestBody.thinking = {
                type: 'enabled',
                budget_tokens: 1024
            };
        }

        const response = await fetch(`${API_ENDPOINT}/chat/completions`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            const error = await response.text();
            throw new Error(`API 错误: ${error}`);
        }

        const data = await response.json();
        
        // 处理思考链输出 - 提取 content 部分
        const choice = data.choices?.[0];
        if (choice?.message?.content) {
            return choice.message.content;
        }
        
        // 可能是思考链格式
        if (choice?.message?.reasoning_content) {
            // 返回思考结果，不是思考过程
            return choice.message.content || choice.message.reasoning_content;
        }
        
        return '';
    }
}

window.api = new DimStarAPI();

