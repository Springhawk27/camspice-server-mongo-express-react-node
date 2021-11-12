const express = require('express')
const app = express()
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;

const cors = require('cors');
require('dotenv').config()

const port = process.env.PORT || 5000

app.use(cors());
app.use(express.json());

// const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.42wwv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.42wwv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {

        await client.connect();
        // console.log('connected to database');

        // database creation if theres none
        const database = client.db('CamSpice');
        // collection or simply a table
        const productCollection = database.collection('products');
        const accessoriesCollection = database.collection('accessories');
        // const bookingSpotCollection = database.collection('bookings');


        // GET API -  all products
        app.get('/products', async (req, res) => {
            const cursor = productCollection.find({});
            const products = await cursor.toArray();
            res.send(products);
        });

        // GET API -  all bookings
        app.get('/bookings', async (req, res) => {
            const cursor = bookingSpotCollection.find({});
            const bookings = await cursor.toArray();
            res.send(bookings);
        });
        // GET API -  accessories
        app.get('/accessories', async (req, res) => {
            const cursor = accessoriesCollection.find({});
            const accessories = await cursor.toArray();
            res.send(accessories);
        });



        // GET API - single spot
        app.get('/picnicSpots/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const picnicSpot = await picnicSpotCollection.findOne(query);
            res.json(picnicSpot)
        })

        // add bookings api
        app.post('/bookings', async (req, res) => {
            const booking = req.body;
            // console.log('my bookings', bookings);
            const result = await bookingSpotCollection.insertOne(booking);
            res.send(result);
        })


        // put or update  api

        app.put('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) }
            const options = { upsert: true }
            const updateDoc = {
                $set: {
                    status: "Approved"
                },
            };
            const result = await bookingSpotCollection.updateOne(filter, updateDoc, options)
            // console.log('updating user', id);
            // console.log('updating user req', req);
            // res.send('updating not dating');
            res.json(result);
        })



        // POST API -- products(camera) will be added(new)
        app.post('/products', async (req, res) => {

            const products = req.body;
            // insertion of one data
            const result = await productCollection.insertOne(products);
            console.log(result);
            // sending the data
            res.json(result)

        });


        // POST API -- accessories will be added(new)
        app.post('/accessories', async (req, res) => {

            const accessory = req.body;
            // insertion of one data
            const result = await accessoriesCollection.insertOne(accessory);
            console.log(result);
            // sending the data
            res.json(result)

        });

        // DELETE API
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await bookingSpotCollection.deleteOne(query);
            res.json(result);

        })
        app.delete('/picnicSpots/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await picnicSpotCollection.deleteOne(query);
            res.json(result);

        })
    }
    finally {
        // await client.close();
    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`)
})