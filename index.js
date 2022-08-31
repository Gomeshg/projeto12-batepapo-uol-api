import express, {json} from "express";
import cors from "cors";
const PORT = 5000;
const server = express();

server.use(json());
server.use(cors());

server.listen(PORT, () => {
	console.log(`Servidor rodando na porta ${PORT}`);
});
