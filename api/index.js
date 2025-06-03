import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { generateToken } from './utils/jwt.js';
import { authenticate } from './middleware/auth.js';
import { authorizeRoles } from './middleware/roles.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

// --- CORS та JSON ---
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

// --- Головна сторінка API ---
app.get('/', (_req, res) => {
  res.json({ status: 'ok', message: 'Retail Web API is up!' });
});

// --- Допоміжна утиліта для фільтрації по магазину ---
function byStore(q) {
  return q.storeId ? { storeId: Number(q.storeId) } : {};
}

// --- Магазини ---
app.get('/stores-lite', async (_req, res) => {
  try {
    const stores = await prisma.store.findMany({
      select: { id: true, name: true }
    });
    res.json(stores);
  } catch {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

app.get('/stores', authenticate, async (_req, res) => {
  try {
    const isAdmin = _req.user.role === 'admin';
    const stores  = await prisma.store.findMany(
      isAdmin
        ? { include: { employees: true, products: true, sales: true } }
        : { select: { id: true, name: true, location: true } } 
    );
    res.json(stores);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch stores' });
  }
});

app.get('/stores/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
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

app.post('/stores', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const store = await prisma.store.create({ data: req.body });
    res.status(201).json(store);
  } catch (err) {
    res.status(400).json({ error: 'Failed to create store' });
  }
});

app.put('/stores/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
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

app.delete('/stores/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    await prisma.store.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Store deleted' });
  } catch (err) {
    res.status(400).json({ error: 'Failed to delete store' });
  }
});

// --- Працівники ---
app.get('/employees', authenticate, authorizeRoles(['admin']), async (_req, res) => {
  try {
    const list = await prisma.employee.findMany({ where: byStore(_req.query) });
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

app.get('/employees/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const emp = await prisma.employee.findUnique({ where: { id: Number(req.params.id) }});
    if (!emp) return res.status(404).json({ error: 'Employee not found' });
    res.json(emp);
  } catch {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

app.post('/employees', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const emp = await prisma.employee.create({ data: req.body });
    res.status(201).json(emp);
  } catch {
    res.status(400).json({ error: 'Failed to create employee' });
  }
});

app.put('/employees/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
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

app.delete('/employees/:id', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    await prisma.employee.delete({ where: { id: Number(req.params.id) }});
    res.json({ message: 'Employee deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete employee' });
  }
});

// --- Продукти ---
app.get('/products', authenticate, async (_req, res) => {
  try {
    const list = await prisma.product.findMany({ where: byStore(_req.query) });
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

app.get('/products/:id', authenticate, async (req, res) => {
  try {
    const prod = await prisma.product.findUnique({ where: { id: Number(req.params.id) }});
    if (!prod) return res.status(404).json({ error: 'Product not found' });
    res.json(prod);
  } catch {
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

app.post('/products', authenticate, authorizeRoles(['admin', 'cashier']), async (req, res) => {
  try {
    if (req.user.role === 'cashier') {
      if (+req.body.storeId !== +req.user.storeId)
        return res.status(403).json({ error: 'Cashier – only own store' });
    }
    const prod = await prisma.product.create({ data:req.body });
    res.status(201).json(prod);
  } catch {
    res.status(400).json({ error: 'Failed to create product' });
  }
});

app.put('/products/:id', authenticate, authorizeRoles(['admin', 'cashier']), async (req, res) => {
  try {
    if (req.user.role === 'cashier') {
      const prod = await prisma.product.findUnique({ where:{ id:+req.params.id } });
      if (!prod || +prod.storeId !== +req.user.storeId)
        return res.status(403).json({ error:'Cashier – only own store' });
    }
    const updated = await prisma.product.update({
      where:{ id:Number(req.params.id) }, data:req.body
    });
    res.json(updated);
  } catch {
    res.status(400).json({ error: 'Failed to update product' });
  }
});

app.delete('/products/:id', authenticate, authorizeRoles(['admin', 'cashier']), async (req, res) => {
  try {
    if (req.user.role === 'cashier') {
      const prod = await prisma.product.findUnique({ where:{ id:+req.params.id } });
      if (!prod || +prod.storeId !== +req.user.storeId)
        return res.status(403).json({ error:'Cashier – only own store' });
    }
    await prisma.product.delete({ where:{ id:Number(req.params.id) } });
    res.json({ message:'Product deleted' });
  } catch {
    res.status(400).json({ error: 'Failed to delete product' });
  }
});

// --- Продажі ---
app.get('/sales', authenticate, authorizeRoles(['admin']), async (req, res) => {
  try {
    const list = await prisma.sale.findMany({
      where: byStore(req.query),
      include:{ product:true, store:true }
    });
    res.json(list);
  } catch {
    res.status(500).json({ error: 'Failed to fetch sales' });
  }
});

// Агрегована сума по магазину
app.get('/sales/summary', authenticate, authorizeRoles(['admin']), async (req,res)=>{
  try{
    const sum = await prisma.sale.aggregate({
      where: byStore(req.query),
      _sum : { total:true }
    });
    res.json({ total: sum._sum.total ?? 0 });
  }catch{ res.status(500).json({ error:'Failed to fetch summary' }); }
});

// Один продаж
app.get('/sales/:id', authenticate, authorizeRoles(['admin']), async (req,res)=>{
  const sale = await prisma.sale.findUnique({
    where:{ id:+req.params.id },
    include:{ product:true, store:true }
  });
  sale ? res.json(sale)
       : res.status(404).json({ error:'Sale not found' });
});

// Додати продаж
app.post('/sales', authenticate, authorizeRoles(['admin']), async (req,res)=>{
  const { productId, quantity } = req.body;
  console.log("[POST /sales] Body:", req.body);

  if (!productId || !quantity) {
    console.log("[POST /sales] Missing productId or quantity");
    return res.status(400).json({ error:'productId & quantity required' });
  }

  const product = await prisma.product.findUnique({ where:{ id:+productId } });
  console.log("[POST /sales] Found product:", product);

  if(!product)
    return res.status(400).json({ error:'product not found' });

  if(product.stock < quantity) {
    console.log(`[POST /sales] Not enough stock: have ${product.stock}, need ${quantity}`);
    return res.status(400).json({ error:'not enough stock' });
  }

  const sale = await prisma.sale.create({
    data:{
      productId : product.id,
      storeId   : product.storeId,
      quantity  : +quantity,
      total     : product.price * quantity
    },
    include:{ product:true, store:true }
  });

  await prisma.product.update({
    where:{ id:product.id },
    data :{ stock:{ decrement: quantity } }
  });

  res.status(201).json(sale);
});

// Оновити продаж
app.put('/sales/:id', authenticate, authorizeRoles(['admin']), async (req,res)=>{
  const { quantity } = req.body;
  if(!quantity) return res.status(400).json({ error:'quantity required' });

  const old = await prisma.sale.findUnique({ where:{ id:+req.params.id } , include:{ product:true }});
  if(!old) return res.status(404).json({ error:'Sale not found' });

  const diff = quantity - old.quantity;
  if(old.product.stock < diff)
      return res.status(400).json({ error:'not enough stock' });

  await prisma.product.update({
    where:{ id:old.productId },
    data :{ stock:{ decrement: diff } }
  });

  const updated = await prisma.sale.update({
    where:{ id:old.id },
    data :{ quantity:+quantity, total: old.product.price * quantity },
    include:{ product:true, store:true }
  });

  res.json(updated);
});

app.delete('/sales/:id', authenticate, authorizeRoles(['admin']), async (req,res)=>{
  const sale = await prisma.sale.findUnique({ where:{ id:+req.params.id }});
  if(!sale) return res.status(404).json({ error:'Sale not found' });

  await prisma.product.update({
    where:{ id:sale.productId },
    data :{ stock:{ increment: sale.quantity } }
  });

  await prisma.sale.delete({ where:{ id:sale.id }});
  res.json({ message:'Sale deleted' });
});

// --- Аутентифікація ---
app.post('/register', async (req, res) => {
  const {
    email,
    password,
    role = 'user',
    storeId,
    firstName,
    lastName,
  } = req.body;

  if (!email || !password || !firstName || !lastName)
    return res.status(400).json({ error: 'email, password, firstName та lastName обовʼязкові' });

  if (role === 'cashier') {
    if (!storeId)
      return res.status(400).json({ error: 'storeId is required for cashier' });

    const storeExists = await prisma.store.findUnique({
      where: { id: Number(storeId) },
      select: { id: true }
    });
    if (!storeExists)
      return res.status(400).json({ error: 'storeId not found' });
  }

  if (role !== 'cashier' && storeId)
    return res.status(400).json({ error: 'storeId allowed only for cashier' });

  const hashed = await bcrypt.hash(password, 10);

  const data = { email, password: hashed, role, firstName, lastName };
  if (role === 'cashier') data.storeId = Number(storeId);

  try {
    const createdUser = await prisma.user.create({ data });

    // Якщо роль касир - одразу додаємо у employee
    if (role === 'cashier') {
      await prisma.employee.create({
        data: {
          name: `${lastName} ${firstName}`,
          role: 'cashier',
          storeId: Number(storeId),
        }
      });
    }

    res.status(201).json({ message: 'User created' });
  } catch (err) {
    res.status(400).json({ error: 'Email already exists' });
  }
});

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

app.get('/profile', authenticate, async (req, res) => {
  const userFromDb = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      email: true,
      role: true,
      storeId: true,
      firstName: true,
      lastName: true,
      avatarUrl: true
    }
  });
  res.json({ user: userFromDb });
});

// --- Завантаження та віддача аватарки ---
const uploadDir = './uploads/';
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `avatar-${req.user.id}${ext}`);
  }
});
const upload = multer({ storage });

app.post('/profile/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const avatarUrl = `/uploads/${req.file.filename}`;
  await prisma.user.update({
    where: { id: req.user.id },
    data: { avatarUrl }
  });
  res.json({ avatarUrl });
});

app.use('/uploads', express.static(uploadDir));

// --- Запуск сервера ---
app.listen(PORT, () => console.log(`API listening on ${PORT}`));
