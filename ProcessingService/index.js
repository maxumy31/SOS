import axios  from "axios"
import calc from "./calculations.js"
import db from "./db.js"
import pino from 'pino';


const logger = pino({
  transport: {
    target: 'pino-pretty',
    options: {
      translateTime: 'HH:MM:ss Z',
      ignore: 'pid,hostname,level',
    }
  }
});
const topicsCollection = "topics"


const errorDelayTime = 5 * 60 * 1000

StartPolling()

async function StartPolling() {
    while (true) {
        logger.info(`Fetching next repo`)
        const resp = await axios.get(`http://localhost:8090/`)
        if (resp.data.error) {
            logger.info(`Got error from request`)
            logger.info(`Will continue work in ${errorDelayTime}ms`)
            setTimeout(StartPolling,errorDelayTime)
            break
        }
        if (!resp.data) {
            logger.error(`Error!`)
            break
        }
        const tranformed = calc.TransformInput(resp.data.repo)
        db.insertBatch(topicsCollection,tranformed)
        logger.info("New topic batch inserted")
        logger.info("Request to update inserted repo")
        const resp2 = await axios.delete(`http://localhost:8090/${resp.data.repo._id}`)
        logger.info("Request to update inserted repo finished")
    }
}
