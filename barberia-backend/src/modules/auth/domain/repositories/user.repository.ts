import { UniqueEntityId } from '@core/domain/unique-entity-id';
import { Email } from '@shared/kernel/email.vo';
import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserListFilter {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

export interface UserRepository {
  findById(id: UniqueEntityId): Promise<User | null>;
  findByEmail(email: Email): Promise<User | null>;
  existsByEmail(email: Email): Promise<boolean>;
  save(user: User): Promise<void>;
  paginate(filter: UserListFilter): Promise<{ items: User[]; total: number }>;
}
