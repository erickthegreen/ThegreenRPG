"use strict";

const crypto = require("node:crypto");

const credentials = [
  {
    username: "erickthemaster",
    name: "Erick, o Mestre",
    role: "gm",
    slot: 0,
    salt: "1e838a06a1fdb266ad72134bd28a50d2",
    hash: "55437fc8c696a2e605c88227689b122bdff2b061614ffcb0661b004799fef537",
  },
  {
    username: "jogador1",
    name: "Jogador 1",
    role: "player",
    slot: 1,
    salt: "9568d918aff5e08147fd2be9f74f3659",
    hash: "4cf8f44908b882064fd3380e86430c1545991276bccb05ddfb2477b0c7cc094e",
  },
  {
    username: "jogador2",
    name: "Jogador 2",
    role: "player",
    slot: 2,
    salt: "d3854a06fe1d2945b7bb306658f35441",
    hash: "a6b9c0f51ba61f43a447aa224a2afbcba29bb95c8d1aa650b0e0147b6e8aa17b",
  },
  {
    username: "jogador3",
    name: "Jogador 3",
    role: "player",
    slot: 3,
    salt: "0749dafdcb8b89890f1be7bab4fdfd10",
    hash: "e5d5ac49d4f7916c840fcfadfd0b52f6f55c817e720ddc88a5111c9f76243296",
  },
  {
    username: "jogador4",
    name: "Jogador 4",
    role: "player",
    slot: 4,
    salt: "bb28c9e26707c98c7cbf578cf77d3005",
    hash: "4660624d955ea753a6875204be70da92f4bfa075da2c7f6c39c242e370fad17c",
  },
  {
    username: "jogador5",
    name: "Jogador 5",
    role: "player",
    slot: 5,
    salt: "7ed49c76613bb60a5d6ecd33e580d71a",
    hash: "f487ab911630740649a5e593a7d42306404e8495e6f2df759dff724037fb23cb",
  },
];

function authenticate(username, password) {
  const cleanUser = String(username || "").trim().toLowerCase();
  const record = credentials.find((item) => item.username === cleanUser);
  if (!record || !password) return null;
  const hash = crypto.scryptSync(String(password), record.salt, 32).toString("hex");
  const expected = Buffer.from(record.hash, "hex");
  const actual = Buffer.from(hash, "hex");
  if (expected.length !== actual.length || !crypto.timingSafeEqual(expected, actual)) return null;
  return {
    username: record.username,
    name: record.name,
    role: record.role,
    slot: record.slot,
  };
}

module.exports = {
  authenticate,
};
