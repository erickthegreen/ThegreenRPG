"use strict";

const { handleRoom } = require("../../lib/danubia-api");

module.exports = async function room(req, res) {
  return handleRoom(req, res);
};
