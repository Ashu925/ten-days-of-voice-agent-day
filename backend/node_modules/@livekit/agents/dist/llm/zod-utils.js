import { toStrictJsonSchema } from "openai/lib/transform";
import { zodToJsonSchema as zodToJsonSchemaV3 } from "zod-to-json-schema";
import * as z4 from "zod/v4";
function isZod4Schema(schema) {
  return "_zod" in schema;
}
function isZodSchema(value) {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  if ("_zod" in value) {
    return true;
  }
  if ("_def" in value && typeof value._def === "object" && value._def !== null) {
    const def = value._def;
    if ("typeName" in def) {
      return true;
    }
  }
  return false;
}
function isZodObjectSchema(schema) {
  var _a, _b, _c, _d;
  const schemaWithInternals = schema;
  if (isZod4Schema(schema)) {
    return ((_a = schemaWithInternals._def) == null ? void 0 : _a.type) === "object" || ((_c = (_b = schemaWithInternals._zod) == null ? void 0 : _b.traits) == null ? void 0 : _c.has("ZodObject")) || false;
  }
  return ((_d = schemaWithInternals._def) == null ? void 0 : _d.typeName) === "ZodObject";
}
function zodSchemaToJsonSchema(schema, isOpenai = true, strict = false) {
  let result;
  if (isZod4Schema(schema)) {
    result = z4.toJSONSchema(schema, {
      target: "draft-7",
      io: "output",
      reused: "inline"
      // Don't use references by default (to support openapi conversion for google)
    });
  } else {
    result = zodToJsonSchemaV3(schema, {
      target: isOpenai ? "openAi" : "jsonSchema7",
      $refStrategy: "none"
      // Don't use references by default (to support openapi conversion for google)
    });
  }
  return strict ? toStrictJsonSchema(result) : result;
}
async function parseZodSchema(schema, value) {
  if (isZod4Schema(schema)) {
    const result = await z4.safeParseAsync(schema, value);
    return result;
  } else {
    const result = await schema.safeParseAsync(value);
    return result;
  }
}
export {
  isZod4Schema,
  isZodObjectSchema,
  isZodSchema,
  parseZodSchema,
  zodSchemaToJsonSchema
};
//# sourceMappingURL=zod-utils.js.map