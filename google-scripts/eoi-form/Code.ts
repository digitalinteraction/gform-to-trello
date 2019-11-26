const webhookUrl = 'https://echo.openlab.dev'

// Running the code in initialize() will cause this function to be triggered this on every Form Submit
function handleFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit) {
  if (!e) {
    Logger.log('#handleFormSubmit No event triggered')
    return
  }

  const token = PropertiesService.getScriptProperties().getProperty(
    'CATALYST_HOOK_TOKEN'
  )

  if (!token) {
    Logger.log('#handleFormSubmit CATALYST_HOOK_TOKEN property is not set')
    return
  }

  const responses = e.response.getItemResponses()
  const response: any = {}

  for (let itemResponse of responses) {
    const item = itemResponse.getItem()

    response[item.getId()] = {
      type: item.getType().toString(),
      index: item.getIndex(),
      title: item.getTitle(),
      value: itemResponse.getResponse()
    }
  }

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify({ token, response })
  })
}

function hello() {
  Logger.log('Hello, ' + webhookUrl)
}
