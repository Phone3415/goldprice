import express, { Request, Response } from "express";
import Path from "./Utils/path";
import env from "dotenv";
import fetch from "node-fetch";
import {
  GoldPrice,
  CurrencyExchange,
  MILLISECONDS_7_DAYS,
} from "./Utils/types";
import Logs from "./Utils/logs";

env.config();

const app: express.Express = express();
app.use("/static", express.static(Path.static.path));
app.use(express.json());

app.get("/", (_, res: Response) => {
  res.sendFile(Path.frontEnd.join("index.html").path);
});

let logs = new Logs();

async function getGoldPrice(): Promise<number | null> {
  const goldResponse = await fetch("https://api.gold-api.com/price/XAU");
  if (!goldResponse.ok) {
    return null;
  }

  const gold = (await goldResponse.json()) as GoldPrice;
  return gold.price;
}

async function exchangeCurrency(
  amount: number | null,
  currency: string
): Promise<number | null> {
  if (typeof amount !== "number") return null;
  if (amount === 0) return 0;

  const params = new URLSearchParams({
    app_id: process.env.CURRENCY_APP_ID!,
    base: "USD",
  });

  const fetchURL = `https://openexchangerates.org/api/latest.json?${params}`;
  const response = await fetch(fetchURL);

  if (!response.ok) return null;

  const { rates } = (await response.json()) as CurrencyExchange;

  return amount * (rates[currency] ?? 1);
}

app.post("/price", async (req: Request, res: Response) => {
  const { CURRENCY } = req.body;

  const goldPrice = await getGoldPrice();
  const currencyGoldPrice = await exchangeCurrency(goldPrice, CURRENCY);

  if (typeof goldPrice !== "number" || typeof currencyGoldPrice !== "number") {
    res.status(500).end();

    return;
  }

  if (logs.closed) logs = new Logs();
  logs.append(goldPrice);

  res.json({ GOLD_PRICE: currencyGoldPrice });
});

app.get("/currencies", async (_, res: Response) => {
  const params = new URLSearchParams({
    app_id: process.env.CURRENCY_APP_ID!,
  });

  const fetchURL = `https://openexchangerates.org/api/currencies.json?${params}`;
  const response = await fetch(fetchURL);

  if (!response.ok) {
    res.status(500).end();
    return;
  }

  res.json(await response.json());
});

let lastClear = Date.now() - MILLISECONDS_7_DAYS;

app.get("/logs", async (_, res: Response) => {
  if (lastClear <= Date.now() - MILLISECONDS_7_DAYS) {
    lastClear = Date.now();
    await logs.clearOlderThan7Days();
  }

  res.sendFile(Path.frontEnd.join("logs.html").path);
});

app.get("/fetchLogs", async (req: Request, res: Response) => {
  const page = Number(req.query.page);
  if (isNaN(page)) return res.status(400).end();

  const logsContent = await logs.loads(page);

  res.json({ logs: logsContent });
});

app.listen(8080, () => console.log("http://localhost:8080"));
