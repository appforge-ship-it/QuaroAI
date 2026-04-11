import { Router, type IRouter } from "express";
import OpenAI from "openai";
import { AiChatBody } from "@workspace/api-zod";

const router: IRouter = Router();

function getOpenAIClient(): OpenAI {
  return new OpenAI({
    baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
    apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  });
}

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  try {
    const openai = getOpenAIClient();

    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      {
        role: "system",
        content:
          "You are a helpful coding assistant. You help users write, debug, and understand code. Be concise and practical in your responses. When showing code, use markdown code blocks with the appropriate language tag.",
      },
    ];

    if (parsed.data.conversationHistory) {
      for (const msg of parsed.data.conversationHistory) {
        messages.push({
          role: msg.role as "user" | "assistant",
          content: msg.content,
        });
      }
    }

    if (parsed.data.code) {
      messages.push({
        role: "user",
        content: `Here is the code I'm working with:\n\`\`\`\n${parsed.data.code}\n\`\`\`\n\n${parsed.data.message}`,
      });
    } else {
      messages.push({
        role: "user",
        content: parsed.data.message,
      });
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages,
    });

    const responseMessage =
      completion.choices[0]?.message?.content ?? "I could not generate a response.";

    res.json({
      message: responseMessage,
      role: "assistant",
    });
  } catch (err) {
    req.log.error({ err }, "AI chat error");
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    res.json({
      message: `I encountered an error: ${errorMessage}. Please try again.`,
      role: "assistant",
    });
  }
});

export default router;
