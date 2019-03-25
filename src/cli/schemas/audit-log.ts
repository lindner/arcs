import RxDB, {RxDatabase, RxCollection, RxJsonSchema, RxDocument, QueryChangeDetector} from 'rxdb';

import AuditLogSchema from './audit-log.json';

export type AuditLog = {
  timestamp: string;
  msg: string;
};

export type AuditLogDocument = RxDocument<AuditLog>;
export type AuditLogCollection = RxCollection<AuditLog>;
