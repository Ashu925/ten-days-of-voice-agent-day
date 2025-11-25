"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
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
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var zod_utils_exports = {};
__export(zod_utils_exports, {
  isZod4Schema: () => isZod4Schema,
  isZodObjectSchema: () => isZodObjectSchema,
  isZodSchema: () => isZodSchema,
  parseZodSchema: () => parseZodSchema,
  zodSchemaToJsonSchema: () => zodSchemaToJsonSchema
});
module.exports = __toCommonJS(zod_utils_exports);
var import_transform = require("openai/lib/transform");
var import_zod_to_json_schema = require("zod-to-json-schema");
var z4 = __toESM(require("zod/v4"), 1);
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
    result = (0, import_zod_to_json_schema.zodToJsonSchema)(schema, {
      target: isOpenai ? "openAi" : "jsonSchema7",
      $refStrategy: "none"
      // Don't use references by default (to support openapi conversion for google)
    });
  }
  return strict ? (0, import_transform.toStrictJsonSchema)(result) : result;
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
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  isZod4Schema,
  isZodObjectSchema,
  isZodSchema,
  parseZodSchema,
  zodSchemaToJsonSchema
});
//# sourceMappingURL=zod-utils.cjs.map