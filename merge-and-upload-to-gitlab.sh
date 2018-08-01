#!/bin/bash
set -e
echo "Checking out saturated branch"
git checkout saturated
echo "Merging master"
git merge --no-edit master
echo "Uploading"
git push -u gitlab saturated:master
echo "Checkouting master branch"
git checkout master
echo "Copying borrowed files"
cp -R ../space-rangers-borrowed/* borrowed/
