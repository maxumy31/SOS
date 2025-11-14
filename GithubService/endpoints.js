import db from "./db.js"
import gh from "./gh.js"
import { ObjectId } from 'mongodb'

const queryCollection = "query"
const visitedCollection = "visited"
const stateCollection = "state"


export async function handleGetKey(maxKey,req,reply) {
    const key = parseInt(req.params.key,10)
        if(isNaN(key)) {
            return {error: "Invalid key format"}
        }
        if (key >= maxKey) {
            return {error : "Max key exceeded"}
        }
        
        const repos = await db.findFirst(queryCollection, {
            $expr: {
                $eq: [
                    { $mod: [{ $dayOfMonth: '$created_at' }, 2] },
                    key
                ]
            }
        });
    
        if (!repos) {
            return {error: "Cannot find repos for key"}
        } else {
            return {repo : repos}
        }
}

export async function markAsProcessed(maxKey,req,reply) {
    const key = parseInt(req.params.key,10)
    const id = req.params.id
    if(isNaN(key)) {
        return {error: "Invalid key format"}
    }
    if (key >= maxKey) {
        return {error : "Max key exceeded"}
    }    
    const objId = new ObjectId(id)
    const res = await db.updateData(queryCollection,{_id:objId},{ $set: { used_in_request: true } })
    console.log("id = ",id)
    console.log("UPDATED!")
    console.log(res)
    if (!res) {
        return {error:"Cannot update value by id"}
    } else {
        return {response:"Value was updated"}
    }
}