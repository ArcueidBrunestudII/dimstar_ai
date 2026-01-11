/**
 * DimStar Demo - Prompts 模块
 * 基于 llm-reasoners Self-Eval 技术的提示词
 */

// 逐步推理提示词
const STEP_BY_STEP_PROMPT = `你是一个严谨的推理专家。请逐步解决以下问题。

**重要规则**：
1. 每次只输出一个推理步骤
2. 每个步骤格式：
   【步骤 N】：[你的推理]
3. 使用 \`\`\`math 块显示数学公式
4. 最后一步用 【结论】 标记

问题：{question}

请输出第 {step_num} 步推理：`;

// 自评估提示词
const SELF_EVAL_PROMPT = `请评估以下推理步骤是否正确。

**问题背景**：
{context}

**当前步骤**：
{current_step}

**评估标准**：
1. 逻辑是否正确
2. 计算是否准确
3. 是否有遗漏

请回答：
(A) 正确 - 这一步推理没有问题
(B) 错误 - 这一步有问题

只输出 A 或 B，然后简要说明理由。`;

// 修正提示词
const CORRECTION_PROMPT = `上一步推理存在错误：
{error_reason}

请重新给出正确的推理步骤。只输出修正后的这一步，格式同上。`;

// 综合结论提示词
const SYNTHESIS_PROMPT = `以下是逐步推理的过程，请综合给出最终答案：

{steps}

请给出完整、连贯的最终答案：`;

// 多角色头脑风暴提示词
const BRAINSTORM_PROMPT = `假设你是 3 位不同领域的专家：
1. 逻辑推理专家 - 擅长严谨的逻辑分析
2. 领域专家 - 对该问题领域有深入了解  
3. 批判性思维专家 - 擅长发现问题和漏洞

请针对以下问题，从各自角度给出初步分析：

问题：{question}

请按以下格式输出每位专家的分析：
【专家1-逻辑推理】：...
【专家2-领域知识】：...
【专家3-批判思维】：...`;

// 互相批评提示词
const PEER_CRITIQUE_PROMPT = `以下是三位专家的初步分析：

{analyses}

现在请每位专家批评其他专家的观点，找出潜在的错误、不一致或遗漏：

【专家1对专家2的批评】：...
【专家1对专家3的批评】：...
【专家2对专家1的批评】：...
【专家2对专家3的批评】：...
【专家3对专家1的批评】：...
【专家3对专家2的批评】：...`;

// 收敛最佳答案提示词
const CONVERGENCE_PROMPT = `经过头脑风暴和互相批评，现在请综合所有专家的观点，给出最佳答案：

**原始问题**：{question}

**专家分析**：
{analyses}

**互相批评**：
{critiques}

请给出经过充分论证的最终答案：`;

window.PROMPTS = {
    STEP_BY_STEP: STEP_BY_STEP_PROMPT,
    SELF_EVAL: SELF_EVAL_PROMPT,
    CORRECTION: CORRECTION_PROMPT,
    SYNTHESIS: SYNTHESIS_PROMPT,
    BRAINSTORM: BRAINSTORM_PROMPT,
    PEER_CRITIQUE: PEER_CRITIQUE_PROMPT,
    CONVERGENCE: CONVERGENCE_PROMPT
};

console.log('[Prompts] 提示词模块已加载');
