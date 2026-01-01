require("dotenv").config();

const express = require("express");
const decide = require("./engine");

const app = express();
app.use(express.json());

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

  if (!apiKey || apiKey !== process.env.ADE_API_KEY) {
    return res.status(401).json({
      error: "Unauthorized: invalid or missing API key"
    });
  }

  next();
}

app.post("/decide", authenticate, (req, res) => {
  const errors = validateRequest(req.body);

  if (errors.length > 0) {
    return res.status(400).json({
      error: "Invalid request",
      details: errors
    });
  }

  const { actor, action, resource, context } = req.body;

  try {
    const result = decide(actor, action, resource, context || {});
    res.json(result);
  } catch (err) {
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
