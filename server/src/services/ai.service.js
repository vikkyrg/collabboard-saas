import AIConversation from "../models/AIConversation.js";
import { getProvider } from "../providers/providerFactory.js";

export const generateAIResponse = async ({ message, roomId, userId, contextImage }) => {
  // 1. Fetch conversation history
  const history = await AIConversation.find({ roomId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();

  const historyText = history
    .reverse()
    .map((h) => `User: ${h.question}\nAssistant: ${h.answer}`)
    .join("\n\n");

  const prompt = historyText
    ? `Previous conversation:\n${historyText}\n\nCurrent question: ${message}`
    : message;

  // 2. Build context
  const context = {
    image: contextImage,
  };

  // 3. Get the configured provider and generate response
  const provider = getProvider();
  const answer = await provider.generateResponse(prompt, context);

  // 4. Save to history
  await AIConversation.create({
    roomId,
    userId,
    question: message,
    answer,
  });

  return answer;
};
