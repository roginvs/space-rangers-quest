import { Lang } from "../lib/qmplayer/player";
import { assertNever } from "../lib/formula/calculator";

const RUS = {
    hi: 'Привет,',
    quests: "Квесты",
    options: "Опции",
    offlinemode: "Оффлайн режим",
    login: "Войти",
    logout: "Выйти",

}

const ENG: typeof RUS = {
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