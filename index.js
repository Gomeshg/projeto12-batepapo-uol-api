import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import { stripHtml } from "string-strip-html";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";
import limitData from "./limitData.js";

const server = express();

dotenv.config();
server.use(json());
server.use(cors());

const PORT = process.env.PORT;
const DB_HOST = process.env.MONGO_URI;
const banco = new MongoClient(DB_HOST);
let db;

banco.connect().then(() => {
  db = banco.db("uol");
  console.log("Banco conectado com sucesso!");
});

setInterval(async () => {
  const users = await db.collection("users").find().toArray();
  if (users) {
    const usersOff = users.filter(
      (user) => user.lastStatus + 10000 < Date.now()
    );

    if (usersOff) {
      usersOff.forEach(async (user) => {
        await db.collection("users").deleteOne({ _id: user._id });
        const exitMessage = {
          from: user.name,
          to: "Todos",
          text: "Sai da sala...",
          type: "Status",
          time: dayjs().format("HH:mm:ss"),
        };

        await db.collection("messages").insertOne(exitMessage);
      });
    }
  }
}, 15000);

const userSchema = joi.object({
  name: joi.string().trim().min(1).max(30).required(),
});

const messageSchema = joi.object({
  to: joi.string().trim().min(1).max(15).required(),
  text: joi.string().trim().min(1).max(200).required(),
  type: joi.string().trim().valid("message", "private_message").required(),
});

server.get("/participants", async (req, res) => {
  try {
    const data = await db.collection("users").find().toArray();
    res.status(200).send(data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
server.post("/participants", async (req, res) => {
  const user = req.body;
  user.name = stripHtml(user.name).result;
  const validation = userSchema.validate(user, { abortEarly: false });

  if (validation.error) {
    res.status(422).send(validation.error.details.map((item) => item.message));
    return;
  }

  try {
    const dataUser = await db
      .collection("users")
      .findOne({ name: validation.value.name });
    if (dataUser) {
      res.status(409).send("O usuário já existe!");
      return;
    }
  } catch (error) {
    res.status(500).send(error.message);
    return;
  }

  const newUser = {
    name: validation.value.name,
    lastStatus: Date.now(),
  };

  const newMessage = {
    from: newUser.name,
    to: "Todos",
    text: "Entra na sala...",
    type: "status",
    time: dayjs().format("HH:mm:ss"),
  };

  try {
    await db.collection("users").insertOne(newUser);
    await db.collection("messages").insertOne(newMessage);
    res.sendStatus(201);
  } catch (error) {
    res.status(500).send(error.message);
  }
});
server.delete("/participants/:id", async (req, res) => {
  const { id } = req.params;

  try {
    await db.collection("users").deleteOne({ _id: new ObjectId(id) });
    res.status(200).send("Usuário deletado com sucesso!");
  } catch (error) {
    res.status(500).send(error.message);
  }
});

server.get("/messages", async (req, res) => {
  const userName = req.headers.user;
  const limit = req.query.limit;

  try {
    const data = await db
      .collection("messages")
      .find({
        $or: [
          { from: userName },
          { to: userName },
          { to: "Todos" },
          { type: "message" },
        ],
      })
      .toArray();
    const newData = limitData(limit, data);
    res.status(200).send(newData);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

server.post("/messages", async (req, res) => {
  const userName = req.headers.user;
  const message = req.body;
  message.to = stripHtml(message.to).result;
  message.text = stripHtml(message.text).result;
  message.type = stripHtml(message.type).result;

  const validation = messageSchema.validate(message, { abortEarly: false });

  console.log(message);
  if (validation.error) {
    res.status(422).send(validation.error.details.map((item) => item.message));
    return;
  }
  res.sendStatus(200);
  try {
    const user = await db.collection("users").findOne({ name: userName });

    if (user) {
      const newMessage = {
        from: user.name,
        ...validation.value,
        time: dayjs().format("HH:mm:ss"),
      };

      try {
        await db.collection("messages").insertOne(newMessage);
        res.sendStatus(201);
      } catch (error) {
        res.status(500).send(error.message);
      }
    } else {
      res.status(404).send("Este usuário não existe!");
    }
  } catch (error) {
    res.status(500).send(error.message);
  }
});

server.post("/status", async (req, res) => {
  const userName = req.headers.user;
  const user = await db.collection("users").findOne({ name: userName });

  if (user) {
    await db
      .collection("users")
      .updateOne({ name: user.name }, { $set: { lastStatus: Date.now() } });

    res.sendStatus(200);
  } else {
    res.sendStatus(404);
  }
});

server.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
