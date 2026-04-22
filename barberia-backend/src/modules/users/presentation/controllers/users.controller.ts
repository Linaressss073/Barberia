import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { JwtAuthGuard } from '@modules/auth/presentation/guards/jwt-auth.guard';
import { RolesGuard } from '@modules/auth/presentation/guards/roles.guard';
import { PaginationQueryDto } from '@shared/pagination/pagination.dto';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { AdminCreateUserUseCase } from '../../application/use-cases/admin-create-user.use-case';
import { UpdateUserRolesUseCase } from '../../application/use-cases/update-user-roles.use-case';
import { SetUserStatusUseCase } from '../../application/use-cases/set-user-status.use-case';
import { AdminCreateUserDto } from '../../application/dto/admin-create-user.dto';
import { UpdateUserRolesDto } from '../../application/dto/update-user-roles.dto';

@ApiTags('Users (admin)')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(Role.Admin)
@Controller('users')
export class UsersController {
  constructor(
    private readonly listUC: ListUsersUseCase,
    private readonly createUC: AdminCreateUserUseCase,
    private readonly rolesUC: UpdateUserRolesUseCase,
    private readonly statusUC: SetUserStatusUseCase,
  ) {}

  @Get()
  async list(@Query() q: PaginationQueryDto & { role?: string; status?: string }) {
    const page = await this.listUC.execute({
      page: q.page,
      limit: q.limit,
      search: q.search,
      role: q.role,
      status: q.status,
    });
    return {
      ...page,
      items: page.items.map((u) => ({
        id: u.id.value,
        email: u.email.value,
        fullName: u.fullName,
        roles: u.roles,
        status: u.status,
        lastLoginAt: u.lastLoginAt,
        createdAt: u.createdAt,
      })),
    };
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: AdminCreateUserDto) {
    const u = await this.createUC.execute(dto);
    return { id: u.id.value, email: u.email.value, roles: u.roles };
  }

  @Patch(':id/roles')
  @HttpCode(HttpStatus.NO_CONTENT)
  async updateRoles(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserRolesDto,
  ): Promise<void> {
    await this.rolesUC.execute(id, dto.roles);
  }

  @Patch(':id/enable')
  @HttpCode(HttpStatus.NO_CONTENT)
  async enable(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.statusUC.execute(id, true);
  }

  @Patch(':id/disable')
  @HttpCode(HttpStatus.NO_CONTENT)
  async disable(@Param('id', ParseUUIDPipe) id: string): Promise<void> {
    await this.statusUC.execute(id, false);
  }
}
