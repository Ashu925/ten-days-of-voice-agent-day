import type { JSONSchema7 } from 'json-schema';
import type * as z3 from 'zod/v3';
import * as z4 from 'zod/v4';
/**
 * Result type from Zod schema parsing.
 */
export type ZodParseResult<T = unknown> = {
    success: true;
    data: T;
} | {
    success: false;
    error: unknown;
};
/**
 * Type definition for Zod schemas that works with both v3 and v4.
 * Uses a union type of both Zod v3 and v4 schema types.
 *
 * Adapted from Vercel AI SDK's zodSchema function signature.
 * Source: https://github.com/vercel/ai/blob/main/packages/provider-utils/src/schema.ts#L278-L281
 */
export type ZodSchema = z4.core.$ZodType<any, any> | z3.Schema<any, z3.ZodTypeDef, any>;
/**
 * Detects if a schema is a Zod v4 schema.
 * Zod v4 schemas have a `_zod` property that v3 schemas don't have.
 *
 * @param schema - The schema to check
 * @returns True if the schema is a Zod v4 schema
 */
export declare function isZod4Schema(schema: ZodSchema): schema is z4.core.$ZodType<any, any>;
/**
 * Checks if a value is a Zod schema (either v3 or v4).
 *
 * @param value - The value to check
 * @returns True if the value is a Zod schema
 */
export declare function isZodSchema(value: unknown): value is ZodSchema;
/**
 * Checks if a Zod schema is an object schema.
 *
 * @param schema - The schema to check
 * @returns True if the schema is an object schema
 */
export declare function isZodObjectSchema(schema: ZodSchema): boolean;
/**
 * Converts a Zod schema to JSON Schema format.
 * Handles both Zod v3 and v4 schemas automatically.
 *
 * Adapted from Vercel AI SDK's zod3Schema and zod4Schema functions.
 * Source: https://github.com/vercel/ai/blob/main/packages/provider-utils/src/schema.ts#L237-L269
 *
 * @param schema - The Zod schema to convert
 * @param isOpenai - Whether to use OpenAI-specific formatting (default: true)
 * @returns A JSON Schema representation of the Zod schema
 */
export declare function zodSchemaToJsonSchema(schema: ZodSchema, isOpenai?: boolean, strict?: boolean): JSONSchema7;
/**
 * Parses a value against a Zod schema.
 * Handles both Zod v3 and v4 parse APIs automatically.
 *
 * @param schema - The Zod schema to parse against
 * @param value - The value to parse
 * @returns A promise that resolves to the parse result
 */
export declare function parseZodSchema<T = unknown>(schema: ZodSchema, value: unknown): Promise<ZodParseResult<T>>;
//# sourceMappingURL=zod-utils.d.ts.map