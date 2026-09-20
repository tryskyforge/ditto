import Dexie, { type EntityTable } from 'dexie';
import type { Guide, Screenshot, Snapshot, Step } from './types';

export class DittoDB extends Dexie {
  guides!: EntityTable<Guide, 'id'>;
  steps!: EntityTable<Step, 'id'>;
  screenshots!: EntityTable<Screenshot, 'id'>;
  snapshots!: EntityTable<Snapshot, 'id'>;

  constructor() {
    super('ditto');
    this.version(1).stores({
      guides: 'id, createdAt, updatedAt, starred, deletedAt',
      steps: 'id, guideId, index',
      screenshots: 'id, stepId',
    });
    this.version(2).stores({
      snapshots: 'id, guideId, createdAt, [guideId+createdAt]',
    });
  }
}

export const db = new DittoDB();
