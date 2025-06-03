const request = require('supertest');
const api = 'http://localhost:3000'; 

let adminToken, userToken, cashierToken;
let storeId, productId, employeeId, saleId;

describe('Retail Web API - інтеграційні тести', () => {
  // --- Користувачі ---
  test('Реєстрація адміна', async () => {
    const res = await request(api)
      .post('/register')
      .send({
        email: 'admin2@example.com',
        password: 'Admin123!',
        role: 'admin',
        firstName: 'Admin',
        lastName: 'Adminenko'
      });
    expect([201, 400]).toContain(res.statusCode); 
  });

  test('Реєстрація користувача', async () => {
    const res = await request(api)
      .post('/register')
      .send({
        email: 'user2@example.com',
        password: 'User123!',
        firstName: 'User',
        lastName: 'Userenko'
      });
    expect([201, 400]).toContain(res.statusCode);
  });

  test('Логін адміна', async () => {
    const res = await request(api)
      .post('/login')
      .send({ email: 'admin2@example.com', password: 'Admin123!' });
    expect(res.statusCode).toBe(200);
    adminToken = res.body.token;
  });

  test('Логін користувача', async () => {
    const res = await request(api)
      .post('/login')
      .send({ email: 'user2@example.com', password: 'User123!' });
    expect(res.statusCode).toBe(200);
    userToken = res.body.token;
  });

  // --- Магазини ---
  test('Створення магазину (адмін)', async () => {
    const res = await request(api)
      .post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Магазин №1', location: 'Київ' });
    expect(res.statusCode).toBe(201);
    storeId = res.body.id;
  });

  test('Отримання списку магазинів (адмін)', async () => {
    const res = await request(api)
      .get('/stores')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Зміна магазину (адмін)', async () => {
    const res = await request(api)
      .put(`/stores/${storeId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Магазин оновлений', location: 'Київ, вул. Нова' });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Магазин оновлений');
  });

  test('Доступ до магазину по id (адмін)', async () => {
    const res = await request(api)
      .get(`/stores/${storeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(storeId);
  });

  // --- Працівники ---
  test('Додавання працівника (адмін)', async () => {
    const res = await request(api)
      .post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Петро Працівник', role: 'cashier', storeId });
    expect(res.statusCode).toBe(201);
    employeeId = res.body.id;
  });

  test('Список працівників (адмін)', async () => {
    const res = await request(api)
      .get('/employees')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- Продукти ---
  test('Додавання продукту (адмін)', async () => {
    const res = await request(api)
      .post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Тест продукт', price: 99, stock: 10, storeId });
    expect(res.statusCode).toBe(201);
    productId = res.body.id;
  });

  test('Зміна продукту (адмін)', async () => {
    const res = await request(api)
      .put(`/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Оновлений продукт', price: 199, stock: 5, storeId });
    expect(res.statusCode).toBe(200);
    expect(res.body.name).toBe('Оновлений продукт');
  });

  test('Список продуктів (адмін)', async () => {
    const res = await request(api)
      .get('/products')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  // --- Продажі ---
  test('Створення продажу (адмін)', async () => {
    const res = await request(api)
      .post('/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 2 });
    expect(res.statusCode).toBe(201);
    saleId = res.body.id;
  });

  test('Отримання продажу по id (адмін)', async () => {
    const res = await request(api)
      .get(`/sales/${saleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.id).toBe(saleId);
  });

  test('Агрегована сума продажів (адмін)', async () => {
    const res = await request(api)
      .get('/sales/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(typeof res.body.total).toBe('number');
  });

  // --- Негативні сценарії ---
  test('Помилка при створенні продажу, якщо не вистачає товару', async () => {
    const res = await request(api)
      .post('/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 1000 }); // перевищує stock
    expect(res.statusCode).toBe(400);
    expect(res.body.error).toMatch(/not enough stock/i);
  });

  test('Видалення продукту (адмін)', async () => {
    const res = await request(api)
      .delete(`/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 400]).toContain(res.statusCode);
  });

  test('Видалення працівника (адмін)', async () => {
    const res = await request(api)
      .delete(`/employees/${employeeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect([200, 400]).toContain(res.statusCode);
  });

  // --- Профіль і аватар ---
  test('Отримати профіль адміна', async () => {
    const res = await request(api)
      .get('/profile')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.user.email).toBe('admin2@example.com');
  });

  // --- Інші сценарії (аватар, некоректні дані) ---
  test('Помилка при видаленні неіснуючого магазину', async () => {
    const res = await request(api)
      .delete('/stores/999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
  });

  test('Помилка логіна з неіснуючим email', async () => {
    const res = await request(api)
      .post('/login')
      .send({ email: 'notfound@example.com', password: 'notFou456' });
    expect([401, 500]).toContain(res.statusCode);
  });

  // --- Спроба створити продукт як user ---
  test('User не може створити продукт', async () => {
    const res = await request(api)
      .post('/products')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'fail', price: 1, stock: 1, storeId });
    expect(res.statusCode).toBe(403);
  });

  // --- Валідація реєстрації ---
  test('Реєстрація без паролю має повертати 400', async () => {
    const res = await request(api)
      .post('/register')
      .send({ email: 'fail@example.com', firstName: 'A', lastName: 'B' });
    expect(res.statusCode).toBe(400);
  });
  // --- Касир: реєстрація, логін, дії ---
  test('Реєстрація касира для магазину', async () => {
    const res = await request(api)
      .post('/register')
      .send({
        email: 'cashier2@example.com',
        password: 'Cashier123!',
        role: 'cashier',
        firstName: 'Cashier',
        lastName: 'Cash',
        storeId
      });
    expect([201, 400]).toContain(res.statusCode);
  });

  test('Логін касира', async () => {
    const res = await request(api)
      .post('/login')
      .send({
        email: 'cashier2@example.com',
        password: 'Cashier123!'
      });
    expect(res.statusCode).toBe(200);
    cashierToken = res.body.token;
  });

  test('Касир не може створити магазин', async () => {
    const res = await request(api)
      .post('/stores')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'Чужий Магазин', location: 'Одеса' });
    expect(res.statusCode).toBe(403);
  });
});

