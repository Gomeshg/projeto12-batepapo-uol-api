import express, { json } from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";

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

const userSchema = joi.object({

	name: joi.string().required()
});



server.get("/users", async (req, res) => {
	try{
		const data = await db.collection("uol").find().toArray();
		res.send(data);
	} catch(error){
		res.status(500).send(error.message);
	}
});

server.post("/users", (req, res) => {

	const user = req.body;

	const validation = userSchema.validate(user, {abortEarly: false});

	if(validation.error){
		res.status(400).send(validation.error.details.map(item => item.message));
	}

	try{
		db.collection("uol").insertOne(user);
		res.status(201).send("Usuário inserido com sucesso!");
	} catch(error){
		res.status(500).send(error.message);
	}
});


server.delete("/users/:id", (req, res) => {
	
	const {id} = req.params;

	try{
		db.collection("uol").deleteOne({_id: new ObjectId(id)});
		res.status(200).send("Usuário deletado com sucesso!");
	} catch(error){
		res.status(500).send(error.message);
	}
});

server.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});
