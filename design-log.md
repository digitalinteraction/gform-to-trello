# Form script design log

This file documents the design / prototyping process of making the magic happen.

## Foreword

I'm using [clasp](https://developers.google.com/apps-script/guides/clasp)
to upload typescript files to google scripts.

I'm running an [echo server](https://openlab.ncl.ac.uk/gitlab/catalyst/echo-server)
which google forms can post values to and I can listen to the server logs.

## 01 - Listening to sheet form events

My first attempt was to listen to the formSubmit event on the sheet associated with the google form.
This got could post the values from the sheet, keyed by their header and could post them to a server.

```ts
function handleFormSubmit(e: GoogleAppsScript.Events.SheetsOnFormSubmit) {
  UrlFetchApp.fetch('https://echo.openlab.dev', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(e.namedValues)
  })
}
```

This worked and I could get the key-valued responses to a field.
There is a nuance that the values are arrays, maybe to support multiple submissions?.

**problems**

I thought I could rename the fields in the sheet to customise how the fields were posted up to the echo server.
However, it turns out that if you rename any field in the google form it overrides the names
and resets them to the name of the question.
Ergo this couldn't be used.

## 02 - Listening to the form directly

WIP

- Get the field id and post key-valued with that
- Helps to have typescript types locally
- can post field type too and more info
- need a way of getting field ids

With this **Code.ts**:

```ts
// Running the code in initialize() will cause this function to be triggered this on every Form Submit
function handleFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit) {
  const responses = e.response.getItemResponses()
  const output: any = {}

  for (let itemResponse of responses) {
    const item = itemResponse.getItem()

    output[item.getId()] = {
      type: item.getType().toString(),
      index: item.getIndex(),
      title: item.getTitle(),
      value: itemResponse.getResponse()
    }
  }

  UrlFetchApp.fetch('https://echo.openlab.dev', {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(output)
  })
}
```

You get posted an **example_body**:

```
{
  '380425739': { index: 10, type: {}, title: 'Industry?', value: [Array] },
  '694048362': {
    index: 9,
    type: {},
    title: 'Third sector domain?',
    value: ['A, B, C']
  },
  '782825089': { index: 1, type: {}, title: 'What is your role?', value: 'Developer' },
  '813013788': {
    index: 3,
    type: {},
    title: 'Which issue are you exploring?',
    value: 'B - 3'
  }
}
```

Which you could create a **mapping.yml** to map field ids to named fields:

```yaml
fields:
  380425739:
    name: matching.industry
  694048362:
    name: matching.thirdSectorDomain
  782825089:
    name: personal.role
```
