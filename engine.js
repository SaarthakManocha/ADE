const fs = require("fs");

function loadPolicies() {
  const data = fs.readFileSync("policies.json", "utf-8");
  return JSON.parse(data).policies;
}

function getValue(path, data) {
  return path.split(".").reduce((obj, key) => obj?.[key], data);
}

function matches(policy, input) {
  const checks = [];

  for (const key in policy.conditions) {
    const expected = policy.conditions[key];
    const actual = getValue(key, input);

    checks.push({
      field: key,
      expected,
      actual,
      passed: actual === expected
    });

    if (actual !== expected) {
      return { matched: false, checks };
    }
  }

  return { matched: true, checks };
}

function decide(actor, action, resource, context) {
  const policies = loadPolicies();
  const input = { actor, action, resource, context };

  const evaluations = [];
  const matchedPolicies = [];

  for (const policy of policies) {
    const result = matches(policy, input);

    evaluations.push({
      policyId: policy.id,
      checks: result.checks
    });

    if (result.matched) {
      matchedPolicies.push(policy);
    }
  }

  if (matchedPolicies.length === 0) {
    return {
      decision: "BLOCK",
      reason: "No matching policy found",
      audit: { evaluations }
    };
  }

  matchedPolicies.sort((a, b) => b.priority - a.priority);
  const winner = matchedPolicies[0];

  return {
    decision: winner.effect,
    reason: winner.reason,
    policyId: winner.id,
    audit: {
      evaluations,
      matchedPolicies: matchedPolicies.map(p => p.id),
      winningPolicy: winner.id
    }
  };
}

module.exports = decide;
