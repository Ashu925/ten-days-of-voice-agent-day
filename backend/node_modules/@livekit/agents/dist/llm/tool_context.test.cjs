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
var import_tool_context = require("./tool_context.cjs");
var import_utils = require("./utils.cjs");
(0, import_vitest.describe)("Tool Context", () => {
  (0, import_vitest.describe)("oaiParams", () => {
    (0, import_vitest.it)("should handle basic object schema", () => {
      const schema = import_zod.z.object({
        name: import_zod.z.string().describe("The user name"),
        age: import_zod.z.number().describe("The user age")
      });
      const result = (0, import_utils.oaiParams)(schema);
      (0, import_vitest.expect)(result).toMatchSnapshot();
    });
    (0, import_vitest.it)("should handle enum fields", () => {
      const schema = import_zod.z.object({
        color: import_zod.z.enum(["red", "blue", "green"]).describe("Choose a color")
      });
      const result = (0, import_utils.oaiParams)(schema);
      (0, import_vitest.expect)(result).toMatchSnapshot();
    });
    (0, import_vitest.it)("should handle array fields", () => {
      const schema = import_zod.z.object({
        tags: import_zod.z.array(import_zod.z.string()).describe("List of tags")
      });
      const result = (0, import_utils.oaiParams)(schema);
      (0, import_vitest.expect)(result).toMatchSnapshot();
    });
    (0, import_vitest.it)("should handle array of enums", () => {
      const schema = import_zod.z.object({
        colors: import_zod.z.array(import_zod.z.enum(["red", "blue", "green"])).describe("List of colors")
      });
      const result = (0, import_utils.oaiParams)(schema);
      (0, import_vitest.expect)(result).toMatchSnapshot();
    });
    (0, import_vitest.it)("should handle optional fields", () => {
      const schema = import_zod.z.object({
        name: import_zod.z.string().describe("The user name"),
        age: import_zod.z.number().optional().describe("The user age")
      });
      const result = (0, import_utils.oaiParams)(schema);
      (0, import_vitest.expect)(result).toMatchSnapshot();
    });
    (0, import_vitest.it)("should handle fields without descriptions", () => {
      const schema = import_zod.z.object({
        name: import_zod.z.string(),
        age: import_zod.z.number()
      });
      const result = (0, import_utils.oaiParams)(schema);
      (0, import_vitest.expect)(result).toMatchSnapshot();
    });
  });
  (0, import_vitest.describe)("tool", () => {
    (0, import_vitest.it)("should create and execute a basic core tool", async () => {
      const getWeather = (0, import_tool_context.tool)({
        description: "Get the weather for a given location",
        parameters: import_zod.z.object({
          location: import_zod.z.string()
        }),
        execute: async ({ location }, { ctx }) => {
          return `The weather in ${location} is sunny, ${ctx.userData.name}`;
        }
      });
      const result = await getWeather.execute(
        { location: "San Francisco" },
        (0, import_utils.createToolOptions)("123", { name: "John" })
      );
      (0, import_vitest.expect)(result).toBe("The weather in San Francisco is sunny, John");
    });
    (0, import_vitest.it)("should properly type a callable function", async () => {
      const testFunction = (0, import_tool_context.tool)({
        description: "Test function",
        parameters: import_zod.z.object({
          name: import_zod.z.string().describe("The user name"),
          age: import_zod.z.number().describe("The user age")
        }),
        execute: async (args) => {
          return `${args.name} is ${args.age} years old`;
        }
      });
      const result = await testFunction.execute(
        { name: "John", age: 30 },
        (0, import_utils.createToolOptions)("123")
      );
      (0, import_vitest.expect)(result).toBe("John is 30 years old");
    });
    (0, import_vitest.it)("should handle async execution", async () => {
      const testFunction = (0, import_tool_context.tool)({
        description: "Async test function",
        parameters: import_zod.z.object({
          delay: import_zod.z.number().describe("Delay in milliseconds")
        }),
        execute: async (args) => {
          await new Promise((resolve) => setTimeout(resolve, args.delay));
          return args.delay;
        }
      });
      const start = Date.now();
      const result = await testFunction.execute({ delay: 100 }, (0, import_utils.createToolOptions)("123"));
      const duration = Date.now() - start;
      (0, import_vitest.expect)(result).toBe(100);
      (0, import_vitest.expect)(duration).toBeGreaterThanOrEqual(95);
    });
    (0, import_vitest.describe)("nested array support", () => {
      (0, import_vitest.it)("should handle nested array fields", () => {
        const schema = import_zod.z.object({
          items: import_zod.z.array(
            import_zod.z.object({
              name: import_zod.z.string().describe("the item name"),
              modifiers: import_zod.z.array(
                import_zod.z.object({
                  modifier_name: import_zod.z.string(),
                  modifier_value: import_zod.z.string()
                })
              ).describe("list of the modifiers applied on this item, such as size")
            })
          )
        });
        const result = (0, import_utils.oaiParams)(schema);
        (0, import_vitest.expect)(result).toMatchSnapshot();
      });
    });
    (0, import_vitest.describe)("optional parameters", () => {
      (0, import_vitest.it)("should create a tool without parameters", async () => {
        const simpleAction = (0, import_tool_context.tool)({
          description: "Perform a simple action",
          execute: async () => {
            return "Action performed";
          }
        });
        (0, import_vitest.expect)(simpleAction.type).toBe("function");
        (0, import_vitest.expect)(simpleAction.description).toBe("Perform a simple action");
        (0, import_vitest.expect)(simpleAction.parameters).toBeDefined();
        (0, import_vitest.expect)(simpleAction.parameters._def.typeName).toBe("ZodObject");
        const result = await simpleAction.execute({}, (0, import_utils.createToolOptions)("123"));
        (0, import_vitest.expect)(result).toBe("Action performed");
      });
      (0, import_vitest.it)("should support .optional() fields in tool parameters", async () => {
        const weatherTool = (0, import_tool_context.tool)({
          description: "Get weather information",
          parameters: import_zod.z.object({
            location: import_zod.z.string().describe("The city or location").optional(),
            units: import_zod.z.enum(["celsius", "fahrenheit"]).describe("Temperature units").optional()
          }),
          execute: async ({ location, units }) => {
            const loc = location ?? "Unknown";
            const unit = units ?? "celsius";
            return `Weather in ${loc} (${unit})`;
          }
        });
        (0, import_vitest.expect)(weatherTool.type).toBe("function");
        (0, import_vitest.expect)(weatherTool.description).toBe("Get weather information");
        const result1 = await weatherTool.execute(
          { location: "London", units: "celsius" },
          (0, import_utils.createToolOptions)("123")
        );
        (0, import_vitest.expect)(result1).toBe("Weather in London (celsius)");
        const result2 = await weatherTool.execute({}, (0, import_utils.createToolOptions)("123"));
        (0, import_vitest.expect)(result2).toBe("Weather in Unknown (celsius)");
        const result3 = await weatherTool.execute({ location: "Paris" }, (0, import_utils.createToolOptions)("123"));
        (0, import_vitest.expect)(result3).toBe("Weather in Paris (celsius)");
      });
      (0, import_vitest.it)("should handle tools with context but no parameters", async () => {
        const greetUser = (0, import_tool_context.tool)({
          description: "Greet the current user",
          execute: async (_, { ctx }) => {
            return `Hello, ${ctx.userData.username}!`;
          }
        });
        const result = await greetUser.execute({}, (0, import_utils.createToolOptions)("123", { username: "Alice" }));
        (0, import_vitest.expect)(result).toBe("Hello, Alice!");
      });
      (0, import_vitest.it)("should create a tool that accesses tool call id without parameters", async () => {
        const getCallId = (0, import_tool_context.tool)({
          description: "Get the current tool call ID",
          execute: async (_, { toolCallId }) => {
            return `Tool call ID: ${toolCallId}`;
          }
        });
        const result = await getCallId.execute({}, (0, import_utils.createToolOptions)("test-id-456"));
        (0, import_vitest.expect)(result).toBe("Tool call ID: test-id-456");
      });
    });
    (0, import_vitest.describe)("Zod v3 and v4 compatibility", () => {
      (0, import_vitest.it)("should work with Zod v3 schemas", async () => {
        const v3Tool = (0, import_tool_context.tool)({
          description: "A tool using Zod v3 schema",
          parameters: z3.object({
            name: z3.string(),
            count: z3.number()
          }),
          execute: async ({ name, count }) => {
            return `${name}: ${count}`;
          }
        });
        const result = await v3Tool.execute(
          { name: "Test", count: 42 },
          (0, import_utils.createToolOptions)("v3-test")
        );
        (0, import_vitest.expect)(result).toBe("Test: 42");
      });
      (0, import_vitest.it)("should work with Zod v4 schemas", async () => {
        const v4Tool = (0, import_tool_context.tool)({
          description: "A tool using Zod v4 schema",
          parameters: z4.object({
            name: z4.string(),
            count: z4.number()
          }),
          execute: async ({ name, count }) => {
            return `${name}: ${count}`;
          }
        });
        const result = await v4Tool.execute(
          { name: "Test", count: 42 },
          (0, import_utils.createToolOptions)("v4-test")
        );
        (0, import_vitest.expect)(result).toBe("Test: 42");
      });
      (0, import_vitest.it)("should handle v4 schemas with optional fields", async () => {
        const v4Tool = (0, import_tool_context.tool)({
          description: "Tool with optional field using v4",
          parameters: z4.object({
            required: z4.string(),
            optional: z4.string().optional()
          }),
          execute: async ({ required, optional }) => {
            return optional ? `${required} - ${optional}` : required;
          }
        });
        const result1 = await v4Tool.execute({ required: "Hello" }, (0, import_utils.createToolOptions)("test-1"));
        (0, import_vitest.expect)(result1).toBe("Hello");
        const result2 = await v4Tool.execute(
          { required: "Hello", optional: "World" },
          (0, import_utils.createToolOptions)("test-2")
        );
        (0, import_vitest.expect)(result2).toBe("Hello - World");
      });
      (0, import_vitest.it)("should handle v4 enum schemas", async () => {
        const v4Tool = (0, import_tool_context.tool)({
          description: "Tool with enum using v4",
          parameters: z4.object({
            color: z4.enum(["red", "blue", "green"])
          }),
          execute: async ({ color }) => {
            return `Selected color: ${color}`;
          }
        });
        const result = await v4Tool.execute({ color: "blue" }, (0, import_utils.createToolOptions)("test-enum"));
        (0, import_vitest.expect)(result).toBe("Selected color: blue");
      });
      (0, import_vitest.it)("should handle v4 array schemas", async () => {
        const v4Tool = (0, import_tool_context.tool)({
          description: "Tool with array using v4",
          parameters: z4.object({
            tags: z4.array(z4.string())
          }),
          execute: async ({ tags }) => {
            return `Tags: ${tags.join(", ")}`;
          }
        });
        const result = await v4Tool.execute(
          { tags: ["nodejs", "typescript", "testing"] },
          (0, import_utils.createToolOptions)("test-array")
        );
        (0, import_vitest.expect)(result).toBe("Tags: nodejs, typescript, testing");
      });
      (0, import_vitest.it)("should handle v4 nested object schemas", async () => {
        const v4Tool = (0, import_tool_context.tool)({
          description: "Tool with nested object using v4",
          parameters: z4.object({
            user: z4.object({
              name: z4.string(),
              email: z4.string()
            })
          }),
          execute: async ({ user }) => {
            return `${user.name} (${user.email})`;
          }
        });
        const result = await v4Tool.execute(
          { user: { name: "John Doe", email: "john@example.com" } },
          (0, import_utils.createToolOptions)("test-nested")
        );
        (0, import_vitest.expect)(result).toBe("John Doe (john@example.com)");
      });
    });
    (0, import_vitest.describe)("oaiParams with v4 schemas", () => {
      (0, import_vitest.it)("should convert v4 basic object schema", () => {
        const schema = z4.object({
          name: z4.string().describe("User name"),
          age: z4.number().describe("User age")
        });
        const result = (0, import_utils.oaiParams)(schema);
        (0, import_vitest.expect)(result.type).toBe("object");
        (0, import_vitest.expect)(result.properties).toHaveProperty("name");
        (0, import_vitest.expect)(result.properties).toHaveProperty("age");
        (0, import_vitest.expect)(result.required).toContain("name");
        (0, import_vitest.expect)(result.required).toContain("age");
      });
      (0, import_vitest.it)("should handle v4 optional fields", () => {
        const schema = z4.object({
          required: z4.string(),
          optional: z4.string().optional()
        });
        const result = (0, import_utils.oaiParams)(schema);
        (0, import_vitest.expect)(result.required).toContain("required");
        (0, import_vitest.expect)(result.required).not.toContain("optional");
      });
      (0, import_vitest.it)("should handle v4 enum fields", () => {
        var _a;
        const schema = z4.object({
          status: z4.enum(["pending", "approved", "rejected"])
        });
        const result = (0, import_utils.oaiParams)(schema);
        const properties = result.properties;
        (0, import_vitest.expect)((_a = properties.status) == null ? void 0 : _a.enum).toEqual(["pending", "approved", "rejected"]);
      });
      (0, import_vitest.it)("should handle v4 array fields", () => {
        const schema = z4.object({
          items: z4.array(z4.string())
        });
        const result = (0, import_utils.oaiParams)(schema);
        const properties = result.properties;
        (0, import_vitest.expect)(
          properties.items && typeof properties.items === "object" ? properties.items.type : void 0
        ).toBe("array");
        (0, import_vitest.expect)(
          properties.items && properties.items.items && typeof properties.items.items === "object" ? properties.items.items.type : void 0
        ).toBe("string");
      });
    });
  });
});
//# sourceMappingURL=tool_context.test.cjs.map