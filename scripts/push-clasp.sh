#!/usr/bin/env sh

set -e

# Get the directories to run scripts in
DIRS=`ls -d google-scripts/*/`

# Loop through each directory
for DIR in $DIRS
do
  #
  # Ask for confimation for the directory
  #
  read -p "Push $DIR? (yN) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    continue
  fi

  #
  # Temporarily move to the directory and push it
  #
  pushd $DIR > /dev/null
  npx clasp push
  popd > /dev/null
  echo
done
