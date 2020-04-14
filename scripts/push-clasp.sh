#!/usr/bin/env bash

set -e

echo -n "Script ID: "
read SCRIPT_ID

if [ -z "$SCRIPT_ID" ]
then
  echo "SCRIPT_ID is required"
  exit 1
fi



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
  echo '{"scriptId":"'$SCRIPT_ID'"}' > .clasp.json
  npx clasp push
  popd > /dev/null
  echo
done

echo "Make sure to set 'CATALYST_HOOK_TOKEN' and 'CATALYST_HOOK_URL' on your project and setup triggers"
echo "e.g. cd google-scripts/eoi-form; npx clasp open"
