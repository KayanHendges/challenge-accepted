import { Injectable, Inject } from '@nestjs/common';
import { ListRepositoryResponse } from '../../../../types';
import { Locale } from '../../../entities/Locale';
import { ElasticService } from '../../../providers/elastic/elastic.service';
import {
  ILocalesRepository,
  ListLocalesParams,
} from '../locales.repository.interface';

@Injectable()
export class ElasticLocalesRepository implements ILocalesRepository {
  private index: string;
  constructor(
    @Inject('ElasticService') private elasticService: ElasticService<Locale>,
  ) {
    this.index = 'locales';
  }

  async create(data: Locale): Promise<Locale> {
    const { _id } = await this.elasticService.create(this.index, data);
    return { ...data, id: _id };
  }

  async list({
    name,
    page,
    pageSize,
    orderBy,
  }: ListLocalesParams): Promise<ListRepositoryResponse<Locale>> {
    const {
      hits: { hits, total },
    } = await this.elasticService.search(this.index, {
      ...(name ? { query: { match_bool_prefix: { name } } } : {}),
      page,
      pageSize,
      orderBy,
    });
    return {
      list: hits.map((hit) => {
        return { ...hit._source, id: hit._id };
      }),
      count: typeof total === 'number' ? total : total.value,
    };
  }

  async find(name: string): Promise<Locale | null> {
    const {
      hits: { hits },
    } = await this.elasticService.search(this.index, {
      query: { match_phrase: { name } },
    });
    const hit = hits.length ? hits[0] : null;

    if (!hit) return null;

    return { ...hit._source, id: hit._id };
  }
}
