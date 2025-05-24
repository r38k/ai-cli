/**
 * Available Gemini models from Google AI
 * Reference: https://ai.google.dev/gemini-api/docs/models
 */

export interface GeminiModel {
  id: string;
  displayName: string;
  category: "flash" | "pro" | "embedding" | "native-audio";
  capabilities: {
    text: boolean;
    images: boolean;
    video: boolean;
    audio: boolean;
    audioOutput?: boolean;
    embedding?: boolean;
  };
  contextWindow: number;
  description: string;
}

export const GEMINI_MODELS: Record<string, GeminiModel> = {
  "gemini-2.5-flash-preview-05-20": {
    id: "gemini-2.5-flash-preview-05-20",
    displayName: "Gemini 2.5 Flash Preview",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    description:
      "Latest Flash model with adaptive thinking and cost efficiency",
  },
  "gemini-2.5-flash-preview-native-audio-dialog": {
    id: "gemini-2.5-flash-preview-native-audio-dialog",
    displayName: "Gemini 2.5 Flash Native Audio Dialog",
    category: "native-audio",
    capabilities: {
      text: true,
      images: false,
      video: true,
      audio: true,
      audioOutput: true,
    },
    contextWindow: 128000,
    description:
      "Specialized for interactive audio conversations with audio generation",
  },
  "gemini-2.5-pro-preview-05-06": {
    id: "gemini-2.5-pro-preview-05-06",
    displayName: "Gemini 2.5 Pro Preview",
    category: "pro",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    description: "Advanced reasoning and complex problem solving capabilities",
  },
  "gemini-2.0-flash": {
    id: "gemini-2.0-flash",
    displayName: "Gemini 2.0 Flash",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    description: "Next-gen tool use with native streaming support",
  },
  "gemini-1.5-pro": {
    id: "gemini-1.5-pro",
    displayName: "Gemini 1.5 Pro",
    category: "pro",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 2097152,
    description: "Large data processing with 2M token context window",
  },
  "gemini-1.5-flash": {
    id: "gemini-1.5-flash",
    displayName: "Gemini 1.5 Flash",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    description: "Fast and versatile performance across diverse tasks",
  },
  "gemini-1.5-flash-8b": {
    id: "gemini-1.5-flash-8b",
    displayName: "Gemini 1.5 Flash 8B",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    description: "Smaller, faster variant ideal for lower intelligence tasks",
  },
  "gemini-1.5-pro-002": {
    id: "gemini-1.5-pro-002",
    displayName: "Gemini 1.5 Pro 002",
    category: "pro",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 2097152,
    description: "Updated Pro model with improved performance",
  },
  "gemini-1.5-flash-002": {
    id: "gemini-1.5-flash-002",
    displayName: "Gemini 1.5 Flash 002",
    category: "flash",
    capabilities: {
      text: true,
      images: true,
      video: true,
      audio: true,
    },
    contextWindow: 1048576,
    description: "Updated Flash model with enhanced capabilities",
  },
  "gemini-embedding-exp-03-07": {
    id: "gemini-embedding-exp-03-07",
    displayName: "Gemini Embedding Experimental",
    category: "embedding",
    capabilities: {
      text: true,
      images: false,
      video: false,
      audio: false,
      embedding: true,
    },
    contextWindow: 8192,
    description: "Multi-lingual embeddings with high retrieval performance",
  },
};

// Model ID constants for easy access
export const MODEL_IDS = {
  // Latest models
  GEMINI_2_5_FLASH_PREVIEW: "gemini-2.5-flash-preview-05-20",
  GEMINI_2_5_FLASH_AUDIO: "gemini-2.5-flash-preview-native-audio-dialog",
  GEMINI_2_5_PRO_PREVIEW: "gemini-2.5-pro-preview-05-06",
  GEMINI_2_0_FLASH: "gemini-2.0-flash",

  // Production models
  GEMINI_1_5_PRO: "gemini-1.5-pro",
  GEMINI_1_5_PRO_002: "gemini-1.5-pro-002",
  GEMINI_1_5_FLASH: "gemini-1.5-flash",
  GEMINI_1_5_FLASH_002: "gemini-1.5-flash-002",
  GEMINI_1_5_FLASH_8B: "gemini-1.5-flash-8b",

  // Specialized models
  GEMINI_EMBEDDING: "gemini-embedding-exp-03-07",
} as const;

export type ModelId = typeof MODEL_IDS[keyof typeof MODEL_IDS];

// Helper functions
export function getModelById(id: string): GeminiModel | undefined {
  return GEMINI_MODELS[id];
}

export function getModelsByCategory(
  category: GeminiModel["category"],
): GeminiModel[] {
  return Object.values(GEMINI_MODELS).filter((model) =>
    model.category === category
  );
}

export function getMultimodalModels(): GeminiModel[] {
  return Object.values(GEMINI_MODELS).filter(
    (model) =>
      model.capabilities.text &&
      model.capabilities.images &&
      model.capabilities.video &&
      model.capabilities.audio,
  );
}

export function getDefaultModel(): string {
  return MODEL_IDS.GEMINI_2_5_FLASH_PREVIEW;
}
