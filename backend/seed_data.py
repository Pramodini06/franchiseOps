BRANCHES = [
 {"id":"b1","name":"Koramangala Flagship","short":"Koramangala","code":"BLR-KOR-01","city":"Bengaluru","address":"80 Feet Road, 4th Block, Koramangala, Bengaluru 560034","phone":"9845012301","manager":"Vikram Shetty","status":"Active","revenue":3400000,"orders":4120,"rating":4.7,"opened":"2021-03-12"},
 {"id":"b2","name":"Indiranagar Central","short":"Indiranagar","code":"BLR-IND-02","city":"Bengaluru","address":"100 Feet Road, Indiranagar, Bengaluru 560038","phone":"9845012302","manager":"Neha Kapoor","status":"Active","revenue":2900000,"orders":3560,"rating":4.6,"opened":"2021-09-05"},
 {"id":"b3","name":"Tumakuru Bypass","short":"Tumakuru","code":"TMK-BYP-01","city":"Tumakuru","address":"BH Road Bypass, Near Siddaganga Circle, Tumakuru 572101","phone":"9448033301","manager":"Manjunath Gowda","status":"Active","revenue":1600000,"orders":2010,"rating":4.4,"opened":"2022-02-18"},
 {"id":"b4","name":"Mysuru Palace Road","short":"Mysuru","code":"MYS-PAL-01","city":"Mysuru","address":"Sayyaji Rao Road, Opp. Palace North Gate, Mysuru 570001","phone":"9448044401","manager":"Lakshmi Narayan","status":"Active","revenue":1900000,"orders":2380,"rating":4.8,"opened":"2022-06-30"},
 {"id":"b5","name":"Hubballi Gokul Road","short":"Hubballi","code":"HBL-GOK-01","city":"Hubballi","address":"Gokul Road, Near Unkal Lake, Hubballi 580030","phone":"9448055501","manager":"Suresh Kulkarni","status":"Active","revenue":1500000,"orders":1890,"rating":4.5,"opened":"2023-01-20"},
 {"id":"b6","name":"Mangaluru Hampankatta","short":"Mangaluru","code":"MNG-HMP-01","city":"Mangaluru","address":"Hampankatta Circle, Mangaluru 575001","phone":"9448066601","manager":"Fathima Rahman","status":"Active","revenue":1800000,"orders":2240,"rating":4.6,"opened":"2023-04-11"},
 {"id":"b7","name":"Whitefield Tech Park","short":"Whitefield","code":"BLR-WHT-03","city":"Bengaluru","address":"ITPL Main Road, Whitefield, Bengaluru 560066","phone":"9845012303","manager":"Arjun Reddy","status":"Maintenance","revenue":0,"orders":0,"rating":4.3,"opened":"2024-02-02"},
 {"id":"b8","name":"Mangaluru Kadri","short":"Kadri","code":"MNG-KDR-02","city":"Mangaluru","address":"Kadri Temple Road, Mangaluru 575002","phone":"9448066602","manager":"Deepak Pai","status":"Inactive","revenue":0,"orders":0,"rating":4.1,"opened":"2024-08-15"}
]
USERS = [
 {"id":"u1","name":"Rohan Mehta","email":"admin@franchiseops.ai","phone":"9900011101","role":"Super Admin","branchId":"all","status":"Active","lastLogin":"Today, 09:12"},
 {"id":"u2","name":"Ananya Rao","email":"owner@franchiseops.ai","phone":"9900011102","role":"Franchise Owner","branchId":"all","status":"Active","lastLogin":"Today, 08:40"},
 {"id":"u3","name":"Vikram Shetty","email":"vikram@franchiseops.ai","phone":"9900011103","role":"Branch Manager","branchId":"b1","status":"Active","lastLogin":"Today, 10:05"},
 {"id":"u4","name":"Neha Kapoor","email":"neha@franchiseops.ai","phone":"9900011104","role":"Branch Manager","branchId":"b2","status":"Active","lastLogin":"Yesterday"},
 {"id":"u5","name":"Suresh Kulkarni","email":"manager@franchiseops.ai","phone":"9900011105","role":"Branch Manager","branchId":"b5","status":"Active","lastLogin":"Today, 07:55"},
 {"id":"u6","name":"Priya Naik","email":"staff@franchiseops.ai","phone":"9900011106","role":"Staff","branchId":"b5","status":"Active","lastLogin":"Today, 09:30"},
 {"id":"u7","name":"Imran Sheikh","email":"imran@franchiseops.ai","phone":"9900011107","role":"Staff","branchId":"b6","status":"Active","lastLogin":"2 days ago"},
 {"id":"u8","name":"Lakshmi Narayan","email":"lakshmi@franchiseops.ai","phone":"9900011108","role":"Branch Manager","branchId":"b4","status":"Active","lastLogin":"Today, 09:02"},
 {"id":"u9","name":"Manjunath Gowda","email":"manju@franchiseops.ai","phone":"9900011109","role":"Branch Manager","branchId":"b3","status":"Inactive","lastLogin":"12 days ago"}
]
_ALL = ['b1','b2','b3','b4','b5','b6']
def _m(id,name,category,price,emoji,description,veg,sold,branches=None,available=True):
 return {"id":id,"name":name,"category":category,"price":price,"emoji":emoji,"description":description,"veg":veg,"sold":sold,"branches":branches or _ALL,"available":available,"image":""}
MENU = [
 _m('m1','Paneer Tikka','Starters',249,'🍢','Tandoor-grilled cottage cheese with mint chutney.',True,940), _m('m2','Chicken 65','Starters',229,'🍗','Spicy South Indian fried chicken, curry leaf tempering.',False,1210), _m('m3','Veg Spring Rolls','Starters',189,'🥟','Crispy rolls stuffed with seasoned vegetables.',True,610,['b1','b2','b4','b6']), _m('m4','Gobi Manchurian','Starters',199,'🥦','Indo-Chinese crispy cauliflower in tangy sauce.',True,780),
 _m('m5','Butter Chicken','Main Course',329,'🍛','Creamy tomato gravy with tender tandoori chicken.',False,1380), _m('m6','Dal Makhani','Main Course',249,'🍲','Slow-cooked black lentils finished with butter & cream.',True,720), _m('m7','Veg Dum Biryani','Main Course',259,'🍚','Fragrant basmati layered with vegetables & saffron.',True,860), _m('m8','Chicken Dum Biryani','Main Course',319,'🍛','Hyderabadi-style dum biryani with raita.',False,1960),
 _m('m9','Margherita Pizza','Pizza',249,'🍕','Classic tomato, basil and mozzarella.',True,1050), _m('m10','Farmhouse Pizza','Pizza',349,'🍕','Loaded with capsicum, onion, mushroom & olives.',True,690,_ALL,False), _m('m11','Peri Peri Chicken Pizza','Pizza',379,'🍕','Peri-peri chicken, jalapeño and cheese.',False,540,['b1','b2','b4','b5','b6']),
 _m('m12','Classic Veg Burger','Burgers',149,'🍔','Crispy veg patty, lettuce, tomato and house sauce.',True,1120), _m('m13','Crispy Chicken Burger','Burgers',199,'🍔','Buttermilk fried chicken with spicy mayo.',False,1490), _m('m14','Paneer Zinger Burger','Burgers',179,'🍔','Crunchy paneer fillet with chipotle sauce.',True,830),
 _m('m15','Filter Coffee','Beverages',69,'☕','Traditional Mysuru-style decoction coffee.',True,2210), _m('m16','Mango Lassi','Beverages',99,'🥭','Thick yoghurt blended with Alphonso mango.',True,1180), _m('m17','Fresh Lime Soda','Beverages',79,'🍹','Sweet, salted or mixed — served chilled.',True,960),
 _m('m18','Gulab Jamun','Desserts',89,'🍮','Warm khoya dumplings in rose-cardamom syrup.',True,1330), _m('m19','Brownie with Ice Cream','Desserts',149,'🍫','Fudgy walnut brownie with vanilla scoop.',True,870), _m('m20','Mysore Pak','Desserts',99,'🍬','Ghee-rich gram flour sweet, a Mysuru classic.',True,520,['b3','b4','b5','b6'])
]
from datetime import datetime, timedelta, timezone
import random
def _calc(lines):
 subtotal=sum(x['price']*x['qty'] for x in lines); return subtotal,round(subtotal*.05,2),round(subtotal*1.05,2)
_names=['Aarav Patil','Sneha Hegde','Kiran Naik','Divya Bhat','Rahul Joshi','Pooja Shenoy','Mohammed Irfan','Anjali Desai','Karthik Murthy','Meghana Rao','Sandeep Kamath','Revathi Iyer','Harish Gowda','Nandini Pai']
_branches=['b1','b2','b3','b4','b5','b6']; _types=['Dine-in','Takeaway','Delivery']; _pays=['UPI','Card','Cash']; _rng=random.Random(11)
ORDERS=[]
for i in range(34):
 branch_id='b5' if i%3==0 else _branches[(i*5+_rng.randrange(3))%6]
 pool=[m for m in MENU if branch_id in m['branches'] and m['available']]
 picked=[]
 for _ in range(1+_rng.randrange(3)):
  m=_rng.choice(pool)
  if not any(x['itemId']==m['id'] for x in picked): picked.append({'itemId':m['id'],'name':m['name'],'price':m['price'],'qty':1+_rng.randrange(3)})
 status='Placed' if i<3 else 'Preparing' if i<6 else 'Ready' if i<8 else 'Cancelled' if i%9==0 else 'Completed'
 subtotal,tax,total=_calc(picked)
 ORDERS.append({'id':f'FO-2611-{1034-i}','customer':_names[(i*3)%len(_names)],'phone':f"98{45000000+i*91731:08d}"[-10:],'branchId':branch_id,'type':_types[i%3],'payment':_pays[(i+1)%3],'status':status,'lines':picked,'subtotal':subtotal,'tax':tax,'total':total,'date':(datetime.now(timezone.utc)-timedelta(minutes=i*38)).isoformat()})
