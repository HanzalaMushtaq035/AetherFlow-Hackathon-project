const IntentAgentInstance = require("./src/lib/agents/IntentAgent.ts").default || require("./src/lib/agents/IntentAgent.ts");
const fs = require("fs");

// We need to support ts-node or simple js execution, let's write a minimal raw test of dynamicExtract method
const IntentAgentClass = require("./src/lib/agents/IntentAgent.ts").IntentAgentClass;
const agent = new IntentAgentClass();

const query = "I need technician after 11 PM in J Block Johar Town Lahore";
console.log("Input Query:", query);
const result = agent.dynamicExtract(query);
console.log("Extraction Result:", JSON.stringify(result, null, 2));
