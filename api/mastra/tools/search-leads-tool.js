import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const searchLeadsTool = createTool({
  id: "search-leads",
  description: "根据关键词搜索线索，支持按姓名、邮箱、公司模糊匹配",
  inputSchema: z.object({
    organizationId: z.string().describe("组织ID"),
    keyword: z.string().describe("搜索关键词"),
    limit: z.number().optional().default(20).describe("返回结果数量上限，默认20"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    leads: z.array(z.any()).optional(),
    total: z.number().optional(),
  }),
  execute: async ({ context }) => {
    const { organizationId, keyword, limit = 20 } = context;

    try {
      const leads = await prisma.lead.findMany({
        where: {
          organizationId,
          OR: [
            { firstName: { contains: keyword, mode: "insensitive" } },
            { lastName: { contains: keyword, mode: "insensitive" } },
            { email: { contains: keyword, mode: "insensitive" } },
            { company: { contains: keyword, mode: "insensitive" } },
            { description: { contains: keyword, mode: "insensitive" } },
          ],
        },
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        success: true,
        message: `搜索到 ${leads.length} 条匹配的线索`,
        leads,
        total: leads.length,
      };
    } catch (error) {
      console.error("搜索线索失败:", error);
      return {
        success: false,
        message: `搜索线索失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
