/**
 * DimStar Demo - Self-Eval 推理引擎
 * 实现逐步推理 + 每步自评估
 */

class SelfEvalEngine {
    constructor() {
        this.maxRetries = 3;  // 每步最多重试次数
        this.maxSteps = 10;   // 最大步骤数
        this.steps = [];
        this.logCallback = null;
    }

    setLogCallback(callback) {
        this.logCallback = callback;
    }

    log(message) {
        console.log(`[SelfEval] ${message}`);
        if (this.logCallback) {
            this.logCallback(message);
        }
    }

    // 替换模板变量
    formatPrompt(template, vars) {
        let result = template;
        for (const [key, value] of Object.entries(vars)) {
            result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
        }
        return result;
    }

    // 生成单步推理
    async generateStep(question, stepNum, previousSteps) {
        const context = previousSteps.length > 0
            ? previousSteps.map((s, i) => `【步骤 ${i + 1}】：${s}`).join('\n')
            : '这是第一步';

        const prompt = this.formatPrompt(window.PROMPTS.STEP_BY_STEP, {
            question,
            step_num: stepNum,
            context
        });

        const model = window.agentManager.recruitRandom(['deep']);
        const response = await window.api.chat(
            [{ role: 'user', content: prompt }],
            model.id
        );

        return response;
    }

    // 自评估单步
    async selfEvaluateStep(question, currentStep, previousSteps) {
        const context = `问题：${question}\n\n历史步骤：\n${previousSteps.join('\n')}`;

        const prompt = this.formatPrompt(window.PROMPTS.SELF_EVAL, {
            context,
            current_step: currentStep
        });

        const model = window.agentManager.recruitRandom(['evaluate']);
        const response = await window.api.chat(
            [{ role: 'user', content: prompt }],
            model.id
        );

        // 解析结果
        const isCorrect = response.trim().toUpperCase().startsWith('A');
        const reason = response.replace(/^[AB]\s*/i, '').trim();

        return { isCorrect, reason, raw: response };
    }

    // 修正错误步骤
    async correctStep(question, errorReason, previousSteps) {
        const prompt = this.formatPrompt(window.PROMPTS.CORRECTION, {
            error_reason: errorReason,
            context: previousSteps.join('\n')
        });

        const model = window.agentManager.recruitRandom(['deep']);
        const response = await window.api.chat(
            [{ role: 'user', content: prompt }],
            model.id
        );

        return response;
    }

    // 综合最终答案
    async synthesize(question, steps) {
        const prompt = this.formatPrompt(window.PROMPTS.SYNTHESIS, {
            steps: steps.map((s, i) => `【步骤 ${i + 1}】：${s}`).join('\n')
        });

        const model = window.agentManager.recruitRandom(['synthesize']);
        const response = await window.api.chat(
            [{ role: 'user', content: prompt }],
            model.id
        );

        return response;
    }

    // 主流程：逐步推理 + 自评估
    async run(question) {
        this.steps = [];
        this.log(`🎯 开始逐步推理...`);

        for (let stepNum = 1; stepNum <= this.maxSteps; stepNum++) {
            this.log(`\n📝 生成第 ${stepNum} 步...`);

            let step = null;
            let retries = 0;

            while (retries < this.maxRetries) {
                // 生成步骤
                if (step === null) {
                    step = await this.generateStep(question, stepNum, this.steps);
                }

                this.log(`   步骤内容: ${step.slice(0, 100)}...`);

                // 自评估
                this.log(`🔍 自评估第 ${stepNum} 步...`);
                const evalResult = await this.selfEvaluateStep(question, step, this.steps);

                if (evalResult.isCorrect) {
                    this.log(`✅ 第 ${stepNum} 步通过评估`);
                    this.steps.push(step);
                    break;
                } else {
                    this.log(`❌ 第 ${stepNum} 步评估失败: ${evalResult.reason.slice(0, 50)}...`);
                    retries++;

                    if (retries < this.maxRetries) {
                        this.log(`🔄 重试 (${retries}/${this.maxRetries})...`);
                        step = await this.correctStep(question, evalResult.reason, this.steps);
                    }
                }
            }

            if (retries >= this.maxRetries) {
                this.log(`⚠️ 第 ${stepNum} 步多次重试仍失败，使用最后版本继续`);
                this.steps.push(step);
            }

            // 检查是否已得出结论
            if (step && (step.includes('【结论】') || step.includes('最终答案'))) {
                this.log(`🏁 检测到结论，停止推理`);
                break;
            }
        }

        // 综合最终答案
        this.log(`\n📊 综合最终答案...`);
        const finalAnswer = await this.synthesize(question, this.steps);

        return {
            steps: this.steps,
            finalAnswer,
            totalSteps: this.steps.length
        };
    }
}

window.selfEvalEngine = new SelfEvalEngine();
console.log('[SelfEvalEngine] Self-Eval 推理引擎已加载');
