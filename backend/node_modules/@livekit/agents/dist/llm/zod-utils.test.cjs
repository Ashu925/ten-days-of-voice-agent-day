"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var import_vitest = require("vitest");
var import_zod = require("zod");
var z3 = __toESM(require("zod/v3"), 1);
var z4 = __toESM(require("zod/v4"), 1);
var import_zod_utils = require("./zod-utils.cjs");
(0, import_vitest.describe)("Zod Utils", () => {
  (0, import_vitest.describe)("isZod4Schema", () => {
    (0, import_vitest.it)("should detect Zod v4 schemas", () => {
      const v4Schema = z4.string();
      (0, import_vitest.expect)((0, import_zod_utils.isZod4Schema)(v4Schema)).toBe(true);
    });
    (0, import_vitest.it)("should detect Zod v3 schemas", () => {
      const v3Schema = z3.string();
      (0, import_vitest.expect)((0, import_zod_utils.isZod4Schema)(v3Schema)).toBe(false);
    });
    (0, import_vitest.it)("should handle default z import (follows installed version)", () => {
      const schema = import_zod.z.string();
      (0, import_vitest.expect)(typeof (0, import_zod_utils.isZod4Schema)(schema)).toBe("boolean");
    });
  });
  (0, import_vitest.describe)("isZodSchema", () => {
    (0, import_vitest.it)("should detect Zod v4 schemas", () => {
      const v4Schema = z4.object({ name: z4.string() });
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)(v4Schema)).toBe(true);
    });
    (0, import_vitest.it)("should detect Zod v3 schemas", () => {
      const v3Schema = z3.object({ name: z3.string() });
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)(v3Schema)).toBe(true);
    });
    (0, import_vitest.it)("should return false for non-Zod values", () => {
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)({})).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)(null)).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)(void 0)).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)("string")).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)(123)).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodSchema)({ _def: {} })).toBe(false);
    });
  });
  (0, import_vitest.describe)("isZodObjectSchema", () => {
    (0, import_vitest.it)("should detect Zod v4 object schemas", () => {
      const objectSchema = z4.object({ name: z4.string() });
      (0, import_vitest.expect)((0, import_zod_utils.isZodObjectSchema)(objectSchema)).toBe(true);
    });
    (0, import_vitest.it)("should detect Zod v3 object schemas", () => {
      const objectSchema = z3.object({ name: z3.string() });
      (0, import_vitest.expect)((0, import_zod_utils.isZodObjectSchema)(objectSchema)).toBe(true);
    });
    (0, import_vitest.it)("should return false for non-object Zod schemas", () => {
      (0, import_vitest.expect)((0, import_zod_utils.isZodObjectSchema)(z4.string())).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodObjectSchema)(z4.number())).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodObjectSchema)(z4.array(z4.string()))).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodObjectSchema)(z3.string())).toBe(false);
      (0, import_vitest.expect)((0, import_zod_utils.isZodObjectSchema)(z3.number())).toBe(false);
    });
  });
  (0, import_vitest.describe)("zodSchemaToJsonSchema", () => {
    (0, import_vitest.describe)("Zod v4 schemas", () => {
      (0, import_vitest.it)("should convert basic v4 object schema to JSON Schema", () => {
        const schema = z4.object({
          name: z4.string(),
          age: z4.number()
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      import_vitest.it.skip("should handle v4 schemas with descriptions", () => {
        const schema = z4.object({
          location: z4.string().describe("The location to search")
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v4 schemas with optional fields", () => {
        const schema = z4.object({
          required: z4.string(),
          optional: z4.string().optional()
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v4 enum schemas", () => {
        const schema = z4.object({
          color: z4.enum(["red", "blue", "green"])
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v4 array schemas", () => {
        const schema = z4.object({
          tags: z4.array(z4.string())
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v4 nested object schemas", () => {
        const schema = z4.object({
          user: z4.object({
            name: z4.string(),
            email: z4.string()
          })
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v4 schemas with multiple optional fields", () => {
        const schema = z4.object({
          id: z4.string(),
          name: z4.string().optional(),
          age: z4.number().optional(),
          email: z4.string()
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v4 schemas with default values", () => {
        const schema = z4.object({
          name: z4.string(),
          role: z4.string().default("user"),
          active: z4.boolean().default(true)
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
    });
    (0, import_vitest.describe)("Zod v3 schemas", () => {
      (0, import_vitest.it)("should convert basic v3 object schema to JSON Schema", () => {
        const schema = z3.object({
          name: z3.string(),
          age: z3.number()
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v3 schemas with descriptions", () => {
        const schema = z3.object({
          location: z3.string().describe("The location to search")
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      import_vitest.it.skip("should handle v3 schemas with optional fields", () => {
        const schema = z3.object({
          required: z3.string(),
          optional: z3.string().optional()
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v3 enum schemas", () => {
        const schema = z3.object({
          color: z3.enum(["red", "blue", "green"])
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v3 array schemas", () => {
        const schema = z3.object({
          tags: z3.array(z3.string())
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v3 nested object schemas", () => {
        const schema = z3.object({
          user: z3.object({
            name: z3.string(),
            email: z3.string()
          })
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v3 schemas with multiple optional fields", () => {
        const schema = z3.object({
          id: z3.string(),
          name: z3.string().optional(),
          age: z3.number().optional(),
          email: z3.string()
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v3 schemas with default values", () => {
        const schema = z3.object({
          name: z3.string(),
          role: z3.string().default("user"),
          active: z3.boolean().default(true)
        });
        const jsonSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema);
        (0, import_vitest.expect)(jsonSchema).toMatchSnapshot();
      });
    });
    (0, import_vitest.describe)("isOpenai parameter", () => {
      (0, import_vitest.it)("should respect isOpenai parameter for v3 schemas", () => {
        const schema = z3.object({ name: z3.string() });
        const openaiSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true);
        const jsonSchema7 = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, false);
        (0, import_vitest.expect)(openaiSchema).toHaveProperty("properties");
        (0, import_vitest.expect)(jsonSchema7).toHaveProperty("properties");
      });
    });
    (0, import_vitest.describe)("strict parameter", () => {
      (0, import_vitest.it)("should produce strict JSON schema with strict: true", () => {
        const schema = z4.object({
          name: z4.string(),
          age: z4.number()
        });
        const strictSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true);
        (0, import_vitest.expect)(strictSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle nullable fields in strict mode", () => {
        const schema = z4.object({
          required: z4.string(),
          optional: z4.string().nullable()
        });
        const strictSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true);
        (0, import_vitest.expect)(strictSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle default values in strict mode", () => {
        const schema = z4.object({
          name: z4.string(),
          role: z4.string().default("user"),
          active: z4.boolean().default(true)
        });
        const strictSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true);
        (0, import_vitest.expect)(strictSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle nested objects in strict mode", () => {
        const schema = z4.object({
          user: z4.object({
            name: z4.string(),
            email: z4.string().nullable()
          }),
          metadata: z4.object({
            created: z4.string()
          })
        });
        const strictSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true);
        (0, import_vitest.expect)(strictSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle arrays in strict mode", () => {
        const schema = z4.object({
          tags: z4.array(z4.string()),
          numbers: z4.array(z4.number())
        });
        const strictSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true);
        (0, import_vitest.expect)(strictSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should handle v3 schemas in strict mode", () => {
        const schema = z3.object({
          name: z3.string(),
          age: z3.number().optional()
        });
        const strictSchema = (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true);
        (0, import_vitest.expect)(strictSchema).toMatchSnapshot();
      });
      (0, import_vitest.it)("should throw error when using .optional() without .nullable() in strict mode", () => {
        const schema = z4.object({
          required: z4.string(),
          optional: z4.string().optional()
        });
        (0, import_vitest.expect)(() => (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true)).toThrow(
          /uses `.optional\(\)` without `.nullable\(\)` which is not supported by the API/
        );
      });
      (0, import_vitest.it)("should throw error for nested .optional() fields in strict mode", () => {
        const schema = z4.object({
          user: z4.object({
            name: z4.string(),
            email: z4.string().optional()
          })
        });
        (0, import_vitest.expect)(() => (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, true)).toThrow(
          /uses `.optional\(\)` without `.nullable\(\)` which is not supported by the API/
        );
      });
      (0, import_vitest.it)("should NOT throw error when using .optional() in non-strict mode", () => {
        const schema = z4.object({
          required: z4.string(),
          optional: z4.string().optional()
        });
        (0, import_vitest.expect)(() => (0, import_zod_utils.zodSchemaToJsonSchema)(schema, true, false)).not.toThrow();
      });
    });
  });
  (0, import_vitest.describe)("parseZodSchema", () => {
    (0, import_vitest.describe)("Zod v4 schemas", () => {
      (0, import_vitest.it)("should successfully parse valid v4 data", async () => {
        const schema = z4.object({
          name: z4.string(),
          age: z4.number()
        });
        const result = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John", age: 30 });
        (0, import_vitest.expect)(result.success).toBe(true);
        if (result.success) {
          (0, import_vitest.expect)(result.data).toEqual({ name: "John", age: 30 });
        }
      });
      (0, import_vitest.it)("should fail to parse invalid v4 data", async () => {
        const schema = z4.object({
          name: z4.string(),
          age: z4.number()
        });
        const result = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John", age: "invalid" });
        (0, import_vitest.expect)(result.success).toBe(false);
        if (!result.success) {
          (0, import_vitest.expect)(result.error).toBeDefined();
        }
      });
      (0, import_vitest.it)("should handle v4 optional fields", async () => {
        const schema = z4.object({
          name: z4.string(),
          email: z4.string().optional()
        });
        const result1 = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John" });
        (0, import_vitest.expect)(result1.success).toBe(true);
        const result2 = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John", email: "john@example.com" });
        (0, import_vitest.expect)(result2.success).toBe(true);
      });
      (0, import_vitest.it)("should handle v4 default values", async () => {
        const schema = z4.object({
          name: z4.string(),
          role: z4.string().default("user")
        });
        const result = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John" });
        (0, import_vitest.expect)(result.success).toBe(true);
        if (result.success) {
          (0, import_vitest.expect)(result.data).toEqual({ name: "John", role: "user" });
        }
      });
    });
    (0, import_vitest.describe)("Zod v3 schemas", () => {
      (0, import_vitest.it)("should successfully parse valid v3 data", async () => {
        const schema = z3.object({
          name: z3.string(),
          age: z3.number()
        });
        const result = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John", age: 30 });
        (0, import_vitest.expect)(result.success).toBe(true);
        if (result.success) {
          (0, import_vitest.expect)(result.data).toEqual({ name: "John", age: 30 });
        }
      });
      (0, import_vitest.it)("should fail to parse invalid v3 data", async () => {
        const schema = z3.object({
          name: z3.string(),
          age: z3.number()
        });
        const result = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John", age: "invalid" });
        (0, import_vitest.expect)(result.success).toBe(false);
        if (!result.success) {
          (0, import_vitest.expect)(result.error).toBeDefined();
        }
      });
      (0, import_vitest.it)("should handle v3 optional fields", async () => {
        const schema = z3.object({
          name: z3.string(),
          email: z3.string().optional()
        });
        const result1 = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John" });
        (0, import_vitest.expect)(result1.success).toBe(true);
        const result2 = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John", email: "john@example.com" });
        (0, import_vitest.expect)(result2.success).toBe(true);
      });
      (0, import_vitest.it)("should handle v3 default values", async () => {
        const schema = z3.object({
          name: z3.string(),
          role: z3.string().default("user")
        });
        const result = await (0, import_zod_utils.parseZodSchema)(schema, { name: "John" });
        (0, import_vitest.expect)(result.success).toBe(true);
        if (result.success) {
          (0, import_vitest.expect)(result.data).toEqual({ name: "John", role: "user" });
        }
      });
    });
  });
  (0, import_vitest.describe)("Cross-version compatibility", () => {
    (0, import_vitest.it)("should handle mixed v3 and v4 schemas in the same codebase", async () => {
      const v3Schema = z3.object({ name: z3.string() });
      const v4Schema = z4.object({ name: z4.string() });
      const v3Result = await (0, import_zod_utils.parseZodSchema)(v3Schema, { name: "John" });
      const v4Result = await (0, import_zod_utils.parseZodSchema)(v4Schema, { name: "Jane" });
      (0, import_vitest.expect)(v3Result.success).toBe(true);
      (0, import_vitest.expect)(v4Result.success).toBe(true);
    });
    (0, import_vitest.it)("should convert both v3 and v4 basic schemas to compatible JSON Schema", () => {
      var _a, _b;
      const v3Schema = z3.object({ count: z3.number() });
      const v4Schema = z4.object({ count: z4.number() });
      const v3Json = (0, import_zod_utils.zodSchemaToJsonSchema)(v3Schema);
      const v4Json = (0, import_zod_utils.zodSchemaToJsonSchema)(v4Schema);
      (0, import_vitest.expect)(v3Json.type).toBe("object");
      (0, import_vitest.expect)(v4Json.type).toBe("object");
      (0, import_vitest.expect)((_a = v3Json.properties.count) == null ? void 0 : _a.type).toBe("number");
      (0, import_vitest.expect)((_b = v4Json.properties.count) == null ? void 0 : _b.type).toBe("number");
    });
    (0, import_vitest.it)("should handle optional fields consistently across v3 and v4", () => {
      const v3Schema = z3.object({
        required: z3.string(),
        optional: z3.string().optional()
      });
      const v4Schema = z4.object({
        required: z4.string(),
        optional: z4.string().optional()
      });
      const v3Json = (0, import_zod_utils.zodSchemaToJsonSchema)(v3Schema);
      const v4Json = (0, import_zod_utils.zodSchemaToJsonSchema)(v4Schema);
      (0, import_vitest.expect)(v3Json.required).toContain("required");
      (0, import_vitest.expect)(v4Json.required).toContain("required");
      (0, import_vitest.expect)(v4Json.required).not.toContain("optional");
    });
    (0, import_vitest.it)("should handle complex schemas with nested objects and arrays consistently", () => {
      const v3Schema = z3.object({
        user: z3.object({
          name: z3.string(),
          email: z3.string().optional()
        }),
        tags: z3.array(z3.string()),
        status: z3.enum(["active", "inactive"])
      });
      const v4Schema = z4.object({
        user: z4.object({
          name: z4.string(),
          email: z4.string().optional()
        }),
        tags: z4.array(z4.string()),
        status: z4.enum(["active", "inactive"])
      });
      const v3Json = (0, import_zod_utils.zodSchemaToJsonSchema)(v3Schema);
      const v4Json = (0, import_zod_utils.zodSchemaToJsonSchema)(v4Schema);
      (0, import_vitest.expect)(v3Json.type).toBe(v4Json.type);
      (0, import_vitest.expect)(Object.keys(v3Json.properties || {})).toEqual(Object.keys(v4Json.properties || {}));
      const v3User = v3Json.properties.user;
      const v4User = v4Json.properties.user;
      (0, import_vitest.expect)(v3User == null ? void 0 : v3User.type).toBe("object");
      (0, import_vitest.expect)(v4User == null ? void 0 : v4User.type).toBe("object");
      const v3Tags = v3Json.properties.tags;
      const v4Tags = v4Json.properties.tags;
      (0, import_vitest.expect)(v3Tags == null ? void 0 : v3Tags.type).toBe("array");
      (0, import_vitest.expect)(v4Tags == null ? void 0 : v4Tags.type).toBe("array");
      const v3Status = v3Json.properties.status;
      const v4Status = v4Json.properties.status;
      (0, import_vitest.expect)(v3Status == null ? void 0 : v3Status.enum).toEqual(["active", "inactive"]);
      (0, import_vitest.expect)(v4Status == null ? void 0 : v4Status.enum).toEqual(["active", "inactive"]);
    });
  });
});
//# sourceMappingURL=zod-utils.test.cjs.map