from __future__ import annotations
import json, os, secrets, sqlite3
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4
from fastapi import FastAPI, Depends, Header, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from hashlib import pbkdf2_hmac

ROOT = Path(__file__).resolve().parent
DB_PATH = Path(os.getenv('FRANCHISE_DB_PATH', ROOT / 'franchiseops.db'))
app = FastAPI(title='FranchiseOps API', version='1.0.0')
app.add_middleware(CORSMiddleware, allow_origins=['http://localhost:5173','http://127.0.0.1:5173'], allow_methods=['*'], allow_headers=['*'])

def db():
    con=sqlite3.connect(DB_PATH); con.row_factory=sqlite3.Row; con.execute('PRAGMA foreign_keys=ON'); return con

def stamp(): return datetime.now(timezone.utc).isoformat()
def hash_password(pw, salt=None):
    salt=salt or secrets.token_bytes(16); return salt.hex()+':'+pbkdf2_hmac('sha256',pw.encode(),salt,180000).hex()
def check_password(pw, encoded):
    try:
        salt,expected=encoded.split(':'); return secrets.compare_digest(pbkdf2_hmac('sha256',pw.encode(),bytes.fromhex(salt),180000).hex(),expected)
    except Exception: return False

def init_db():
    con=db()
    con.executescript('''
    CREATE TABLE IF NOT EXISTS branches(id TEXT PRIMARY KEY,name TEXT NOT NULL,short TEXT,code TEXT NOT NULL UNIQUE,city TEXT NOT NULL,address TEXT NOT NULL,phone TEXT NOT NULL,manager TEXT NOT NULL,status TEXT NOT NULL,revenue REAL NOT NULL DEFAULT 0,orders INTEGER NOT NULL DEFAULT 0,rating REAL NOT NULL DEFAULT 0,opened TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,name TEXT NOT NULL,email TEXT NOT NULL UNIQUE,phone TEXT NOT NULL,role TEXT NOT NULL,branchId TEXT NOT NULL DEFAULT 'all',status TEXT NOT NULL,lastLogin TEXT NOT NULL DEFAULT 'Never',password_hash TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS menu_items(id TEXT PRIMARY KEY,name TEXT NOT NULL,category TEXT NOT NULL,price REAL NOT NULL,emoji TEXT,description TEXT,veg INTEGER NOT NULL,sold INTEGER NOT NULL DEFAULT 0,branches TEXT NOT NULL,available INTEGER NOT NULL DEFAULT 1,image TEXT NOT NULL DEFAULT '');
    CREATE TABLE IF NOT EXISTS orders(id TEXT PRIMARY KEY,customer TEXT NOT NULL,phone TEXT NOT NULL,branchId TEXT NOT NULL,type TEXT NOT NULL,payment TEXT NOT NULL,status TEXT NOT NULL,subtotal REAL NOT NULL,tax REAL NOT NULL,total REAL NOT NULL,date TEXT NOT NULL,FOREIGN KEY(branchId) REFERENCES branches(id));
    CREATE TABLE IF NOT EXISTS order_items(id INTEGER PRIMARY KEY AUTOINCREMENT,order_id TEXT NOT NULL,itemId TEXT NOT NULL,name TEXT NOT NULL,price REAL NOT NULL,qty INTEGER NOT NULL,FOREIGN KEY(order_id) REFERENCES orders(id) ON DELETE CASCADE);
    CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT NOT NULL,expires_at TEXT NOT NULL,FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE);
    ''')
    if con.execute('SELECT COUNT(*) FROM branches').fetchone()[0]==0:
        from seed_data import BRANCHES, MENU, USERS
        con.executemany('INSERT INTO branches VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',[(b['id'],b['name'],b.get('short'),b['code'],b['city'],b['address'],b['phone'],b['manager'],b['status'],b['revenue'],b['orders'],b['rating'],b['opened']) for b in BRANCHES])
        for u in USERS:
            con.execute('INSERT INTO users(id,name,email,phone,role,branchId,status,lastLogin,password_hash) VALUES(?,?,?,?,?,?,?,?,?)',(u['id'],u['name'],u['email'],u['phone'],u['role'],u['branchId'],u['status'],u['lastLogin'],hash_password('demo1234')))
        con.executemany('INSERT INTO menu_items VALUES(?,?,?,?,?,?,?,?,?,?,?)',[(m['id'],m['name'],m['category'],m['price'],m['emoji'],m['description'],int(m['veg']),m['sold'],json.dumps(m['branches']),int(m['available']),m.get('image','')) for m in MENU])
        from seed_data import ORDERS
        for o in ORDERS:
            lines=o['lines']; subtotal=sum(x['price']*x['qty'] for x in lines); tax=round(subtotal*.05,2); oid=o['id']
            con.execute('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?,?,?)',(oid,o['customer'],o['phone'],o['branchId'],o['type'],o['payment'],o['status'],subtotal,tax,subtotal+tax,o['date']))
            con.executemany('INSERT INTO order_items(order_id,itemId,name,price,qty) VALUES(?,?,?,?,?)',[(oid,x['itemId'],x['name'],x['price'],x['qty']) for x in lines])
        con.commit()
    con.close()
init_db()

ROLE_KEYS={'Super Admin':'super_admin','Franchise Owner':'franchise_owner','Branch Manager':'branch_manager','Staff':'staff'}
ROLE_LABELS={v:k for k,v in ROLE_KEYS.items()}
class LoginIn(BaseModel): email:str; password:str
class BranchIn(BaseModel): name:str; short:str|None=None; code:str; city:str; address:str; phone:str; manager:str; status:str='Active'; revenue:float=0; orders:int=0; rating:float=0; opened:str|None=None
class MenuIn(BaseModel): name:str; category:str; price:float=Field(ge=0); emoji:str='🍽️'; description:str=''; veg:bool=True; sold:int=0; branches:list[str]; available:bool=True; image:str=''
class UserIn(BaseModel): name:str; email:str; phone:str; role:str; branchId:str='all'; status:str='Active'; password:str='demo1234'
class OrderLine(BaseModel): itemId:str; name:str; price:float=Field(ge=0); qty:int=Field(gt=0)
class OrderIn(BaseModel): customer:str; phone:str; branchId:str; type:str; payment:str; lines:list[OrderLine]
class StatusIn(BaseModel): status:str
class QuestionIn(BaseModel): question:str=Field(min_length=2,max_length=500)

def user_dict(row):
    d=dict(row); d.pop('password_hash',None); return d
def current_user(authorization:str|None=Header(default=None)):
    if not authorization or not authorization.startswith('Bearer '): raise HTTPException(401,'Sign in to continue')
    con=db(); row=con.execute('SELECT u.* FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token=? AND s.expires_at>?',(authorization[7:],stamp())).fetchone(); con.close()
    if not row: raise HTTPException(401,'Session expired; sign in again')
    return user_dict(row)
def scope(user, branch_id):
    if user['role']=='Super Admin': return
    if user['role']=='Franchise Owner' and branch_id in {'b1','b2','b3','b4'}: return
    if user.get('branchId')==branch_id: return
    raise HTTPException(403,'You do not have access to this branch')
def require(user, roles):
    if user['role'] not in roles: raise HTTPException(403,'Your role cannot perform this action')
def rows(sql,args=(),convert=None):
    con=db(); result=[dict(r) for r in con.execute(sql,args).fetchall()]; con.close()
    if convert: result=[convert(r) for r in result]
    return result
def clean_menu(r): r['branches']=json.loads(r['branches']); r['veg']=bool(r['veg']); r['available']=bool(r['available']); return r

@app.get('/api/health')
def health(): return {'status':'ok','database':'sqlite','timestamp':stamp()}
@app.post('/api/auth/login')
def login(body:LoginIn):
    con=db(); row=con.execute('SELECT * FROM users WHERE lower(email)=lower(?)',(body.email,)).fetchone()
    if not row or row['status']!='Active' or not check_password(body.password,row['password_hash']): con.close(); raise HTTPException(401,'Email or password is incorrect')
    token=secrets.token_urlsafe(36); expires=(datetime.now(timezone.utc)+timedelta(hours=12)).isoformat(); con.execute('INSERT INTO sessions VALUES(?,?,?)',(token,row['id'],expires)); con.execute('UPDATE users SET lastLogin=? WHERE id=?',(datetime.now().astimezone().strftime('Today, %H:%M'),row['id'])); con.commit(); result=user_dict(con.execute('SELECT * FROM users WHERE id=?',(row['id'],)).fetchone()); con.close()
    return {'token':token,'user':result,'roleKey':ROLE_KEYS.get(result['role'])}
@app.get('/api/auth/me')
def me(user=Depends(current_user)): return {'user':user,'roleKey':ROLE_KEYS.get(user['role'])}
@app.post('/api/auth/logout')
def logout(authorization:str|None=Header(default=None)):
    if authorization and authorization.startswith('Bearer '):
        con=db(); con.execute('DELETE FROM sessions WHERE token=?',(authorization[7:],)); con.commit(); con.close()
    return {'ok':True}
@app.get('/api/branches')
def get_branches(user=Depends(current_user)):
    if user['role']=='Super Admin': return rows('SELECT * FROM branches ORDER BY name')
    if user['role']=='Franchise Owner': return rows("SELECT * FROM branches WHERE id IN ('b1','b2','b3','b4') ORDER BY name")
    return rows('SELECT * FROM branches WHERE id=?',(user['branchId'],))
@app.post('/api/branches')
def add_branch(body:BranchIn,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner']); d=body.model_dump(); d['id']='b'+uuid4().hex[:8]; d['short']=d['short'] or d['city']; d['opened']=d['opened'] or stamp()[:10]
    con=db()
    try: con.execute('INSERT INTO branches VALUES(?,?,?,?,?,?,?,?,?,?,?,?,?)',tuple(d[k] for k in ['id','name','short','code','city','address','phone','manager','status','revenue','orders','rating','opened'])); con.commit()
    except sqlite3.IntegrityError: con.close(); raise HTTPException(409,'Branch code already exists')
    con.close(); return d
@app.put('/api/branches/{item_id}')
def update_branch(item_id:str,body:BranchIn,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner']); d=body.model_dump(); con=db(); cur=con.execute('UPDATE branches SET name=?,short=?,code=?,city=?,address=?,phone=?,manager=?,status=?,revenue=?,orders=?,rating=?,opened=? WHERE id=?',(d['name'],d['short'] or d['city'],d['code'],d['city'],d['address'],d['phone'],d['manager'],d['status'],d['revenue'],d['orders'],d['rating'],d['opened'] or stamp()[:10],item_id)); con.commit()
    row=con.execute('SELECT * FROM branches WHERE id=?',(item_id,)).fetchone(); con.close()
    if not cur.rowcount: raise HTTPException(404,'Branch not found')
    return dict(row)
@app.delete('/api/branches/{item_id}')
def delete_branch(item_id:str,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner']); con=db()
    if con.execute('SELECT 1 FROM orders WHERE branchId=? LIMIT 1',(item_id,)).fetchone(): con.close(); raise HTTPException(409,'Branch has orders and cannot be deleted')
    cur=con.execute('DELETE FROM branches WHERE id=?',(item_id,)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,'Branch not found')
    return {'ok':True}
@app.get('/api/menu')
def get_menu(user=Depends(current_user)):
    return rows('SELECT * FROM menu_items ORDER BY name',convert=clean_menu)
@app.post('/api/menu')
def add_menu(body:MenuIn,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner','Branch Manager']); d=body.model_dump(); d['id']='m'+uuid4().hex[:8]; con=db(); con.execute('INSERT INTO menu_items VALUES(?,?,?,?,?,?,?,?,?,?,?)',(d['id'],d['name'],d['category'],d['price'],d['emoji'],d['description'],int(d['veg']),d['sold'],json.dumps(d['branches']),int(d['available']),d['image'])); con.commit(); con.close(); return d
@app.put('/api/menu/{item_id}')
def update_menu(item_id:str,body:MenuIn,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner','Branch Manager']); d=body.model_dump()
    if user['role']=='Branch Manager' and not set(d['branches']).issubset({user['branchId']}): raise HTTPException(403,'Menu changes must be limited to your branch')
    con=db(); cur=con.execute('UPDATE menu_items SET name=?,category=?,price=?,emoji=?,description=?,veg=?,sold=?,branches=?,available=?,image=? WHERE id=?',(d['name'],d['category'],d['price'],d['emoji'],d['description'],int(d['veg']),d['sold'],json.dumps(d['branches']),int(d['available']),d['image'],item_id)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,'Menu item not found')
    return {'id':item_id,**d}
@app.delete('/api/menu/{item_id}')
def delete_menu(item_id:str,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner','Branch Manager']); con=db(); cur=con.execute('DELETE FROM menu_items WHERE id=?',(item_id,)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,'Menu item not found')
    return {'ok':True}
@app.get('/api/users')
def get_users(user=Depends(current_user)):
    if user['role'] not in ['Super Admin','Franchise Owner']: raise HTTPException(403,'Your role cannot view users')
    if user['role']=='Super Admin': return rows('SELECT * FROM users ORDER BY name',convert=user_dict)
    return rows("SELECT * FROM users WHERE branchId='all' OR branchId IN ('b1','b2','b3','b4') ORDER BY name",convert=user_dict)
@app.post('/api/users')
def add_user(body:UserIn,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner']); d=body.model_dump(); d['id']='u'+uuid4().hex[:8]; con=db()
    try: con.execute('INSERT INTO users(id,name,email,phone,role,branchId,status,lastLogin,password_hash) VALUES(?,?,?,?,?,?,?,?,?)',(d['id'],d['name'],d['email'].lower(),d['phone'],d['role'],d['branchId'],d['status'],'Never',hash_password(d['password']))); con.commit()
    except sqlite3.IntegrityError: con.close(); raise HTTPException(409,'Email already exists or branch is invalid')
    con.close(); d.pop('password'); d['lastLogin']='Never'; return d
@app.put('/api/users/{item_id}')
def update_user(item_id:str,body:UserIn,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner']); d=body.model_dump(); con=db(); cur=con.execute('UPDATE users SET name=?,email=?,phone=?,role=?,branchId=?,status=? WHERE id=?',(d['name'],d['email'].lower(),d['phone'],d['role'],d['branchId'],d['status'],item_id)); con.commit(); row=con.execute('SELECT * FROM users WHERE id=?',(item_id,)).fetchone(); con.close()
    if not cur.rowcount: raise HTTPException(404,'User not found')
    return user_dict(row)
@app.delete('/api/users/{item_id}')
def delete_user(item_id:str,user=Depends(current_user)):
    require(user,['Super Admin','Franchise Owner']);
    if user['id']==item_id: raise HTTPException(400,'You cannot delete your own account')
    con=db(); cur=con.execute('DELETE FROM users WHERE id=?',(item_id,)); con.commit(); con.close()
    if not cur.rowcount: raise HTTPException(404,'User not found')
    return {'ok':True}
@app.get('/api/orders')
def get_orders(user=Depends(current_user)):
    con=db()
    if user['role']=='Super Admin': found=con.execute('SELECT * FROM orders ORDER BY date DESC').fetchall()
    elif user['role']=='Franchise Owner': found=con.execute("SELECT * FROM orders WHERE branchId IN ('b1','b2','b3','b4') ORDER BY date DESC").fetchall()
    else: found=con.execute('SELECT * FROM orders WHERE branchId=? ORDER BY date DESC',(user['branchId'],)).fetchall()
    result=[]
    for row in found:
        d=dict(row); d['lines']=[dict(x) for x in con.execute('SELECT itemId,name,price,qty FROM order_items WHERE order_id=?',(d['id'],)).fetchall()]; result.append(d)
    con.close(); return result
@app.get('/api/dashboard')
def dashboard(period:str=Query(default='daily',alias='range'),user=Depends(current_user)):
    if period not in {'daily','weekly','monthly'}: raise HTTPException(400,'Invalid analytics range')
    now=datetime.now().astimezone(); today=now.date(); start=(today-timedelta(days=6) if period=='daily' else today-timedelta(days=55) if period=='weekly' else today.replace(day=1))
    con=db()
    if user['role']=='Super Admin': branches=[dict(r) for r in con.execute('SELECT * FROM branches').fetchall()]
    elif user['role']=='Franchise Owner': branches=[dict(r) for r in con.execute("SELECT * FROM branches WHERE id IN ('b1','b2','b3','b4')").fetchall()]
    else: branches=[dict(r) for r in con.execute('SELECT * FROM branches WHERE id=?',(user['branchId'],)).fetchall()]
    ids=[b['id'] for b in branches]
    if not ids: con.close(); return {'revenue':0,'totalOrders':0,'active':0,'rating':0,'orders':[],'sales':[],'topItems':[],'activities':[]}
    marks=','.join('?' for _ in ids)
    orders=[dict(r) for r in con.execute(f'SELECT * FROM orders WHERE branchId IN ({marks}) ORDER BY date DESC',ids).fetchall()]
    for o in orders: o['lines']=[dict(x) for x in con.execute('SELECT itemId,name,price,qty FROM order_items WHERE order_id=?',(o['id'],)).fetchall()]
    month_start=today.replace(day=1).isoformat()
    month_orders=[o for o in orders if o['status']!='Cancelled' and o['date'][:10]>=month_start]
    revenue=round(sum(o['total'] for o in month_orders),2)
    if period=='daily': buckets=[(today-timedelta(days=i)) for i in reversed(range(7))]; keys=[d.isoformat() for d in buckets]; labels=[d.strftime('%a') for d in buckets]
    elif period=='weekly': buckets=[start+timedelta(days=7*i) for i in range(8)]; keys=[d.isoformat() for d in buckets]; labels=[f'W{i+1}' for i in range(8)]
    else:
        buckets=[]; d=today.replace(day=1)
        while d<=today:
            buckets.append(d); d=(d.replace(day=28)+timedelta(days=4)).replace(day=1)
        keys=[d.strftime('%Y-%m') for d in buckets]; labels=[d.strftime('%b') for d in buckets]
    sales=[]
    for i,key in enumerate(keys):
        if period=='daily': total=sum(o['total'] for o in orders if o['status']!='Cancelled' and o['date'][:10]==key)
        elif period=='weekly':
            end=(buckets[i]+timedelta(days=6)).isoformat()
            total=sum(o['total'] for o in orders if o['status']!='Cancelled' and key<=o['date'][:10]<=end)
        else: total=sum(o['total'] for o in orders if o['status']!='Cancelled' and o['date'][:7]==key)
        sales.append({'label':labels[i],'sales':round(total,2)})
    sold={}
    for o in orders:
        if o['status']=='Cancelled': continue
        for line in o['lines']: sold[line['itemId']]=sold.get(line['itemId'],0)+line['qty']
    menu={r['id']:dict(r) for r in con.execute('SELECT id,name,emoji FROM menu_items').fetchall()}
    topItems=sorted([{'id':k,'name':menu.get(k,{}).get('name',k),'emoji':menu.get(k,{}).get('emoji','🍽️'),'units':v} for k,v in sold.items()],key=lambda x:x['units'],reverse=True)[:5]
    activities=[]
    for o in orders[:6]:
        b=next((b for b in branches if b['id']==o['branchId']),{})
        activities.append({'id':o['id'],'type':'order','text':f"Order {o['id']} {o['status'].lower()} at {b.get('short','branch')} · {o['customer']}",'time':o['date']})
    result={'revenue':revenue,'totalOrders':len(month_orders),'active':sum(b['status']=='Active' for b in branches),'rating':round(sum(b['rating'] for b in branches if b['rating'])/max(1,sum(bool(b['rating']) for b in branches)),1),'orders':orders,'sales':sales,'topItems':topItems,'activities':activities,'branchRevenue':[{'id':b['id'],'name':b.get('short') or b['name'],'revenue':round(sum(o['total'] for o in month_orders if o['branchId']==b['id']),2)} for b in branches]}
    con.close(); return result
@app.post('/api/assistant/ask')
def assistant_ask(body:QuestionIn,user=Depends(current_user)):
    q=body.question.strip().lower(); con=db()
    if user['role']=='Super Admin': branches=[dict(r) for r in con.execute('SELECT * FROM branches').fetchall()]
    elif user['role']=='Franchise Owner': branches=[dict(r) for r in con.execute("SELECT * FROM branches WHERE id IN ('b1','b2','b3','b4')").fetchall()]
    else: branches=[dict(r) for r in con.execute('SELECT * FROM branches WHERE id=?',(user['branchId'],)).fetchall()]
    ids=[b['id'] for b in branches]; marks=','.join('?' for _ in ids)
    orders=[dict(r) for r in con.execute(f'SELECT * FROM orders WHERE branchId IN ({marks}) ORDER BY date DESC',ids).fetchall()] if ids else []
    for o in orders: o['lines']=[dict(x) for x in con.execute('SELECT itemId,name,price,qty FROM order_items WHERE order_id=?',(o['id'],)).fetchall()]
    bnames={b['id']:b['name'] for b in branches}; today=datetime.now().astimezone().date(); month_start=today.replace(day=1)
    month=[o for o in orders if o['status']!='Cancelled' and datetime.fromisoformat(o['date']).date()>=month_start]
    active=[o for o in orders if o['status'] in {'Placed','Preparing','Ready'}]
    low=q
    if any(x in low for x in ['revenue','sales','earning','income']):
        if any(x in low for x in ['today','today\'s']): chosen=[o for o in orders if o['status']!='Cancelled' and datetime.fromisoformat(o['date']).date()==today]; period='today'
        else: chosen=month; period='this month'
        answer=f"Your permitted branches recorded ₹{sum(o['total'] for o in chosen):,.2f} in {period} from {len(chosen)} non-cancelled orders."
    elif any(x in low for x in ['top selling','top-selling','best selling','popular item','most sold']):
        units={}
        for o in orders:
            if o['status']!='Cancelled':
                for line in o['lines']: units[line['name']]=units.get(line['name'],0)+line['qty']
        best=sorted(units.items(),key=lambda x:x[1],reverse=True)[:5]
        answer='Top items by units in saved orders: '+(', '.join(f'{n} ({u})' for n,u in best) if best else 'No order items found.')
    elif 'order' in low and any(x in low for x in ['active','pending','open','kitchen','status']):
        answer=f"There are {len(active)} active orders: {sum(o['status']=='Placed' for o in active)} placed, {sum(o['status']=='Preparing' for o in active)} preparing, and {sum(o['status']=='Ready' for o in active)} ready."
    elif any(x in low for x in ['branch','outlet','franchise','location']):
        lines=[]
        for b in branches:
            bo=[o for o in month if o['branchId']==b['id']]
            lines.append(f"{b['name']}: {len(bo)} orders, ₹{sum(o['total'] for o in bo):,.2f} sales")
        answer='Here is the current month summary for branches you can access: '+'; '.join(lines)
    elif any(x in low for x in ['rating','average rating']):
        rated=[b for b in branches if b['rating']]
        answer=f"The average branch rating for your permitted locations is {sum(b['rating'] for b in rated)/max(1,len(rated)):.1f}/5 across {len(rated)} rated branches."
    elif any(x in low for x in ['help','what can','ask','question']):
        answer='Ask me about saved order sales, today’s revenue, active order status, top-selling items, branch comparisons, or branch ratings. I can only report data you are permitted to see.'
    else:
        answer='I can answer questions about saved order sales, today’s revenue, active order status, top-selling items, branch comparisons, and branch ratings. Try asking one of those.'
    con.close(); return {'answer':answer,'asOf':stamp(),'scope':user['role']}
@app.post('/api/orders')
def add_order(body:OrderIn,user=Depends(current_user)):
    scope(user,body.branchId)
    if not body.lines: raise HTTPException(400,'At least one item is required')
    con=db(); con.execute('BEGIN IMMEDIATE')
    ids=[line.itemId for line in body.lines]; placeholders=','.join('?' for _ in ids); available={r['id']:r for r in con.execute(f'SELECT id,name,price,branches,available FROM menu_items WHERE id IN ({placeholders})',ids)}
    lines=[]; subtotal=0
    for line in body.lines:
        item=available.get(line.itemId)
        if not item or not item['available'] or body.branchId not in json.loads(item['branches']): con.rollback(); con.close(); raise HTTPException(400,f'{line.name} is unavailable at this branch')
        price=item['price']; lines.append((line.itemId,item['name'],price,line.qty)); subtotal+=price*line.qty
    tax=round(subtotal*.05,2); total=round(subtotal+tax,2); seq=con.execute("SELECT COALESCE(MAX(CAST(substr(id,9) AS INTEGER)),1000)+1 FROM orders WHERE id LIKE 'FO-%'").fetchone()[0]; order_id=f'FO-{datetime.now().strftime("%y%m")}-{seq}'; when=stamp()
    con.execute('INSERT INTO orders VALUES(?,?,?,?,?,?,?,?,?,?,?)',(order_id,body.customer,body.phone,body.branchId,body.type,body.payment,'Placed',subtotal,tax,total,when)); con.executemany('INSERT INTO order_items(order_id,itemId,name,price,qty) VALUES(?,?,?,?,?)',[(order_id,*line) for line in lines]); con.commit(); result={'id':order_id,'customer':body.customer,'phone':body.phone,'branchId':body.branchId,'type':body.type,'payment':body.payment,'status':'Placed','subtotal':subtotal,'tax':tax,'total':total,'date':when,'lines':[{'itemId':x[0],'name':x[1],'price':x[2],'qty':x[3]} for x in lines]}; con.close(); return result
@app.patch('/api/orders/{order_id}/status')
def set_status(order_id:str,body:StatusIn,user=Depends(current_user)):
    if body.status not in {'Placed','Preparing','Ready','Completed','Cancelled'}: raise HTTPException(400,'Invalid order status')
    con=db(); row=con.execute('SELECT branchId FROM orders WHERE id=?',(order_id,)).fetchone()
    if not row: con.close(); raise HTTPException(404,'Order not found')
    scope(user,row['branchId']); con.execute('UPDATE orders SET status=? WHERE id=?',(body.status,order_id)); con.commit(); con.close(); return {'id':order_id,'status':body.status}
