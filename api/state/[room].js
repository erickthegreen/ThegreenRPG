"use strict";

const { handleState } = require("../../lib/danubia-api");

module.exports = async function state(req, res) {
  return handleState(req, res);
};
