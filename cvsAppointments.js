const puppeteer = require("puppeteer")
const cron = require("node-cron")

const state = "DC"
let available = false

const runCron = async () => {
  console.log("Starting cronjob...")
  cron.schedule("*/2 * * * *", () => {
    console.log(`Checking status of vaccine: ${new Date().toLocaleString()}`)
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
        )
        available = true
      } else {
        console.log(
          `${new Date().toLocaleString()}: Oooh! It looks like there are appointments available!`
        )
        available = true
      }
      await browser.close()
    })()
  })
}

const reportStatus = () => {
  return { available }
}

module.exports = { runCron, reportStatus }
