import cron from 'node-cron';
import { escalationService } from './escalationService.js';

export function initScheduler() {
  console.log('[Scheduler] Gate Entry System active (Night curfew attendance disabled).');
}
