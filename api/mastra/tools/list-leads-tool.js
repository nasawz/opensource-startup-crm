import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const listLeadsTool = createTool({
  id: "list-leads",
  description: "获取组织下的线索列表，支持分页、搜索和多条件筛选",
  inputSchema: z.object({
    organizationId: z.string().describe("组织ID"),
    page: z.number().optional().default(1).describe("页码，默认1"),
    limit: z.number().optional().default(10).describe("每页数量，默认10"),
    search: z.string().optional().describe("搜索关键词，匹配姓名、邮箱、公司"),
    status: z
      .enum(["NEW", "PENDING", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"])
      .optional()
      .describe("线索状态筛选"),
    leadSource: z
      .enum([
        "WEB",
        "PHONE_INQUIRY",
        "PARTNER_REFERRAL",
        "COLD_CALL",
        "TRADE_SHOW",
        "EMPLOYEE_REFERRAL",
        "ADVERTISEMENT",
        "OTHER",
      ])
      .optional()
      .describe("线索来源筛选"),
    industry: z.string().optional().describe("行业筛选"),
    rating: z.enum(["Hot", "Warm", "Cold"]).optional().describe("评级筛选"),
    converted: z.boolean().optional().describe("是否已转化筛选"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    leads: z.array(z.any()).optional(),
    pagination: z
      .object({
        page: z.number(),
        limit: z.number(),
        total: z.number(),
        totalPages: z.number(),
        hasNext: z.boolean(),
        hasPrev: z.boolean(),
      })
      .optional(),
  }),
  execute: async ({ context }) => {
    const {
      organizationId,
      page = 1,
      limit = 10,
      search,
      status,
      leadSource,
      industry,
      rating,
      converted,
    } = context;

    try {
      const skip = (page - 1) * limit;

      /** @type {any} */
      const whereClause = { organizationId };

      if (search) {
        whereClause.OR = [
          { firstName: { contains: search, mode: "insensitive" } },
          { lastName: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
          { company: { contains: search, mode: "insensitive" } },
        ];
      }

      if (status) whereClause.status = status;
      if (leadSource) whereClause.leadSource = leadSource;
      if (industry) whereClause.industry = { contains: industry, mode: "insensitive" };
      if (rating) whereClause.rating = rating;
      if (converted !== undefined) whereClause.isConverted = converted;

      const [leads, total] = await Promise.all([
        prisma.lead.findMany({
          where: whereClause,
          skip,
          take: limit,
          orderBy: { createdAt: "desc" },
          include: {
            owner: { select: { id: true, name: true, email: true } },
          },
        }),
        prisma.lead.count({ where: whereClause }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        success: true,
        message: `成功获取 ${leads.length} 条线索，共 ${total} 条`,
        leads,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      };
    } catch (error) {
      console.error("获取线索列表失败:", error);
      return {
        success: false,
        message: `获取线索列表失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
