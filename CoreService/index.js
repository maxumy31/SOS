import axios  from "axios"
import calc from "./calculations.js"
import db from "./db.js"

const topicsCollection = "topics"


const resp = await axios.get("http://localhost:8090/0")
const tranformed = calc.TransformInput(resp.data.repo)
db.insertBatch(topicsCollection,tranformed)
const resp2 = await axios.delete(`http://localhost:8090/0/${resp.data.repo._id}`)
console.log(resp2.data)

