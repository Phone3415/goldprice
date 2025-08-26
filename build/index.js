"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("./Utils/path"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use("/static", express_1.default.static(path_1.default.static.path));
app.use(express_1.default.json());
app.get("/", (_, res) => {
    res.sendFile(path_1.default.frontEnd.join("index.html").path);
});
app.post("/price", async (req, res) => {
    const { CURRENCY } = req.body;
    const goldResponse = await (0, node_fetch_1.default)("https://api.gold-api.com/price/XAU");
    if (!goldResponse.ok) {
        res.status(500).end();
        return;
    }
    const gold = (await goldResponse.json());
    const goldPrice = gold.price;
    const params = new URLSearchParams({
        app_id: process.env.CURRENCY_APP_ID,
        base: "USD",
    });
    const response = await (0, node_fetch_1.default)(`https://openexchangerates.org/api/latest.json?${params}`);
    if (!response.ok) {
        res.status(500).end();
        return;
    }
    const { rates } = (await response.json());
    res.json({ GOLD_PRICE: (rates[CURRENCY] ?? 1) * goldPrice });
});
app.get("/currencies", async (_, res) => {
    const params = new URLSearchParams({
        app_id: process.env.CURRENCY_APP_ID,
    });
    const response = await (0, node_fetch_1.default)(`https://openexchangerates.org/api/currencies.json?${params}`);
    if (!response.ok) {
        res.status(500).end();
        return;
    }
    res.json(await response.json());
});
app.listen(8080, () => console.log("http://localhost:8080"));
