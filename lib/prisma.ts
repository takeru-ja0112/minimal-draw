import { Prisma, PrismaClient } from '@/lib/generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

// deleted_at を持ち、ソフトデリート対象とするモデル（Theme, AnswerInput は対象外）
const SOFT_DELETE_MODELS = new Set([
  'MUser',
  'Room',
  'Drawing',
  'Point',
  'Subscription',
  'HistoryDrawing',
]);

// 自動的に deleted_at: null を条件に加える読み取り系操作
const READ_OPERATIONS = new Set([
  'findMany',
  'findFirst',
  'findFirstOrThrow',
  'findUnique',
  'findUniqueOrThrow',
  'count',
  'aggregate',
  'groupBy',
]);

type WhereArgs = { where?: Record<string, unknown> };
type UpsertArgs = { update?: Record<string, unknown> };

function createPrismaClients() {
  const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
  const rawClient = new PrismaClient({ adapter });

  // MUser を論理削除する際、関連する Room / Drawing / Point / Subscription /
  // HistoryDrawing もまとめて論理削除するための内部ヘルパー。
  // 拡張後のクライアントを経由せず rawClient を直接使うことで、
  // 二重に deleted_at フィルタや delete→update の読み替えが掛からないようにする。
  async function cascadeSoftDeleteForUsers(userIds: string[], deletedAt: Date) {
    if (userIds.length === 0) return;

    await rawClient.$transaction([
      rawClient.room.updateMany({
        where: { OR: [{ created_by_userId: { in: userIds } }, { answer_id: { in: userIds } }] },
        data: { deleted_at: deletedAt },
      }),
      rawClient.drawing.updateMany({ where: { user_id: { in: userIds } }, data: { deleted_at: deletedAt } }),
      rawClient.point.updateMany({ where: { user_id: { in: userIds } }, data: { deleted_at: deletedAt } }),
      rawClient.subscription.updateMany({ where: { user_id: { in: userIds } }, data: { deleted_at: deletedAt } }),
      rawClient.historyDrawing.updateMany({ where: { user_id: { in: userIds } }, data: { deleted_at: deletedAt } }),
      rawClient.mUser.updateMany({ where: { id: { in: userIds } }, data: { deleted_at: deletedAt } }),
    ]);
  }

  // delete/deleteMany を物理削除ではなく deleted_at の更新に読み替える汎用オーバーライド。
  // MUser 以外の対象モデル（Room/Drawing/Point/Subscription/HistoryDrawing）で共通利用する。
  function softDeleteOverrides() {
    return {
      async delete(args: WhereArgs) {
        const context = Prisma.getExtensionContext(this) as unknown as {
          update: (args: { where?: Record<string, unknown>; data: Record<string, unknown> }) => unknown;
        };
        return context.update({ where: args.where, data: { deleted_at: new Date() } });
      },
      async deleteMany(args: WhereArgs = {}) {
        const context = Prisma.getExtensionContext(this) as unknown as {
          updateMany: (args: { where?: Record<string, unknown>; data: Record<string, unknown> }) => unknown;
        };
        return context.updateMany({ where: args.where, data: { deleted_at: new Date() } });
      },
    };
  }

  const extended = rawClient.$extends({
    name: 'soft-delete',
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          if (!SOFT_DELETE_MODELS.has(model)) return query(args);

          if (READ_OPERATIONS.has(operation)) {
            const readArgs = args as WhereArgs;
            return query({ ...args, where: { ...readArgs.where, deleted_at: null } });
          }

          // upsert の update 経路で論理削除済み行に当たった場合、自動的に復活させる
          if (operation === 'upsert') {
            const upsertArgs = args as UpsertArgs;
            return query({ ...args, update: { ...upsertArgs.update, deleted_at: null } });
          }

          return query(args);
        },
      },
    },
    model: {
      mUser: {
        async delete(args: { where: { id: string } }) {
          const deletedAt = new Date();
          await cascadeSoftDeleteForUsers([args.where.id], deletedAt);
          return rawClient.mUser.findUniqueOrThrow({ where: { id: args.where.id } });
        },
        async deleteMany(args: WhereArgs = {}) {
          const targets = await rawClient.mUser.findMany({ where: args.where, select: { id: true } });
          await cascadeSoftDeleteForUsers(
            targets.map((u) => u.id),
            new Date(),
          );
          return { count: targets.length };
        },
      },
      room: softDeleteOverrides(),
      drawing: softDeleteOverrides(),
      point: softDeleteOverrides(),
      subscription: softDeleteOverrides(),
      historyDrawing: softDeleteOverrides(),
    },
  });

  return { prisma: extended, prismaAdminReadonly: rawClient };
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClients>['prisma'];
  prismaAdminReadonly: ReturnType<typeof createPrismaClients>['prismaAdminReadonly'];
};

const clients = globalForPrisma.prisma && globalForPrisma.prismaAdminReadonly
  ? { prisma: globalForPrisma.prisma, prismaAdminReadonly: globalForPrisma.prismaAdminReadonly }
  : createPrismaClients();

export const prisma = clients.prisma;
export const prismaAdminReadonly = clients.prismaAdminReadonly;

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
  globalForPrisma.prismaAdminReadonly = prismaAdminReadonly;
}
