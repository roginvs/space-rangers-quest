import { Lang } from "../lib/qmplayer/player";
import { assertNever } from "../lib/formula/calculator";

const RUS = {
    hi: 'Привет, ',
    quests: "Квесты",
    options: "Опции",
    offlinemode: "Оффлайн режим",
    login: "Войти",
    useown: "Загрузить .qm/.qmm",
    loginWithGoogle: "Войти через Google",
    logout: "Выйти",
    topplayers: "Чемпионы",
    reallyLogout: "Действительно выйти",
    waitForFirebase: "Ждем ответа от firebase",

    // showingName: "Имя пользователя",
    // showingNameDesc: "Это имя будет в общем списке",

    ranger: "Рейнджер",
    fromPlanet: "С планеты",
    fromStar: "С системы",
    toPlanet: "Прилетел на планету",
    toStar: "В системе",
    lang: "Язык",
    save: "Сохранить",
    saving: "Сохраняю",

    rus: "Русский",
    eng: "Английский",
}

export type LangTexts = typeof RUS;

const ENG: LangTexts = {
    ...RUS,
    hi: 'Hi,'
}



export function getLang(lang: Lang) {
    if (lang === 'rus') {
        return RUS
    } else if (lang === 'eng') {
        return ENG
    } else {
        return assertNever(lang)
    }
}

export function guessBrowserLang(): Lang {    
const browserLanguages = navigator.languages || [    
    navigator.language || (navigator as any).userLanguage || "sv"
  ];
  console.info(
    `languages=${
        navigator.languages ? navigator.languages.join(",") : "null"
    } ` +
        `language=${navigator.language} ` +
        `userLanguage=${
            (navigator as any).userLanguage
        } browserLanguages=${browserLanguages.join(",")}`
  );
  for (const browserLang of browserLanguages) {
    if (browserLang.indexOf('ru') === 0) {
        return 'rus'
    }
  }
  return "eng"
}