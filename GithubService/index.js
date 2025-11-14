import Fastify from 'fastify'
import db from "./db.js"
import gh from "./gh.js"
import gen from "./dateGenerator.js"
import { handleGetKey, markAsProcessed } from './endpoints.js'

const queryCollection = "query"
const visitedCollection = "visited"
const stateCollection = "state"
const fastify = Fastify({logger:true})
const generator = gen.NewDateGenerator(await GetDateState())

const maxKey = 2
fastify.get('/:key',async function handler(req,reply) {
    return handleGetKey(maxKey,req,reply)
})

fastify.delete('/:key/:id',async function handler(req,reply) {
    return markAsProcessed(maxKey,req,reply)
})




function ParseGithubItem(response) {
    return {
        fullname : response.full_name,
        description: response.description,
        created_at : new Date(response.created_at),
        updated_at : new Date(response.updated_at),
        stars : response.stargazers_count,
        language:response.language,
        forks: response.forks_count,
        topics : response.topics,
        used_in_request : false
    }
}

function WriteBatch(batch) {
    const names = batch.map(data => data.fullname).map(fname => {return {name : fname}})
    //console.log(names)
    db.insertBatch(visitedCollection,names)
    const themeBatch = batch.filter(data => data.dependencies && data.dependencies != 0 && 
        data.topics && data.topics.length != 0)
    if (themeBatch.length > 0) {
        db.insertBatch(queryCollection,themeBatch)
    }
}

async function SaveNewDateState(date) {
    console.log(`Updated date. New date : ${date}`)
    await db.updateData(stateCollection, {}, { $set: { date: date } });
}

async function GetDateState() {
    const res =  await db.findFirst(stateCollection,{})
    if(res) {
        console.log(`Loaded date : ${res.date}`)
        return new Date(res.date)
    } else {
        const date = new Date()
        db.insertData(stateCollection,{date : date})
        return date
    }
}

async function FetchAllRepos(date) {
    const formatedDate = gen.TimeToStringQueryFormat(date)
    const per_page = 100
    const starThreshold = 10
    let batch = []
    const first = await gh.FetchRepos(formatedDate,1,per_page,starThreshold)
    const total = first.data.total_count
    const pages = Math.ceil(total / per_page)

    for(const f of first.data.items) {
        const parsed = ParseGithubItem(f)
        batch.push(parsed)
    }
    
    for(let i = 2; i <= pages;i++) {
        const page = await gh.FetchRepos(formatedDate,i,per_page,starThreshold)
        const parsed = ParseGithubItem(page)
        batch.push(parsed)
    }
    //console.log(batch)
    return batch
}

async function ProcessDay() {
    try {
    const day = generator.Next()
        let batch = await FetchAllRepos(day)
        for(let i = 0; i < batch.length;i++) {
            const [org,name] = batch[i].fullname.split("/")
            batch[i].dependencies = await gh.ParseProjectFiles(org,name)
        }
        batch = batch.filter(date => date.dependencies.length > 0)
        if (batch.length > 0) {
            WriteBatch(batch)
        }
        SaveNewDateState(day)
    } catch(error) {
        console.log(`Error : ${error}. Skipping to the next day.`)
        const day = generator.Next()
        SaveNewDateState(day)
    }
    
}

async function StartProcessing() {
    while (true) {
        await ProcessDay()
    }
}


try {
    const fetchInterval = 1000
    await fastify.listen({ port: process.env.PORT})
    StartProcessing()

} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}