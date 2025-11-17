import db from "./db.js"
import Fastify from "fastify";
import { ApolloServer } from '@apollo/server';
import fastifyApollo from '@as-integrations/fastify';
import ql from "./graphql.js"

const fastify = Fastify({
  logger: {
    level: 'info',
    transport: {
      target: 'pino-pretty',
      options: {
        translateTime: 'HH:MM:ss Z',
        ignore: 'pid,hostname,level',
      }
    }
  }
})

const timeoutInMinutes = 15
let state = []

//Нужно подождать актуальные данные, иначе работаем с пустым массивом
await CompleteAggregation()


const server = new ApolloServer({
  typeDefs:ql.typeDefs,
  resolvers:ql.createResolvers(fastify),
});

await server.start()
fastify.register(fastifyApollo(server), {
    context: (req,reply) => ({
    getState: () => state
  })
});

fastify.get('/health', async (req, reply) => {
  return { status: 'ok' };
});

await fastify.listen({port:process.env.SERVICE_PORT, host:"0.0.0.0"})

async function CompleteAggregation() {
    const start = performance.now()
    const res = await db.aggregateResults()
    state = res
    const end = performance.now()
    const benchmark= Math.round(end-start)
    fastify.log.info(`Aggregation query completed.Took ${benchmark}ms. Will retry query in ${timeoutInMinutes} minutes. Got ${res.length} results.`)
    db.saveBenchmark({type:"Topics aggregation",date:new Date(),time:benchmark,data_size : res.length})
    setTimeout(CompleteAggregation,timeoutInMinutes * 60 * 1000)
}
