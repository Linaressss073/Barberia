import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { AdminCreateUserUseCase } from './application/use-cases/admin-create-user.use-case';
import { UpdateUserRolesUseCase } from './application/use-cases/update-user-roles.use-case';
import { SetUserStatusUseCase } from './application/use-cases/set-user-status.use-case';
import { UsersController } from './presentation/controllers/users.controller';

@Module({
  imports: [AuthModule],
  controllers: [UsersController],
  providers: [
    ListUsersUseCase,
    AdminCreateUserUseCase,
    UpdateUserRolesUseCase,
    SetUserStatusUseCase,
  ],
})
export class UsersModule {}
