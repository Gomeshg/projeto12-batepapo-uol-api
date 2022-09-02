import express, { json } from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
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

	name: joi.string().min(3).max(30).trim().required()
});



server.get("/participants", async (req, res) => {
	try{
		const data = await db.collection("uol").find().toArray();
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
		const data = await db.collection("uol").find({name: user.name}).toArray();
		if(data.length !== 0){
			res.status(400).send("O usuário já existe!");
			return;
		}

	} catch(error){
		res.status(500).send(error.message);
		return;
	}


	try{
		db.collection("uol").insertOne(user);
		res.status(201).send("Usuário inserido com sucesso!");
	} catch(error){
		res.status(500).send(error.message);
	}
});


server.delete("/participants/:id", (req, res) => {
	
	const {id} = req.params;

	try{
		db.collection("uol").deleteOne({_id: new ObjectId(id) });
		res.status(200).send("Usuário deletado com sucesso!");
	} catch(error){
		res.status(500).send(error.message);
	}
});

server.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});
