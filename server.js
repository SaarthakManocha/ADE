const { log } = require("./logger");
const { recordDecision, recordError, getMetrics, getHealth } = require("./metrics");
const fs = require("fs");
require("dotenv").config();

const express = require("express");
const { decide, loadPolicyFile } = require("./engine");

const app = express();
app.use(express.json());

// Load client registry
function loadClients() {
  try {
    const data = fs.readFileSync("clients.json", "utf-8");
    return JSON.parse(data).clients;
  } catch {
    return [];
  }
}

function validateRequest(body) {
  const errors = [];

  if (!body.actor || typeof body.actor.role !== "string") {
    errors.push("actor.role is required and must be a string");
  }

  if (typeof body.action !== "string") {
    errors.push("action is required and must be a string");
  }

  if (!body.resource || typeof body.resource.type !== "string") {
    errors.push("resource.type is required and must be a string");
  }

  return errors;
}

function authenticate(req, res, next) {
  const apiKey = req.headers["x-api-key"];

  if (!apiKey) {
    return res.status(401).json({
      error: "Unauthorized: missing API key"
    });
  }

  const clients = loadClients();
  const client = clients.find(c => c.apiKey === apiKey && c.enabled);

  if (!client) {
    return res.status(401).json({
      error: "Unauthorized: invalid API key"
    });
  }

  req.caller = {
    id: client.id,
    name: client.name
  };

  next();
}

// Health check - no auth required
app.get("/health", (req, res) => {
  res.json(getHealth());
});

// Metrics - requires auth
app.get("/metrics", authenticate, (req, res) => {
  res.json(getMetrics());
});

// Policies - view all policies with metadata
app.get("/policies", authenticate, (req, res) => {
  try {
    const policyFile = loadPolicyFile();
    res.json({
      version: policyFile.version,
      lastModified: policyFile.lastModified,
      author: policyFile.author,
      count: policyFile.policies.length,
      policies: policyFile.policies.map(p => ({
        id: p.id,
        version: p.version,
        author: p.author,
        createdAt: p.createdAt,
        priority: p.priority,
        effect: p.effect,
        reason: p.reason
      }))
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to load policies" });
  }
});

// Main decision endpoint
app.post("/decide", authenticate, (req, res) => {
  const errors = validateRequest(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid request",
      details: errors
    });
  }

  const { actor, action, resource, context } = req.body;
  const startTime = Date.now();

  try {
    const result = decide(actor, action, resource, context || {});
    const latency = Date.now() - startTime;

    recordDecision(result.decision, latency);

    log("decision_made", {
      caller: req.caller.id,
      callerName: req.caller.name,
      actor: actor.role,
      action,
      resource: resource.type,
      decision: result.decision,
      policy: result.policyId || null,
      latency_ms: latency
    });

    res.json(result);
  } catch (err) {
    recordError();
    console.error("Decision engine error:", err);

    res.status(500).json({
      error: "Internal decision error"
    });
  }
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`ADE server running on port ${PORT}`);
});
