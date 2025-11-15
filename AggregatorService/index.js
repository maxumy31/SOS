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

await fastify.listen({port:8099})

CompleteAggregation()
async function CompleteAggregation() {
    const start = performance.now()
    const res = await db.aggregateResults()
    state = res
    const end = performance.now()
    const benchmark= Math.round(end-start)
    fastify.log.info(`Aggregation query completed.Took ${benchmark}ms. Will retry query in ${timeoutInMinutes} minutes.`)
    db.saveBenchmark({type:"Topics aggregation",date:new Date(),time:benchmark})
    setTimeout(CompleteAggregation,timeoutInMinutes * 60 * 1000)
}
