interface UsageRecord {
  timestamp: Date;
  model: string;
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
  cost: number;
  duration: number;
}

export class CostTracker {
  private static instance: CostTracker;
  private usageRecords: UsageRecord[] = [];
  private startTime: Date = new Date();
  private totalCost: number = 0;

  private constructor() { }

  static getInstance(): CostTracker {
    if (!CostTracker.instance) {
      CostTracker.instance = new CostTracker();
    }
    return CostTracker.instance;
  }

  recordUsage(
    model: string,
    inputTokens: number,
    outputTokens: number,
    cost: number,
    duration: number
  ): void {
    const record: UsageRecord = {
      timestamp: new Date(),
      model,
      inputTokens,
      outputTokens,
      totalTokens: inputTokens + outputTokens,
      cost,
      duration
    };

    this.usageRecords.push(record);
    this.totalCost += cost;

    console.log(`Usage recorded: ${model} - Input: ${inputTokens}, Output: ${outputTokens}, Cost: $${cost.toFixed(6)}, Duration: ${duration}ms`);
  }

  getTotalCost(): number {
    return this.totalCost;
  }

  getTotalDuration(): number {
    return this.usageRecords.reduce((total, record) => total + record.duration, 0);
  }

  getWallDuration(): number {
    return (new Date().getTime() - this.startTime.getTime()) / 1000;
  }

  getTotalTokens(): { input: number; output: number; total: number } {
    return this.usageRecords.reduce(
      (totals, record) => ({
        input: totals.input + record.inputTokens,
        output: totals.output + record.outputTokens,
        total: totals.total + record.totalTokens
      }),
      { input: 0, output: 0, total: 0 }
    );
  }

  getUsageByModel(): Record<string, { input: number; output: number; cost: number; count: number }> {
    const usage: Record<string, { input: number; output: number; cost: number; count: number }> = {};

    for (const record of this.usageRecords) {
      const modelKey = this.getModelDisplayName(record.model);
      if (!usage[modelKey]) {
        usage[modelKey] = { input: 0, output: 0, cost: 0, count: 0 };
      }
      usage[modelKey].input += record.inputTokens;
      usage[modelKey].output += record.outputTokens;
      usage[modelKey].cost += record.cost;
      usage[modelKey].count += 1;
    }

    return usage;
  }

  private getModelDisplayName(model: string): string {
    // Map LiteLLM model names to Claude Code display names
    if (model.includes('claude-sonnet-4')) return 'claude-sonnet';
    if (model.includes('claude-3-5-haiku')) return 'claude-3-5-haiku';
    if (model.includes('claude-3-5-sonnet')) return 'claude-3-5-sonnet';
    return model;
  }

  // Format compatible with Claude Code
  getClaudeCodeFormat() {
    const totalTokens = this.getTotalTokens();
    const usageByModel = this.getUsageByModel();
    const totalDurationSec = this.getTotalDuration() / 1000;
    const wallDurationSec = this.getWallDuration();

    return {
      totalCost: this.totalCost,
      totalDurationAPI: totalDurationSec,
      totalDurationWall: wallDurationSec,
      totalCodeChanges: { added: 0, removed: 0 }, // We don't track code changes
      usageByModel,
      requestCount: this.usageRecords.length
    };
  }

  reset(): void {
    this.usageRecords = [];
    this.totalCost = 0;
    this.startTime = new Date();
    console.log('Cost tracker reset');
  }
}
