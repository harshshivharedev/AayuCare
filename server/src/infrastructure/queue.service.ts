export interface JobHandler<T = any> {
  (data: T): Promise<void> | void;
}

export interface IQueueService {
  enqueueDelayed<T = any>(jobName: string, data: T, delayMs: number): Promise<string>;
  registerWorker<T = any>(jobName: string, handler: JobHandler<T>): void;
  cancelJob(jobId: string): Promise<void>;
}

export class InMemoryQueueService implements IQueueService {
  private timers: Map<string, NodeJS.Timeout> = new Map();
  private workers: Map<string, JobHandler> = new Map();

  async enqueueDelayed<T = any>(jobName: string, data: T, delayMs: number): Promise<string> {
    const jobId = `job-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;

    const timer = setTimeout(async () => {
      this.timers.delete(jobId);
      const worker = this.workers.get(jobName);
      if (worker) {
        try {
          await worker(data);
        } catch (err) {
          console.error(`❌ Queue Worker Error [${jobName}]:`, err);
        }
      }
    }, delayMs);

    this.timers.set(jobId, timer);
    return jobId;
  }

  registerWorker<T = any>(jobName: string, handler: JobHandler<T>): void {
    this.workers.set(jobName, handler);
  }

  async cancelJob(jobId: string): Promise<void> {
    const timer = this.timers.get(jobId);
    if (timer) {
      clearTimeout(timer);
      this.timers.delete(jobId);
    }
  }
}

export const queueService: IQueueService = new InMemoryQueueService();
