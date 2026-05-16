import { MCPAgent, MCPClient } from "mcp-use";
import { readFile } from "fs/promises";
import path from "path";
import { DeepSeekLLMProvider } from "./deepseekProvider";

let agent: MCPAgent | null = null;
let client: MCPClient | null = null;

const MAX_STEPS = 10;

export async function generateResponse(prompt: string): Promise<string> {
  if (!prompt?.trim()) throw new Error("Prompt is empty");

  if (!agent) {
    const config = await loadMCPConfig();
    client = MCPClient.fromDict(config);
    const llm = new DeepSeekLLMProvider().getInstance();
    agent = new MCPAgent({ llm, client, maxSteps: MAX_STEPS });
  }

  return agent.run(prompt, MAX_STEPS);
}

export async function closeMCPAgent(): Promise<void> {
  if (client) {
    await client.closeAllSessions();
  }
  agent = null;
  client = null;
}

async function loadMCPConfig(): Promise<Record<string, unknown>> {
  const file = path.join(process.cwd(), "mcp.config.json");

  let raw: string;
  try {
    raw = await readFile(file, "utf8");
  } catch {
    throw new Error(
      "mcp.config.json not found. Create it in the project root to define mcpServers.",
    );
  }

  // Interpolate ${ENV_VAR} placeholders
  raw = raw.replace(/\$\{([^}]+)\}/g, (_, key: string) => process.env[key] ?? "");

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch (err) {
    throw new Error("Invalid JSON in mcp.config.json: " + (err as Error).message);
  }

  if (!parsed.mcpServers || typeof parsed.mcpServers !== "object") {
    throw new Error("mcp.config.json must include a 'mcpServers' object.");
  }

  return parsed;
}
