/**
 * Seed a few thin champion rows into the local RTDB emulator so the
 * champions tab can be screenshotted without signing in.
 *
 * Usage (emulator must already be running):
 *   FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000 \
 *     npx ts-node src/development-tools/seed-champions-emulator.ts
 */
const PROJECT_ID = "test-project-5f054";
const host = process.env.FIREBASE_DATABASE_EMULATOR_HOST || "127.0.0.1:9000";
const now = Date.now();

const rows: { [uid: string]: object } = {
  "seed-uid-andromeda": {
    name: "Андромеда",
    gamesWonCount: 6,
    gameNames: {
      "Пиратская линейка": true,
      "День независимости": true,
      "Охота на Снарка": true,
      Гладиатор: true,
      Хищник: true,
      Эпидемия: true,
    },
    updatedAt: now,
  },
  "seed-uid-grey": {
    name: "Grey",
    gamesWonCount: 5,
    gameNames: {
      Шпион: true,
      "Технологическая революция": true,
      "Последний герой": true,
      Бомба: true,
      "Неуловимый Джон": true,
    },
    updatedAt: now - 1000,
  },
  "seed-uid-kayl": {
    name: "Кейл ган Лаэр",
    gamesWonCount: 5,
    gameNames: {
      "Пиратская линейка": true,
      "День независимости": true,
      Феи: true,
      "Малокские войны": true,
      "Коварные сестры": true,
    },
    updatedAt: now - 2000,
  },
  "seed-uid-renat": {
    name: "Ренат",
    gamesWonCount: 4,
    gameNames: {
      "Охота на Снарка": true,
      Деньги: true,
      Шпион: true,
      Гладиатор: true,
    },
    updatedAt: now - 3000,
  },
  "seed-uid-tiara": {
    name: "Тиара",
    gamesWonCount: 4,
    gameNames: {
      "Пиратская линейка": true,
      Хищник: true,
      Эпидемия: true,
      Бомба: true,
    },
    updatedAt: now - 4000,
  },
  "seed-uid-doc": {
    name: "Док",
    gamesWonCount: 7,
    gameNames: {
      "День независимости": true,
      Феи: true,
      Шпион: true,
      "Последний герой": true,
      Гладиатор: true,
      Деньги: true,
      Бомба: true,
    },
    updatedAt: now - 5000,
  },
  "seed-uid-noname": {
    name: "",
    gamesWonCount: 3,
    gameNames: {
      "Пиратская линейка": true,
      Феи: true,
      Деньги: true,
    },
    updatedAt: now - 6000,
  },
};

(async () => {
  const res = await fetch(`http://${host}/champions.json?ns=${PROJECT_ID}`, {
    method: "PUT",
    headers: { Authorization: "Bearer owner", "Content-Type": "application/json" },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    throw new Error(`Seed failed: ${res.status} ${await res.text()}`);
  }
  console.info(`Seeded ${Object.keys(rows).length} champions into the emulator`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
