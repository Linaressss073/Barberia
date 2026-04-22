import { Injectable } from '@nestjs/common';
import { DataSource, EntityManager } from 'typeorm';

export type IsolationLevel =
  | 'READ UNCOMMITTED'
  | 'READ COMMITTED'
  | 'REPEATABLE READ'
  | 'SERIALIZABLE';

/**
 * Wrapper de transacciones. Por defecto READ COMMITTED.
 * Use cases lo inyectan y reciben un EntityManager transaccional.
 */
@Injectable()
export class UnitOfWork {
  constructor(private readonly dataSource: DataSource) {}

  run<T>(
    work: (manager: EntityManager) => Promise<T>,
    isolation: IsolationLevel = 'READ COMMITTED',
  ): Promise<T> {
    return this.dataSource.transaction(isolation, work);
  }
}
