const decide = require("./engine");

const actor = {
  role: process.argv[2],
  department: process.argv[3]
};

const action = process.argv[4];

const resource = {
  type: process.argv[5]
};

const context = {
  time: process.argv[6]
};

const result = decide(actor, action, resource, context);

console.log("DECISION:", result.decision);
console.log("REASON:", result.reason);

if (result.policyId) {
  console.log("POLICY USED:", result.policyId);
}

console.log("\nAUDIT TRAIL:");
console.dir(result.audit, { depth: null });
