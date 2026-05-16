import { ChatOpenAI } from "@langchain/openai";

export class DeepSeekLLMProvider {
  private instance: ChatOpenAI | null = null;

  getInstance(): ChatOpenAI {
    if (!this.instance) {
      this.instance = new ChatOpenAI({
        model: process.env.DEEPSEEK_MODEL ?? "deepseek-chat",
        temperature: 0.2,
        apiKey: process.env.DEEPSEEK_API_KEY!,
        configuration: {
          baseURL: process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com",
        },
      });
    }
    return this.instance;
  }
}
