import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import * as db from "./db";
import { z } from "zod";

// Admin-only procedure
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ BRANCHES ============
  branches: router({
    list: protectedProcedure.query(() => db.getBranches()),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getBranchById(input.id)),
    
    create: adminProcedure
      .input(z.object({ name: z.string().min(1), location: z.string().min(1) }))
      .mutation(({ input }) => db.createBranch(input)),
    
    update: adminProcedure
      .input(z.object({ id: z.number(), name: z.string().min(1), location: z.string().min(1) }))
      .mutation(({ input }) => db.updateBranch(input.id, { name: input.name, location: input.location })),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteBranch(input.id)),
  }),

  // ============ PRODUCTS ============
  products: router({
    list: protectedProcedure
      .input(z.object({ branchId: z.number().optional() }).optional())
      .query(({ input }) => db.getProducts(input?.branchId)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getProductById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        branchId: z.number(),
        stock: z.number().int().min(0),
        purchasePrice: z.number().positive(),
        salePrice: z.number().positive(),
      }))
      .mutation(({ input }) => db.createProduct(input)),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        branchId: z.number(),
        stock: z.number().int().min(0),
        purchasePrice: z.number().positive(),
        salePrice: z.number().positive(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateProduct(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteProduct(input.id)),
  }),

  // ============ SALES ============
  sales: router({
    list: protectedProcedure
      .input(z.object({
        branchId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ input }) => db.getSales(input?.branchId, input?.startDate, input?.endDate)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getSaleById(input.id)),
    
    recordProductSale: protectedProcedure
      .input(z.object({
        productId: z.number(),
        quantity: z.number().int().min(1),
      }))
      .mutation(async ({ input }) => {
        const product = await db.getProductById(input.productId);
        if (!product) throw new TRPCError({ code: "NOT_FOUND", message: "Product not found" });
        if (product.stock < input.quantity) {
          throw new TRPCError({ code: "BAD_REQUEST", message: "Insufficient stock" });
        }
        
        const amount = parseFloat(product.salePrice.toString()) * input.quantity;
        const cost = parseFloat(product.purchasePrice.toString()) * input.quantity;
        
        // Deduct stock
        await db.updateProduct(product.id, { stock: product.stock - input.quantity });
        
        // Record sale
        return db.createSale({
          type: "product",
          itemName: product.name,
          branchId: product.branchId,
          quantity: input.quantity,
          amount,
          cost,
        });
      }),
    
    recordServiceSale: protectedProcedure
      .input(z.object({
        itemName: z.string().min(1),
        branchId: z.number(),
        amount: z.number().positive(),
      }))
      .mutation(({ input }) => {
        return db.createSale({
          type: "service",
          itemName: input.itemName,
          branchId: input.branchId,
          quantity: 1,
          amount: input.amount,
          cost: 0,
        });
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteSale(input.id)),
  }),

  // ============ EXPENSES ============
  expenses: router({
    list: protectedProcedure
      .input(z.object({
        branchId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ input }) => db.getExpenses(input?.branchId, input?.startDate, input?.endDate)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getExpenseById(input.id)),
    
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        branchId: z.number(),
        amount: z.number().positive(),
      }))
      .mutation(({ input }) => db.createExpense(input)),
    
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().min(1),
        branchId: z.number(),
        amount: z.number().positive(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateExpense(id, data);
      }),
    
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteExpense(input.id)),
  }),

  // ============ STAFF USERS ============
  staffUsers: router({
    list: protectedProcedure
      .input(z.object({ branchId: z.number().optional() }).optional())
      .query(({ input }) => db.getStaffUsers(input?.branchId)),
    
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(({ input }) => db.getStaffUserById(input.id)),
    
    create: adminProcedure
      .input(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["manager", "cashier", "stock"]),
        branchId: z.number(),
      }))
      .mutation(({ input }) => db.createStaffUser(input)),
    
    update: adminProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().min(1),
        email: z.string().email(),
        role: z.enum(["manager", "cashier", "stock"]),
        branchId: z.number(),
      }))
      .mutation(({ input }) => {
        const { id, ...data } = input;
        return db.updateStaffUser(id, data);
      }),
    
    delete: adminProcedure
      .input(z.object({ id: z.number() }))
      .mutation(({ input }) => db.deleteStaffUser(input.id)),
  }),

  // ============ ANALYTICS ============
  analytics: router({
    salesMetrics: protectedProcedure
      .input(z.object({
        branchId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ input }) => db.getSalesMetrics(input?.branchId, input?.startDate, input?.endDate)),
    
    expenseMetrics: protectedProcedure
      .input(z.object({
        branchId: z.number().optional(),
        startDate: z.date().optional(),
        endDate: z.date().optional(),
      }).optional())
      .query(({ input }) => db.getExpenseMetrics(input?.branchId, input?.startDate, input?.endDate)),
  }),
});

export type AppRouter = typeof appRouter;
