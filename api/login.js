"use strict";

const { handleLogin } = require("../lib/danubia-api");

module.exports = async function login(req, res) {
  return handleLogin(req, res);
};
