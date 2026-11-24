const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { DatabaseSync } = require("node:sqlite");

const ROOT = __dirname;
const WEB_ROOT = path.join(ROOT, "website");
const DATA_DIR = path.join(ROOT, "data");
const PORT = Number(process.env.PORT || 5500);
const HOST = process.env.HOST || (process.env.RENDER ? "0.0.0.0" : "127.0.0.1");
fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = process.env.BOOKLY_DB ? path.resolve(process.env.BOOKLY_DB) : path.join(DATA_DIR, "bookly.db");
const db = new DatabaseSync(DB_PATH);
db.exec("PRAGMA foreign_keys = ON; PRAGMA journal_mode = WAL;");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    password_salt TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('customer','provider','admin')),
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active','pending','suspended')),
    phone TEXT DEFAULT '',
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS providers (
    id TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
    category TEXT NOT NULL,
    cat TEXT NOT NULL,
    location TEXT NOT NULL,
    badge TEXT NOT NULL DEFAULT 'New provider',
    image TEXT NOT NULL DEFAULT 'photo-1472099645785-5658abf4ff4e',
    cover TEXT NOT NULL DEFAULT 'photo-1558618666-fcd25c85cd64',
    description TEXT NOT NULL DEFAULT '',
    headline TEXT NOT NULL DEFAULT '',
    bio TEXT NOT NULL DEFAULT '',
    hourly_rate REAL NOT NULL DEFAULT 500,
    rating REAL NOT NULL DEFAULT 5,
    reviews_count INTEGER NOT NULL DEFAULT 0,
    availability TEXT NOT NULL DEFAULT 'Monday-Friday, 9:00 AM-5:00 PM',
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('active','pending','inactive'))
  );
  CREATE TABLE IF NOT EXISTS services (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    price_per_hour REAL NOT NULL,
    active INTEGER NOT NULL DEFAULT 1
  );
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    expires_at TEXT NOT NULL
  );
  CREATE TABLE IF NOT EXISTS bookings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    confirmation TEXT NOT NULL UNIQUE,
    customer_id INTEGER NOT NULL REFERENCES users(id),
    provider_id TEXT NOT NULL REFERENCES providers(id),
    service_id INTEGER REFERENCES services(id),
    service_name TEXT NOT NULL,
    scheduled_date TEXT NOT NULL,
    hours INTEGER NOT NULL CHECK(hours BETWEEN 1 AND 8),
    notes TEXT NOT NULL DEFAULT '',
    address TEXT NOT NULL,
    fulfilment TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    subtotal REAL NOT NULL,
    protection_fee REAL NOT NULL DEFAULT 99,
    shipping_cost REAL NOT NULL DEFAULT 0,
    total REAL NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending','confirmed','declined','completed','cancelled')),
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
  );
  CREATE TABLE IF NOT EXISTS wishlist (
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider_id TEXT NOT NULL REFERENCES providers(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, provider_id)
  );
  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

function passwordRecord(password, salt = crypto.randomBytes(16).toString("hex")) {
  return { salt, hash: crypto.scryptSync(password, salt, 64).toString("hex") };
}

function verifyPassword(password, salt, expected) {
  const actual = crypto.scryptSync(password, salt, 64);
  const wanted = Buffer.from(expected, "hex");
  return actual.length === wanted.length && crypto.timingSafeEqual(actual, wanted);
}

function slugify(value) {
  return value.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function createUser({ firstName, lastName, email, password, role, status = "active", phone = "" }) {
  const { salt, hash } = passwordRecord(password);
  const result = db.prepare(`INSERT INTO users (first_name,last_name,email,password_hash,password_salt,role,status,phone)
    VALUES (?,?,?,?,?,?,?,?)`).run(firstName, lastName, email.toLowerCase(), hash, salt, role, status, phone);
  return Number(result.lastInsertRowid);
}

function seed() {
  const count = db.prepare("SELECT COUNT(*) AS count FROM users").get().count;
  if (count) return;
  const adminId = createUser({ firstName: "Alex", lastName: "Morgan", email: "admin@bookly.local", password: "Admin123!", role: "admin" });
  createUser({ firstName: "Jamie", lastName: "Customer", email: "user@bookly.local", password: "User123!", role: "customer" });
  const providerSeeds = [
    { id:"maria", first:"Maria", last:"Santos", email:"provider@bookly.local", password:"Provider123!", category:"Home Cleaning", cat:"cleaning", location:"North District", badge:"Top Rated", image:"photo-1531746020798-e6953c6e8e04", cover:"photo-1581578731548-c64695cc6952", description:"Eco-friendly home cleaning with meticulous attention to detail.", headline:"A spotless home, without losing your weekend.", bio:"Experienced, detail-focused home care using thoughtful methods and reliable equipment.", rate:450, rating:4.9, reviews:124, services:["Deep Cleaning","General Cleaning","Move-in / Move-out"] },
    { id:"david", first:"David", last:"Okafor", email:"david@bookly.local", password:"Provider123!", category:"Home Cleaning", cat:"cleaning", location:"East Side", badge:"Verified", image:"photo-1472099645785-5658abf4ff4e", cover:"photo-1558618666-fcd25c85cd64", description:"Reliable residential cleaning with all equipment included.", headline:"Reliable care for homes that deserve attention.", bio:"Reliable residential cleaning with flexible weekday availability.", rate:400, rating:4.7, reviews:89, services:["General Cleaning","Deep Cleaning","Office Cleaning"] },
    { id:"robert", first:"Robert", last:"Chen", email:"robert@bookly.local", password:"Provider123!", category:"Home Repair", cat:"repair", location:"West Quarter", badge:"Verified Pro", image:"photo-1566492031773-4f4e44671857", cover:"photo-1504148455328-c376907d081c", description:"Licensed carpenter and handyman for repairs and installations.", headline:"Thoughtful repairs, finished properly the first time.", bio:"Licensed carpenter and practical problem-solver with twelve years of experience.", rate:650, rating:4.8, reviews:67, services:["Carpentry","Furniture Assembly","Shelving Installation"] },
    { id:"aisha", first:"Aisha", last:"Patel", email:"aisha@bookly.local", password:"Provider123!", category:"Tutoring", cat:"tutoring", location:"Central", badge:"Top Rated", image:"photo-1573496359142-b8d87734a5a2", cover:"photo-1503676260728-1c00da094a0b", description:"Former teacher offering tailored maths and science sessions.", headline:"Build confidence with lessons shaped around you.", bio:"Supportive one-to-one teaching shaped around each learner's goals.", rate:500, rating:5.0, reviews:53, services:["GCSE Maths","A-Level Maths","Science Tutoring"] },
    { id:"thomas", first:"Thomas", last:"Wright", email:"thomas@bookly.local", password:"Provider123!", category:"Technology Support", cat:"tech", location:"North District", badge:"Verified", image:"photo-1560250097-0b93528c311a", cover:"photo-1518770660439-4636190af475", description:"Friendly IT support explained clearly and without jargon.", headline:"Technology fixed, explained, and made less stressful.", bio:"Friendly technical help for homes and small businesses.", rate:700, rating:4.6, reviews:41, services:["Computer Repair","Wi-Fi Setup","Device Setup"] },
    { id:"yuki", first:"Yuki", last:"Tanaka", email:"yuki@bookly.local", password:"Provider123!", category:"Tutoring", cat:"tutoring", location:"South Side", badge:"Top Rated", image:"photo-1580489944761-15a19d654956", cover:"photo-1523240795612-9a054b0db644", description:"Warm, practical English and Japanese language tutoring.", headline:"Language lessons that turn practice into progress.", bio:"Warm, practical language tutoring for learners of all levels.", rate:450, rating:4.9, reviews:78, services:["English Language","English Literature","Beginner Japanese"] }
  ];
  const insertProvider = db.prepare(`INSERT INTO providers (id,user_id,category,cat,location,badge,image,cover,description,headline,bio,hourly_rate,rating,reviews_count,status)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?, 'active')`);
  const insertService = db.prepare("INSERT INTO services (provider_id,name,description,price_per_hour) VALUES (?,?,?,?)");
  for (const p of providerSeeds) {
    const userId = createUser({ firstName:p.first, lastName:p.last, email:p.email, password:p.password, role:"provider" });
    insertProvider.run(p.id,userId,p.category,p.cat,p.location,p.badge,p.image,p.cover,p.description,p.headline,p.bio,p.rate,p.rating,p.reviews);
    p.services.forEach((name) => insertService.run(p.id,name,`${name} with ${p.first} ${p.last}`,p.rate));
  }
  db.prepare("INSERT OR REPLACE INTO settings (key,value) VALUES ('store_name','Bookly'),('support_email','support@bookly.local')").run();
  console.log(`Seeded Bookly database (admin user ${adminId}).`);
}
seed();

const mime = { ".html":"text/html; charset=utf-8", ".css":"text/css; charset=utf-8", ".js":"text/javascript; charset=utf-8", ".json":"application/json; charset=utf-8", ".png":"image/png", ".jpg":"image/jpeg", ".jpeg":"image/jpeg", ".svg":"image/svg+xml", ".ico":"image/x-icon" };
const publicUser = (u) => u && ({ id:u.id, firstName:u.first_name, lastName:u.last_name, name:`${u.first_name} ${u.last_name}`, email:u.email, role:u.role, status:u.status, phone:u.phone });
const json = (res, status, body, headers = {}) => { res.writeHead(status, { "Content-Type":"application/json; charset=utf-8", "Cache-Control":"no-store", ...headers }); res.end(JSON.stringify(body)); };
const parseCookies = (req) => Object.fromEntries((req.headers.cookie || "").split(";").filter(Boolean).map((part) => { const i=part.indexOf("="); return [part.slice(0,i).trim(), decodeURIComponent(part.slice(i+1))]; }));
const readBody = (req) => new Promise((resolve,reject) => { let raw=""; req.on("data",c => { raw += c; if(raw.length>1_000_000) reject(new Error("Request too large")); }); req.on("end",() => { try { resolve(raw ? JSON.parse(raw) : {}); } catch { reject(new Error("Invalid JSON")); } }); req.on("error",reject); });
const getUser = (req) => {
  const token = parseCookies(req).bookly_session;
  if (!token) return null;
  return db.prepare(`SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>datetime('now')`).get(token) || null;
};
const requireUser = (req,res,roles=[]) => { const user=getUser(req); if(!user){ json(res,401,{error:"Please log in to continue."}); return null; } if(roles.length && !roles.includes(user.role)){ json(res,403,{error:"You do not have permission to access this area."}); return null; } if(user.status!=="active"){ json(res,403,{error:"This account is not active."}); return null; } return user; };
const sessionCookie = (token,maxAge=60*60*24*7) => `bookly_session=${encodeURIComponent(token)}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
const providerSelect = `SELECT p.*, u.first_name, u.last_name, u.email FROM providers p JOIN users u ON u.id=p.user_id`;
const shapeProvider = (p) => ({ id:p.id,name:`${p.first_name} ${p.last_name}`,email:p.email,category:p.category,cat:p.cat,location:p.location,badge:p.badge,image:p.image,cover:p.cover,description:p.description,headline:p.headline,bio:p.bio,price:p.hourly_rate,rating:p.rating,reviews:p.reviews_count,availability:p.availability,status:p.status,services:db.prepare("SELECT id,name,description,price_per_hour AS price FROM services WHERE provider_id=? AND active=1 ORDER BY id").all(p.id) });

async function api(req,res,url) {
  const method=req.method;
  const route=url.pathname;
  try {
    if(route==="/api/health" && method==="GET") return json(res,200,{ok:true,database:"sqlite",time:new Date().toISOString()});
    if(route==="/api/auth/me" && method==="GET") return json(res,200,{user:publicUser(getUser(req))});
    if(route==="/api/auth/register" && method==="POST") {
      const b=await readBody(req); const firstName=String(b.firstName||"").trim(); const lastName=String(b.lastName||"").trim(); const email=String(b.email||"").trim().toLowerCase(); const password=String(b.password||""); const role=b.role==="provider"?"provider":"customer";
      if(!firstName||!lastName||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json(res,400,{error:"Enter a valid name and email address."});
      if(password.length<8||!/[0-9]/.test(password)||!/[!@#$%^&*]/.test(password)) return json(res,400,{error:"Password must contain 8+ characters, a number, and a symbol."});
      if(db.prepare("SELECT 1 FROM users WHERE email=?").get(email)) return json(res,409,{error:"An account already exists for this email."});
      const status=role==="provider"?"pending":"active"; const id=createUser({firstName,lastName,email,password,role,status,phone:String(b.phone||"")});
      if(role==="provider") { const pid=`provider-${id}`; db.prepare(`INSERT INTO providers (id,user_id,category,cat,location,description,headline,bio,hourly_rate,status) VALUES (?,?,?,?,?,?,?,?,?, 'pending')`).run(pid,id,String(b.category||"Other Services"),slugify(String(b.category||"other")),String(b.location||"Local area"),"New provider application","Ready to help local customers.",String(b.bio||""),Number(b.hourlyRate||500)); }
      if(status!=="active") return json(res,201,{message:"Provider application created. An administrator must approve it before login.",pending:true});
      const token=crypto.randomBytes(32).toString("hex"); db.prepare("INSERT INTO sessions VALUES (?,?,datetime('now','+7 days'))").run(token,id); const user=db.prepare("SELECT * FROM users WHERE id=?").get(id); return json(res,201,{user:publicUser(user)},{"Set-Cookie":sessionCookie(token)});
    }
    if(route==="/api/auth/login" && method==="POST") {
      const b=await readBody(req); const user=db.prepare("SELECT * FROM users WHERE email=?").get(String(b.email||"").trim().toLowerCase());
      if(!user||!verifyPassword(String(b.password||""),user.password_salt,user.password_hash)) return json(res,401,{error:"Incorrect email or password."});
      if(user.status!=="active") return json(res,403,{error:user.status==="pending"?"Your provider account is awaiting administrator approval.":"Your account is suspended."});
      db.prepare("DELETE FROM sessions WHERE expires_at<=datetime('now')").run(); const token=crypto.randomBytes(32).toString("hex"); db.prepare("INSERT INTO sessions VALUES (?,?,datetime('now','+7 days'))").run(token,user.id); return json(res,200,{user:publicUser(user)},{"Set-Cookie":sessionCookie(token)});
    }
    if(route==="/api/auth/logout" && method==="POST") { const token=parseCookies(req).bookly_session; if(token) db.prepare("DELETE FROM sessions WHERE token=?").run(token); return json(res,200,{ok:true},{"Set-Cookie":sessionCookie("",0)}); }
    if(route==="/api/auth/profile" && method==="PATCH") { const user=requireUser(req,res); if(!user)return; const b=await readBody(req); db.prepare("UPDATE users SET first_name=?,last_name=?,phone=? WHERE id=?").run(String(b.firstName||user.first_name).trim(),String(b.lastName||user.last_name).trim(),String(b.phone||user.phone||"").trim(),user.id); return json(res,200,{user:publicUser(db.prepare("SELECT * FROM users WHERE id=?").get(user.id))}); }
    if(route==="/api/auth/password" && method==="PATCH") { const user=requireUser(req,res); if(!user)return; const b=await readBody(req); if(!verifyPassword(String(b.currentPassword||""),user.password_salt,user.password_hash)) return json(res,400,{error:"Current password is incorrect."}); if(String(b.newPassword||"").length<8||!/[0-9]/.test(b.newPassword)||!/[!@#$%^&*]/.test(b.newPassword)) return json(res,400,{error:"New password must contain 8+ characters, a number, and a symbol."}); const pr=passwordRecord(b.newPassword); db.prepare("UPDATE users SET password_hash=?,password_salt=? WHERE id=?").run(pr.hash,pr.salt,user.id); db.prepare("DELETE FROM sessions WHERE user_id=? AND token<>?").run(user.id,parseCookies(req).bookly_session||""); return json(res,200,{ok:true}); }

    if(route==="/api/providers" && method==="GET") { const rows=db.prepare(`${providerSelect} WHERE p.status='active' ORDER BY p.rating DESC,p.reviews_count DESC`).all(); return json(res,200,{providers:rows.map(shapeProvider)}); }
    const providerMatch=route.match(/^\/api\/providers\/([^/]+)$/);
    if(providerMatch && method==="GET") { const p=db.prepare(`${providerSelect} WHERE p.id=? AND p.status='active'`).get(decodeURIComponent(providerMatch[1])); if(!p)return json(res,404,{error:"Provider not found."}); return json(res,200,{provider:shapeProvider(p)}); }

    if(route==="/api/wishlist" && method==="GET") { const user=requireUser(req,res,["customer"]); if(!user)return; const rows=db.prepare(`${providerSelect} JOIN wishlist w ON w.provider_id=p.id WHERE w.user_id=? AND p.status='active'`).all(user.id); return json(res,200,{providers:rows.map(shapeProvider)}); }
    const wishMatch=route.match(/^\/api\/wishlist\/([^/]+)$/);
    if(wishMatch && method==="POST") { const user=requireUser(req,res,["customer"]); if(!user)return; db.prepare("INSERT OR IGNORE INTO wishlist VALUES (?,?)").run(user.id,wishMatch[1]); return json(res,201,{ok:true}); }
    if(wishMatch && method==="DELETE") { const user=requireUser(req,res,["customer"]); if(!user)return; db.prepare("DELETE FROM wishlist WHERE user_id=? AND provider_id=?").run(user.id,wishMatch[1]); return json(res,200,{ok:true}); }

    if(route==="/api/bookings" && method==="POST") {
      const user=requireUser(req,res,["customer"]); if(!user)return; const b=await readBody(req); if(!Array.isArray(b.items)||!b.items.length) return json(res,400,{error:"Your booking cart is empty."});
      if(!String(b.address||"").trim()) return json(res,400,{error:"A service or delivery address is required."});
      const fulfilment=String(b.fulfilment||"standard"); const shippingCost=fulfilment==="priority"?299:0; const payment=String(b.paymentMethod||""); if(!["card","ewallet","cod"].includes(payment)) return json(res,400,{error:"Choose a payment method."});
      const created=[]; db.exec("BEGIN");
      try { for(let i=0;i<b.items.length;i++){ const item=b.items[i]; const provider=db.prepare("SELECT * FROM providers WHERE id=? AND status='active'").get(String(item.providerId)); if(!provider) throw new Error("A selected provider is unavailable."); const date=String(item.date||""); if(!/^\d{4}-\d{2}-\d{2}$/.test(date)||new Date(`${date}T23:59:59`)<new Date()) throw new Error("Choose a valid future booking date."); const conflict=db.prepare("SELECT 1 FROM bookings WHERE provider_id=? AND scheduled_date=? AND status NOT IN ('declined','cancelled')").get(provider.id,date); if(conflict) throw new Error(`${provider.id} is already booked on that date. Choose another date.`); const service=db.prepare("SELECT * FROM services WHERE provider_id=? AND (id=? OR name=?) AND active=1 ORDER BY id LIMIT 1").get(provider.id,Number(item.serviceId||0),String(item.service||"")); if(!service) throw new Error("A selected service is unavailable."); const hours=Math.max(1,Math.min(8,Number(item.hours||1))); const subtotal=Number(service.price_per_hour)*hours; const fee=99; const ship=i===0?shippingCost:0; const total=subtotal+fee+ship; const confirmation=`BK-${Date.now().toString().slice(-6)}${i}`; const result=db.prepare(`INSERT INTO bookings (confirmation,customer_id,provider_id,service_id,service_name,scheduled_date,hours,notes,address,fulfilment,payment_method,subtotal,protection_fee,shipping_cost,total) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`).run(confirmation,user.id,provider.id,service.id,service.name,date,hours,String(item.notes||""),String(b.address).trim(),fulfilment,payment,subtotal,fee,ship,total); created.push({id:Number(result.lastInsertRowid),confirmation,total}); } db.exec("COMMIT"); } catch(error){ db.exec("ROLLBACK"); throw error; }
      return json(res,201,{message:"Booking submitted to the provider.",bookings:created,confirmation:created[0].confirmation});
    }
    if(route==="/api/customer/bookings" && method==="GET") { const user=requireUser(req,res,["customer"]); if(!user)return; const rows=db.prepare(`SELECT b.*, u.first_name||' '||u.last_name AS provider_name,p.image,p.category FROM bookings b JOIN providers p ON p.id=b.provider_id JOIN users u ON u.id=p.user_id WHERE b.customer_id=? ORDER BY b.created_at DESC,b.id DESC`).all(user.id); return json(res,200,{bookings:rows}); }
    const cancelMatch=route.match(/^\/api\/customer\/bookings\/(\d+)\/cancel$/);
    if(cancelMatch && method==="PATCH") { const user=requireUser(req,res,["customer"]); if(!user)return; const result=db.prepare("UPDATE bookings SET status='cancelled',updated_at=CURRENT_TIMESTAMP WHERE id=? AND customer_id=? AND status IN ('pending','confirmed')").run(Number(cancelMatch[1]),user.id); if(!result.changes)return json(res,400,{error:"This booking cannot be cancelled."}); return json(res,200,{ok:true}); }

    if(route==="/api/provider/dashboard" && method==="GET") { const user=requireUser(req,res,["provider"]); if(!user)return; const p=db.prepare(`${providerSelect} WHERE p.user_id=?`).get(user.id); const bookings=db.prepare(`SELECT b.*,u.first_name||' '||u.last_name AS customer_name,u.email AS customer_email FROM bookings b JOIN users u ON u.id=b.customer_id WHERE b.provider_id=? ORDER BY b.scheduled_date,b.created_at DESC`).all(p.id); const stats=db.prepare(`SELECT COUNT(*) AS total,SUM(CASE WHEN status='pending' THEN 1 ELSE 0 END) AS pending,SUM(CASE WHEN status='completed' THEN total ELSE 0 END) AS earnings FROM bookings WHERE provider_id=?`).get(p.id); return json(res,200,{provider:shapeProvider(p),bookings,stats}); }
    if(route==="/api/provider/profile" && method==="PATCH") { const user=requireUser(req,res,["provider"]); if(!user)return; const b=await readBody(req); db.prepare(`UPDATE providers SET category=?,cat=?,location=?,description=?,headline=?,bio=?,hourly_rate=?,availability=? WHERE user_id=?`).run(String(b.category||"Other Services"),slugify(String(b.category||"other")),String(b.location||"Local area"),String(b.description||""),String(b.headline||""),String(b.bio||""),Number(b.hourlyRate||500),String(b.availability||"Monday-Friday, 9:00 AM-5:00 PM"),user.id); return json(res,200,{ok:true}); }
    if(route==="/api/provider/services" && method==="POST") { const user=requireUser(req,res,["provider"]); if(!user)return; const p=db.prepare("SELECT id FROM providers WHERE user_id=?").get(user.id); const b=await readBody(req); if(!String(b.name||"").trim()||Number(b.price)<=0)return json(res,400,{error:"Service name and valid price are required."}); const result=db.prepare("INSERT INTO services (provider_id,name,description,price_per_hour) VALUES (?,?,?,?)").run(p.id,String(b.name).trim(),String(b.description||""),Number(b.price)); return json(res,201,{id:Number(result.lastInsertRowid)}); }
    const providerService=route.match(/^\/api\/provider\/services\/(\d+)$/);
    if(providerService && method==="PATCH") { const user=requireUser(req,res,["provider"]); if(!user)return; const p=db.prepare("SELECT id FROM providers WHERE user_id=?").get(user.id); const b=await readBody(req); const result=db.prepare("UPDATE services SET name=?,description=?,price_per_hour=?,active=? WHERE id=? AND provider_id=?").run(String(b.name||""),String(b.description||""),Number(b.price||0),b.active===false?0:1,Number(providerService[1]),p.id); if(!result.changes)return json(res,404,{error:"Service not found."}); return json(res,200,{ok:true}); }
    if(providerService && method==="DELETE") { const user=requireUser(req,res,["provider"]); if(!user)return; const p=db.prepare("SELECT id FROM providers WHERE user_id=?").get(user.id); db.prepare("UPDATE services SET active=0 WHERE id=? AND provider_id=?").run(Number(providerService[1]),p.id); return json(res,200,{ok:true}); }
    const providerBooking=route.match(/^\/api\/provider\/bookings\/(\d+)$/);
    if(providerBooking && method==="PATCH") { const user=requireUser(req,res,["provider"]); if(!user)return; const p=db.prepare("SELECT id FROM providers WHERE user_id=?").get(user.id); const b=await readBody(req); const status=String(b.status||""); if(!["confirmed","declined","completed"].includes(status))return json(res,400,{error:"Invalid booking status."}); const result=db.prepare("UPDATE bookings SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND provider_id=?").run(status,Number(providerBooking[1]),p.id); if(!result.changes)return json(res,404,{error:"Booking not found."}); return json(res,200,{ok:true}); }

    if(route==="/api/admin/dashboard" && method==="GET") { const user=requireUser(req,res,["admin"]); if(!user)return; const summary={ revenue:db.prepare("SELECT COALESCE(SUM(total),0) AS value FROM bookings WHERE status='completed'").get().value, openOrders:db.prepare("SELECT COUNT(*) AS value FROM bookings WHERE status IN ('pending','confirmed')").get().value, activeProviders:db.prepare("SELECT COUNT(*) AS value FROM providers WHERE status='active'").get().value, pendingProviders:db.prepare("SELECT COUNT(*) AS value FROM providers WHERE status='pending'").get().value, customers:db.prepare("SELECT COUNT(*) AS value FROM users WHERE role='customer'").get().value }; const recent=db.prepare(`SELECT b.*,u.first_name||' '||u.last_name AS customer_name FROM bookings b JOIN users u ON u.id=b.customer_id ORDER BY b.created_at DESC LIMIT 8`).all(); return json(res,200,{summary,recent}); }
    if(route==="/api/admin/providers" && method==="GET") { const user=requireUser(req,res,["admin"]); if(!user)return; return json(res,200,{providers:db.prepare(`${providerSelect} ORDER BY p.status DESC,u.last_name`).all().map(shapeProvider)}); }
    if(route==="/api/admin/providers" && method==="POST") { const user=requireUser(req,res,["admin"]); if(!user)return; const b=await readBody(req); if(db.prepare("SELECT 1 FROM users WHERE email=?").get(String(b.email||"").toLowerCase()))return json(res,409,{error:"Email already exists."}); const parts=String(b.name||"").trim().split(/\s+/); const firstName=parts.shift()||"Provider"; const lastName=parts.join(" ")||"Account"; const uid=createUser({firstName,lastName,email:String(b.email||"").toLowerCase(),password:String(b.password||"Provider123!"),role:"provider"}); const pid=`${slugify(`${firstName}-${lastName}`)}-${uid}`; db.prepare(`INSERT INTO providers (id,user_id,category,cat,location,description,headline,bio,hourly_rate,status) VALUES (?,?,?,?,?,?,?,?,?,'active')`).run(pid,uid,String(b.category||"Other Services"),slugify(String(b.category||"other")),String(b.location||"Local area"),String(b.description||"New provider"),String(b.headline||"Ready to help."),String(b.bio||""),Number(b.hourlyRate||500)); return json(res,201,{id:pid}); }
    const adminProvider=route.match(/^\/api\/admin\/providers\/([^/]+)$/);
    if(adminProvider && method==="PATCH") { const user=requireUser(req,res,["admin"]); if(!user)return; const b=await readBody(req); const p=db.prepare("SELECT * FROM providers WHERE id=?").get(adminProvider[1]); if(!p)return json(res,404,{error:"Provider not found."}); db.prepare(`UPDATE providers SET category=?,cat=?,location=?,description=?,headline=?,hourly_rate=?,availability=?,status=? WHERE id=?`).run(String(b.category||p.category),slugify(String(b.category||p.category)),String(b.location||p.location),String(b.description||p.description),String(b.headline||p.headline),Number(b.hourlyRate||p.hourly_rate),String(b.availability||p.availability),String(b.status||p.status),p.id); db.prepare("UPDATE users SET status=? WHERE id=?").run((b.status||p.status)==="active"?"active":((b.status||p.status)==="pending"?"pending":"suspended"),p.user_id); return json(res,200,{ok:true}); }
    if(adminProvider && method==="DELETE") { const user=requireUser(req,res,["admin"]); if(!user)return; const p=db.prepare("SELECT user_id FROM providers WHERE id=?").get(adminProvider[1]); if(!p)return json(res,404,{error:"Provider not found."}); db.prepare("UPDATE providers SET status='inactive' WHERE id=?").run(adminProvider[1]); db.prepare("UPDATE users SET status='suspended' WHERE id=?").run(p.user_id); return json(res,200,{ok:true}); }
    if(route==="/api/admin/users" && method==="GET") { const user=requireUser(req,res,["admin"]); if(!user)return; const rows=db.prepare(`SELECT u.id,u.first_name,u.last_name,u.email,u.role,u.status,u.created_at,COUNT(b.id) AS bookings FROM users u LEFT JOIN bookings b ON b.customer_id=u.id GROUP BY u.id ORDER BY u.created_at DESC`).all(); return json(res,200,{users:rows}); }
    const adminUser=route.match(/^\/api\/admin\/users\/(\d+)$/);
    if(adminUser && method==="PATCH") { const user=requireUser(req,res,["admin"]); if(!user)return; const b=await readBody(req); if(Number(adminUser[1])===user.id)return json(res,400,{error:"You cannot suspend your own administrator account."}); if(!["active","pending","suspended"].includes(b.status))return json(res,400,{error:"Invalid account status."}); db.prepare("UPDATE users SET status=? WHERE id=?").run(b.status,Number(adminUser[1])); return json(res,200,{ok:true}); }
    if(route==="/api/admin/bookings" && method==="GET") { const user=requireUser(req,res,["admin"]); if(!user)return; const rows=db.prepare(`SELECT b.*,c.first_name||' '||c.last_name AS customer_name,puser.first_name||' '||puser.last_name AS provider_name FROM bookings b JOIN users c ON c.id=b.customer_id JOIN providers p ON p.id=b.provider_id JOIN users puser ON puser.id=p.user_id ORDER BY b.created_at DESC`).all(); return json(res,200,{bookings:rows}); }
    const adminBooking=route.match(/^\/api\/admin\/bookings\/(\d+)$/);
    if(adminBooking && method==="PATCH") { const user=requireUser(req,res,["admin"]); if(!user)return; const b=await readBody(req); if(!["pending","confirmed","declined","completed","cancelled"].includes(b.status))return json(res,400,{error:"Invalid booking status."}); db.prepare("UPDATE bookings SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?").run(b.status,Number(adminBooking[1])); return json(res,200,{ok:true}); }

    return json(res,404,{error:"API endpoint not found."});
  } catch(error) { console.error(error); if(String(error.message).includes("UNIQUE constraint")) return json(res,409,{error:"That record already exists."}); return json(res,400,{error:error.message||"Request failed."}); }
}

function serveStatic(req,res,url) {
  let pathname=decodeURIComponent(url.pathname);
  if(pathname==="/")pathname="/index.html";
  const filePath=path.resolve(WEB_ROOT,`.${pathname}`);
  if(!filePath.startsWith(WEB_ROOT)) return json(res,403,{error:"Forbidden"});
  fs.stat(filePath,(err,stat)=>{
    if(err||!stat.isFile()){ res.writeHead(404,{"Content-Type":"text/html; charset=utf-8"}); return res.end("<h1>Page not found</h1><p><a href='/'>Return to Bookly</a></p>"); }
    res.writeHead(200,{"Content-Type":mime[path.extname(filePath).toLowerCase()]||"application/octet-stream","Cache-Control":"no-cache"});
    fs.createReadStream(filePath).pipe(res);
  });
}

const server=http.createServer((req,res)=>{ const url=new URL(req.url,`http://${req.headers.host||`${HOST}:${PORT}`}`); if(url.pathname.startsWith("/api/")) return api(req,res,url); serveStatic(req,res,url); });
server.listen(PORT,HOST,()=>console.log(`Bookly is running at http://${HOST}:${PORT}`));
const shutdown=()=>{ server.close(()=>{ db.close(); process.exit(0); }); };
process.on("SIGINT",shutdown);
process.on("SIGTERM",shutdown);
