import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Root
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Retail Web API is up!' });
});

// Отримати всі магазини
app.get('/stores', async (_req, res) => {
  try {
    const stores = await prisma.store.findMany({
      include: { employees: true, products: true, sales: true }
    });
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

// Створити магазин
app.post('/stores', async (req, res) => {
  try {
    const { name, location } = req.body;
    const store = await prisma.store.create({ data: { name, location } });
    res.status(201).json(store);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create store' });
  }
});

// Створити працівника
app.post('/employees', async (req, res) => {
  try {
    const { name, role, storeId } = req.body;
    const employee = await prisma.employee.create({ data: { name, role, storeId } });
    res.status(201).json(employee);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create employee' });
  }
});

// Створити товар
app.post('/products', async (req, res) => {
  try {
    const { name, price, stock, storeId } = req.body;
    const product = await prisma.product.create({ data: { name, price, stock, storeId } });
    res.status(201).json(product);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Створити продаж
app.post('/sales', async (req, res) => {
  try {
    const { productId, storeId, quantity, total } = req.body;
    const sale = await prisma.sale.create({ data: { productId, storeId, quantity, total } });
    res.status(201).json(sale);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create sale' });
  }
});

app.listen(PORT, () => console.log(`API listening on ${PORT}`));