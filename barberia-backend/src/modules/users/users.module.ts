import { Module } from '@nestjs/common';
import { AuthModule } from '@modules/auth/auth.module';
import { ListUsersUseCase } from './application/use-cases/list-users.use-case';
import { AdminCreateUserUseCase } from './application/use-cases/admin-create-user.use-case';
import { UpdateUserRolesUseCase, LookupUserByEmailUseCase, AssignStaffUseCase } from './application/use-cases/update-user-roles.use-case';
import { SetUserStatusUseCase } from './application/use-cases/set-user-status.use-case';
import { UpdateMeUseCase } from './application/use-cases/update-me.use-case';
import { UsersController } from './presentation/controllers/users.controller';
import { UserMeController } from './presentation/controllers/user-me.controller';

@Module({
  imports: [AuthModule],
  controllers: [UserMeController, UsersController],
  providers: [
    ListUsersUseCase,
    AdminCreateUserUseCase,
    UpdateUserRolesUseCase,
    LookupUserByEmailUseCase,
    AssignStaffUseCase,
    SetUserStatusUseCase,
    UpdateMeUseCase,
  ],
})
export class UsersModule {}
