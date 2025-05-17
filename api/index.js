import 'dotenv/config';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from './utils/jwt.js';
import { authenticate } from './middleware/auth.js';

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

// Отримати магазин за ID
app.get('/stores/:id', authenticate, async (req, res) => {
  try {
    const store = await prisma.store.findUnique({
      where: { id: Number(req.params.id) },
      include: { employees: true, products: true, sales: true }
    });
    if (!store) return res.status(404).json({ error: 'Store not found' });
    res.json(store);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch store' });
  }
});

// Створити магазин
app.post('/stores', authenticate, async (req, res) => {
  try {
    const store = await prisma.store.create({ data: req.body });
    res.status(201).json(store);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create store' });
  }
});

// Оновити магазин
app.put('/stores/:id', authenticate, async (req, res) => {
  try {
    const updated = await prisma.store.update({
      where: { id: Number(req.params.id) },
      data: req.body
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: 'Failed to update store' });
  }
});

// Видалити магазин
app.delete('/stores/:id', authenticate, async (req, res) => {
  try {
    await prisma.store.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Store deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete store' });
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

// Реєстрація нового користувача
app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);

  try {
    const user = await prisma.user.create({
      data: { email, password: hashed }
    });
    res.json({ message: 'User created' });
  } catch {
    res.status(400).json({ error: 'Email already exists' });
  }
});

// Вхід користувача та видача JWT
app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = generateToken(user);
  res.json({ token });
});

// Захищений маршрут
app.get('/profile', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => console.log(`API listening on ${PORT}`));