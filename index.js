const express = require("express")
const app = express()
const port = 8888
const { runCron, reportStatus } = require("./cvsAppointments")

runCron()

app.get("/cvs-vaccine-status-updater/:stateID", async (request, response) => {
  const state = request.params.stateID
  const content = reportStatus()
  response.set({
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Credentials": true,
    "Access-Control-Allow-Methods": "POST, GET, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "text/json",
  })

  response.send(content)
})

app.listen(port, () => {
  console.log(
    `CVSVaccineStatusUpdater server listening on http://localhost:${port}`
  )
})
