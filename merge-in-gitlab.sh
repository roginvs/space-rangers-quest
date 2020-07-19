#!/bin/bash

if git remote | grep github ; then
  true # do nothing
else
  echo "Adding github as remote"
  git remote add github git@github.com:roginvs/space-rangers-quest.git
fi

git fetch github master:githubmaster
git merge githubmaster --no-commit
git commit --no-edit --author='vasya@rogin.ru'