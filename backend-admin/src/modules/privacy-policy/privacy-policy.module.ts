import { Module } from '@nestjs/common';
import {
  PrivacyPolicyController,
  AdminPrivacyPolicyController,
} from './privacy-policy.controller';
import { PrivacyPolicyService } from './privacy-policy.service';

@Module({
  imports: [],
  controllers: [PrivacyPolicyController, AdminPrivacyPolicyController],
  providers: [PrivacyPolicyService],
  exports: [PrivacyPolicyService],
})
export class PrivacyPolicyModule {}
