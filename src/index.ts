import express from "express";
import { getExample } from "./handlers/manager/example";
import 'dotenv/config';

const app = express();

const port = process.env.PORT || 3000;

app.get('/manager/example', getExample);

app.listen(port);

