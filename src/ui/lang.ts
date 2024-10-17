import { Lang } from "../lib/qmplayer/player";
import { assertNever } from "../assertNever";

const RUS = {
  hi: "Привет, ",
  menu: "Меню",
  quests: "Квесты",
  options: "Опции",
  installMode: "Приложение",
  installModeInstalling: "Загрузка",
  installModeNeedReload: "Готово обновление",
  login: "Войти",
  useown: "Загрузить .qm/.qmm",
  loginWith: "Войти через",
  authConnectedTo: "Привязан к",
  authConnectTo: "Привязать к",
  profile: "Профиль",
  loginInfo:
    "Вход в систему позволяет синхронизировать опции и пройденные квесты на разных устройствах",
  topplayers: "Чемпионы",
  logout: "Выйти",
  waitForFirebase: "Ждем ответа от firebase",

  firebaseSyncing: "Синхронизация с firebase",
  doFirebaseSync: "Выполнить синхронизацию с firebase",
  // showingName: "Имя пользователя",
  // showingNameDesc: "Это имя будет в общем списке",

  minutesShort: "мин.",

  ranger: "Рейнджер",
  fromPlanet: "С планеты",
  fromStar: "С системы",
  toPlanet: "Прилетел на планету",
  toStar: "В системе",
  defaultCompensation: "Награда за квест",
  enableBackButton: "Кнопка назад",
  backButtonDisabled: "Выключена (нормальный режим)",
  backButtonEnabled: "Включена (читерский режим)",
  debugButtonEnabled: "Включен режим отладки",

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
  //startRandomUnpassed: "Выбрать случайный из непройденного",
  allQuestPassed: "Все квесты пройдены!",

  passed: "Пройден",
  startFromTheStart: "Начать сначала",
  startFromLastSave: "Загрузить сохранение",
  noLastSave: "Нет сохранения",
  loading: "Загрузка",
  loadingIndex: "Загрузка индекса",
  loadingLocalDatabase: "Загрузка локальной базы данных",
  reloading: "Перезагрузка",

  loadingQuest: "Загрузка квеста",

  restart: "Начать сначала",
  stepBack: "Шаг назад",
  reallyRestart: "Начать сначала?",
  toggleMusic: "Музыка",
  toggleFullscreen: "На весь экран",
  exit: "Выход",
  yes: "Да",
  no: "Нет",

  back: "Назад",
  backToList: "К списку квестов",

  installEngineNotStarted: "Ожидание регистрации оффлайн режима",
  installingEngine: "Установка оффлайн режима для приложения",
  installingEngineUpdate: "Идет фоновое обновление",
  installEngineError: "Приложение не установлено, оффлайн режим недоступен",
  engineInstalledNeedReload:
    "Приложение установлено, нажмите здесь для перезапуска в оффлайн режиме",
  engineUpdatedNeedReload: "Обновление установлено, нажмите здесь для перезапуска",
  engineInstalledAndInOfflineMode: "Приложение установлено и работает в оффлайн режиме",
  storageIsPersisted: "Хранилище устойчивое, браузер не удалит",
  storageIsNotPersisted:
    "Хранилище неустойчивое, браузер может удалить. " +
    "Можно попробовать добавить приложение на главный экран или добавить в закладки",
  storePersistedIsUnknown: "Статус устойчивости хранилища неизвестен",

  cacheImagesMusicInfo:
    "По-умолчанию для оффлайн режима устанавливаются только код и текстовые квесты, " +
    "это сделано для того, чтобы не занимать много места на устройстве. " +
    "Картинки и музыку можно установить отдельно здесь",

  images: "Картинки",
  musicAndSound: "Музыка и звуки",
  installing: "Установка",
  installed: "Установлено",
  uninstall: "Удалить",
  notInstalled: "Не установлено",
  install: "Установить",
  storageUsed: "Использовано",
  storageUsedFrom: "из",
  storageUsageUnavailable: "Статус использования хранилища недоступен",

  about: "О приложении",
  builtAt: "Сборка",
  linkForBugreports: "Сообщения об ошибках можно оставлять в багтрекере Github-а или на Pikabu",

  validatingInfo: "Прохождения проверяются, это займёт какое-то время",
  validationComplete: "Проверка завершена. Показываются проверенные результаты",
  championsDisabled: "Таблица чемпионов временно не работает из-за лимитов firebase",
  championName: "Имя рейнджера",
  championWonGames: "Пройдено квестов",
  championGameNames: "Список пройденный квестов",
  championNoName: "<Имя не задано>",
  validatingQuest: "Проверяем прохождение",
  questValidationErrorsInfo:
    "Есть ошибки валидации. Это означает что " +
    "квест был пройден на старой браузерозависимой версии движка и нужно пройти этот квест еще раз",
  championsTotal: "Загружено чемпионов:",
  championsLoading: "Загрузка списка чемпионов",

  pwaInstallHeader: "Веб-приложение",
  pwaInstallInfoLink: "Нажми здесь",
  pwaInstallInfoToAddToDesktop: " чтобы закончить установку и создать ярлык на рабочем столе",
  pwaInstallOk: "Установка приложения началась!",
  pwaInstallNotOk: "Не получилось установить",

  editor: "Редактор",

  debug: "Отладка",

  debugCopyState: "Скопировать состояние",
  debugSetState: "Установить состояние",
  debugStepBack: "Шаг назад",
  debugClose: "Закрыть",
};

export type LangTexts = typeof RUS;

const ENG: LangTexts = {
  hi: "Hi, ",
  menu: "Menu",
  quests: "Quests",
  options: "Option",
  installMode: "Application",
  installModeInstalling: "Downloading",
  installModeNeedReload: "Update ready",
  login: "Log in",
  useown: "Upload .qm/.qmm",
  loginWith: "Log in with",
  authConnectedTo: "Connected to",
  authConnectTo: "Connect to",
  profile: "Profile",
  loginInfo:
    "The entry to the systems allows to synchronize options and quests completed between different devices",
  topplayers: "Champions",
  logout: "Log out",
  waitForFirebase: "Waiting for firebase",

  firebaseSyncing: "Synchronizing with firebase",
  doFirebaseSync: "Sync data with firebase",
  // showingName: "Имя пользователя",
  // showingNameDesc: "Это имя будет в общем списке",

  minutesShort: "min.",

  ranger: "Ranger",
  fromPlanet: "From the planet",
  fromStar: "From the system",
  toPlanet: "Arrived at the planet",
  toStar: "In the system",
  defaultCompensation: "Default compensation",
  enableBackButton: "Back button",
  backButtonDisabled: "Disabled (normal mode)",
  backButtonEnabled: "Enabled (cheater mode)",
  debugButtonEnabled: "Debug mode enabled",

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
  //startRandomUnpassed: "Choose a randome quest from those you have not completed",
  allQuestPassed: " All quests are completed!",

  passed: "Complete",
  startFromTheStart: "Start over",
  startFromLastSave: "Start saving",
  noLastSave: "No saving",
  loading: "Loading",
  loadingIndex: "Loading index",
  loadingLocalDatabase: "Loading local database",
  reloading: "Reloading",

  loadingQuest: "Quest loading",

  restart: "Restart",
  stepBack: "Step back",
  reallyRestart: "Really restart?",
  toggleMusic: "Music",
  toggleFullscreen: "Fullscreen",
  exit: "Exit",
  yes: "Yes",
  no: "No",

  back: "Back",
  backToList: "Back to quests",

  installEngineNotStarted: "Waiting for offline mode registration",
  installingEngine: "Offline application mode is being installed",
  installingEngineUpdate: "Background updating is underway",
  installEngineError: "The application is not installed, offline mode is unavailable",
  engineInstalledNeedReload: "The application is installed, click here to reload offline mode",
  engineUpdatedNeedReload: "The update is installed, click here to reload",
  engineInstalledAndInOfflineMode: "The application is installed and working in an offline mode",
  storageIsPersisted: "The storage is persisted, browser won't delete this",
  storageIsNotPersisted:
    "The storage is not persisted, browser may delete this. " +
    "You can try to add the app to the main screen or add to bookmarks",
  storePersistedIsUnknown: "Storage persisted status is unknown",

  cacheImagesMusicInfo:
    "Only code and text quests are installed for offline mode by default. " +
    "This has been done to save space on your device. " +
    "Pics and music can be installed separately here",

  images: "Pictures",
  musicAndSound: "Music and sound",
  installing: "Installing",
  installed: "Installed",
  uninstall: "Uninstall",
  notInstalled: "Not installed",
  install: "Install",
  storageUsed: "Storage is using",
  storageUsedFrom: "from",
  storageUsageUnavailable: "Storage usage is unavailable",

  about: "About",
  builtAt: "Built at",
  linkForBugreports: "You can add a bugreport into Github bug tracker or into Pikabu",

  validatingInfo: "Quest game passing is validating. Please be patient",
  validationComplete: "Validation is complete. Only validated results are shown now",
  championsDisabled: "Championship table is temporarely disabled due to firebase limits",
  championName: "Ranger's name",
  championWonGames: "Amount of passed quests",
  championGameNames: "Список пройденный квестов",
  championNoName: "<Name is not set>",
  validatingQuest: "Checking passing",
  questValidationErrorsInfo:
    "Validation errors are present. This means that " +
    "the quest was passed using old brower-depend engine and it needs to be passed again",
  championsTotal: "Loaded champions:",
  championsLoading: "Loading list of champions",

  pwaInstallHeader: "Web application",
  pwaInstallInfoLink: "Click here",
  pwaInstallInfoToAddToDesktop: " to finish installation and to add to homescreen",
  pwaInstallOk: "Application installation started!",
  pwaInstallNotOk: "Failed to install application",

  editor: "Editor",

  debug: "Debug",

  debugCopyState: "Copy state",
  debugSetState: "Set state",
  debugStepBack: "Step back",
  debugClose: "Close",
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

function isBot() {
  if (!window.indexedDB) {
    return true;
  }
  if (navigator.webdriver) {
    return true;
  }
  if (/bot|google|baidu|bing|msn|teoma|slurp|yandex/i.test(navigator.userAgent)) {
    return true;
  }
  if (
    /spider|crawl|APIs-Google|AdsBot|Googlebot|mediapartners|Google Favicon|FeedFetcher/i.test(
      navigator.userAgent,
    )
  ) {
    return true;
  }
  if (
    /Google-Read-Aloud|DuplexWeb-Google|googleweblight|duckduck|yahoo|ecosia|ia_archiver|facebook/i.test(
      navigator.userAgent,
    )
  ) {
    return true;
  }
  if (
    /instagram|pinterest|reddit|slack|twitter|whatsapp|youtube|semrush/i.test(navigator.userAgent)
  ) {
    return true;
  }
  return false;
}

function guessBrowserLang(): Lang {
  // tslint:disable-next-line:strict-type-predicates
  if (typeof navigator === "undefined") {
    // To run inside tests
    return "rus";
  }

  if (isBot()) {
    // Это чтобы индексировалась русская версия
    return "rus";
  }

  const browserLanguages = navigator.languages || [
    navigator.language || (navigator as any).userLanguage || "ru",
  ];
  console.info(
    `languages=${navigator.languages ? navigator.languages.join(",") : "null"} ` +
      `language=${navigator.language} ` +
      `userLanguage=${(navigator as any).userLanguage} browserLanguages=${browserLanguages.join(
        ",",
      )}`,
  );
  for (const browserLang of browserLanguages) {
    if (browserLang.indexOf("ru") === 0) {
      return "rus";
    }
  }
  if (!window.indexedDB) {
    // Чтобы google русский вариант индексировал
    return "rus";
  }
  return "eng";
}

export const browserDefaultLang = guessBrowserLang();
