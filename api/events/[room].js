"use strict";

const { handleEvents } = require("../../lib/danubia-api");

module.exports = async function events(req, res) {
  return handleEvents(req, res);
};
