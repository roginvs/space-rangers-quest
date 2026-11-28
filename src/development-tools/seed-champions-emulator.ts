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
    games: {
      "Пиратская линейка": ["seed-1"],
      "День независимости": ["seed-2"],
      "Охота на Снарка": ["seed-3"],
      Гладиатор: ["seed-4"],
      Хищник: ["seed-5"],
      Эпидемия: ["seed-6"],
    },
    updatedAt: now,
  },
  "seed-uid-grey": {
    name: "Grey",
    gamesWonCount: 5,
    games: {
      Шпион: ["seed-7"],
      "Технологическая революция": ["seed-8"],
      "Последний герой": ["seed-9"],
      Бомба: ["seed-10"],
      "Неуловимый Джон": ["seed-11"],
    },
    updatedAt: now - 1000,
  },
  "seed-uid-kayl": {
    name: "Кейл ган Лаэр",
    gamesWonCount: 5,
    games: {
      "Пиратская линейка": ["seed-12"],
      "День независимости": ["seed-13"],
      Феи: ["seed-14"],
      "Малокские войны": ["seed-15"],
      "Коварные сестры": ["seed-16"],
    },
    updatedAt: now - 2000,
  },
  "seed-uid-renat": {
    name: "Ренат",
    gamesWonCount: 4,
    games: {
      "Охота на Снарка": ["seed-17"],
      Деньги: ["seed-18"],
      Шпион: ["seed-19"],
      Гладиатор: ["seed-20"],
    },
    updatedAt: now - 3000,
  },
  "seed-uid-tiara": {
    name: "Тиара",
    gamesWonCount: 4,
    games: {
      "Пиратская линейка": ["seed-21"],
      Хищник: ["seed-22"],
      Эпидемия: ["seed-23"],
      Бомба: ["seed-24"],
    },
    updatedAt: now - 4000,
  },
  "seed-uid-doc": {
    name: "Док",
    gamesWonCount: 7,
    games: {
      "День независимости": ["seed-25"],
      Феи: ["seed-26"],
      Шпион: ["seed-27"],
      "Последний герой": ["seed-28"],
      Гладиатор: ["seed-29"],
      Деньги: ["seed-30"],
      Бомба: ["seed-31"],
    },
    updatedAt: now - 5000,
  },
  "seed-uid-noname": {
    name: "",
    gamesWonCount: 3,
    games: {
      "Пиратская линейка": ["seed-32"],
      Феи: ["seed-33"],
      Деньги: ["seed-34"],
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
