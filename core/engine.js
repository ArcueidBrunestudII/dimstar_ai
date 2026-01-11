/**
 * DimStar Demo - 迭代执行引擎
 * 完整实现迭代上升 + 收敛
 */

class IterativeEngine {
    constructor() {
        this.round = 0;
        this.callCount = 0;
        this.threshold = 50;  // 默认阈值
        this.history = [];
        this.lastQuality = 0;
        this.noImproveCount = 0;
        this.logCallback = null;
    }

    setLogCallback(callback) {
        this.logCallback = callback;
    }

    log(message) {
        console.log(`[Engine] ${message}`);
        if (this.logCallback) {
            this.logCallback(message);
        }
    }

    // 动态角色创建 - 根据轮次和质量决定角色数量和类型
    createDynamicRoles(round, quality) {
        this.log(`🎭 动态创建角色 (轮次${round}, 质量${quality.toFixed(2)})...`);

        let roles = [];

        if (round === 1) {
            // 第1轮：基础探索
            roles = ['analyst', 'creative', 'creative', 'synthesizer'];
            this.log('   → 第1轮: 种子思考 + 发散×2 + 整合');
        } else if (quality < 0.5) {
            // 质量很差：大量增加角色
            roles = [
                'analyst',           // 深度分析
                'analyst',           // 再分析
                'creative',          // 研究1
                'creative',          // 研究2
                'creative',          // 研究3
                'critic',            // 质疑1
                'critic',            // 质疑2
                'synthesizer'        // 综合
            ];
            this.log('   → 质量差(<0.5): 大规模研究团队 (8人)');
        } else if (quality < 0.8) {
            // 还需改进
            roles = ['analyst', 'critic', 'creative', 'synthesizer'];
            this.log('   → 中等质量(<0.8): 精炼+质疑+改进 (4人)');
        } else {
            // 快收敛了
            roles = ['synthesizer', 'evaluator'];
            this.log('   → 高质量(≥0.8): 最终抛光 (2人)');
        }

        // 创建 Agent
        const workers = roles.map(role => window.agentManager.createAgent(role));
        this.log(`   → 创建了 ${workers.length} 个 Agent`);

        return workers;
    }

    // 管理者协调模式 + Self-Eval 融合
    async managerCoordinate(task) {
        this.log('👔 管理者开始协调任务...');

        // 1. 分解任务 + Self-Eval
        const decomposer = window.agentManager.createAgent('analyst');
        let decomposition = await decomposer.execute(
            `请将以下任务分解为 2-3 个子任务：\n${task.current}`
        );
        this.callCount++;

        // 对任务分解进行 Self-Eval
        this.log('🔍 Self-Eval: 检查任务分解...');
        const decompEval = await this.selfEvaluate(
            task.current,
            decomposition,
            '任务分解是否合理、完整、无遗漏？'
        );
        if (!decompEval.isCorrect) {
            this.log('🔄 任务分解需要改进，重新生成...');
            decomposition = await decomposer.execute(
                `任务分解存在问题：${decompEval.reason}\n请重新分解：\n${task.current}`
            );
            this.callCount++;
        }

        // 解析子任务
        const subtasks = decomposition.split('\n')
            .filter(line => line.trim() && /^\d|^[一二三四五]/.test(line.trim()))
            .slice(0, 3);

        this.log(`📋 分解为 ${subtasks.length} 个子任务`);

        // 2. 动态分配工人 - 不再是固定的3个角色！
        const workers = this.createDynamicRoles(this.round, this.lastQuality);

        // 3. 并行执行所有 Agent (加速!)
        this.log('⚡ 并行执行 Agent...');
        const executePromises = workers.map((worker, i) => {
            this.callCount++;
            return worker.execute(subtasks[i % subtasks.length] || task.current);
        });
        let results = await Promise.all(executePromises);

        // 4. 并行 Self-Eval 检查 (加速!)
        this.log('🔍 并行 Self-Eval 检查...');
        const evalPromises = results.map((result, i) =>
            this.selfEvaluate(
                subtasks[i % subtasks.length] || task.current,
                result,
                '这个回答是否正确、完整、有深度？'
            )
        );
        const evalResults = await Promise.all(evalPromises);

        // 只对失败的重试 (串行，避免太多请求)
        for (let i = 0; i < evalResults.length; i++) {
            if (!evalResults[i].isCorrect) {
                this.log(`🔄 Agent ${i + 1} 需要改进...`);
                results[i] = await workers[i].execute(
                    `存在问题：${evalResults[i].reason}\n请改进：\n${subtasks[i % subtasks.length] || task.current}`
                );
                this.callCount++;
            }
        }

        // 5. 并行反思循环 (加速!)
        this.log('🔄 并行反思...');
        const reflectPromises = workers.map((worker, i) => {
            this.callCount++;
            return worker.reflect(results[i]);
        });
        const reflections = await Promise.all(reflectPromises);

        const improvedResults = reflections.map((r, i) => {
            workers[i].updateTrust(!r.needsImprovement);
            return r.improved;
        });

        // 4. 信任加权综合 + Self-Eval
        const synthesizer = window.agentManager.createAgent('synthesizer');
        const weightedResults = window.agentManager.weightedSynthesize(improvedResults, workers);

        const synthesisPrompt = `请综合以下多个观点（按重要性排序）：

${weightedResults.map((r, i) =>
            `【观点 ${i + 1}】(权重: ${(r.weight * 100).toFixed(0)}%)\n${r.content.slice(0, 1000)}`
        ).join('\n\n')}

请给出综合后的完整结论：`;

        this.callCount++;
        let synthesized = await synthesizer.execute(synthesisPrompt);

        // 对最终综合结果进行 Self-Eval
        this.log('🔍 Self-Eval: 检查综合结论...');
        const synthEval = await this.selfEvaluate(
            task.original,
            synthesized,
            '这个综合结论是否完整、准确、有深度？是否回答了原始问题？'
        );

        if (!synthEval.isCorrect) {
            this.log('🔄 综合结论需要改进...');
            synthesized = await synthesizer.execute(
                `综合结论存在问题：${synthEval.reason}\n请改进综合：\n${synthesisPrompt}`
            );
            this.callCount++;
        }

        return synthesized;
    }

    // Self-Eval 自评估方法
    async selfEvaluate(context, content, criteria) {
        const model = window.agentManager.recruitRandom(['evaluate']);
        const prompt = `请评估以下内容是否正确。

**任务背景**：
${context.slice(0, 500)}

**待评估内容**：
${content.slice(0, 1500)}

**评估标准**：
${criteria}

请回答：
(A) 正确 - 内容没有问题
(B) 错误 - 内容有问题

只输出 A 或 B，然后简要说明理由。`;

        this.callCount++;
        const response = await window.api.chat(
            [{ role: 'user', content: prompt }],
            model.id
        );

        const isCorrect = response.trim().toUpperCase().startsWith('A');
        const reason = response.replace(/^[AB]\s*/i, '').trim();

        return { isCorrect, reason };
    }

    // 执行一轮
    async executeRound(task) {
        this.round++;
        this.log(`\n========== 第 ${this.round} 轮 ==========`);

        const result = await this.managerCoordinate(task);
        return result;
    }

    // 主循环
    async run(userInput, threshold = 50) {
        this.threshold = threshold;
        this.round = 0;
        this.callCount = 0;
        this.history = [];
        this.lastQuality = 0;
        this.noImproveCount = 0;

        const task = new window.Task(userInput);
        this.log(`🚀 开始迭代处理，阈值: ${threshold}`);

        while (true) {
            // 执行一轮
            const result = await this.executeRound(task);

            // 多模型交叉评估
            const quality = await window.evaluateQualityConsensus(result);

            // 检查是否有提升
            if (quality <= this.lastQuality + 0.05) {
                this.noImproveCount++;
            } else {
                this.noImproveCount = 0;
            }
            this.lastQuality = quality;

            // 记录历史
            this.history.push({
                round: this.round,
                quality,
                callCount: this.callCount,
                resultPreview: result.slice(0, 200)
            });

            // 检查收敛
            const budget = window.calculateBudget(this.threshold, quality);
            if (window.shouldConverge({
                quality,
                round: this.round,
                noImproveCount: this.noImproveCount,
                callCount: this.callCount,
                threshold: budget
            })) {
                this.log(`\n✅ 最终结果 (${this.round}轮, ${this.callCount}次调用, 质量${quality.toFixed(2)})`);
                return {
                    result,
                    rounds: this.round,
                    callCount: this.callCount,
                    quality,
                    history: this.history
                };
            }

            // 进化任务
            await window.evolveTask(task, result, quality);
        }
    }
}

window.engine = new IterativeEngine();
