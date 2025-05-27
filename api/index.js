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

// Всі працівники
app.get('/employees', authenticate, async (_req, res) => {
  try {
    const list = await prisma.employee.findMany();
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// Один працівник
app.get('/employees/:id', authenticate, async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({ where: { id: Number(req.params.id) }});
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// Створити працівника
app.post('/employees', authenticate, async (req, res) => {
  try {
    const emp = await prisma.employee.create({ data: req.body });
    res.status(201).json(emp);
  } catch {
    res.status(400).json({ error: 'Failed to create employee' });
  }
});

// Оновити працівника
app.put('/employees/:id', authenticate, async (req, res) => {
  try {
    const emp = await prisma.employee.update({
      where: { id: Number(req.params.id) },
      data:  req.body
    });
    res.json(emp);
  } catch {
    res.status(400).json({ error: 'Failed to update employee' });
  }
});

// Видалити працівника
app.delete('/employees/:id', authenticate, async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: Number(req.params.id) }});
    res.json({ message: 'Employee deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete employee' });
  }
});

// Всі продукти
app.get('/products', authenticate, async (_req, res) => {
  try {
    const list = await prisma.product.findMany();
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Один продукт
app.get('/products/:id', authenticate, async (req, res) => {
  try {
    const prod = await prisma.product.findUnique({ where: { id: Number(req.params.id) }});
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Створити продукт
app.post('/products', authenticate, async (req, res) => {
  try {
    const prod = await prisma.product.create({ data: req.body });
    res.status(201).json(prod);
  } catch {
    res.status(400).json({ error: 'Failed to create product' });
  }
});

// Оновити продукт
app.put('/products/:id', authenticate, async (req, res) => {
  try {
    const prod = await prisma.product.update({
      where: { id: Number(req.params.id) },
      data:  req.body
    });
    res.json(prod);
  } catch {
    res.status(400).json({ error: 'Failed to update product' });
  }
});

// Видалити продукт
app.delete('/products/:id', authenticate, async (req, res) => {
  try {
    await prisma.product.delete({ where: { id: Number(req.params.id) }});
    res.json({ message: 'Product deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

// Всі продажі
app.get('/sales', authenticate, async (_req, res) => {
  try {
    const list = await prisma.sale.findMany();
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Один продаж
app.get('/sales/:id', authenticate, async (req, res) => {
  try {
    const sale = await prisma.sale.findUnique({ where: { id: Number(req.params.id) }});
    if (!sale) return res.status(404).json({ error: 'Sale not found' });
    res.json(sale);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sale' });
  }
});

// Створити продаж
app.post('/sales', authenticate, async (req, res) => {
  try {
    const sale = await prisma.sale.create({ data: req.body });
    res.status(201).json(sale);
  } catch {
    res.status(400).json({ error: 'Failed to create sale' });
  }
});

// Оновити продаж
app.put('/sales/:id', authenticate, async (req, res) => {
  try {
    const sale = await prisma.sale.update({
      where: { id: Number(req.params.id) },
      data:  req.body
    });
    res.json(sale);
  } catch {
    res.status(400).json({ error: 'Failed to update sale' });
  }
});

// Видалити продаж
app.delete('/sales/:id', authenticate, async (req, res) => {
  try {
    await prisma.sale.delete({ where: { id: Number(req.params.id) }});
    res.json({ message: 'Sale deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete sale' });
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
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Invalid credentials' });

    res.json({ token: generateToken(user) });
  } catch {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Захищений маршрут
app.get('/profile', authenticate, async (req, res) => {
  res.json({ user: req.user });
});

app.listen(PORT, () => console.log(`API listening on ${PORT}`));