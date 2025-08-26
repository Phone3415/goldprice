"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const oop_path_1 = require("oop-path");
const app = (0, express_1.default)();
const PATH = {
    root: new oop_path_1.Path(__dirname).join("../").resolve(),
};
PATH.frontEnd = PATH.root.join("front-end");
app.get("/", (_, res) => {
    res.sendFile(PATH.frontEnd.join("index.html").path);
});
app.listen(8080, () => console.log("http://localhost:8080"));
