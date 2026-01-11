/**
 * DimStar Demo - Agent 管理模块
 * 包含信任加权、专业化Agent、随机招募
 */

// 三个可用模型 (用户指定，不要修改！)
const MODELS = [
    { id: 'deepseek-ai/deepseek-v3.2', name: 'DeepSeek V3.2', tokens: 128000, traits: ['deep', 'synthesize'] },
    { id: 'openai/gpt-oss-120b', name: 'GPT-OSS 120B', tokens: 4096, traits: ['fast', 'simple'] },
    { id: 'qwen/qwen3-235b-a22b', name: 'Qwen3 235B', tokens: 32000, traits: ['evaluate', 'critique'] }
];

// 专业化Agent角色
const SPECIALIZED_ROLES = {
    analyst: { focus: '深度分析问题', preferTraits: ['deep'], systemPrompt: '你是一个深度分析专家，擅长拆解复杂问题。' },
    creative: { focus: '创意发散思维', preferTraits: ['fast'], systemPrompt: '你是一个创意专家，擅长从多角度思考问题。' },
    critic: { focus: '批判质疑', preferTraits: ['critique'], systemPrompt: '你是一个批判性思维专家，擅长发现问题和漏洞。' },
    synthesizer: { focus: '信息整合', preferTraits: ['synthesize'], systemPrompt: '你是一个整合专家，擅长将多个观点融合成连贯的结论。' },
    evaluator: { focus: '质量评估', preferTraits: ['evaluate'], systemPrompt: '你是一个评估专家，擅长客观评价内容质量。' }
};

// Agent 类
class Agent {
    constructor(id, role, model) {
        this.id = id;
        this.role = role;
        this.model = model;
        this.trust = 0.5;  // 初始信任分
        this.history = [];
    }

    updateTrust(wasGood) {
        if (wasGood) {
            this.trust = Math.min(1.0, this.trust * 1.1);
        } else {
            this.trust = Math.max(0.1, this.trust * 0.9);
        }
    }

    async execute(task) {
        const role = SPECIALIZED_ROLES[this.role];
        const prompt = `${role.systemPrompt}\n\n任务：${task}`;

        const result = await window.api.chat(
            [{ role: 'user', content: prompt }],
            this.model.id
        );

        this.history.push({ task, result: result.slice(0, 200) });
        return result;
    }

    async reflect(result) {
        const prompt = `请反思以下输出是否有改进空间：\n${result.slice(0, 2000)}\n\n如果需要改进，请直接给出改进后的版本。如果已经足够好，回复"无需改进"。`;

        const reflection = await window.api.chat(
            [{ role: 'user', content: prompt }],
            this.model.id
        );

        const needsImprovement = !reflection.includes('无需改进');
        return { needsImprovement, improved: needsImprovement ? reflection : result };
    }
}

// Agent 管理器
class AgentManager {
    constructor() {
        this.agents = new Map();
        this.nextId = 1;
    }

    // 随机招募（概率加权）
    recruitRandom(preferTraits = []) {
        const weights = MODELS.map(m => {
            let weight = 1.0;
            for (const trait of preferTraits) {
                if (m.traits.includes(trait)) weight *= 1.5;
            }
            return weight;
        });

        const total = weights.reduce((a, b) => a + b, 0);
        let random = Math.random() * total;

        for (let i = 0; i < MODELS.length; i++) {
            random -= weights[i];
            if (random <= 0) return MODELS[i];
        }
        return MODELS[0];
    }

    // 创建专业化 Agent
    createAgent(role) {
        const roleConfig = SPECIALIZED_ROLES[role];
        if (!roleConfig) throw new Error(`未知角色: ${role}`);

        const model = this.recruitRandom(roleConfig.preferTraits);
        const agent = new Agent(`agent_${this.nextId++}`, role, model);
        this.agents.set(agent.id, agent);

        console.log(`[AgentManager] 创建 ${role} Agent，招募模型: ${model.name}`);
        return agent;
    }

    // 并行执行多个 Agent
    async parallelExecute(agents, task) {
        const promises = agents.map(agent => agent.execute(task));
        return Promise.all(promises);
    }

    // 信任加权综合
    weightedSynthesize(results, agents) {
        const totalTrust = agents.reduce((sum, a) => sum + a.trust, 0);
        // 这里简化处理，实际应该让模型综合
        return results.map((r, i) => ({
            content: r,
            weight: agents[i].trust / totalTrust,
            agent: agents[i]
        }));
    }
}

window.MODELS = MODELS;
window.SPECIALIZED_ROLES = SPECIALIZED_ROLES;
window.Agent = Agent;
window.agentManager = new AgentManager();
