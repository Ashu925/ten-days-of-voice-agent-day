import type { ChatContext } from '../chat_context.js';
export type ProviderFormat = 'openai' | 'google';
export declare function toChatCtx(format: ProviderFormat, chatCtx: ChatContext, injectDummyUserMessage?: boolean): Promise<[Record<string, unknown>[], import("./google.js").GoogleFormatData] | Record<string, any>[]>;
//# sourceMappingURL=index.d.ts.map