const puppeteer = require("puppeteer")
const cron = require("node-cron")
const Twilio = require("twilio")
const colors = require("colors")
const sound = require("sound-play")
require("dotenv").config()

const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioFromNumber = process.env.TWILIO_FROM_NUMBER

const twilio = new Twilio(accountSid, authToken)

const commandLineArgumentDefinitions = [
  { name: "state", alias: "s", type: String },
]
const commandLineArgs = require("command-line-args")
const options = commandLineArgs(commandLineArgumentDefinitions)
const state = options.state

if (!state) {
  console.error(
    "Error: You must provide a state abbreviation as a command line argument. For example: 'node cvsAppointments.js --state=DC'."
  )
  process.exit(1)
} else {
  console.log("Checking for appointments in ", state)
}

cron.schedule("*/2 * * * *", () => {
  ;(async () => {
    const browser = await puppeteer.launch()
    const page = await browser.newPage()
    await page.goto("https://www.cvs.com/immunizations/covid-19-vaccine")

    // Wait for state link, then click
    await page.waitForSelector(`li div a[data-modal='vaccineinfo-${state}']`)
    await page.click(`li div a[data-modal='vaccineinfo-${state}']`)

    // Wait for modal
    await page.waitForSelector(".modal__inner")

    // Check if appointments are available
    const appointmentsAreAvailable = await page.evaluate((state) => {
      const scheduleAnAppointmentNowLink = document.querySelector(
        `div.modal__box.modal--active#vaccineinfo-${state} div[data-id='vaccine-info-schedule']:not(.hidden) a[data-analytics-name='Schedule an appointment now']`
      )
      return scheduleAnAppointmentNowLink ? true : false
    }, state)

    if (!appointmentsAreAvailable) {
      console.log(
        `${new Date().toLocaleString()}: Looks like there are still no appointments available.`
          .red
      )
    } else {
      console.log(
        `${new Date().toLocaleString()}: Oooh! It looks like there are appointments available!`
          .green
      )
      sound.play("siren.mp3")
      const numbers = process.env.NUMBERS_TO_TEXT.split(" ")

      numbers.forEach((number) => {
        twilio.messages
          .create({
            to: `+${number}`,
            from: twilioFromNumber,
            body:
              "OOOH, LOOKS LIKE THERE ARE VACCINATION APPOINTMENTS AVAILABLE. GO CHECK IT OUT!",
          })
          .then((message) => console.log(message.sid))
      })
    }

    await browser.close()
  })()
})
