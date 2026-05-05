import { eq, desc, and, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, branches, products, sales, expenses, staffUsers } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ BRANCHES ============
export async function getBranches() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(branches).orderBy(desc(branches.createdAt));
}

export async function getBranchById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(branches).where(eq(branches.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createBranch(data: { name: string; location: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(branches).values(data);
  return result;
}

export async function updateBranch(id: number, data: { name: string; location: string }) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(branches).set(data).where(eq(branches.id, id));
}

export async function deleteBranch(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(branches).where(eq(branches.id, id));
}

// ============ PRODUCTS ============
export async function getProducts(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) {
    return db.select().from(products).where(eq(products.branchId, branchId)).orderBy(desc(products.createdAt));
  }
  return db.select().from(products).orderBy(desc(products.createdAt));
}

export async function getProductById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createProduct(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(products).values(data);
}

export async function updateProduct(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(products).set(data).where(eq(products.id, id));
}

export async function deleteProduct(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(products).where(eq(products.id, id));
}

// ============ SALES ============
export async function getSales(branchId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions: any[] = [];
  if (branchId) conditions.push(eq(sales.branchId, branchId));
  if (startDate) conditions.push(gte(sales.createdAt, startDate));
  if (endDate) conditions.push(lte(sales.createdAt, endDate));
  
  const query = conditions.length > 0 ? db.select().from(sales).where(and(...conditions)) : db.select().from(sales);
  return query.orderBy(desc(sales.createdAt));
}

export async function getSaleById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(sales).where(eq(sales.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createSale(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(sales).values(data);
}

export async function updateSale(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(sales).set(data).where(eq(sales.id, id));
}

export async function deleteSale(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(sales).where(eq(sales.id, id));
}

// ============ EXPENSES ============
export async function getExpenses(branchId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return [];
  
  let conditions: any[] = [];
  if (branchId) conditions.push(eq(expenses.branchId, branchId));
  if (startDate) conditions.push(gte(expenses.createdAt, startDate));
  if (endDate) conditions.push(lte(expenses.createdAt, endDate));
  
  const query = conditions.length > 0 ? db.select().from(expenses).where(and(...conditions)) : db.select().from(expenses);
  return query.orderBy(desc(expenses.createdAt));
}

export async function getExpenseById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(expenses).where(eq(expenses.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createExpense(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(expenses).values(data);
}

export async function updateExpense(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(expenses).set(data).where(eq(expenses.id, id));
}

export async function deleteExpense(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(expenses).where(eq(expenses.id, id));
}

// ============ STAFF USERS ============
export async function getStaffUsers(branchId?: number) {
  const db = await getDb();
  if (!db) return [];
  if (branchId) {
    return db.select().from(staffUsers).where(eq(staffUsers.branchId, branchId)).orderBy(desc(staffUsers.createdAt));
  }
  return db.select().from(staffUsers).orderBy(desc(staffUsers.createdAt));
}

export async function getStaffUserById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(staffUsers).where(eq(staffUsers.id, id)).limit(1);
  return result.length > 0 ? result[0] : null;
}

export async function createStaffUser(data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.insert(staffUsers).values(data);
}

export async function updateStaffUser(id: number, data: any) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.update(staffUsers).set(data).where(eq(staffUsers.id, id));
}

export async function deleteStaffUser(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  return db.delete(staffUsers).where(eq(staffUsers.id, id));
}

// ============ ANALYTICS ============
export async function getSalesMetrics(branchId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { totalSales: 0, totalCost: 0, count: 0 };
  
  const salesData = await getSales(branchId, startDate, endDate);
  const totalSales = salesData.reduce((sum, s) => sum + parseFloat(s.amount.toString()), 0);
  const totalCost = salesData.reduce((sum, s) => sum + parseFloat(s.cost?.toString() || "0"), 0);
  
  return { totalSales, totalCost, count: salesData.length };
}

export async function getExpenseMetrics(branchId?: number, startDate?: Date, endDate?: Date) {
  const db = await getDb();
  if (!db) return { totalExpenses: 0, count: 0 };
  
  const expenseData = await getExpenses(branchId, startDate, endDate);
  const totalExpenses = expenseData.reduce((sum, e) => sum + parseFloat(e.amount.toString()), 0);
  
  return { totalExpenses, count: expenseData.length };
}
