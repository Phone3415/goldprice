import express, { Request, Response } from "express";
import { Path } from "oop-path";

const app: express.Express = express();

const PATH: Record<string, Path> = {
  root: new Path(__dirname).join("../").resolve(),
};

PATH.frontEnd = PATH.root.join("front-end");

app.get("/", (_, res: Response) => {
  res.sendFile(PATH.frontEnd.join("index.html").path);
});

app.listen(8080, () => console.log("http://localhost:8080"));
