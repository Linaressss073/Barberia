import { Inject, Injectable } from '@nestjs/common';
import { USER_REPOSITORY, UserRepository } from '@modules/auth/domain/repositories/user.repository';
import { Page, buildPage } from '@shared/pagination/pagination.dto';
import { User } from '@modules/auth/domain/entities/user.entity';

export interface ListUsersInput {
  page: number;
  limit: number;
  search?: string;
  role?: string;
  status?: string;
}

@Injectable()
export class ListUsersUseCase {
  constructor(@Inject(USER_REPOSITORY) private readonly users: UserRepository) {}

  async execute(input: ListUsersInput): Promise<Page<User>> {
    const { items, total } = await this.users.paginate(input);
    return buildPage(items, total, input.page, input.limit);
  }
}
