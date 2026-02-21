import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const createLeadTool = createTool({
  id: "create-lead",
  description: "创建新的销售线索",
  inputSchema: z.object({
    organizationId: z.string().describe("组织ID"),
    ownerId: z.string().describe("线索负责人的用户ID"),
    firstName: z.string().describe("名"),
    lastName: z.string().describe("姓"),
    email: z.string().email().describe("邮箱地址"),
    phone: z.string().optional().describe("电话号码"),
    company: z.string().optional().describe("公司名称"),
    title: z.string().optional().describe("职位"),
    status: z
      .enum(["NEW", "PENDING", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"])
      .optional()
      .default("PENDING")
      .describe("线索状态，默认PENDING"),
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
      .describe("线索来源"),
    industry: z.string().optional().describe("行业"),
    rating: z.enum(["Hot", "Warm", "Cold"]).optional().describe("评级"),
    description: z.string().optional().describe("描述信息"),
  }),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    lead: z.any().optional(),
  }),
  execute: async ({ context }) => {
    const {
      organizationId,
      ownerId,
      firstName,
      lastName,
      email,
      phone,
      company,
      title,
      status,
      leadSource,
      industry,
      rating,
      description,
    } = context;

    try {
      const lead = await prisma.lead.create({
        data: {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone?.trim() || null,
          company: company?.trim() || null,
          title: title?.trim() || null,
          status: status || "PENDING",
          leadSource: leadSource || null,
          industry: industry?.trim() || null,
          rating: rating || null,
          description: description?.trim() || null,
          organizationId,
          ownerId,
        },
        include: {
          owner: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        success: true,
        message: `成功创建线索: ${firstName} ${lastName}`,
        lead,
      };
    } catch (error) {
      console.error("创建线索失败:", error);
      if (/** @type {any} */ (error).code === "P2002") {
        return {
          success: false,
          message: "该邮箱在此组织中已存在对应线索",
        };
      }
      return {
        success: false,
        message: `创建线索失败: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  },
});
