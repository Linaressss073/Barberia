import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MembershipDoc, MembershipSchema } from './infrastructure/persistence/membership.schema';
import { MongoMembershipRepository } from './infrastructure/persistence/typeorm-membership.repository';
import { MEMBERSHIP_REPOSITORY } from './domain/membership.repository';
import {
  CancelMembershipUseCase,
  ListMembershipsByCustomerUseCase,
  SubscribeMembershipUseCase,
} from './application/membership-use-cases';
import { MembershipsController } from './presentation/memberships.controller';

@Module({
  imports: [MongooseModule.forFeature([{ name: MembershipDoc.name, schema: MembershipSchema }])],
  controllers: [MembershipsController],
  providers: [
    { provide: MEMBERSHIP_REPOSITORY, useClass: MongoMembershipRepository },
    SubscribeMembershipUseCase,
    CancelMembershipUseCase,
    ListMembershipsByCustomerUseCase,
  ],
  exports: [MEMBERSHIP_REPOSITORY, MongooseModule],
})
export class MembershipsModule {}
