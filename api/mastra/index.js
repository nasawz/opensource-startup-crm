import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { Mastra } from "@mastra/core";
import { LibSQLStore } from '@mastra/libsql';
import { PinoLogger } from '@mastra/loggers';
import { leadsAgent } from "./agents/leads-agent.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dirname, '../../data/mastra.db');

export const mastra = new Mastra({
  agents: { leadsAgent },
  storage: new LibSQLStore({
    id: 'mastra-storage',
    url: `file:${dbPath}`,
  }),
  logger: new PinoLogger({
    name: 'Mastra',
    level: 'info',
  }),
  telemetry: {
    // Telemetry is deprecated and will be removed in the Nov 4th release
    enabled: false,
  },
  observability: {
    // Enables DefaultExporter and CloudExporter for AI tracing
    default: { enabled: true },
  },  
});
