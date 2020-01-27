# gform-to-trello

This repo is a [Node.js](https://nodejs.org/en/) server
which reacts to [Google Form](https://www.google.com/forms/about/) submissions
and uses templates and variables to generate [Trello](https://trello.com/home) cards.

There is also a tool for generating a [Google Apps Script](https://developers.google.com/apps-script/)
to process form responses and send data to the node server.

<!-- toc-head -->

## Table of contents

- [Usage](#usage)
  - [Environment variables](#environment-variables)
  - [Mounted files](#mounted-files)
    - [mapping.yml](#mappingyml)
    - [content.njk](#contentnjk)
- [Development](#development)
  - [Setup](#setup)
  - [Regular use](#regular-use)
  - [Irregular use](#irregular-use)
  - [Testing](#testing)
  - [Commits](#commits)
  - [Code formatting](#code-formatting)
  - [Building the image](#building-the-image)
  - [Google scripts](#google-scripts)
  - [Exploring the Trello api](#exploring-the-trello-api)
  - [Future work](#future-work)

<!-- toc-tail -->

## Usage

Below is info on how to configure and run the docker image.
The image will crash if any values are not set.

```bash
# For example ...
docker run \
  --env-file=.env \
  -v `pwd`/content.njk:/app/res/content.njk \
  -v `pwd`/mapping.yml:/app/res/mapping.yml \
  -p 3000:3000 \
  openlab.ncl.ac.uk:4567/catalyst/gform-trello-magic:$VERSION
```

### Environment variables

- `TRELLO_APP_KEY` ~ https://trello.com/app-key
- `TRELLO_TOKEN` ~ Trello auth token generated with `TRELLO_APP_KEY`
- `TRELLO_BOARD_ID` ~ The board to use
- `TRELLO_INBOX_LIST_ID` ~ The list to put form responses into
- `HOOK_SECRET` ~ A secret to authenticate creating cards

> For help on trello variables, [Setup](#setup) might be useful

### Mounted files

These files need to be mounted into the container when you run it,
without them the image won't know how to process form responses.
The image will crash if they are not set.

#### mapping.yml

This should be mounted at `/app/res/mapping.yml`.
It is responsible for mapping google form ids to human names
and telling the image how to match tags.

When processing, if a value is not found for that key/path it is set to `null`

```yaml
# This sections maps google form ids to human-readable names
fields:
  123456:
    person.name
  123456:
    person.age
  123456:
    person.pets

# This section tells the image how to match tags on form responses
labels:
  person.pets:  # the field to match labels on (works with any text or checkbox)
    prefix: pet # The prefix of the label, e.g. will generate pet:dog and pet:cat
    color: lime # The color to create labels if they don't already exist
```

> For more info see [types.ts](src/types.ts)'s MappingConfig.

To get field ids there is a `#onOpen` event handler in the `google-scripts/eoi-form` script
which if you hook up to a Google form opening it will log all the fields.
You can get this log on the script's page under `View > Logs`.

#### content.njk

This should be mounted at `/app/res/content.njk`.
This file is a [Nunjucks](https://mozilla.github.io/nunjucks/) template
used to generate a card's description.
It has all the fields from [mapping.yml](#mapping.yml) under the `data` object
so you can generate the card description based on any mapped field value.

```md
# {{ data.person.name }}

> AGE: {{ data.person.age }}
```

## Development

Below is information about developing on this repo.

### Setup

To develop on this repo you will need to have [Docker](https://www.docker.com/) and
[node.js](https://nodejs.org) installed on your dev machine and have an understanding of them.
This guide assumes you have the repo checked out and are on macOS.

You will need a [trello account](https://trello.com/home) with access to a board to link with.

You'll only need to follow this setup once for your dev machine.

```bash
# Install node dependencies
npm install

# Start creating your env
cp .env.example .env

# 1. Set your TRELLO_APP_KEY in .env
open https://trello.com/app-key

# 2. Generate and set your TRELLO_TOKEN in .env
npm run cli:dev trello:auth

# 3. Get and set your TRELLO_BOARD_ID in .env
npm run cli:dev trello:boards

# 4. Pick your TRELLO_INBOX_LIST_ID in .env
npm run cli:dev trello:lists
```

### Regular use

These are the commands you'll regularly run to develop the API, in no particular order.

```bash
# Run unit tests
# -> Runs any ".spec.ts" file in the "src" folder
npm run test

# Run the cli directly
# -> runs typescript on-the-go using ts-node
# -> the -- stops npm-run slurping dash-dash parameters
npm run cli:dev -- --help

# Run the server locally
# -> Requests a valid .env ~ it'll let you know
# -> Runs on port 3000 by default
npm run cli:dev server

# Test a content.njk
# -> Uses res/content.njk as the template
# -> Uses res/dummy-content.json as the data to render with
#    Make this to the same shape your mapping.yml will produce
# -> Outputs the generated markdown to the terminal
npm run cli:dev test:content res/dummy-content.json
```

### Irregular use

These are commands you might need to run but probably won't, also in no particular order.

```bash
# Manually compile javascript from typescript
npm run build

# Find linter errors
npm run lint

# Run the production CLI
# -> Needs javascript to be compilled
# -> Doesn't load the local .env
npm run cli:prod

# Generate the table of contents in this readme
npm run generate:toc
```

### Testing

This repo uses [unit tests](https://en.wikipedia.org/wiki/Unit_testing)
to ensure that everything is working correctly, guide development, avoid bad code and reduce defects.
It uses [Jest](https://www.npmjs.com/package/jest) to run unit tests.
Tests are any file in `src/` that end with `.spec.ts`, by convention they are inline with the source code,
in a parallel folder called `__tests__`.

These tests are also run as a CI when you push to git.

```bash
# Run the tests
npm test -s

# Generate test coverage to find gaps
npm run coverage -s
open coverage/lcov-report/index.html
```

### Commits

All commits to this repo must follow [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/).
This ensures changes are structured and means the [CHANGELOG.md](/CHANGELOG.md) can be automatically generated.

This standard is enforced through a `commit-msg` hook using [yorkie](https://www.npmjs.com/package/yorkie).

### Code formatting

This repo uses [Prettier](https://prettier.io/) to automatically format code to a consistent standard.
It works using the [husky](https://www.npmjs.com/package/husky)
and [lint-staged](https://www.npmjs.com/package/lint-staged) packages to
automatically format code whenever code is committed.
This means that code that is pushed to the repo is always formatted to a consistent standard.

You can manually run the formatter with `npm run prettier` if you want.

Prettier is slightly configured in [package.json](/package.json)
and also ignores files using [.prettierignore](/.prettierignore).

### Building the image

This repo uses a [GitLab CI](https://about.gitlab.com/product/continuous-integration/)
to build a Docker image when you push a git tag.
This is designed to be used with the `npm version` command so all docker images are [semantically versioned](https://semver.org/).
The `:latest` docker tag is not used.

This job runs using the [.gitlab-ci.yml](/.gitlab-ci.yml) file which
runs a docker build using the [Dockerfile](/Dockerfile)
and **only** runs when you push a [tag](https://git-scm.com/book/en/v2/Git-Basics-Tagging).

It pushes these docker images to the GitLab registry of the repo.

```bash
# Generate a new release
# -> Generates a new version based on the commits since the last version
# -> Generates the CHANGELOG.md based on those commits
# -> There is a "preversion" script to lint & run tests
npm run release

# Push the new version
# -> The GitLab CI will build a new docker image for it
git push --follow-tags
```

### Google scripts

This repos also uses [clasp](https://github.com/google/clasp)
to sync local `.ts` files with Google App Scripts.
So you can develop scripts locally with typescript types
and push them up to be run on events i.e. onFormSubmit.

> [Intro to clasp](https://codelabs.developers.google.com/codelabs/clasp)

Theres an interactive script that will attempt to `clasp push`
any directory in `google-scripts`

```
./scripts/push-clasp.sh
```

To add a new clasp folder:

```bash
cd google-scripts/new-dir

# Clone the project into the currect directory
npx clasp clone $SCRIPT_ID

# Open the code in the browser
npx clasp open
```

### Exploring the Trello api

Below are some useful scripts for inspecting what Trello's API gives you.
Examples use [httpie](https://httpie.org).

```bash
# Add your environment variables to your dev machine's env so we can use them
source .env

# fetchOrganizations
http https://api.trello.com/1/members/me/organizations key==$TRELLO_APP_KEY token==$TRELLO_TOKEN

# fetchBoards
http https://api.trello.com/1/members/me/boards key==$TRELLO_APP_KEY token==$TRELLO_TOKEN

# fetchLabels
http https://api.trello.com/1/boards/$TRELLO_BOARD_ID/labels key==$TRELLO_APP_KEY token==$TRELLO_TOKEN

# fetchLists
http https://api.trello.com/1/boards/$TRELLO_BOARD_ID/lists key==$TRELLO_APP_KEY token==$TRELLO_TOKEN cards==open
```

### Future work

- Explore better ways of handling clasp deployments
- Look into handling Trello API pagination
- git-ignore the `res` folder for easier testing mapping/content
- Create an npm package with the cli to deploy the scraper and test files
- Improve documentation for setting up of Google Apps Scripts
- Push docker images to dockerhub

---

> The code on https://github.com/unplatform/gform-to-trello is a mirror of https://openlab.ncl.ac.uk/gitlab/catalyst/gform-trello-magic
