//
// Triggered when someone submits the google form
// - Required x and y are set as properties
//
function handleFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit) {
  if (!e) {
    Logger.log('#handleFormSubmit No event triggered')
    return
  }

  const props = PropertiesService.getScriptProperties()

  const token = props.getProperty('CATALYST_HOOK_TOKEN')
  const webhookUrl = props.getProperty('CATALYST_HOOK_URL')

  if (!token) {
    Logger.log('#handleFormSubmit CATALYST_HOOK_TOKEN property is not set')
    return
  }
  if (!webhookUrl) {
    Logger.log('#handleFormSubmit CATALYST_HOOK_URL property is not set')
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
