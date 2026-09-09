'use server';

import { auth } from '@/auth';
import { db } from '@/db';
import { userItems, items } from '@/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { ALL_ITEMS, ITEMS_BY_ID } from '@/lib/game/items';
import { revalidatePath } from 'next/cache';

// Get all items in the user's inventory
export async function getInventory() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  const result = await db
    .select({
      id: userItems.id,
      itemId: userItems.itemId,
      quantity: userItems.quantity,
      acquiredAt: userItems.acquiredAt,
      name: items.name,
      description: items.description,
      icon: items.icon,
      rarity: items.rarity,
      category: items.category,
      effectType: items.effectType,
      effectValue: items.effectValue,
      subject: items.subject,
    })
    .from(userItems)
    .innerJoin(items, eq(userItems.itemId, items.id))
    .where(eq(userItems.userId, userId));

  return result;
}

// Get user items as simple list (for game use)
export async function getUserItems() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return [];

  return db
    .select()
    .from(userItems)
    .where(eq(userItems.userId, userId));
}

// Add an item to the user's inventory (stack if exists)
export async function addItem(itemId: string, quantity: number = 1) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const itemDef = ITEMS_BY_ID[itemId];
  if (!itemDef) throw new Error(`Item not found: ${itemId}`);

  // Check if user already has this item
  const existing = await db
    .select()
    .from(userItems)
    .where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)))
    .limit(1);

  if (existing.length > 0) {
    // Stack quantity
    await db
      .update(userItems)
      .set({ quantity: existing[0].quantity + quantity })
      .where(eq(userItems.id, existing[0].id));
  } else {
    // Insert new
    await db.insert(userItems).values({
      userId,
      itemId,
      quantity,
    });
  }

  revalidatePath('/inventory');
  revalidatePath('/play');
  return { success: true };
}

// Remove items from inventory (by quantity)
export async function removeItem(itemId: string, quantity: number = 1) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const existing = await db
    .select()
    .from(userItems)
    .where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)))
    .limit(1);

  if (existing.length === 0) return { success: false, error: 'Item not in inventory' };

  if (existing[0].quantity <= quantity) {
    // Delete the row
    await db.delete(userItems).where(eq(userItems.id, existing[0].id));
  } else {
    // Decrease quantity
    await db
      .update(userItems)
      .set({ quantity: existing[0].quantity - quantity })
      .where(eq(userItems.id, existing[0].id));
  }

  revalidatePath('/inventory');
  return { success: true };
}

// Use a consumable item
export async function useItem(itemId: string) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const itemDef = ITEMS_BY_ID[itemId];
  if (!itemDef) throw new Error(`Item not found: ${itemId}`);
  if (itemDef.category !== 'consumable') throw new Error('Item is not consumable');

  // Check inventory
  const existing = await db
    .select()
    .from(userItems)
    .where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)))
    .limit(1);

  if (existing.length === 0 || existing[0].quantity < 1) {
    return { success: false, error: 'Item not in inventory' };
  }

  // Remove one
  if (existing[0].quantity <= 1) {
    await db.delete(userItems).where(eq(userItems.id, existing[0].id));
  } else {
    await db
      .update(userItems)
      .set({ quantity: existing[0].quantity - 1 })
      .where(eq(userItems.id, existing[0].id));
  }

  revalidatePath('/inventory');
  return { success: true, item: itemDef };
}

// Purchase an item from the shop
export async function purchaseItem(itemId: string, quantity: number = 1) {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error('Not authenticated');

  const itemDef = ITEMS_BY_ID[itemId];
  if (!itemDef) throw new Error(`Item not found: ${itemId}`);
  if (itemDef.price <= 0) throw new Error('Item is not purchasable');

  const totalCost = itemDef.price * quantity;

  // We need to deduct gold from user_profiles - import here to avoid circular
  const { userProfiles } = await import('@/db/schema');
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);

  if (profile.length === 0) throw new Error('Profile not found');
  if (profile[0].gold < totalCost) {
    return { success: false, error: 'Not enough gold' };
  }

  // Deduct gold
  await db
    .update(userProfiles)
    .set({ gold: profile[0].gold - totalCost })
    .where(eq(userProfiles.userId, userId));

  // Add item
  await addItem(itemId, quantity);

  revalidatePath('/inventory');
  revalidatePath('/shop');
  revalidatePath('/play');
  return { success: true, cost: totalCost };
}

// Get shop items (items with price > 0)
export async function getShopItems() {
  return ALL_ITEMS.filter((item) => item.price > 0);
}

// Get item count by id
export async function getUserItemCounts(): Promise<Record<string, number>> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return {};

  const rows = await db
    .select({ itemId: userItems.itemId, quantity: userItems.quantity })
    .from(userItems)
    .where(eq(userItems.userId, userId));

  const counts: Record<string, number> = {};
  for (const row of rows) {
    counts[row.itemId] = row.quantity;
  }
  return counts;
}

// Check if user has a specific item
export async function hasItem(itemId: string): Promise<boolean> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return false;

  const existing = await db
    .select({ quantity: userItems.quantity })
    .from(userItems)
    .where(and(eq(userItems.userId, userId), eq(userItems.itemId, itemId)))
    .limit(1);

  return existing.length > 0 && existing[0].quantity > 0;
}
