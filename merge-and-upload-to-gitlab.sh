#!/bin/bash
set -e
echo "Checking out saturated2 branch"
git checkout saturated2
echo "Merging master"
git merge --no-edit master
echo "Uploading"
git push -u gitlab2 saturated2:master
echo "Checkouting master branch"
git checkout master
echo "Copying borrowed files"
cp -R ../space-rangers-borrowed/* borrowed/
