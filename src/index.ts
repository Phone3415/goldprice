import express, { Request, Response } from "express";
import Path from "./Utils/path";
import env from "dotenv";
import fetch from "node-fetch";
import { GoldPrice, CurrencyExchange } from "./Utils/types";

env.config();

const app: express.Express = express();
app.use("/static", express.static(Path.static.path));
app.use(express.json());

app.get("/", (_, res: Response) => {
  res.sendFile(Path.frontEnd.join("index.html").path);
});

app.post("/price", async (req: Request, res: Response) => {
  const { CURRENCY } = req.body;

  const goldResponse = await fetch("https://api.gold-api.com/price/XAU");
  if (!goldResponse.ok) {
    res.status(500).end();
    return;
  }

  const gold = (await goldResponse.json()) as GoldPrice;
  const goldPrice = gold.price;

  const params = new URLSearchParams({
    app_id: process.env.CURRENCY_APP_ID!,
    base: "USD",
  });
  const response = await fetch(
    `https://openexchangerates.org/api/latest.json?${params}`
  );
  if (!response.ok) {
    res.status(500).end();
    return;
  }

  const { rates } = (await response.json()) as CurrencyExchange;

  res.json({ GOLD_PRICE: (rates[CURRENCY] ?? 1) * goldPrice });
});

app.get("/currencies", async (_, res: Response) => {
  const params = new URLSearchParams({
    app_id: process.env.CURRENCY_APP_ID!,
  });
  const response = await fetch(
    `https://openexchangerates.org/api/currencies.json?${params}`
  );
  if (!response.ok) {
    res.status(500).end();
    return;
  }

  res.json(await response.json());
});

app.listen(8080, () => console.log("http://localhost:8080"));
