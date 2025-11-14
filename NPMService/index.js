import db from "./db.js"
import npm from "./npmRegistryQueries.js"
import Fastify from 'fastify'


const fastify = Fastify({logger:true})
const cacheCollection = "npm_cache"


fastify.get('/:name',async function handler(req,reply) {
    const name = req.params.name
    const found = await db.findFirst(cacheCollection,{name:name})
    if (found) {
        return found
    } else {
        const resp = await npm.RequestRepository(name)
        db.insertData(cacheCollection,resp)
        return resp
    }
})

try {
    await fastify.listen({ port: process.env.PORT})

} catch (err) {
    fastify.log.error(err)
    process.exit(1)
}