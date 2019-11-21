const webhookUrl = 'https://echo.openlab.dev'

// Running the code in initialize() will cause this function to be triggered this on every Form Submit
function handleFormSubmit(e: GoogleAppsScript.Events.FormsOnFormSubmit) {}

function hello() {
  Logger.log('Hello, ' + webhookUrl)
}
