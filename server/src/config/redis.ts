import { logger } from '../utils/logger';

// Since Redis setup is skipped for now, we will create a mock queue interface
// that stores jobs in memory and processes them asynchronously after a delay.
export interface QueueJob<T> {
  id: string;
  data: T;
}

export class MockQueue<T> {
  private name: string;
  private processor: ((job: QueueJob<T>) => Promise<void>) | null = null;

  constructor(name: string) {
    this.name = name;
    logger.info(`[MockQueue] Initialized in-memory queue: ${name}`);
  }

  public async add(data: T, options?: { delay?: number }): Promise<QueueJob<T>> {
    const job: QueueJob<T> = {
      id: Math.random().toString(36).substring(7),
      data,
    };

    const delay = options?.delay || 0;
    logger.debug(`[MockQueue] Enqueued job ${job.id} in queue '${this.name}' with delay: ${delay}ms`);

    // Process asynchronously
    setTimeout(async () => {
      if (this.processor) {
        try {
          logger.debug(`[MockQueue] Processing job ${job.id} in queue '${this.name}'`);
          await this.processor(job);
          logger.debug(`[MockQueue] Successfully completed job ${job.id}`);
        } catch (error: any) {
          logger.error(`[MockQueue] Failed to process job ${job.id} in queue '${this.name}': ${error.message}`);
        }
      } else {
        logger.warn(`[MockQueue] No processor registered for queue '${this.name}'`);
      }
    }, delay);

    return job;
  }

  public process(processor: (job: QueueJob<T>) => Promise<void>): void {
    this.processor = processor;
    logger.info(`[MockQueue] Registered processor for queue: ${this.name}`);
  }
}

// Keep the standard Redis import/setup logic aside as requested
// When Redis is enabled in the future, developers can swap these mocks with standard Bull queue instances.
export const initializeQueues = () => {
  logger.info('Initializing background job queues (In-Memory Mock Mode)...');
};
