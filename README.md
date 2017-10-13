# Онлайн плеер квестов из Космически Рейнжеров

[Играть можно тут](https://vasiliy0.gitlab.io)

Должно работать во всех современных браузерах

## Происхождение
Основан на описании формата qm `lastqm.txt` и исследовании поведения TGE 4.3.0.

## Сборка
Файлы квестов (*.qm, *.qmm) нужно извлечь из игры и положить в `borrowed/qm/SR 2.1.2170/` (либо `borrowed/qm/SR 2.1.2121 eng/`, либо `borrowed/qm/Tge 4.2.5/`, либо `borrowed/qm/anyNameHere/`). Музыку и картинки, соответственно в `borrowed/qm/music/` и `borrowed/qm/img/`. Можно так же положить `borrowed/qm/PQI.txt` чтобы картинки отображались корректно (если квесты qmm и взяты с последних версий игры, то необязательно класть PQI.txt потому как имена картинок содержатся в qmm).
Затем всё собрать:
```
rm -R build-web || true
# rm -R node_modules
# npm install
chmod a+x node_modules/.bin/*
npm run tsc  
npm run test
mkdir build-web
node build-node/packGameData.js
npm run build
```
## TODO
 - См. `info.md` 

## Квесты пересохранённые
- Glavred: была исправлена 184-я локация с неправильной формулой (третий текст, "...вам всего лишь {[p47])} cr..." -> "...вам всего лишь {[p47]} cr..."). 
- Gladiator: был пересохранен потому как там совсем какой-то древний формат

## Webpack devserver
`npm start`
