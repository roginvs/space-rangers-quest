import { Lang } from "../lib/qmplayer/player";
import { assertNever } from "../lib/formula/calculator";

const RUS = {
    hi: 'Привет, ',
    quests: "Квесты",
    options: "Опции",
    installMode: "Установить",
    login: "Войти",
    useown: "Загрузить .qm/.qmm",
    loginWithGoogle: "Войти через Google",    
    profile: "Профиль",
    loginInfo: "Вход в систему позволяет синхронизировать опции и пройденные квесты на разных устройствах",
    topplayers: "Чемпионы",
    logout: "Действительно выйти",
    waitForFirebase: "Ждем ответа от firebase",

    firebaseSyncing: "Синхронизация с firebase",
    // showingName: "Имя пользователя",
    // showingNameDesc: "Это имя будет в общем списке",

    minutesShort: "мин.",

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

    welcomeHeader: "Добро пожаловать в онлайн плеер квестов!",
    all: "Все",
    own: "Загруженные",
    search: "Поиск",
    nothingFound: "Ничего не найдено",
    startRandomUnpassed: "Выбрать случайный из непройденного",
    passed: "Пройден",
    startFromTheStart: "Начать сначала",
    startFromLastSave: "Загрузить сохранение",
    noLastSave: "Нет сохранения",
    loading: "Загрузка",
    loadingQuest: "Загрузка квеста",

    reallyRestart: "Начать сначала?",
    yes: "Да",
    no: "Нет",

    back: "Назад",

    installingEngine: "Установка оффлайн режима для приложения",
    installEngineError: "Ошибка установки",
    engineInstalledNeedReload: "Приложение установлено, необходимо обновить страницу",
    engineInstalledAndInOfflineMode: "Приложение установлено и работает в оффлайн режиме",
    storePersisted: "Хранилище устойчивое, браузер не удалит",
    storeNotPersisted: "Хранилище неустойчивое, браузер может удалить. Можно попробовать добавить приложение на главный экран или добавить в закладки",

    images: "Картинки",
    music: "Музыка",
    installing: "Установка",
    installed: "Установлено",
    uninstall: "Удалить",
    notInstalled: "Не установлено",
    install: "Установить",
    storageUsed: "Использовано",
    storageUsedFrom: "из",

    about: "О приложении",
    buildAt: "Сборка",
}

export type LangTexts = typeof RUS;

const ENG: LangTexts = {
    ...RUS,
    hi: 'Hi, '
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