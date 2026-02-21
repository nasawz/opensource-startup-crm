import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const getLeadTool = createTool({
  id: "get-lead",
  description: "根据ID获取线索详情",
  inputSchema: z.object({
    id: z.string().describe("线索的唯一标识符"),
    organizationId: z.string().describe("组织ID，用于数据隔离"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    lead: z.any().optional(),
  }),
  execute: async ({ context }) => {
    const { id, organizationId } = context;

    try {
      const lead = await prisma.lead.findFirst({
        where: { id, organizationId },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      if (!lead) {
        return {
          success: false,
          message: `未找到ID为 ${id} 的线索`,
        };
      }

      return {
        success: true,
        message: "成功获取线索详情",
        lead,
      };
    } catch (error) {
      console.error("获取线索详情失败:", error);
      return {
        success: false,
        message: `获取线索详情失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
