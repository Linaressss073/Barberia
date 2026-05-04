import { Inject, Injectable } from '@nestjs/common';
import { requestContext } from '@core/context/request-context';
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
    const tenantId = requestContext.get()?.tenantId ?? null;
    if (!tenantId) {
      return buildPage([], 0, input.page, input.limit);
    }
    const { items, total } = await this.users.paginate({ ...input, tenantId });
    return buildPage(items, total, input.page, input.limit);
  }
}
