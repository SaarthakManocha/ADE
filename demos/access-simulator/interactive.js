// Interactive CLI demo - accepts dynamic inputs without editing code

const http = require("http");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const API_KEY = "super-secret-key-123";

function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

async function callADE(actor, action, resource, context) {
  const payload = JSON.stringify({ actor, action, resource, context });

  return new Promise((resolve, reject) => {
    const options = {
      hostname: "localhost",
      port: 3000,
      path: "/decide",
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Content-Length": Buffer.byteLength(payload),
        "x-api-key": API_KEY
      }
    };

    const req = http.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error("Invalid response from ADE"));
        }
      });
    });

    req.on("error", (err) => reject(err));
    req.write(payload);
    req.end();
  });
}

function printDecision(result) {
  console.log("\n+----------------------------------------+");
  console.log("|          ADE DECISION RESULT           |");
  console.log("+----------------------------------------+");
  console.log(`  Decision : ${result.decision}`);
  console.log(`  Reason   : ${result.reason || "N/A"}`);
  console.log(`  Policy   : ${result.policyId || "none"}`);
  console.log("+----------------------------------------+");

  if (result.audit?.matchedPolicies?.length > 0) {
    console.log("\nMatched Policies:", result.audit.matchedPolicies.join(", "));
  }
}

async function runSimulation() {
  console.log("\n========================================");
  console.log("  ADE Interactive Access Simulator");
  console.log("========================================");
  console.log("Simulate access requests dynamically.\n");

  while (true) {
    console.log("\n--- New Access Request ---");
    
    const role = await prompt("Actor Role (e.g., admin, intern): ");
    if (role.toLowerCase() === "exit") break;

    const department = await prompt("Department (e.g., tech, hr): ");
    const action = await prompt("Action (e.g., read, write, delete): ");
    const resourceType = await prompt("Resource Type (e.g., database, report): ");
    const time = await prompt("Context Time (day/night): ");

    const actor = { role, department };
    const resource = { type: resourceType };
    const context = { time };

    console.log("\nQuerying ADE...");

    try {
      const result = await callADE(actor, action, resource, context);
      printDecision(result);
    } catch (err) {
      console.error("\nError:", err.message);
      console.log("Make sure ADE server is running (npm start)");
    }

    const again = await prompt("\nTry another? (yes/no): ");
    if (again.toLowerCase() !== "yes" && again.toLowerCase() !== "y") {
      break;
    }
  }

  console.log("\nSession ended.\n");
  rl.close();
}

runSimulation();
