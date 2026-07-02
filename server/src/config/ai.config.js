export const aiConfig = {
  get provider() { return process.env.AI_PROVIDER || 'groq'; },
  groq: {
    get apiKey() { return process.env.GROQ_API_KEY; },
    get model() { return process.env.GROQ_MODEL || 'llama-3.3-70b-versatile'; },
  },
};
