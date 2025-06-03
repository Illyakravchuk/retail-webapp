const request = require('supertest');
const baseURL = 'http://localhost:3000';

describe('Retail Web API - інтеграційні тести', () => {
  let adminToken = '';
  let cashierToken = '';
  let userToken = '';
  let storeId;
  let productId;
  let saleId;

  // --- Реєстрація та логін користувачів ---
  test('Реєстрація адміністратора', async () => {
    const res = await request(baseURL).post('/register').send({
      email: 'admin1@test.com', password: 'Admin123!', role: 'admin',
      firstName: 'Admin', lastName: 'Main'
    });
    expect(res.statusCode).toBe(201);
  });

  test('Реєстрація звичайного користувача', async () => {
    const res = await request(baseURL).post('/register').send({
      email: 'user1@test.com', password: 'User123!',
      firstName: 'User', lastName: 'One'
    });
    expect(res.statusCode).toBe(201);
  });

  test('Логін як адміністратор', async () => {
    const res = await request(baseURL).post('/login').send({
      email: 'admin1@test.com', password: 'Admin123!'
    });
    expect(res.body.token).toBeDefined();
    adminToken = res.body.token;
  });

  test('Логін як користувач', async () => {
    const res = await request(baseURL).post('/login').send({
      email: 'user1@test.com', password: 'User123!'
    });
    expect(res.body.token).toBeDefined();
    userToken = res.body.token;
  });

  // --- Магазини ---
  test('Адмін може створити магазин', async () => {
    const res = await request(baseURL).post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Test Store', location: 'Kyiv' });
    expect(res.statusCode).toBe(201);
    storeId = res.body.id;
  });

  test('Звичайний користувач не може створити магазин', async () => {
    const res = await request(baseURL).post('/stores')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ name: 'Fail Store', location: 'Lviv' });
    expect(res.statusCode).toBe(403);
  });

  test('Отримати список магазинів (адмін)', async () => {
    const res = await request(baseURL).get('/stores')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Публічний список магазинів (stores-lite)', async () => {
    const res = await request(baseURL).get('/stores-lite');
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0]).toHaveProperty('id');
    expect(res.body[0]).toHaveProperty('name');
  });

  test('Отримати магазин по id (адмін)', async () => {
    const res = await request(baseURL).get(`/stores/${storeId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.id).toBe(storeId);
    expect(res.body.products).toBeDefined();
    expect(res.body.sales).toBeDefined();
  });

  // --- Товари ---
  test('Адмін може створити товар', async () => {
    const res = await request(baseURL).post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'CocaCola', price: 18, stock: 40, storeId });
    expect(res.statusCode).toBe(201);
    productId = res.body.id;
  });

  test('Отримати всі товари (адмін)', async () => {
    const res = await request(baseURL).get('/products')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(p => p.id === productId)).toBe(true);
  });

  test('Отримати товар по id', async () => {
    const res = await request(baseURL).get(`/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.id).toBe(productId);
    expect(res.body.name).toBe('CocaCola');
  });

  test('Оновити товар (адмін)', async () => {
    const res = await request(baseURL).put(`/products/${productId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'CocaCola', price: 20, stock: 35, storeId });
    expect(res.body.price).toBe(20);
    expect(res.body.stock).toBe(35);
  });

  test('Видалити товар (адмін)', async () => {
    // Створюємо товар для видалення
    const create = await request(baseURL).post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'ToDelete', price: 10, stock: 1, storeId });
    // Видаляємо його
    const del = await request(baseURL).delete(`/products/${create.body.id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.body.message).toBe('Product deleted');
  });

  // --- Продажі ---
  test('Адмін може створити продаж', async () => {
    const res = await request(baseURL).post('/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId, quantity: 2 });
    expect(res.statusCode).toBe(201);
    saleId = res.body.id;
  });

  test('Адмін може отримати всі продажі', async () => {
    const res = await request(baseURL).get('/sales')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.some(s => s.id === saleId)).toBe(true);
  });

  test('Отримати продаж по id', async () => {
    const res = await request(baseURL).get(`/sales/${saleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.id).toBe(saleId);
    expect(res.body.product).toBeDefined();
    expect(res.body.store).toBeDefined();
  });

  test('Оновити продаж (зміна кількості)', async () => {
    const res = await request(baseURL).put(`/sales/${saleId}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ quantity: 1 });
    expect(res.body.quantity).toBe(1);
  });

  test('Видалити продаж', async () => {
    const del = await request(baseURL).delete(`/sales/${saleId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(del.body.message).toBe('Sale deleted');
  });

  test('Агрегована сума продажів', async () => {
    const res = await request(baseURL).get('/sales/summary')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body).toHaveProperty('total');
  });

  // --- Працівники ---
  test('Адмін може додати працівника', async () => {
    const res = await request(baseURL).post('/employees')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'Ivan Test', role: 'cashier', storeId });
    expect(res.statusCode).toBe(201);
  });

  test('Адмін може отримати всіх працівників', async () => {
    const res = await request(baseURL).get('/employees')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(Array.isArray(res.body)).toBe(true);
  });

  test('Отримати працівника по id', async () => {
    const empList = await request(baseURL).get('/employees')
      .set('Authorization', `Bearer ${adminToken}`);
    const empId = empList.body[0]?.id;
    if (!empId) return; // якщо немає працівника, нічого тестувати
    const res = await request(baseURL).get(`/employees/${empId}`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.id).toBe(empId);
  });

  // --- Профіль ---
  test('Адмін може отримати свій профіль', async () => {
    const res = await request(baseURL).get('/profile')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.body.user).toBeDefined();
    expect(res.body.user.email).toBe('admin1@test.com');
  });

  // --- Негативні кейси (перевірка помилок) ---
  test('Логін з неправильним паролем', async () => {
    const res = await request(baseURL).post('/login').send({
      email: 'admin1@test.com', password: 'wrongpass'
    });
    expect(res.statusCode).toBe(401);
  });

  test('Видалення неіснуючого магазину', async () => {
    const res = await request(baseURL).delete('/stores/999999')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.statusCode).toBe(400);
  });

  test('Отримати товари без авторизації', async () => {
    const res = await request(baseURL).get('/products');
    expect(res.statusCode).toBe(401);
  });

  test('Створення продажу з недостатньою кількістю товару', async () => {
    // створюємо товар з 1 шт, пробуємо продати 2
    const create = await request(baseURL).post('/products')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'NoStock', price: 10, stock: 1, storeId });
    const res = await request(baseURL).post('/sales')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ productId: create.body.id, quantity: 2 });
    expect(res.statusCode).toBe(400);
  });
    // --- Касир: реєстрація та логін ---
  test('Реєстрація касира (з магазином)', async () => {
    // Касира треба створити з id магазину
    const res = await request(baseURL).post('/register').send({
      email: 'cashier1@test.com', password: 'Cashier123!', role: 'cashier',
      firstName: 'Cash', lastName: 'Ier', storeId
    });
    expect(res.statusCode).toBe(201);
  });

  test('Логін як касир', async () => {
    const res = await request(baseURL).post('/login').send({
      email: 'cashier1@test.com', password: 'Cashier123!'
    });
    expect(res.body.token).toBeDefined();
    cashierToken = res.body.token;
  });

  // --- Касир: робота лише зі своїм магазином ---
  test('Касир може додати товар лише у свій магазин', async () => {
    const res = await request(baseURL).post('/products')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'Pepsi', price: 13, stock: 50, storeId });
    expect(res.statusCode).toBe(201);
  });

  test('Касир не може додати товар у чужий магазин', async () => {
    // Створимо інший магазин через адміна
    const otherStore = await request(baseURL).post('/stores')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'OtherStore', location: 'Lviv' });
    const res = await request(baseURL).post('/products')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'ForeignProduct', price: 11, stock: 5, storeId: otherStore.body.id });
    expect(res.statusCode).toBe(403);
  });

  test('Касир не може створити магазин', async () => {
    const res = await request(baseURL).post('/stores')
      .set('Authorization', `Bearer ${cashierToken}`)
      .send({ name: 'NewStore', location: 'Kharkiv' });
    expect(res.statusCode).toBe(403);
  });
 
});
