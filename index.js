const express = require("express");
const app = express();
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
const admin = require("firebase-admin");

const cors = require("cors");
require("dotenv").config();

const port = process.env.PORT || 5000;

const serviceAccount = require("./camspice-3c20d-firebase-adminsdk-bl7i8-4676e4c069.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.42wwv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
// const uri = "mongodb+srv://camspice:rGsOsL1gedfosoEb@cluster0.42wwv.mongodb.net/myFirstDatabase?retryWrites=true&w=majority";
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

async function verifyToken(req, res, next) {
  if (req.headers?.authorization?.startsWith("Bearer ")) {
    const token = req.headers.authorization.split(" ")[1];

    try {
      const decodedUser = await admin.auth().verifyIdToken(token);
      req.decodedEmail = decodedUser.email;
    } catch {}
  }
  next();
}

async function run() {
  try {
    await client.connect();

    // database creation if theres none
    const database = client.db("CamSpice");
    // collection or simply a table
    const productCollection = database.collection("products");
    const accessoriesCollection = database.collection("accessories");
    const reviewCollection = database.collection("reviews");
    const orderCollection = database.collection("orders");
    const userCollection = database.collection("users");

    // GET API -  all products
    app.get("/products", async (req, res) => {
      const cursor = productCollection.find({});
      const products = await cursor.toArray();
      console.log("from server", products);
      res.send(products);
    });

    // GET API -  all orders
    app.get("/orders", async (req, res) => {
      const cursor = orderCollection.find({});
      const orders = await cursor.toArray();
      res.send(orders);
    });
    // GET API -  accessories
    app.get("/accessories", async (req, res) => {
      const cursor = accessoriesCollection.find({});
      const accessories = await cursor.toArray();
      res.send(accessories);
    });
    // GET API -  accessories
    app.get("/reviews", async (req, res) => {
      const cursor = reviewCollection.find({});
      const reviews = await cursor.toArray();
      res.send(reviews);
    });

    // GET API - single product
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.json(product);
    });

    // add orders api
    app.post("/orders", async (req, res) => {
      const order = req.body;
      // console.log('my bookings', bookings);
      const result = await orderCollection.insertOne(order);
      res.send(result);
    });

    // put or update  api

    app.put("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: {
          status: "Shipped",
        },
      };
      const result = await orderCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    // POST API -- products(camera) will be added(new)
    app.post("/products", async (req, res) => {
      const products = req.body;
      // insertion of one data
      const result = await productCollection.insertOne(products);
      console.log(result);
      // sending the data
      res.json(result);
    });

    // POST API -- accessories will be added(new)
    app.post("/accessories", async (req, res) => {
      const accessory = req.body;
      // insertion of one data
      const result = await accessoriesCollection.insertOne(accessory);
      console.log(result);
      // sending the data
      res.json(result);
    });
    // POST API -- review will be added(new)
    app.post("/reviews", async (req, res) => {
      const review = req.body;
      // insertion of one data
      const result = await reviewCollection.insertOne(review);
      // console.log(result);
      // sending the data
      res.json(result);
    });

    // DELETE API
    app.delete("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await orderCollection.deleteOne(query);
      res.json(result);
    });

    app.get("/users", async (req, res) => {
      const cursor = userCollection.find({});
      const users = await cursor.toArray();
      res.json(users);
    });

    app.get("/users/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email: email };
      const user = await userCollection.findOne(query);
      let isAdmin = false;
      if (user?.role === "admin") {
        isAdmin = true;
      }
      res.json({ admin: isAdmin });
    });

    app.post("/users", async (req, res) => {
      const user = req.body;
      const result = await userCollection.insertOne(user);
      console.log(user);
      console.log(result);
      res.json(result);
    });

    app.put("/users", async (req, res) => {
      const user = req.body;
      const filter = { email: user.email };
      const options = { upsert: true };
      const updateDoc = {
        $set: user,
      };
      const result = await userCollection.updateOne(filter, updateDoc, options);
      res.json(result);
    });

    app.put("/users/admin", verifyToken, async (req, res) => {
      const user = req.body;

      const requester = req.decodedEmail;

      if (requester) {
        const requesterAccount = await userCollection.findOne({
          email: requester,
        });
        if (requesterAccount.role === "admin") {
          const filter = { email: user.email };
          const updateDoc = {
            $set: { role: "admin" },
          };
          const result = await userCollection.updateOne(filter, updateDoc);
          res.json(result);
        }
      } else {
        res.status(401).json({ message: "You are not authorized" });
      }
    });

    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.json(result);
    });
  } finally {
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`);
});
