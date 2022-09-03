import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import joi from "joi";
import dayjs from "dayjs";

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

const userSchema = joi.object({
	name: joi.string().min(3).max(30).trim().required()
});

const messageSchema = joi.object({
	from: joi.string().min(3).max(20).trim().required(),
	to: joi.string().min(3).max(15).trim().required(),
	text: joi.string().min(3).max(200).trim().required(),
	type: joi.string().min(3).min(20).trim().required(),
	time: joi.string().min(3).max(10).trim().required()
});


server.get("/participants", async (req, res) => {
	try{
		const data = await db.collection("users").find().toArray();
		res.status(200).send(data);
	} catch(error){
		res.status(500).send(error.message);
	}
});


server.post("/participants", async (req, res) => {

	const user = req.body;
	const validation = userSchema.validate(user, {abortEarly: false});

	if(validation.error){
		res.status(422).send(validation.error.details.map(item => item.message));
		return;
	} 

	try{
		const data = await db.collection("users").find({name: user.name}).toArray();
		if(data.length !== 0){
			res.status(409).send("O usuário já existe!");
			return;
		}

	} catch(error){
		res.status(500).send(error.message);
		return;
	}

	const newUser = {
		name: user.name,
		lastStatus: Date.now()
	};

	const timeNow = dayjs().format("HH:mm:ss");

	const newMessage = {
		from: newUser.name,
		to: "Todos",
		text: "Entra na sala...",
		type: "status",
		time: timeNow
	};

	try{
		db.collection("users").insertOne(newUser);
		db.collection("messages").insertOne(newMessage);
		res.status(201);
	} catch(error){
		res.status(500).send(error.message);
	}
});


server.delete("/participants/:id", (req, res) => {
	
	const {id} = req.params;

	try{
		db.collection("users").deleteOne({_id: new ObjectId(id) });
		res.status(200).send("Usuário deletado com sucesso!");
	} catch(error){
		res.status(500).send(error.message);
	}
});



server.get("/messages", async (req, res) => {

	try{
		const data = await db.collection("messages").find().toArray();
		res.status(200).send(data);
	} catch(error){
		res.status(500).send(error.message);
	}
});

server.post("/messages", async (req, res) => {

	const message = req.body;
	const validation = messageSchema.validate(message, {abortEarly: false});

	if(validation.error){
		res.status(422).send(validation.error.details.map(item => item.message));
		return;
	}

	try{

		db.collection("messages").insertOne(message);
		res.status(200).send("Mensagem inserida com sucesso!");
	} catch(error){
		res.status(500).send(error.message);
	}
});

server.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});