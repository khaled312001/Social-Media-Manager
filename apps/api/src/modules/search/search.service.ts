import { Injectable, Logger } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

export interface IndexablePost {
  id: string;
  workspaceId: string;
  content: string;
  platforms: string[];
  status: string;
  tags?: string[];
  publishedAt?: Date | null;
  createdAt: Date;
  authorId?: string;
}

export interface IndexableContact {
  id: string;
  workspaceId: string;
  firstName: string;
  lastName?: string | null;
  email?: string | null;
  company?: string | null;
  jobTitle?: string | null;
  stage?: string;
  tags?: string[];
  createdAt: Date;
}

export interface SearchOptions {
  page?: number;
  limit?: number;
  fields?: string[];
}

export interface SearchResult<T> {
  hits: T[];
  total: number;
  page: number;
  limit: number;
}

const POSTS_INDEX = 'posts';
const CONTACTS_INDEX = 'contacts';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private readonly es: ElasticsearchService) {}

  // ─── Posts ────────────────────────────────────────────────────────────────

  async indexPost(post: IndexablePost): Promise<void> {
    try {
      await this.es.index({
        index: POSTS_INDEX,
        id: post.id,
        document: {
          ...post,
          publishedAt: post.publishedAt?.toISOString() ?? null,
          createdAt: post.createdAt.toISOString(),
        },
      });
    } catch (err) {
      this.logger.error(`Failed to index post ${post.id}`, err);
    }
  }

  async searchPosts(
    workspaceId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<IndexablePost>> {
    const { page = 1, limit = 20 } = options;
    const from = (page - 1) * limit;

    const response = await this.es.search<IndexablePost>({
      index: POSTS_INDEX,
      from,
      size: limit,
      query: {
        bool: {
          must: [
            { term: { workspaceId } },
            {
              multi_match: {
                query,
                fields: ['content^3', 'tags^2'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
      highlight: {
        fields: { content: {} },
      },
      sort: [{ _score: { order: 'desc' } }, { createdAt: { order: 'desc' } }],
    });

    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? 0);

    return {
      hits: response.hits.hits.map((h) => ({
        ...(h._source as IndexablePost),
        id: h._id,
      })),
      total,
      page,
      limit,
    };
  }

  // ─── Contacts ─────────────────────────────────────────────────────────────

  async indexContact(contact: IndexableContact): Promise<void> {
    try {
      await this.es.index({
        index: CONTACTS_INDEX,
        id: contact.id,
        document: {
          ...contact,
          createdAt: contact.createdAt.toISOString(),
        },
      });
    } catch (err) {
      this.logger.error(`Failed to index contact ${contact.id}`, err);
    }
  }

  async searchContacts(
    workspaceId: string,
    query: string,
    options: SearchOptions = {},
  ): Promise<SearchResult<IndexableContact>> {
    const { page = 1, limit = 20 } = options;
    const from = (page - 1) * limit;

    const response = await this.es.search<IndexableContact>({
      index: CONTACTS_INDEX,
      from,
      size: limit,
      query: {
        bool: {
          must: [
            { term: { workspaceId } },
            {
              multi_match: {
                query,
                fields: ['firstName^3', 'lastName^3', 'email^2', 'company^2', 'jobTitle'],
                type: 'best_fields',
                fuzziness: 'AUTO',
              },
            },
          ],
        },
      },
      sort: [{ _score: { order: 'desc' } }, { createdAt: { order: 'desc' } }],
    });

    const total =
      typeof response.hits.total === 'number'
        ? response.hits.total
        : (response.hits.total?.value ?? 0);

    return {
      hits: response.hits.hits.map((h) => ({
        ...(h._source as IndexableContact),
        id: h._id,
      })),
      total,
      page,
      limit,
    };
  }

  // ─── Generic ──────────────────────────────────────────────────────────────

  async deleteIndex(id: string, index: typeof POSTS_INDEX | typeof CONTACTS_INDEX): Promise<void> {
    try {
      await this.es.delete({ index, id });
    } catch (err: any) {
      if (err?.meta?.statusCode !== 404) {
        this.logger.error(`Failed to delete document ${id} from index ${index}`, err);
      }
    }
  }

  async ensureIndices(): Promise<void> {
    await this.ensurePostsIndex();
    await this.ensureContactsIndex();
  }

  private async ensurePostsIndex(): Promise<void> {
    const exists = await this.es.indices.exists({ index: POSTS_INDEX });
    if (!exists) {
      await this.es.indices.create({
        index: POSTS_INDEX,
        mappings: {
          properties: {
            workspaceId: { type: 'keyword' },
            content: { type: 'text', analyzer: 'standard' },
            platforms: { type: 'keyword' },
            status: { type: 'keyword' },
            tags: { type: 'keyword' },
            publishedAt: { type: 'date' },
            createdAt: { type: 'date' },
            authorId: { type: 'keyword' },
          },
        },
      });
      this.logger.log(`Created Elasticsearch index: ${POSTS_INDEX}`);
    }
  }

  private async ensureContactsIndex(): Promise<void> {
    const exists = await this.es.indices.exists({ index: CONTACTS_INDEX });
    if (!exists) {
      await this.es.indices.create({
        index: CONTACTS_INDEX,
        mappings: {
          properties: {
            workspaceId: { type: 'keyword' },
            firstName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            lastName: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            email: { type: 'keyword' },
            company: { type: 'text', fields: { keyword: { type: 'keyword' } } },
            jobTitle: { type: 'text' },
            stage: { type: 'keyword' },
            tags: { type: 'keyword' },
            createdAt: { type: 'date' },
          },
        },
      });
      this.logger.log(`Created Elasticsearch index: ${CONTACTS_INDEX}`);
    }
  }
}
