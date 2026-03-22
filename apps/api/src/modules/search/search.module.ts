import { Module, Global } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ElasticsearchModule } from '@nestjs/elasticsearch';
import { SearchService } from './search.service';

@Global()
@Module({
  imports: [
    ElasticsearchModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        node: config.getOrThrow<string>('ELASTICSEARCH_URL'),
        auth: {
          username: config.get<string>('ELASTICSEARCH_USERNAME', 'elastic'),
          password: config.get<string>('ELASTICSEARCH_PASSWORD', ''),
        },
        tls: {
          rejectUnauthorized: config.get<boolean>('ELASTICSEARCH_TLS_VERIFY', false),
        },
      }),
    }),
  ],
  providers: [SearchService],
  exports: [SearchService, ElasticsearchModule],
})
export class SearchModule {}
