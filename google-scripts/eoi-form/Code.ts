const webhookUrl = 'https://echo.openlab.dev'

// Running the code in initialize() will cause this function to be triggered this on every Form Submit
function handleFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit) {
  if (!e) {
    Logger.log('#handleFormSubmit No event triggered')
    return
  }

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

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(output)
  })
}

function hello() {
  Logger.log('Hello, ' + webhookUrl)
}
