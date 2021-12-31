require('dotenv').config()
express = require("express")
cors = require('cors')
redis = require('redis')
neo4j = require("neo4j-driver")
cors = require('cors')
env = process.env

app = express()
app.use(cors())

async function setupRedis() {
    console.log(env['REDIS_HOSTNAME'])
    console.log(env['REDIS_PORT'])
    client = redis.createClient({
        host: env['REDIS_HOSTNAME'],
        port: env['REDIS_PORT'],
        //password: env['REDIS_PASS']
    });
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    await client.set('tmp', 0)
}
setupRedis()

host = "neo4j://" + env['NEO4J_HOSTNAME'] + ":" + env['NEO4J_PORT']
driver = neo4j.driver(host, neo4j.auth.basic(env['NEO4J_USER'], env['NEO4J_PASS']))
const session = driver.session()

app.get("/incr", async (req, res) => {
    try {
        await client.incr('tmp')
        value = await client.get('tmp');
        console.log(value)
        res.status(200).send(value);
    } catch(err) {
        console.log("greska")
        res.status(500).send({message: err.message});
    }
})

app.get("/shark", (req, res) => {
    console.log("uso")
    session
        .run("match (s:Shark) where s.name = \"Sammy\" return s")
        .then(function(result){
            list = []
            result.records.forEach(function(record){
                list.push(record._fields[0].properties)
            })
            res.send(list)
        }).catch();
})

app.get("/lebron", (req, res) => {
    session
        .run("match (p:PLAYER) where p.name = \"LeBron James\" return p")
        .then(function(result){
            list = []
            result.records.forEach(function(record){
                list.push(record._fields[0].properties)
            })
            res.send(list)
        }).catch();
})

app.listen(3030)