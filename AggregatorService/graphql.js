const typeDefs = `
  enum SortOrder {
    ASC
    DESC
  }

  enum DependencySortBy {
    TOTAL_STARS
    COUNT
    NAME
  }

  enum TopicSortBy {
    TOTAL_STARS
    NAME
  }

  type Dependency {
    name: String!
    totalStars: Int!
    count: Int!
  }

  type Topic {
    id: String!
    totalTopicStars: Int!
    dependencies(
      limit: Int
      sortBy: DependencySortBy = TOTAL_STARS
      order: SortOrder = DESC
      minStars: Int
      maxStars: Int
    ): [Dependency!]!
  }

  type Query {
    allTopics(
      limit: Int
      sortBy: TopicSortBy = TOTAL_STARS
      order: SortOrder = DESC
    ): [Topic!]!
    
    topic(
      id: String!
    ): Topic
  }
`;

const createResolvers = (logger) => { return {
 Query: {
    topic: (parent, args, ctx) => {
        const state = ctx.getState()
        const topic = state.find(el => el._id === args.id)
        if (topic) {
            return topic
        } else {
        return null
        }  
      
    },

    allTopics: (parent,args,ctx) => {
        let data = [...ctx.getState()]
        data.sort((a,b) => {
        let cmpResult = 0
        switch (args.sortBy) {
            case 'TOTAL_STARS':
                cmpResult = a.totalStars - b.totalStars
                break;
            default:
                logger.log.error("Unknown topic sorting strategy!!! Using NAME sorting")
            case 'NAME':
                if(a.name && b.name) {
                    cmpResult = -(a.name.localeCompare(b.name,'en'))
                } else {cmpResult = 0}
            break; 
        }
        return args.order === 'ASC' ? cmpResult : -cmpResult;
        })

        if (args.limit && args.limit < data.length) {
            data = data.slice(0, args.limit);
        }
        return data
    },
  },

  Topic: {
    id:(parent) => parent._id,
    totalTopicStars : (parent) => parent.totalTopicStars,
    dependencies: (parent, args) => {
      let deps = parent.dependencies;
      
      if (args.minStars !== undefined) {
        deps = deps.filter(d => d.totalStars >= args.minStars);
      }
      if (args.maxStars !== undefined) {
        deps = deps.filter(d => d.totalStars <= args.maxStars);
      }
      
      deps.sort((a, b) => {
        let cmpResult = 0
        switch (args.sortBy) {
          case 'TOTAL_STARS':
            cmpResult = a.totalStars - b.totalStars
            break;
          case 'COUNT':
            cmpResult = a.count - b.count
            break;
        default:
            logger.log.error("Unknown topic sorting strategy!!! Using NAME sorting")
          case 'NAME':
            if(a.name && b.name) {
                cmpResult = -(a.name.localeCompare(b.name,'en'))
            } else {cmpResult = 0}
            break; 
          
        }
        return args.order === 'ASC' ? cmpResult : -cmpResult;
      });
      
      if (args.limit && args.limit < deps.length) {
        deps = deps.slice(0, args.limit);
      }
      
      return deps;
    }
  }
}};

export default {createResolvers,typeDefs}