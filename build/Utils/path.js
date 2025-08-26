"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const oop_path_1 = require("oop-path");
const PATH = {
    root: new oop_path_1.Path(__dirname).join("../../").resolve(),
};
PATH.frontEnd = PATH.root.join("front-end");
PATH.static = PATH.root.join("static");
exports.default = PATH;
