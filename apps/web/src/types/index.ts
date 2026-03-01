export type Platform = "midjourney" | "flux" | "dalle";
export type Orientation = "portrait" | "square" | "landscape";
export type PromptLabel = "safe" | "creative" | "experimental";
export type Account =
  | "sammiisparkle"
  | "spellbound"
  | "lunary"
  | "personal";

export interface PromptVariation {
  label: PromptLabel;
  prompt: string;
}

export interface GenerateRequest {
  brief: string;
  account: Account | "";
  platform: Platform;
  orientation: Orientation;
  sessionId?: string;
  refinement?: string;
  basePrompt?: string;
}

export interface GenerateResponse {
  sessionId: string;
  iterationId: string;
  variations: PromptVariation[];
}

export interface SavedPrompt {
  id: string;
  label: PromptLabel;
  output: string;
  rating: number | null;
  favourite: boolean;
  saved: boolean;
  tags: string[];
  collectionId: string | null;
  createdAt: string;
  iteration: {
    refinement: string | null;
    session: {
      brief: string;
      account: string | null;
      platform: string;
      orientation: string;
    };
  };
}

export const PLATFORM_PARAMS: Record<
  Platform,
  Record<Orientation, string>
> = {
  midjourney: {
    portrait: "--ar 9:16 --v 6.1 --stylize 750",
    square: "--ar 1:1 --v 6.1 --stylize 750",
    landscape: "--ar 16:9 --v 6.1 --stylize 750",
  },
  flux: {
    portrait: "--ar 9:16",
    square: "--ar 1:1",
    landscape: "--ar 16:9",
  },
  dalle: {
    portrait: "1024x1792",
    square: "1024x1024",
    landscape: "1792x1024",
  },
};

export const ACCOUNT_STYLE_HINTS: Record<string, string> = {
  sammiisparkle:
    "ethereal lifestyle aesthetics, soft warm tones, golden hour light, feminine wellness energy, cottagecore and celestial vibes",
  spellbound:
    "witchy illustration style, bold ink lines, dark mystical atmosphere, tarot card aesthetics, occult symbolism, gothic botanical",
  lunary:
    "cosmic astrology visuals, deep space blues and purples, celestial bodies, modern minimal spiritual, clean editorial",
  personal: "authentic candid style, natural light, genuine emotion, documentary photography",
};
