import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

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
});



server.get("/", async (req, res) => {
	
	const data = await db.collection("uol").find().toArray();
	res.send(data);
});

server.post("/", (req, res) => {

	const { nome } = req.body;

	db.collection("uol").insertOne({nome: nome}).then( () => {
		res.status(201).send("Usuário inserido com sucesso!");
	});
});

server.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});
