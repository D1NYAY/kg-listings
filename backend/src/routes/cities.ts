import { Router } from "express";

const CITIES = [
  "Бишкек",
  "Ош",
  "Каракол",
  "Джалал-Абад",
  "Нарын",
  "Талас",
  "Баткен",
];

export const citiesRouter = Router();

// GET /api/cities
citiesRouter.get("/", (_req, res) => {
  res.json(CITIES);
});
