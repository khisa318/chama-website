import { getDb } from './connection';
import { groupMessages } from '@db/schema';
import { eq, desc } from 'drizzle-orm';

export async function getGroupMessages(groupId: number) {
  return await getDb()
    .select()
    .from(groupMessages)
    .where(eq(groupMessages.groupId, groupId))
    .orderBy(desc(groupMessages.createdAt));
}

export async function createGroupMessage(groupId: number, userId: number, userName: string, userAvatar: string | null, content: string) {
  return await getDb()
    .insert(groupMessages)
    .values({
      groupId,
      userId,
      userName,
      userAvatar,
      content,
    })
    .returning();
}