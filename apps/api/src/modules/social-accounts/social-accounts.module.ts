import { Module } from '@nestjs/common';
import { SocialAccountsController } from './social-accounts.controller';
import { OAuthController } from './oauth.controller';
import { SocialAccountsService } from './social-accounts.service';
import { EncryptionService } from './encryption.service';

@Module({
  controllers: [SocialAccountsController, OAuthController],
  providers: [SocialAccountsService, EncryptionService],
  exports: [SocialAccountsService],
})
export class SocialAccountsModule {}
