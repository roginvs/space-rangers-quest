# Онлайн плеер квестов из Космических рейнджеров

[Играть можно тут](https://spacerangers.gitlab.io)

Если не открывается то попробуйте через VPN.

Должно работать во всех современных браузерах

## Происхождение

Основан на описании формата qm `lastqm.txt` и исследовании поведения TGE 4.3.0/5.2.10.

## Сборка

- Установить FFmpeg (нужен для перекодирования ogg-звуков в mp3 при упаковке данных игры)

- Файлы квестов (_.qm, _.qmm) нужно извлечь из игры и положить в `borrowed/qm/SR 2.1.2170/`
  - и/или в `borrowed/qm/SR 2.1.2121 eng/`
  - и/или в `borrowed/qm/Tge 4.2.5/`
  - и/или в `borrowed/qm/anyNameHere/`
- Картинки в `borrowed/qm/img/`
- Звуки и музыку положить в `borrowed/sound/` и в `borrowed/track/` соответственно (даже если ничего нет то всё равно нужно эти директории создать)
- По-умолчанию музыка фоном включается рандомно из папки `borrowed/track/`. Чтобы убрать какой-то трек из рандомной ротации нужно создать файл `borrowed/track/randomignore.txt` где на каждой строчке написать имя файла который рандомно включать не нужно.
- Затем всё собрать (установив предварительно nodejs версии 16):

```
rm -R built-web || true
npm install --legacy-peer-deps
npm run lint
npm run test
mkdir built-web
npm run pack-game-data
npm run build
```

## Известные проблемы

- Автопереходы по пустым переходам/локациям работают только в режиме TGE4

## TODO

- См. `info.md`, `info2.md`

## Квесты пересохранённые

### Источник

- SR1 - из Tge 4.2.5
- SR2 - из SR 2.1.2170
- SR2 eng - из SR 2.1.2121

### Пересохранённые

- Glavred: была исправлена 184-я локация с неправильной формулой (третий текст, "...вам всего лишь {[p47])} cr..." -> "...вам всего лишь {[p47]} cr...").
- Gladiator: был пересохранен потому как там совсем какой-то древний формат
- Prison из TGE переименован в Prison1 чтобы не было коллизии
- Kidnapped сложность поставлена в 100
- Stealth исправление багов
  
## Webpack devserver

`npm start`

## CI и проверки в merge request

- Пайплайн описан в `.gitlab-ci.yml` и состоит из одной job-ы `pages`, которая делает всё:
  prettier-check, тесты, lint, упаковку данных и сборку
- Ветка `master` в GitLab защищена, поэтому пайплайн для push-а в `master` Protected Variables не использует
  и проходит нормально (например успешный пайплайн деплоя в gitlab pages)
- А вот пайплайны для merge request и для push-а в незащищённую ветку GitLab запускает
  **от имени автора MR/push-а**, и к ним применяются настройки аккаунта этого автора. Из-за этого
  у обычных контрибьюторов проверки в MR были все красные:

  ```
  failureReason: "The pipeline failed due to the user not being verified."
  totalJobs: 0
  ```

  Пайплайн «падает» до создания job-ов, потому что для аккаунтов collaborator-уровня на GitLab.com
  пайплайны в незащищённых ветках и в MR требуют
  [верификации личности](https://docs.gitlab.com/ee/user/verification/) (привязка карты/телефона).
  Это не ошибка репозитория — это настройки аккаунтов, поэтому красными были **все** MR начиная с 2024-10-30:
  у каждого `head_pipeline` в MR один и тот же `failureReason`.

  Как исправить (нужны права Maintainer/Owner):

  1. Верифицировать аккаунт (или верифицировать и добавить в проект сервисный аккаунт) — тогда
     пайплайны в MR будут запускаться, и проверки станут настоящими.
  2. Переименовать `pages` в что-то нейтральное (например `build`) — это уже разрешения на уровне проекта,
     которые применимы к любому пайплайну в проекте (как для MR, так и для protected-ветки): job
     с именем `pages` может запускать только пользователь с правами Maintainer/Developer и выше.

  Проверить, почему упал пайплайн (в том числе у конкретного MR) можно через API:

  ```bash
  # pipeline из GitLab UI имеет свой id (в URL), а failureReason виден через GraphQL
  curl -s https://gitlab.com/api/graphql \
    -H 'Content-Type: application/json' \
    -d '{"query":"query{project(fullPath:\"spacerangers/spacerangers.gitlab.io\"){mergeRequests(last:1){nodes{iid title headPipeline{ref status:detailedStatus{label} failureReason}}}}}"}'
  ```

## Testing

This project is tested with BrowserStack
