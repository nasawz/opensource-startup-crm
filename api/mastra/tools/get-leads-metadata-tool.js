import { createTool } from "@mastra/core/tools";
import { z } from "zod";

export const getLeadsMetadataTool = createTool({
  id: "get-leads-metadata",
  description: "获取线索相关的元数据，包括状态、来源、评级、行业等可选值",
  inputSchema: z.object({}),
  outputSchema: z.object({
    success: z.boolean(),
    message: z.string(),
    metadata: z.object({
      leadStatuses: z.array(z.string()),
      leadSources: z.array(z.string()),
      ratings: z.array(z.string()),
      industries: z.array(z.string()),
    }),
  }),
  execute: async () => {
    return {
      success: true,
      message: "成功获取线索元数据",
      metadata: {
        leadStatuses: ["NEW", "PENDING", "CONTACTED", "QUALIFIED", "UNQUALIFIED", "CONVERTED"],
        leadSources: [
          "WEB",
          "PHONE_INQUIRY",
          "PARTNER_REFERRAL",
          "COLD_CALL",
          "TRADE_SHOW",
          "EMPLOYEE_REFERRAL",
          "ADVERTISEMENT",
          "OTHER",
        ],
        ratings: ["Hot", "Warm", "Cold"],
        industries: [
          "Technology",
          "Healthcare",
          "Finance",
          "Education",
          "Manufacturing",
          "Retail",
          "Real Estate",
          "Consulting",
          "Media",
          "Transportation",
          "Energy",
          "Government",
          "Non-profit",
          "Other",
        ],
      },
    };
  },
});
