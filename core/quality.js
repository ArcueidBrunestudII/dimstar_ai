/**
 * DimStar Demo - 质量评估模块
 * 多模型交叉评估
 */

// 多模型交叉评估
async function evaluateQualityConsensus(content) {
    const evaluators = window.MODELS;
    const scores = [];

    window.engine?.log('🔍 开始多模型交叉评估...');

    for (const model of evaluators) {
        const prompt = `请评估以下内容的质量，考虑完整性、准确性、深度、实用性。
只返回一个 0 到 1 之间的数字（如 0.75），不要其他文字。

内容：
${content.slice(0, 3000)}${content.length > 3000 ? '...(截断)' : ''}`;

        try {
            const response = await window.api.chat(
                [{ role: 'user', content: prompt }],
                model.id
            );

            const match = response.match(/([0-9]*\.?[0-9]+)/);
            if (match) {
                const score = parseFloat(match[1]);
                if (score >= 0 && score <= 1) {
                    scores.push({ model: model.name, score });
                    window.engine?.log(`  ${model.name}: ${score.toFixed(2)}`);
                }
            }
        } catch (error) {
            console.error(`[Quality] ${model.name} 评估失败:`, error);
        }
    }

    if (scores.length === 0) return 0.5;

    // 取中位数作为共识
    scores.sort((a, b) => a.score - b.score);
    const median = scores[Math.floor(scores.length / 2)].score;

    window.engine?.log(`📊 共识质量分数: ${median.toFixed(2)}`);
    return median;
}

// 多条件收敛判断
function shouldConverge(state) {
    const {
        quality = 0,
        round = 1,
        noImproveCount = 0,
        callCount = 0,
        threshold = 50
    } = state;

    const conditions = {
        qualityEnough: quality >= 0.9,
        maxRounds: round >= 10,
        noImprovement: noImproveCount >= 3,
        budgetExceeded: callCount >= threshold * 2
    };

    const shouldStop = Object.values(conditions).some(v => v);

    if (shouldStop) {
        const reason = Object.entries(conditions)
            .filter(([, v]) => v)
            .map(([k]) => k)
            .join(', ');
        window.engine?.log(`🏁 收敛! 原因: ${reason}`);
    }

    return shouldStop;
}

// 计算调用预算
function calculateBudget(threshold, quality) {
    if (quality >= 0.9) return threshold;
    const growthFactor = 1 + Math.pow(1 - quality, 2);
    return Math.ceil(threshold * growthFactor);
}

window.evaluateQualityConsensus = evaluateQualityConsensus;
window.shouldConverge = shouldConverge;
window.calculateBudget = calculateBudget;
