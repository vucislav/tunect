express = require("express")
cors = require('cors')
redis = require('redis')
neo4j = require("neo4j-driver")
cors = require('cors')

app = express()
app.use(cors())

async function setupRedis() {
    client = redis.createClient(6379)
    client.on('error', (err) => console.log('Redis Client Error', err));
    await client.connect();
    await client.set('tmp', 0);
}
setupRedis()

driver = neo4j.driver("bolt://localhost:7687", neo4j.auth.basic("evel", "evel123"))
const session = driver.session()

app.get("/incr", async (req, res) => {
    try {
        await client.incr('tmp')
        value = await client.get('tmp');
        console.log(value)
        res.status(200).send(value);
    } catch(err) {
        console.log("radi5")
        res.status(500).send({message: err.message});
    }
})

app.get("/russel", (req, res) => {
    session
        .run("match (p:PLAYER) where p.name = \"Russell Westbrook\" return p")
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