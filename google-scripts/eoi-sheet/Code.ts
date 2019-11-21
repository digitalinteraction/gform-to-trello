const webhookUrl = 'https://echo.openlab.dev'

function handleFormSubmit(e: GoogleAppsScript.Events.SheetsOnFormSubmit) {
  if (!e) {
    Logger.log('#handleFormSubmit No event triggered')
    return
  }

  UrlFetchApp.fetch(webhookUrl, {
    method: 'post',
    contentType: 'application/json',
    payload: JSON.stringify(e.namedValues)
  })
}
