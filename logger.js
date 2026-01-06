// logger.js

function log(event, data) {
  const entry = {
    timestamp: new Date().toISOString(),
    event,
    ...data
  };

  console.log(JSON.stringify(entry));
}

module.exports = { log };
