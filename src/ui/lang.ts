import { Lang } from "../lib/qmplayer/player";
import { assertNever } from "../lib/formula/calculator";

const RUS = {
    hi: "Привет, ",
    quests: "Квесты",
    options: "Опции",
    installMode: "Установить",
    installModeInstalling: "Загрузка",
    installModeNeedReload: "Готово обновление",
    login: "Войти",
    useown: "Загрузить .qm/.qmm",
    loginWithGoogle: "Войти через Google",
    profile: "Профиль",
    loginInfo:
        "Вход в систему позволяет синхронизировать опции и пройденные квесты на разных устройствах",
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

    lang: "Язык/Language",
    rus: "Русский",
    eng: "English",
    
    save: "Сохранить",
    saving: "Сохраняю",

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
    loadingIndex: "Загрузка индекса",
    loadingLocalDatabase: "Загрузка локальной базы данных",
    reloading: "Перезагрузка",

    loadingQuest: "Загрузка квеста",

    reallyRestart: "Начать сначала?",
    yes: "Да",
    no: "Нет",

    back: "Назад",

    installingEngine: "Установка оффлайн режима для приложения",
    installingEngineUpdate: "Идет фоновое обновление",
    installEngineError: "Приложение не установлено, оффлайн режим недоступен",
    engineInstalledNeedReload:
        "Приложение установлено, нажмите здесь для перезапуска в оффлайн режиме",
    engineUpdatedNeedReload:
        "Обновление установлено, нажмите здесь для перезапуска",
    engineInstalledAndInOfflineMode:
        "Приложение установлено и работает в оффлайн режиме",
    storePersisted: "Хранилище устойчивое, браузер не удалит",
    storeNotPersisted:
        "Хранилище неустойчивое, браузер может удалить. " +
        "Можно попробовать добавить приложение на главный экран или добавить в закладки",

    cacheImagesMusicInfo:
        "По-умолчанию для оффлайн режима устанавливаются только код и текстовые квесты, " +
        "это сделано для того, чтобы не занимать много места на устройстве. " +
        "Картинки и музыку можно установить отдельно здесь",

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
    builtAt: "Сборка",
    linkForBugreports: "Сообщения об ошибках можно оставлять в багтрекере Github-а или на Pikabu",
};

export type LangTexts = typeof RUS;

const ENG: LangTexts = {    
    hi: "Hi, ",
    quests: "Quests",
    options: "Option",
    installMode: "Install",
    installModeInstalling: "Downloading",
    installModeNeedReload: "Update ready",
    login: "Log in",
    useown: "Upload .qm/.qmm",
    loginWithGoogle: "Log in with Google",
    profile: "Profile",
    loginInfo:
        "The entry to the systems allows to synchronize options and quests completed between different devices",
    topplayers: "Champions",
    logout: "Are you sure you want to log out?",
    waitForFirebase: "Waiting for firebase",

    firebaseSyncing: "Synchronizing with firebase",
    // showingName: "Имя пользователя",
    // showingNameDesc: "Это имя будет в общем списке",

    minutesShort: "min.",

    ranger: "Ranger",
    fromPlanet: "From the planet",
    fromStar: "From the system",
    toPlanet: "Arrived at the planet",
    toStar: "In the system",

    lang: "Язык/Language",
    rus: "Русский",
    eng: "English",

    save: "Save",
    saving: "Saving",

    welcomeHeader: "Welcome to the online quest player!",
    all: "All",
    own: "Uploaded",
    search: "Search",
    nothingFound: "Nothing is found",
    startRandomUnpassed: "Choose a randome quest from those you have not completed",
    passed: "Complete",
    startFromTheStart: "Start over",
    startFromLastSave: "Start saving",
    noLastSave: "No saving",
    loading: "Loading",
    loadingIndex: "Loading index",
    loadingLocalDatabase: "Loading local database",
    reloading: "Reloading",

    loadingQuest: "Quest loading",

    reallyRestart: "Really restart?",
    yes: "Yes",
    no: "No",

    back: "Back",

    installingEngine: "Offline application mode is being installed",
    installingEngineUpdate: "Background updating is underway",
    installEngineError: "The application is not installed, offline mode is unavailable",
    engineInstalledNeedReload:
        "The application is installed, click here to reload offline mode",
    engineUpdatedNeedReload:
        "The update is installed, click here to reload",
    engineInstalledAndInOfflineMode:
        "The application is installed and working in an offline mode",
    storePersisted: "The storage is persisted, browser won't delete this",
    storeNotPersisted:
        "The storage is not persisted, browser may delete this. " +
        "You can try to add the app to the main screen or add to bookmarks",

    cacheImagesMusicInfo:
        "Only code and text quests are installed for offline mode by default. " +
        "This has been done to save space on your device. " +
        "Pics and music can be installed separately here",

    images: "Pictures",
    music: "Music",
    installing: "Installing",
    installed: "Installed",
    uninstall: "Uninstall",
    notInstalled: "Not installed",
    install: "Install",
    storageUsed: "Storage is using",
    storageUsedFrom: "from",

    about: "About",
    builtAt: "Built at",
    linkForBugreports: "You can add a bugreport into Github bug tracker or into Pikabu",
};

export function getLang(lang: Lang) {
    if (lang === "rus") {
        return RUS;
    } else if (lang === "eng") {
        return ENG;
    } else {
        return assertNever(lang);
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
        if (browserLang.indexOf("ru") === 0) {
            return "rus";
        }
    }
    if (navigator.userAgent.indexOf('Googlebot') > -1) { // Чтобы google русский вариант индексировал
        return "rus"
    }
    return "eng";
}
