import { Body, Controller, HttpCode, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '@core/decorators/roles.decorator';
import { CurrentUser, AuthenticatedUser } from '@core/decorators/current-user.decorator';
import { LoginDto } from '../../application/dto/login.dto';
import { RegisterDto } from '../../application/dto/register.dto';
import { AuthResponseDto, AuthTokensDto } from '../../application/dto/auth-response.dto';
import { LoginUseCase } from '../../application/use-cases/login.use-case';
import { RegisterUserUseCase } from '../../application/use-cases/register-user.use-case';
import { RefreshTokenUseCase } from '../../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../../application/use-cases/logout.use-case';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly registerUC: RegisterUserUseCase,
    private readonly loginUC: LoginUseCase,
    private readonly refreshUC: RefreshTokenUseCase,
    private readonly logoutUC: LogoutUseCase,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Registrar un nuevo usuario (rol Customer por defecto)' })
  async register(@Body() dto: RegisterDto): Promise<{ id: string; email: string }> {
    const user = await this.registerUC.execute(dto);
    return { id: user.id.value, email: user.email.value };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login con email y password' })
  @ApiOkResponse({ type: AuthResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.loginUC.execute(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Rotar access/refresh token' })
  @ApiOkResponse({ type: AuthTokensDto })
  refresh(@Body() body: { refreshToken: string }): Promise<AuthTokensDto> {
    return this.refreshUC.execute(body.refreshToken);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión (revoca todos los refresh tokens)' })
  async logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.logoutUC.execute({ userId: user.sub, jti: user.jti, exp: user.exp });
  }
}
