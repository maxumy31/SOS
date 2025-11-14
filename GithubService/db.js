import { MongoClient } from 'mongodb';
const uri = 'mongodb://localhost:27017'; // строка подключения

const dbName = "db"
const client = new MongoClient(uri);
const connection = await client.connect()


const createInsertFunction = (dbName) => {
    async function insertData(dbName,collection,data) {
    const db = client.db(dbName)
    const col = db.collection(collection)
    const res = await col.insertOne(data)
    return res
    }

    return (collection,data) => insertData(dbName,collection,data)
};

const createUpdateFunction = (dbName) => {
    async function updatetData(dbName, collection, filter, updateData = {}) {
        const db = client.db(dbName);
        const col = db.collection(collection);
        const res = await col.updateOne(filter, updateData);
        return res;
    }

    return (collection, filter, updateData) => updatetData(dbName, collection, filter, updateData);
};

const createInsertBatchFunction = (dbName) => {
    async function insertBatchData(dbName,collection,data) {
    const db = client.db(dbName)
    const col = db.collection(collection)
    const res = await col.insertMany(data)
    return res
    }

    return (collection,data) => insertBatchData(dbName,collection,data)
};

const createReadFunction = (dbName) => {
    async function readData(dbName, collection, query = {}, options = {}) {
        const db = client.db(dbName);
        const col = db.collection(collection);
        const res = await col.find(query, options).toArray();
        return res;
    }

    return (collection, query = {}, options = {}) => readData(dbName, collection, query = {}, options);
};

const createFindOneFunction = (dbName) => {
    async function findOne(dbName,collection,query) {
        const db = client.db(dbName)
        const col = db.collection(collection)
        const res = await col.findOne(query)
        return res
    }
    return (collection,query) => findOne(dbName,collection,query)
}

const createDropCollectionFunction = (dbName) => {
    async function dropCollection(dbName,collection) {
        const db = client.db(dbName)
        const col = db.collection(collection)
        const res = await col.drop()
    }
    return (collection) => dropCollection(dbName,collection)
}

const insertData = createInsertFunction(dbName);
const readData = createReadFunction(dbName);
const findFirst = createFindOneFunction(dbName)
const dropCollection = createDropCollectionFunction(dbName)
const insertBatch = createInsertBatchFunction(dbName)
const updateData = createUpdateFunction(dbName)

export default {insertData, readData, findFirst, dropCollection, insertBatch, updateData}
