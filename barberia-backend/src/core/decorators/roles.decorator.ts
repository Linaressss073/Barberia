import { SetMetadata } from '@nestjs/common';

export enum Role {
  Admin = 'ADMIN',
  Receptionist = 'RECEPTIONIST',
  Barber = 'BARBER',
  Customer = 'CUSTOMER',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

export const PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(PUBLIC_KEY, true);
