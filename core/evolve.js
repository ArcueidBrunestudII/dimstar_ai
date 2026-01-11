/**
 * DimStar Demo - 任务进化模块
 * 保持原始目标锚定
 */

// 任务对象（保持原始锚定）
class Task {
    constructor(original) {
        this.original = original;  // 原始任务，不变
        this.current = original;   // 当前任务，可变
        this.focusPoints = [];     // 改进重点
        this.history = [];         // 进化历史
    }

    evolve(newFocus, evolved) {
        this.history.push({
            previous: this.current,
            focusPoints: this.focusPoints
        });
        this.focusPoints = newFocus;
        this.current = evolved;
    }
}

// 任务进化
async function evolveTask(task, lastResult, quality) {
    const model = window.agentManager.recruitRandom(['fast']);

    const prompt = `原始任务（锚点）：
${task.original}

上一轮结果质量：${quality.toFixed(2)}

上轮结果片段：
${lastResult.slice(0, 1500)}${lastResult.length > 1500 ? '...' : ''}

请分析不足之处，给出下一轮需要重点改进的 1-3 个方向。
格式：每行一个改进点，简洁明了。`;

    const response = await window.api.chat(
        [{ role: 'user', content: prompt }],
        model.id
    );

    const focusPoints = response
        .split('\n')
        .filter(line => line.trim())
        .slice(0, 3);

    const evolved = `${task.original}\n\n【改进重点】\n${focusPoints.map((p, i) => `${i + 1}. ${p}`).join('\n')}`;

    task.evolve(focusPoints, evolved);

    window.engine?.log(`📝 任务进化完成，${focusPoints.length} 个改进点`);
    return task;
}

window.Task = Task;
window.evolveTask = evolveTask;
