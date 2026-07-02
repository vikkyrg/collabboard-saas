import { aiConfig } from '../config/ai.config.js';
import * as groqProvider from './groq.provider.js';
import ApiError from '../utils/ApiError.js';

const providers = {
  groq: groqProvider,
};

export const getProvider = () => {
  const providerName = aiConfig.provider;
  
  const provider = providers[providerName];
  if (!provider) {
    throw new ApiError(500, `AI Provider '${providerName}' is not supported or not configured.`);
  }

  return provider;
};
