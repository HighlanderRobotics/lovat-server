import express from "express";
import RouteLoader from "./RouteLoader.js";
const app = express();
const port = process.env.PORT || 3000;
const routes = await RouteLoader('dist/routes/**/*.ts');
app.listen(port, () => console.log('Server is running'));
