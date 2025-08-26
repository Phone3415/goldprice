"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("./Utils/path"));
const dotenv_1 = __importDefault(require("dotenv"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const types_1 = require("./Utils/types");
const logs_1 = __importDefault(require("./Utils/logs"));
dotenv_1.default.config();
const app = (0, express_1.default)();
app.use("/static", express_1.default.static(path_1.default.static.path));
app.use(express_1.default.json());
app.get("/", (_, res) => {
    res.sendFile(path_1.default.frontEnd.join("index.html").path);
});
let logs = new logs_1.default();
(async function () {
    await logs.init();
})();
async function getGoldPrice() {
    const goldResponse = await (0, node_fetch_1.default)("https://api.gold-api.com/price/XAU");
    if (!goldResponse.ok) {
        return null;
    }
    const gold = (await goldResponse.json());
    return gold.price;
}
async function exchangeCurrency(amount, currency) {
    if (typeof amount !== "number")
        return null;
    if (amount === 0)
        return 0;
    const params = new URLSearchParams({
        app_id: process.env.CURRENCY_APP_ID,
        base: "USD",
    });
    const fetchURL = `https://openexchangerates.org/api/latest.json?${params}`;
    const response = await (0, node_fetch_1.default)(fetchURL);
    if (!response.ok)
        return null;
    const { rates } = (await response.json());
    return amount * (rates[currency] ?? 1);
}
app.post("/price", async (req, res) => {
    const { CURRENCY } = req.body;
    const goldPrice = await getGoldPrice();
    const currencyGoldPrice = await exchangeCurrency(goldPrice, CURRENCY);
    if (typeof goldPrice !== "number" || typeof currencyGoldPrice !== "number") {
        res.status(500).end();
        return;
    }
    if (logs.closed || !logs.database) {
        logs = new logs_1.default();
        await logs.init();
    }
    await logs.append(goldPrice);
    res.json({ GOLD_PRICE: currencyGoldPrice });
});
app.get("/currencies", async (_, res) => {
    const params = new URLSearchParams({
        app_id: process.env.CURRENCY_APP_ID,
    });
    const fetchURL = `https://openexchangerates.org/api/currencies.json?${params}`;
    const response = await (0, node_fetch_1.default)(fetchURL);
    if (!response.ok) {
        res.status(500).end();
        return;
    }
    res.json(await response.json());
});
let lastClear = Date.now() - types_1.MILLISECONDS_7_DAYS;
app.get("/logs", async (_, res) => {
    if (lastClear <= Date.now() - types_1.MILLISECONDS_7_DAYS) {
        lastClear = Date.now();
        if (logs.closed || !logs.database) {
            logs = new logs_1.default();
            await logs.init();
        }
        await logs.clearOlderThan7Days();
    }
    res.sendFile(path_1.default.frontEnd.join("logs.html").path);
});
app.get("/fetchLogs", async (req, res) => {
    const page = Number(req.query.page);
    if (isNaN(page))
        return res.status(400).end();
    const logsContent = await logs.loads(page);
    res.json({ logs: logsContent });
});
app.listen(8080, () => console.log("http://localhost:8080"));
