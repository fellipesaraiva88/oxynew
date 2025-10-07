/**
 * Queue System - Public API
 * Centraliza exports para uso em outras partes da aplicação
 */

export {
  messageQueue,
  campaignQueue,
  automationQueue,
  dlqQueue,
  addMessageJob,
  addCampaignJob,
  addAutomationJob,
  sendToDLQ,
  cleanOldJobs,
  retryFailedJobs,
  closeQueues
} from './queue-manager.js';

export type {
  MessageJobData,
  CampaignJobData,
  AutomationJobData,
  DLQJobData
} from './queue-manager.js';

export { MessageWorker } from './workers/message.worker.js';
export { CampaignWorker } from './workers/campaign.worker.js';
export { AutomationWorker } from './workers/automation.worker.js';
