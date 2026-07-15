import type { Prisma, SignalDirection, SignalStatus } from '@prisma/client';

export interface SignalHistoryFilters {
  pair?: string;
  direction?: SignalDirection;
  status?: SignalStatus;
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export function parseSignalHistoryFilters(searchParams: URLSearchParams): SignalHistoryFilters {
  return {
    pair: searchParams.get('pair') ?? undefined,
    direction: (searchParams.get('direction') as SignalDirection) ?? undefined,
    status: (searchParams.get('status') as SignalStatus) ?? undefined,
    dateFrom: searchParams.get('dateFrom') ?? undefined,
    dateTo: searchParams.get('dateTo') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };
}

export function buildSignalHistoryWhere(filters: SignalHistoryFilters): Prisma.SignalWhereInput {
  const where: Prisma.SignalWhereInput = {};

  if (filters.pair) where.pair = filters.pair;
  if (filters.direction) where.direction = filters.direction;
  if (filters.status) where.status = filters.status;

  if (filters.dateFrom || filters.dateTo) {
    where.createdAt = {
      ...(filters.dateFrom ? { gte: new Date(filters.dateFrom) } : {}),
      ...(filters.dateTo ? { lte: new Date(filters.dateTo) } : {}),
    };
  }

  if (filters.search) {
    where.technicalSummary = { contains: filters.search, mode: 'insensitive' };
  }

  return where;
}
