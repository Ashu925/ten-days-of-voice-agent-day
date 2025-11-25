import type { JSONSchema7 } from 'json-schema';
import type { Agent } from '../voice/agent.js';
import type { RunContext, UnknownUserData } from '../voice/run_context.js';
declare const TOOL_SYMBOL: unique symbol;
declare const FUNCTION_TOOL_SYMBOL: unique symbol;
declare const PROVIDER_DEFINED_TOOL_SYMBOL: unique symbol;
declare const HANDOFF_SYMBOL: unique symbol;
export type JSONValue = null | string | number | boolean | JSONObject | JSONArray;
export type JSONArray = JSONValue[];
export type JSONObject = {
    [key: string]: JSONValue;
};
export type ToolInputSchema<T = JSONObject> = {
    _output: T;
} | {
    '~standard': {
        types?: {
            output: T;
        };
    };
} | JSONSchema7;
/**
 * Infer the output type from a ToolInputSchema.
 * Adapted from Vercel AI SDK's InferSchema type.
 * Source: https://github.com/vercel/ai/blob/main/packages/provider-utils/src/schema.ts#L72-L79
 */
export type InferToolInput<T> = T extends {
    _output: infer O;
} ? O : T extends {
    '~standard': {
        types?: {
            output: infer O;
        };
    };
} ? O : any;
export type ToolType = 'function' | 'provider-defined';
export type ToolChoice = 'auto' | 'none' | 'required' | {
    type: 'function';
    function: {
        name: string;
    };
};
export declare class ToolError extends Error {
    constructor(message: string);
}
export interface AgentHandoff {
    /**
     * The agent to handoff to.
     */
    agent: Agent;
    /**
     * The return value of the tool.
     */
    returns?: any;
    [HANDOFF_SYMBOL]: true;
}
export declare function handoff(options: {
    agent: Agent;
    returns?: any;
}): AgentHandoff;
export interface ToolOptions<UserData = UnknownUserData> {
    /**
     * RunContext for the current agent session.
     */
    ctx: RunContext<UserData>;
    /**
     * The ID of the tool call.
     */
    toolCallId: string;
    /**
     * An optional abort signal that indicates that the overall operation should be aborted.
     */
    abortSignal?: AbortSignal;
}
export type ToolExecuteFunction<Parameters extends JSONObject, UserData = UnknownUserData, Result = unknown> = (args: Parameters, opts: ToolOptions<UserData>) => Promise<Result>;
export interface Tool {
    /**
     * The type of the tool.
     * @internal Either user-defined core tool or provider-defined tool.
     */
    type: ToolType;
    [TOOL_SYMBOL]: true;
}
export interface ProviderDefinedTool extends Tool {
    type: 'provider-defined';
    /**
     * The ID of the tool.
     */
    id: string;
    /**
     * The configuration of the tool.
     */
    config: Record<string, unknown>;
    [PROVIDER_DEFINED_TOOL_SYMBOL]: true;
}
export interface FunctionTool<Parameters extends JSONObject, UserData = UnknownUserData, Result = unknown> extends Tool {
    type: 'function';
    /**
     * The description of the tool. Will be used by the language model to decide whether to use the tool.
     */
    description: string;
    /**
     * The schema of the input that the tool expects. The language model will use this to generate the input.
     * It is also used to validate the output of the language model.
     * Use descriptions to make the input understandable for the language model.
     */
    parameters: ToolInputSchema<Parameters>;
    /**
     * An async function that is called with the arguments from the tool call and produces a result.
     * It also carries context about current session, user-defined data, and the tool call id, etc.
     */
    execute: ToolExecuteFunction<Parameters, UserData, Result>;
    [FUNCTION_TOOL_SYMBOL]: true;
}
export type ToolContext<UserData = UnknownUserData> = {
    [name: string]: FunctionTool<any, UserData, any>;
};
export declare function isSameToolContext(ctx1: ToolContext, ctx2: ToolContext): boolean;
export declare function isSameToolChoice(choice1: ToolChoice | null, choice2: ToolChoice | null): boolean;
/**
 * Create a function tool with inferred parameters from the schema.
 */
export declare function tool<Schema extends ToolInputSchema<any>, // eslint-disable-line @typescript-eslint/no-explicit-any -- Generic constraint needs to accept any JSONObject type
UserData = UnknownUserData, Result = unknown>({ description, parameters, execute, }: {
    description: string;
    parameters: Schema;
    execute: ToolExecuteFunction<InferToolInput<Schema>, UserData, Result>;
}): FunctionTool<InferToolInput<Schema>, UserData, Result>;
/**
 * Create a function tool without parameters.
 */
export declare function tool<UserData = UnknownUserData, Result = unknown>({ description, execute, }: {
    description: string;
    parameters?: never;
    execute: ToolExecuteFunction<Record<string, never>, UserData, Result>;
}): FunctionTool<Record<string, never>, UserData, Result>;
/**
 * Create a provider-defined tool.
 *
 * @param id - The ID of the tool.
 * @param config - The configuration of the tool.
 */
export declare function tool({ id, config, }: {
    id: string;
    config: Record<string, unknown>;
}): ProviderDefinedTool;
export declare function isTool(tool: any): tool is Tool;
export declare function isFunctionTool(tool: any): tool is FunctionTool<any, any, any>;
export declare function isProviderDefinedTool(tool: any): tool is ProviderDefinedTool;
export declare function isToolError(error: any): error is ToolError;
export declare function isAgentHandoff(handoff: any): handoff is AgentHandoff;
export {};
//# sourceMappingURL=tool_context.d.ts.map