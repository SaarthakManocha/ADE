// demos/access-simulator/client.js

const http = require("http");

const payload = JSON.stringify({
  actor: { role: "admin", department: "tech" },
  action: "delete",
  resource: { type: "database" },
  context: { time: "night" }
});

const options = {
  hostname: "localhost",
  port: 3000,
  path: "/decide",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(payload),
    "x-api-key": "super-secret-key-123"
  }
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    const response = JSON.parse(data);

    console.log("\n=== ADE DECISION ===");
    console.log("Decision :", response.decision);
    console.log("Reason   :", response.reason);
    console.log("Policy   :", response.policyId || "N/A");
  });
});

req.on("error", (error) => {
  console.error("Error calling ADE:", error.message);
});

req.write(payload);
req.end();
