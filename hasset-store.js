// ============================================================
// HASSET RESTAURANT — SHARED DATA STORE
// All dashboards import this via <script src="hasset-store.js">
// Uses localStorage + BroadcastChannel for real-time cross-tab sync
// ============================================================

const STORE_KEY = 'hasset_orders';
const INV_KEY   = 'hasset_inventory';
const BC_NAME   = 'hasset_channel';

// ── Menu Data ──────────────────────────────────────────────
const MENU_DATA = [
  // Breakfast
  {id:1,cat:'Breakfast',name:'Normal Full',price:200,emoji:'🍳',isFood:true},
  {id:2,cat:'Breakfast',name:'Special Full',price:230,emoji:'🍳',isFood:true},
  {id:3,cat:'Breakfast',name:'Scrambled Egg',price:230,emoji:'🥚',isFood:true},
  {id:4,cat:'Breakfast',name:'Egg with Meat',price:300,emoji:'🥚',isFood:true},
  {id:5,cat:'Breakfast',name:'Special Nashif',price:220,emoji:'🥣',isFood:true},
  {id:6,cat:'Breakfast',name:'Egg with Tomato Sauce',price:250,emoji:'🥚',isFood:true},
  {id:7,cat:'Breakfast',name:'Fetira with Egg',price:300,emoji:'🥞',isFood:true},
  {id:8,cat:'Breakfast',name:'Fetira with Honey',price:250,emoji:'🥞',isFood:true},
  {id:9,cat:'Breakfast',name:'Pan Cake',price:199,emoji:'🥞',isFood:true},
  {id:10,cat:'Breakfast',name:'Pancakes with Banana Cream',price:260,emoji:'🥞',isFood:true},
  {id:11,cat:'Breakfast',name:'Pancakes with Strawberry Cream',price:260,emoji:'🥞',isFood:true},
  {id:12,cat:'Breakfast',name:'Banana Cake',price:100,emoji:'🍌',isFood:true},
  {id:13,cat:'Breakfast',name:'English Cake',price:100,emoji:'🍰',isFood:true},
  {id:14,cat:'Breakfast',name:'Bula Genfo',price:250,emoji:'🥣',isFood:true},
  {id:15,cat:'Breakfast',name:'Qinche',price:250,emoji:'🥣',isFood:true},
  {id:16,cat:'Breakfast',name:'Hasset Combo (Breakfast)',price:700,emoji:'🍱',isFood:true},
  {id:17,cat:'Breakfast',name:'Avocado Lebleb',price:230,emoji:'🥑',isFood:true},
  {id:18,cat:'Breakfast',name:'Chechebsa Fasting',price:250,emoji:'🫓',isFood:true},
  {id:19,cat:'Breakfast',name:'Chechebsa with Egg',price:280,emoji:'🫓',isFood:true},
  {id:20,cat:'Breakfast',name:'Black Tef Chechebsa',price:280,emoji:'🫓',isFood:true},
  {id:21,cat:'Breakfast',name:'Special Black Tef Chechebsa',price:330,emoji:'🫓',isFood:true},
  {id:22,cat:'Breakfast',name:'Fasting Firfir',price:250,emoji:'🫓',isFood:true},
  {id:23,cat:'Breakfast',name:'Tibis Firfir',price:430,emoji:'🫓',isFood:true},
  // Traditional
  {id:24,cat:'Traditional',name:'Shiro Tegabino with Salad',price:320,emoji:'🫘',isFood:true},
  {id:25,cat:'Traditional',name:'Bozena Shiro',price:310,emoji:'🫘',isFood:true},
  {id:26,cat:'Traditional',name:'Fasting Firfir',price:250,emoji:'🫓',isFood:true},
  {id:27,cat:'Traditional',name:'Tuna Firfir',price:450,emoji:'🐟',isFood:true},
  {id:28,cat:'Traditional',name:'Meat Firfir',price:430,emoji:'🥩',isFood:true},
  {id:29,cat:'Traditional',name:'Tibs Firfir',price:430,emoji:'🥩',isFood:true},
  {id:30,cat:'Traditional',name:'Quanta Firfir',price:450,emoji:'🥩',isFood:true},
  {id:31,cat:'Traditional',name:'Chikina Tibs',price:530,emoji:'🥩',isFood:true},
  {id:32,cat:'Traditional',name:'Lamb Tibs',price:570,emoji:'🐑',isFood:true},
  {id:33,cat:'Traditional',name:'Kikil',price:520,emoji:'🍲',isFood:true},
  {id:34,cat:'Traditional',name:'Beyayint',price:320,emoji:'🫙',isFood:true},
  {id:35,cat:'Traditional',name:'Hasset Combo',price:700,emoji:'🍱',isFood:true},
  {id:36,cat:'Traditional',name:'Fasting Combo',price:500,emoji:'🍱',isFood:true},
  {id:37,cat:'Traditional',name:'Chef Combo',price:800,emoji:'🍱',isFood:true},
  {id:38,cat:'Traditional',name:'Suf Fitfit',price:200,emoji:'🫓',isFood:true},
  {id:39,cat:'Traditional',name:'Shiro with Salad',price:280,emoji:'🫘',isFood:true},
  {id:40,cat:'Traditional',name:'Half Half',price:350,emoji:'🍽️',isFood:true},
  {id:41,cat:'Traditional',name:'Special Shiro',price:370,emoji:'🫘',isFood:true},
  {id:42,cat:'Traditional',name:'Fasting Special Shiro',price:310,emoji:'🫘',isFood:true},
  {id:43,cat:'Traditional',name:'Derkosh Firfir',price:320,emoji:'🫓',isFood:true},
  {id:44,cat:'Traditional',name:'Duleat',price:390,emoji:'🥩',isFood:true},
  {id:45,cat:'Traditional',name:'French Toast',price:260,emoji:'🍞',isFood:true},
  {id:46,cat:'Traditional',name:'Cheese Omelet',price:250,emoji:'🥚',isFood:true},
  {id:47,cat:'Traditional',name:'Omlet',price:206,emoji:'🥚',isFood:true},
  // Pasta & Rice
  {id:48,cat:'Pasta & Rice',name:'Spaghetti/Rice with Vegetable',price:280,emoji:'🍝',isFood:true},
  {id:49,cat:'Pasta & Rice',name:'Spaghetti/Rice with Tomato',price:280,emoji:'🍝',isFood:true},
  {id:50,cat:'Pasta & Rice',name:'Spaghetti/Rice with Meat Sauce',price:370,emoji:'🍝',isFood:true},
  {id:51,cat:'Pasta & Rice',name:'Spaghetti/Rice with Tuna',price:450,emoji:'🐟',isFood:true},
  {id:52,cat:'Pasta & Rice',name:'Spaghetti/Rice with Chicken',price:400,emoji:'🍗',isFood:true},
  {id:53,cat:'Pasta & Rice',name:'Lasagna',price:400,emoji:'🫕',isFood:true},
  // Fish
  {id:54,cat:'Fish',name:'Grilled Fish',price:550,emoji:'🐟',isFood:true},
  {id:55,cat:'Fish',name:'Fish Gulash',price:550,emoji:'🐟',isFood:true},
  {id:56,cat:'Fish',name:'Fish Cottelet',price:550,emoji:'🐟',isFood:true},
  {id:57,cat:'Fish',name:'Hot & Spice Finger Fish',price:550,emoji:'🌶️',isFood:true},
  // Beef
  {id:58,cat:'Beef',name:'Pepper Steak',price:530,emoji:'🥩',isFood:true},
  {id:59,cat:'Beef',name:'Stir Fried Beef',price:530,emoji:'🥩',isFood:true},
  {id:60,cat:'Beef',name:'Beef Kebeb',price:530,emoji:'🍢',isFood:true},
  {id:61,cat:'Beef',name:'Beef Gulash',price:530,emoji:'🥩',isFood:true},
  // Chicken
  {id:62,cat:'Chicken',name:'Full Roasted Chicken',price:2000,emoji:'🍗',isFood:true},
  {id:63,cat:'Chicken',name:'Roasted Half Chicken',price:1100,emoji:'🍗',isFood:true},
  {id:64,cat:'Chicken',name:'Chicken Cottelet',price:600,emoji:'🍗',isFood:true},
  {id:65,cat:'Chicken',name:'Fried Chicken Leg',price:550,emoji:'🍗',isFood:true},
  {id:66,cat:'Chicken',name:'Grilled Chicken Breast',price:550,emoji:'🍗',isFood:true},
  // Burgers & Sandwiches
  {id:67,cat:'Burgers & Sandwiches',name:'Hasset Special Burger',price:620,emoji:'🍔',isFood:true},
  {id:68,cat:'Burgers & Sandwiches',name:'Double Special Burger',price:740,emoji:'🍔',isFood:true},
  {id:69,cat:'Burgers & Sandwiches',name:'Double Beef Burger',price:600,emoji:'🍔',isFood:true},
  {id:70,cat:'Burgers & Sandwiches',name:'Cheese Burger',price:500,emoji:'🍔',isFood:true},
  {id:71,cat:'Burgers & Sandwiches',name:'Normal Burger',price:430,emoji:'🍔',isFood:true},
  {id:72,cat:'Burgers & Sandwiches',name:'Ham Burger',price:530,emoji:'🍔',isFood:true},
  {id:73,cat:'Burgers & Sandwiches',name:'Club Sandwich',price:500,emoji:'🥪',isFood:true},
  {id:74,cat:'Burgers & Sandwiches',name:'Chicken Sandwich',price:600,emoji:'🥪',isFood:true},
  {id:75,cat:'Burgers & Sandwiches',name:'Tuna Sandwich',price:470,emoji:'🥪',isFood:true},
  {id:76,cat:'Burgers & Sandwiches',name:'Egg Sandwich',price:280,emoji:'🥚',isFood:true},
  {id:77,cat:'Burgers & Sandwiches',name:'Vegetable Sandwich',price:280,emoji:'🥗',isFood:true},
  {id:78,cat:'Burgers & Sandwiches',name:'French Fries',price:260,emoji:'🍟',isFood:true},
  // Pizza
  {id:79,cat:'Pizza',name:'Hasset Special Pizza',price:830,emoji:'🍕',isFood:true},
  {id:80,cat:'Pizza',name:'Chef Special Pizza',price:1050,emoji:'🍕',isFood:true},
  {id:81,cat:'Pizza',name:'Chicken Pizza',price:870,emoji:'🍕',isFood:true},
  {id:82,cat:'Pizza',name:'Beef Pizza',price:730,emoji:'🍕',isFood:true},
  {id:83,cat:'Pizza',name:'Tuna Pizza',price:650,emoji:'🍕',isFood:true},
  {id:84,cat:'Pizza',name:'Tuna with Cheese Pizza',price:700,emoji:'🍕',isFood:true},
  {id:85,cat:'Pizza',name:'Vegetable with Cheese Pizza',price:600,emoji:'🍕',isFood:true},
  {id:86,cat:'Pizza',name:'Vegetable Fasting Pizza',price:500,emoji:'🍕',isFood:true},
  {id:87,cat:'Pizza',name:'Margarita Pizza',price:610,emoji:'🍕',isFood:true},
  {id:88,cat:'Pizza',name:'Four Season Pizza',price:1090,emoji:'🍕',isFood:true},
  {id:89,cat:'Pizza',name:'Family Special Pizza',price:1050,emoji:'🍕',isFood:true},
  // Wraps
  {id:90,cat:'Wraps',name:'Vegetable Wrap',price:290,emoji:'🌯',isFood:true},
  {id:91,cat:'Wraps',name:'Tuna Wrap',price:470,emoji:'🌯',isFood:true},
  {id:92,cat:'Wraps',name:'Chicken Wrap',price:550,emoji:'🌯',isFood:true},
  {id:93,cat:'Wraps',name:'Beef Wrap',price:520,emoji:'🌯',isFood:true},
  // Salad & Soup
  {id:94,cat:'Salad',name:'Hasset Special Salad',price:470,emoji:'🥗',isFood:true},
  {id:95,cat:'Salad',name:'Tuna Salad',price:420,emoji:'🥗',isFood:true},
  {id:96,cat:'Salad',name:'Normal Salad',price:250,emoji:'🥗',isFood:true},
  {id:97,cat:'Salad',name:'Avocado Salad',price:300,emoji:'🥑',isFood:true},
  {id:98,cat:'Salad',name:'Home Made Salad',price:250,emoji:'🥗',isFood:true},
  {id:99,cat:'Soup',name:'Tomato Cream Soup',price:200,emoji:'🍲',isFood:true},
  {id:100,cat:'Soup',name:'Vegetable Soup',price:200,emoji:'🍲',isFood:true},
  {id:101,cat:'Soup',name:'Beef Soup',price:250,emoji:'🍲',isFood:true},
  {id:102,cat:'Soup',name:'Chicken Soup',price:250,emoji:'🍲',isFood:true},
  // Drinks — isFood:false → goes to bar
  {id:103,cat:'Juice',name:'Avocado Juice',price:200,emoji:'🥤',isFood:false},
  {id:104,cat:'Juice',name:'Mango Juice',price:200,emoji:'🥭',isFood:false},
  {id:105,cat:'Juice',name:'Papaya Juice',price:170,emoji:'🥤',isFood:false},
  {id:106,cat:'Juice',name:'Watermelon Juice',price:170,emoji:'🍉',isFood:false},
  {id:107,cat:'Juice',name:'Flax Seed Shake',price:200,emoji:'🥤',isFood:false},
  {id:108,cat:'Juice',name:'Mixed Juice',price:200,emoji:'🥤',isFood:false},
  {id:109,cat:'Juice',name:'Fruit Punch',price:300,emoji:'🍹',isFood:false},
  {id:110,cat:'Juice',name:'Carrot Juice',price:200,emoji:'🥕',isFood:false},
  {id:111,cat:'Shakes & Smoothies',name:'Banana Shake',price:250,emoji:'🍌',isFood:false},
  {id:112,cat:'Shakes & Smoothies',name:'Mango Shake',price:250,emoji:'🥭',isFood:false},
  {id:113,cat:'Shakes & Smoothies',name:'Flax Seed Shake with Milk',price:250,emoji:'🥤',isFood:false},
  {id:114,cat:'Shakes & Smoothies',name:'Chocolate Banana Shake',price:250,emoji:'🍫',isFood:false},
  {id:115,cat:'Shakes & Smoothies',name:'Strawberry Shake',price:250,emoji:'🍓',isFood:false},
  {id:116,cat:'Shakes & Smoothies',name:'Avocado Shake',price:250,emoji:'🥑',isFood:false},
  {id:117,cat:'Shakes & Smoothies',name:'Banana with Mango Shake',price:250,emoji:'🍌',isFood:false},
  {id:118,cat:'Shakes & Smoothies',name:'Banana with Strawberry Shake',price:250,emoji:'🍓',isFood:false},
  {id:119,cat:'Shakes & Smoothies',name:'Hasset Special Shake',price:300,emoji:'🥤',isFood:false},
  {id:120,cat:'Shakes & Smoothies',name:'Sport Juice',price:270,emoji:'💪',isFood:false},
  {id:121,cat:'Cold Drinks',name:'Lemon Head',price:200,emoji:'🍋',isFood:false},
  {id:122,cat:'Cold Drinks',name:'Ice Coffee',price:200,emoji:'☕',isFood:false},
  {id:123,cat:'Cold Drinks',name:'Ice Tea',price:200,emoji:'🍵',isFood:false},
  {id:124,cat:'Cold Drinks',name:'Lemon Mojitos',price:200,emoji:'🍹',isFood:false},
  {id:125,cat:'Cold Drinks',name:'Strawberry Mojitos',price:250,emoji:'🍓',isFood:false},
  {id:126,cat:'Cold Drinks',name:'Watermelon Mojitos',price:200,emoji:'🍉',isFood:false},
  {id:127,cat:'Cold Drinks',name:'Soft Drink',price:70,emoji:'🥤',isFood:false},
  {id:128,cat:'Cold Drinks',name:'Water 1/2 lit',price:50,emoji:'💧',isFood:false},
  {id:129,cat:'Cold Drinks',name:'Water 1 lit',price:65,emoji:'💧',isFood:false},
  {id:130,cat:'Hot Drinks',name:'Tea',price:40,emoji:'🍵',isFood:false},
  {id:131,cat:'Hot Drinks',name:'Macciato',price:90,emoji:'☕',isFood:false},
  {id:132,cat:'Hot Drinks',name:'Special Tea with Alcohol',price:130,emoji:'🍵',isFood:false},
  {id:133,cat:'Hot Drinks',name:'Special Tea Non-Alcohol',price:115,emoji:'🍵',isFood:false},
  {id:134,cat:'Hot Drinks',name:'Keshir',price:70,emoji:'🍵',isFood:false},
  {id:135,cat:'Hot Drinks',name:'Keshir with Honey',price:100,emoji:'🍯',isFood:false},
  {id:136,cat:'Hot Drinks',name:'Cappuccino',price:120,emoji:'☕',isFood:false},
  {id:137,cat:'Hot Drinks',name:'Espresso',price:70,emoji:'☕',isFood:false},
  {id:138,cat:'Hot Drinks',name:'Flavor Tea',price:90,emoji:'🍵',isFood:false},
  {id:139,cat:'Hot Drinks',name:'Fruit Tea',price:90,emoji:'🍵',isFood:false},
  {id:140,cat:'Hot Drinks',name:'Coffee',price:70,emoji:'☕',isFood:false},
  {id:141,cat:'Hot Drinks',name:'Hot Chocolate',price:120,emoji:'🍫',isFood:false},
  {id:142,cat:'Hot Drinks',name:'Lemon Tea',price:70,emoji:'🍋',isFood:false},
  {id:143,cat:'Hot Drinks',name:'Fasting Machiato',price:110,emoji:'☕',isFood:false},
  {id:144,cat:'Hot Drinks',name:'Milk',price:100,emoji:'🥛',isFood:false},
  {id:145,cat:'Hot Drinks',name:'Latte',price:120,emoji:'☕',isFood:false},
  {id:146,cat:'Alcohol',name:'Beer',price:100,emoji:'🍺',isFood:false},
  {id:147,cat:'Alcohol',name:'Heineken',price:120,emoji:'🍺',isFood:false},
  {id:148,cat:'Alcohol',name:'Arada',price:120,emoji:'🍺',isFood:false},
  {id:149,cat:'Alcohol',name:'Draft',price:60,emoji:'🍺',isFood:false},
  {id:150,cat:'Alcohol',name:'Awash Tekeshino',price:1200,emoji:'🥃',isFood:false},
  {id:151,cat:'Alcohol',name:'Awash Wine',price:800,emoji:'🍷',isFood:false},
  {id:152,cat:'Alcohol',name:'Guder Wine',price:800,emoji:'🍷',isFood:false},
  {id:153,cat:'Alcohol',name:'Axumawit Wine',price:900,emoji:'🍷',isFood:false},
  {id:154,cat:'Alcohol',name:'Gebeta Wine',price:1000,emoji:'🍷',isFood:false},
  {id:155,cat:'Alcohol',name:'Accia Wine',price:1500,emoji:'🍷',isFood:false},
  {id:156,cat:'Alcohol',name:'Kemila Wine',price:1200,emoji:'🍷',isFood:false},
  {id:157,cat:'Alcohol',name:'Habesha Areke (cc)',price:50,emoji:'🥃',isFood:false},
  {id:158,cat:'Alcohol',name:'Habesha Areke (lit)',price:800,emoji:'🥃',isFood:false},
  // Misc
  {id:159,cat:'Yogurt',name:'Normal Yoghurt',price:150,emoji:'🫙',isFood:true},
  {id:160,cat:'Yogurt',name:'Flavor Yoghurt',price:180,emoji:'🫙',isFood:true},
  {id:161,cat:'Extras',name:'Injera',price:50,emoji:'🫓',isFood:true},
  {id:162,cat:'Extras',name:'Bread',price:30,emoji:'🍞',isFood:true},
  {id:163,cat:'Extras',name:'Egg',price:40,emoji:'🥚',isFood:true},
];

// ── Default inventory ──────────────────────────────────────
const DEFAULT_INVENTORY = [
  {id:'inv1',name:'Injera',unit:'pcs',qty:200,low:50},
  {id:'inv2',name:'Teff Flour',unit:'kg',qty:20,low:5},
  {id:'inv3',name:'Chicken',unit:'kg',qty:15,low:3},
  {id:'inv4',name:'Beef',unit:'kg',qty:12,low:3},
  {id:'inv5',name:'Fish',unit:'kg',qty:8,low:2},
  {id:'inv6',name:'Eggs',unit:'pcs',qty:120,low:30},
  {id:'inv7',name:'Tomatoes',unit:'kg',qty:10,low:3},
  {id:'inv8',name:'Onions',unit:'kg',qty:8,low:2},
  {id:'inv9',name:'Cooking Oil',unit:'L',qty:10,low:2},
  {id:'inv10',name:'Mozzarella Cheese',unit:'kg',qty:5,low:1},
  {id:'inv11',name:'Pizza Dough',unit:'pcs',qty:30,low:10},
  {id:'inv12',name:'Spaghetti',unit:'kg',qty:8,low:2},
  {id:'inv13',name:'Coffee Beans',unit:'kg',qty:5,low:1},
  {id:'inv14',name:'Milk',unit:'L',qty:20,low:5},
  {id:'inv15',name:'Avocado',unit:'pcs',qty:40,low:10},
  {id:'inv16',name:'Mango',unit:'pcs',qty:30,low:10},
  {id:'inv17',name:'Banana',unit:'pcs',qty:50,low:15},
  {id:'inv18',name:'Beer (cases)',unit:'case',qty:10,low:2},
  {id:'inv19',name:'Wine (bottles)',unit:'btl',qty:24,low:6},
  {id:'inv20',name:'Bread',unit:'pcs',qty:40,low:10},
];

// ── Order Status Flow ──────────────────────────────────────
// pending → kitchen (food) / bar (drinks) → ready → served → paid
const STATUS = {
  PENDING:  'pending',
  KITCHEN:  'kitchen',
  BAR:      'bar',
  READY:    'ready',
  SERVED:   'served',
  PAID:     'paid',
  CANCELLED:'cancelled',
};

// ── Store API ──────────────────────────────────────────────
const Store = {
  _channel: null,
  _listeners: [],

  init() {
    this._channel = new BroadcastChannel(BC_NAME);
    this._channel.onmessage = (e) => {
      this._listeners.forEach(fn => fn(e.data));
    };
    if (!localStorage.getItem(INV_KEY)) {
      localStorage.setItem(INV_KEY, JSON.stringify(DEFAULT_INVENTORY));
    }
    if (!localStorage.getItem(STORE_KEY)) {
      localStorage.setItem(STORE_KEY, JSON.stringify([]));
    }
  },

  // Broadcast to all other tabs
  broadcast(type, payload) {
    this._channel && this._channel.postMessage({ type, payload, ts: Date.now() });
  },

  onUpdate(fn) { this._listeners.push(fn); },

  // ── Orders ──
  getOrders() {
    return JSON.parse(localStorage.getItem(STORE_KEY) || '[]');
  },
  saveOrders(orders) {
    localStorage.setItem(STORE_KEY, JSON.stringify(orders));
    this.broadcast('orders_updated', orders);
  },
  addOrder(order) {
    const orders = this.getOrders();
    order.id = 'ORD-' + Date.now();
    order.createdAt = Date.now();
    order.status = STATUS.PENDING;
    order.kitchenItems = order.items.filter(i => {
      const m = MENU_DATA.find(x => x.id === i.menuId);
      return m && m.isFood;
    });
    order.barItems = order.items.filter(i => {
      const m = MENU_DATA.find(x => x.id === i.menuId);
      return m && !m.isFood;
    });
    order.kitchenStatus = order.kitchenItems.length > 0 ? STATUS.KITCHEN : 'na';
    order.barStatus = order.barItems.length > 0 ? STATUS.BAR : 'na';
    orders.unshift(order);
    this.saveOrders(orders);
    this.broadcast('new_order', order);
    return order;
  },
  updateOrder(id, changes) {
    const orders = this.getOrders();
    const idx = orders.findIndex(o => o.id === id);
    if (idx > -1) {
      orders[idx] = { ...orders[idx], ...changes, updatedAt: Date.now() };
      this.saveOrders(orders);
      this.broadcast('order_updated', orders[idx]);
      return orders[idx];
    }
  },
  getOrder(id) {
    return this.getOrders().find(o => o.id === id);
  },
  deleteOrder(id) {
    const orders = this.getOrders().filter(o => o.id !== id);
    this.saveOrders(orders);
  },
  getTodayOrders() {
    const start = new Date(); start.setHours(0,0,0,0);
    return this.getOrders().filter(o => o.createdAt >= start.getTime());
  },

  // ── Inventory ──
  getInventory() {
    return JSON.parse(localStorage.getItem(INV_KEY) || '[]');
  },
  saveInventory(inv) {
    localStorage.setItem(INV_KEY, JSON.stringify(inv));
    this.broadcast('inventory_updated', inv);
  },
  updateInventoryItem(id, changes) {
    const inv = this.getInventory();
    const idx = inv.findIndex(i => i.id === id);
    if (idx > -1) {
      inv[idx] = { ...inv[idx], ...changes };
      this.saveInventory(inv);
    }
  },
  addInventoryItem(item) {
    const inv = this.getInventory();
    item.id = 'inv' + Date.now();
    inv.push(item);
    this.saveInventory(inv);
  },

  // ── Helpers ──
  menuItem(id) { return MENU_DATA.find(m => m.id === id); },
  formatTime(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleTimeString('en-ET', {hour:'2-digit', minute:'2-digit'});
  },
  formatDate(ts) {
    if (!ts) return '';
    return new Date(ts).toLocaleDateString('en-ET');
  },
  elapsed(ts) {
    const m = Math.floor((Date.now() - ts) / 60000);
    if (m < 1) return 'just now';
    if (m < 60) return m + 'm ago';
    return Math.floor(m/60) + 'h ' + (m%60) + 'm ago';
  },
  orderTotal(order) {
    return order.items.reduce((s,i) => s + i.price * i.qty, 0);
  },
};

// ── Audio Notification ─────────────────────────────────────
const Audio = {
  ctx: null,
  getCtx() {
    if (!this.ctx) this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    return this.ctx;
  },
  playNewOrder() {
    try {
      const ctx = this.getCtx();
      // Three ascending beeps
      [440, 550, 660].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = freq;
        osc.type = 'sine';
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.18);
        gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + i * 0.18 + 0.02);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + i * 0.18 + 0.15);
        osc.start(ctx.currentTime + i * 0.18);
        osc.stop(ctx.currentTime + i * 0.18 + 0.2);
      });
    } catch (e) { console.log('Audio not available'); }
  },
  playDone() {
    try {
      const ctx = this.getCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.frequency.value = 880;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.4, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.3);
      osc.start(); osc.stop(ctx.currentTime + 0.3);
    } catch (e) { console.log('Audio not available'); }
  }
};
