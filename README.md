# gform-trello-magic

Coming soon...

## Clasp usage

Clasp is google's CLI for managing script stuff.
[Intro to clasp](https://codelabs.developers.google.com/codelabs/clasp)

```bash
# Clone the project into the currect directory and put code in src
npx clasp clone 1AdTuvKuWvZWKD_ZJ5iCHb_j6I0rm32u4_kyqY800PnuH3pw_X-M1QQnV --rootDir src

# Open the code in the browser
npx clasp open
```

## Container usage

### Environment variables

- `TRELLO_APP_KEY` ~ https://trello.com/app-key
- `TRELLO_TOKEN` ~ Trello auth token generated with `TRELLO_APP_KEY`
- `TRELLO_BOARD_ID` ~ The board to use
- `TRELLO_INBOX_LIST_ID` ~ The list to put form responses into
- `HOOK_SECRET` ~ A secret to authenticate creating cards

### Mounted files

- `/app/res/mapping.yml` ~ A yaml file to map gform field ids to dot.notation paths
  see [types.ts ](src/types.ts)'s MappingConfig.
- `/app/res/content.njk` ~ A nunjucks template to generate the card description

---

> This project was set up by [puggle](https://npm.im/puggle)
