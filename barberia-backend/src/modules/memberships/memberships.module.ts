import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MembershipOrmEntity } from './infrastructure/persistence/membership.orm-entity';
import { TypeOrmMembershipRepository } from './infrastructure/persistence/typeorm-membership.repository';
import { MEMBERSHIP_REPOSITORY } from './domain/membership.repository';
import {
  CancelMembershipUseCase,
  ListMembershipsByCustomerUseCase,
  SubscribeMembershipUseCase,
} from './application/membership-use-cases';
import { MembershipsController } from './presentation/memberships.controller';

@Module({
  imports: [TypeOrmModule.forFeature([MembershipOrmEntity])],
  controllers: [MembershipsController],
  providers: [
    { provide: MEMBERSHIP_REPOSITORY, useClass: TypeOrmMembershipRepository },
    SubscribeMembershipUseCase,
    CancelMembershipUseCase,
    ListMembershipsByCustomerUseCase,
  ],
  exports: [MEMBERSHIP_REPOSITORY],
})
export class MembershipsModule {}
