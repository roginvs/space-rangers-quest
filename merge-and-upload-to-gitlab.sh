#!/bin/bash
set -e
echo "Checking out saturated branch"
git checkout saturated
echo "Merging version1"
git merge --no-edit version1
echo "Uploading"
git push -u gitlab saturated:master
echo "Checkouting version1 branch"
git checkout version1
