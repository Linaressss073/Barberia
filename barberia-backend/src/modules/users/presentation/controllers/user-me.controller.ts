import { Body, Controller, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { CurrentUser, AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { Role, Roles } from '@core/decorators/roles.decorator';
import { UpdateMeDto } from '../../application/dto/update-me.dto';
import { UpdateMeUseCase } from '../../application/use-cases/update-me.use-case';

@ApiTags('Users')
@ApiBearerAuth()
@Controller('users')
export class UserMeController {
  constructor(private readonly updateMe: UpdateMeUseCase) {}

  @Patch('me')
  @Roles(Role.Admin, Role.Receptionist, Role.Barber, Role.Customer)
  async patchMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateMeDto) {
    return this.updateMe.execute(user.sub, dto);
  }
}
