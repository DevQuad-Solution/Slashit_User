export const fmt = (n) => `₦${Number(n).toLocaleString("en-NG")}`;
export const delay = (ms=400) => new Promise(r=>setTimeout(r,ms));
export const fromNow = (iso) => {
  const s = Math.floor((Date.now()-new Date(iso).getTime())/1000);
  if(s<60) return "just now"; const m=Math.floor(s/60); if(m<60) return `${m}m ago`;
  const h=Math.floor(m/60); if(h<24) return `${h}h ago`; return `${Math.floor(h/24)}d ago`;
};
export const timeUntil = (iso) => {
  const ms = new Date(iso).getTime()-Date.now(); if(ms<=0) return "Ended";
  const h=Math.floor(ms/3600000); const d=Math.floor(h/24);
  return d>0?`${d}d ${h%24}h left`:`${h}h left`;
};

export let FEATURE_FLAGS = {
  // Backend keys — must match FLAG_KEYS in admin constants exactly
  hosteLeaderboard: true,
  banterBoard:      true,
  referralProgram:  true,
  paidPlanPackages: true,
  foodPackages:     true,
  walletFunding:    true,
  transportation:   true,
};

export let MOCK_USER = {
  id:"user-001", name:"Olanrewaju Tolulope", email:"olanrewaju77@gmail.com", phone:"08043289704",
  avatarEmoji:"🧑🏾", kycStatus:"unverified", kycLevel:0, walletBalance:56980,
  hubId:"bodija-hub", hubName:"Bodija Hub", city:"Ibadan", state:"Oyo", stateName:"Oyo State",
  accountNumber:"5301234567", accountBank:"Moniepoint MFB", accountName:"SLASHIT / OLANREWAJU T.",
  createdAt:new Date(Date.now()-30*86400000).toISOString(),
  plan:"free", planExpiresAt:null, hostel:"Idia Hall",
  referralCode:"SLASH-LANRE", referralCount:3, referralEarnings:1500,
};

export const MOCK_PRODUCTS = [
  {id:"rice-50kg",emoji:"🌾",name:"50kg Bag of Rice",category:"Grains",description:"Premium grade Nigerian long grain rice from Olaiya Farms. 50kg bag split equally.",totalPrice:72000,defaultSlots:6,pricePerSlot:12000,defaultPrice:12000,isActive:true,
    prices:{"Lagos":14500,"Kano":10800,"Abuja":13200,"Rivers":13800,"Enugu":11500}},
  {id:"pasta-carton",emoji:"🍝",name:"Carton of Pasta",category:"Carbs",description:"Golden Penny Spaghetti — 20 packs × 500g. Each member gets 5 packs.",totalPrice:12800,defaultSlots:4,pricePerSlot:3200,defaultPrice:3200,isActive:true,
    prices:{"Lagos":3600,"Kano":2900,"Abuja":3400}},
  {id:"eggs-4crates",emoji:"🥚",name:"Crate of Eggs x4",category:"Protein",description:"4 crates of fresh eggs. 30 eggs (half crate) per member.",totalPrice:22400,defaultSlots:8,pricePerSlot:2800,defaultPrice:2800,isActive:true,
    prices:{"Lagos":3200,"Kano":2500,"Rivers":3000}},
  {id:"indomie-carton",emoji:"🍜",name:"Indomie Carton",category:"Carbs",description:"Indomie Chicken Noodles, 40 packs. Each member gets 8 packs.",totalPrice:8500,defaultSlots:5,pricePerSlot:1700,defaultPrice:1700,isActive:true,
    prices:{"Lagos":1950,"Kano":1550}},
  {id:"groundnut-oil-25l",emoji:"🫙",name:"Groundnut Oil 25L",category:"Condiments",description:"25L premium groundnut oil — 5L per member in sealed containers.",totalPrice:45000,defaultSlots:5,pricePerSlot:9000,defaultPrice:9000,isActive:true,
    prices:{"Lagos":10500,"Kano":8200,"Abuja":9800,"Rivers":10000}},
  {id:"detergent-bulk",emoji:"🧼",name:"Detergent Bulk x12",category:"Cleaning",description:"12 packs Ariel 3kg detergent. 2 packs per member.",totalPrice:15600,defaultSlots:6,pricePerSlot:2600,defaultPrice:2600,isActive:true,
    prices:{"Lagos":2950,"Abuja":2800}},
];

export const FOOD_PACKAGES = [
  {id:"exam-pack",emoji:"📚",name:"Exam Season Pack",theme:"exam",description:"Essential study-time foods: Indomie, eggs, sardines & energy drinks.",totalPrice:18500,defaultSlots:5,pricePerSlot:3700,isActive:true,products:["Indomie Carton","Crate of Eggs x2","Sardines x6"],themeColor:"#2563eb"},
  {id:"val-pack",emoji:"❤️",name:"Valentine Special",theme:"valentine",description:"Premium cooking essentials for Valentine's Day: rice, oil, tomatoes & spices.",totalPrice:28000,defaultSlots:4,pricePerSlot:7000,isActive:true,products:["50kg Rice (quarter)","Palm Oil 5L","Tomato Paste x12"],themeColor:"#e11d48"},
];

export const MOCK_HUBS = [
  {id:"bodija-hub",name:"Bodija Hub",city:"Ibadan",state:"Oyo",address:"12 Bodija Market Road",attendantName:"Adebayo Johnson",rating:4.7,isActive:true,defaultTransportCost:3600,transportFee:600},
  {id:"ui-sub-hub",name:"UI SUB Hub",city:"Ibadan",state:"Oyo",address:"University of Ibadan, SUB",attendantName:"Chioma Obi",rating:4.5,isActive:true,defaultTransportCost:4800,transportFee:800},
  {id:"challenge-hub",name:"Challenge Hub",city:"Ibadan",state:"Oyo",address:"Challenge Market, Ring Road",attendantName:"Emeka Nwosu",rating:4.2,isActive:true,defaultTransportCost:3000,transportFee:500},
  {id:"lautech-hub",name:"LAUTECH Hub",city:"Ogbomosho",state:"Oyo",address:"LAUTECH Campus Gate",attendantName:"Akin Oladele",rating:4.8,isActive:true,defaultTransportCost:4200,transportFee:700},
  {id:"yaba-hub",name:"Yaba Hub",city:"Yaba",state:"Lagos",address:"Herbert Macaulay Way",attendantName:"Tunde Adeyemi",rating:4.4,isActive:true,defaultTransportCost:7200,transportFee:1200},
  {id:"unilag-hub",name:"UNILAG Hub",city:"Yaba",state:"Lagos",address:"University of Lagos",attendantName:"Ngozi Eze",rating:4.6,isActive:true,defaultTransportCost:6000,transportFee:1000},
  {id:"oau-hub",name:"OAU Campus Hub",city:"Ile-Ife",state:"Osun",address:"Obafemi Awolowo University Gate",attendantName:"Damilola Adesanya",rating:4.5,isActive:true,defaultTransportCost:3300,transportFee:550},
  {id:"ife-market-hub",name:"Ife Central Hub",city:"Ile-Ife",state:"Osun",address:"Ife Central Market, Lagere",attendantName:"Seun Fagbemi",rating:4.3,isActive:true,defaultTransportCost:2700,transportFee:450},
  {id:"osogbo-hub",name:"Osogbo Hub",city:"Osogbo",state:"Osun",address:"Oke-Fia Market Road",attendantName:"Wale Adeola",rating:4.1,isActive:true,defaultTransportCost:2400,transportFee:400},
];

export let MOCK_SLASHES = [
  {id:1047,emoji:"🌾",name:"50kg Bag of Rice",description:"Premium rice at wholesale.",totalPrice:72000,pricePerSlot:12000,transportFee:600,totalSlots:6,filledSlots:3,status:"open",hubId:"bodija-hub",hubName:"Bodija Hub",city:"Ibadan",state:"Oyo",leaderName:"Chukwudi A.",leaderId:"u2",timeLimit:"24h",expiresAt:new Date(Date.now()+3*86400000).toISOString(),createdAt:new Date(Date.now()-86400000).toISOString(),category:"Grains"},
  {id:1048,emoji:"🥚",name:"Crate of Eggs x4",description:"Fresh eggs, 30 per member.",totalPrice:22400,pricePerSlot:2800,transportFee:800,totalSlots:8,filledSlots:7,status:"open",hubId:"ui-sub-hub",hubName:"UI SUB Hub",city:"Ibadan",state:"Oyo",leaderName:"Emeka O.",leaderId:"u3",timeLimit:"12h",expiresAt:new Date(Date.now()+86400000).toISOString(),createdAt:new Date(Date.now()-43200000).toISOString(),category:"Protein",isMine:true,isLeader:true},
  {id:1049,emoji:"🍝",name:"Carton of Pasta",description:"5 packs per member.",totalPrice:12800,pricePerSlot:3200,transportFee:800,totalSlots:4,filledSlots:1,status:"open",hubId:"ui-sub-hub",hubName:"UI SUB Hub",city:"Ibadan",state:"Oyo",leaderName:"Fatima K.",leaderId:"u4",timeLimit:"48h",expiresAt:new Date(Date.now()+6*86400000).toISOString(),createdAt:new Date(Date.now()-7200000).toISOString(),category:"Carbs",isMine:true},
  {id:1050,emoji:"🫙",name:"Groundnut Oil 25L",description:"5L per member.",totalPrice:45000,pricePerSlot:9000,totalSlots:5,filledSlots:5,status:"ready_for_pickup",hubId:"bodija-hub",hubName:"Bodija Hub",city:"Ibadan",state:"Oyo",leaderName:"Seun L.",leaderId:"u5",timeLimit:"24h",expiresAt:new Date(Date.now()-86400000).toISOString(),createdAt:new Date(Date.now()-4*86400000).toISOString(),category:"Condiments",isMine:true},
  {id:1051,emoji:"🍜",name:"Indomie Carton",description:"8 packs per member.",totalPrice:8500,pricePerSlot:1700,transportFee:600,totalSlots:5,filledSlots:2,status:"open",hubId:"bodija-hub",hubName:"Bodija Hub",city:"Ibadan",state:"Oyo",leaderName:"Bola A.",leaderId:"u6",timeLimit:"72h",expiresAt:new Date(Date.now()+4*86400000).toISOString(),createdAt:new Date(Date.now()-3600000).toISOString(),category:"Carbs"},
];

export const MOCK_TRANSACTIONS = [
  {id:"txn-001",type:"credit",amount:10000,description:"Bank Transfer — Monnify",reference:"MN20240221001",createdAt:new Date(Date.now()-3600000).toISOString()},
  {id:"txn-002",type:"debit",amount:12000,description:"Joined Slash #1047 — 50kg Rice",reference:"SL1047-USR001",createdAt:new Date(Date.now()-86400000).toISOString()},
  {id:"txn-003",type:"fee",amount:100,description:"Processing fee — Slash #1047",reference:"FEE-SL1047",createdAt:new Date(Date.now()-86400000).toISOString()},
  {id:"txn-004",type:"refund",amount:7500,description:"Refund — Slash #1039 dissolved",reference:"REF-SL1039",createdAt:new Date(Date.now()-3*86400000).toISOString()},
  {id:"txn-005",type:"credit",amount:500,description:"Referral bonus — SLASH-EMEKA joined",reference:"REF-BONUS-001",createdAt:new Date(Date.now()-2*86400000).toISOString()},
  {id:"txn-006",type:"credit",amount:25000,description:"Bank Transfer — Monnify",reference:"MN20240218004",createdAt:new Date(Date.now()-4*86400000).toISOString()},
];

export const MOCK_NOTIFICATIONS = [
  {id:"n1",type:"slash_update",title:"Your Eggs Slash is nearly full!",body:"7 out of 8 slots filled. Only 1 remaining!",isRead:false,createdAt:new Date(Date.now()-120000).toISOString(),slashId:1048},
  {id:"n2",type:"pickup_ready",title:"Groundnut Oil is ready for collection!",body:"Verified at Bodija Hub. Bring your QR code.",isRead:false,createdAt:new Date(Date.now()-3600000).toISOString(),slashId:1050},
  {id:"n3",type:"wallet",title:"N10,000 added to your wallet",body:"Bank transfer received and credited.",isRead:false,createdAt:new Date(Date.now()-7200000).toISOString()},
  {id:"n4",type:"referral",title:"Referral bonus!",body:"Emeka joined using your code. N500 added to wallet.",isRead:false,createdAt:new Date(Date.now()-2*86400000).toISOString()},
  {id:"n5",type:"system",title:"KYC reminder",body:"Complete verification to join & create slashes.",isRead:true,createdAt:new Date(Date.now()-2*86400000).toISOString()},
];

export const MOCK_LEADERBOARD = [
  {rank:1,hostel:"Mellanby Hall",campus:"UI, Ibadan",slashCount:47,totalSaved:186400,trend:"same",trendDelta:0,isCurrentUser:false},
  {rank:2,hostel:"Tedder Hall",campus:"UI, Ibadan",slashCount:43,totalSaved:172800,trend:"up",trendDelta:2,isCurrentUser:false},
  {rank:3,hostel:"Sultan Bello",campus:"UI, Ibadan",slashCount:38,totalSaved:154200,trend:"down",trendDelta:1,isCurrentUser:false},
  {rank:4,hostel:"Idia Hall",campus:"UI, Ibadan",slashCount:35,totalSaved:140500,trend:"up",trendDelta:1,isCurrentUser:true},
  {rank:5,hostel:"Kuti Hall",campus:"UI, Ibadan",slashCount:29,totalSaved:118300,trend:"down",trendDelta:2,isCurrentUser:false},
  {rank:6,hostel:"Awolowo Hall",campus:"UI, Ibadan",slashCount:24,totalSaved:96800,trend:"up",trendDelta:1,isCurrentUser:false},
  {rank:7,hostel:"LAUTECH Block A",campus:"LAUTECH",slashCount:19,totalSaved:76200,trend:"same",trendDelta:0,isCurrentUser:false},
  {rank:8,hostel:"Moremi Hall",campus:"UI, Ibadan",slashCount:14,totalSaved:58400,trend:"down",trendDelta:3,isCurrentUser:false},
];

export let BANTER_MESSAGES = [
  {id:"b1",hostel:"Mellanby Hall",user:"SlashKing",message:"Mellanby dey collect the bag every week! Una fit try",likes:24,createdAt:new Date(Date.now()-3600000).toISOString()},
  {id:"b2",hostel:"Tedder Hall",user:"TedderBoy",message:"Next week we dey overtake Mellanby, mark my words!",likes:18,createdAt:new Date(Date.now()-7200000).toISOString()},
  {id:"b3",hostel:"Idia Hall",user:"IdiaQueen",message:"Ladies dey rise! Idia Hall go shock everybody this week!",likes:31,createdAt:new Date(Date.now()-14400000).toISOString()},
  {id:"b4",hostel:"Kuti Hall",user:"KutiAnimal",message:"Kuti Hall slept on? Wait for the comeback!",likes:9,createdAt:new Date(Date.now()-86400000).toISOString()},
  {id:"b5",hostel:"Sultan Bello",user:"SultanBoss",message:"Sultan Bello wey no dey play... coming for that #1 spot",likes:15,createdAt:new Date(Date.now()-2*86400000).toISOString()},
];

export const LEADERBOARD_CONFIG = {isEnabled:true,weekEndsAt:new Date(Date.now()+4*86400000+3*3600000).toISOString(),reward:"Free Delivery Sunday",rewardDescription:"Top hostel this week gets direct delivery to their hostel door!"};

export const PLANS = [
  {id:"free",name:"Basic",price:0,emoji:"🟢",slashLimit:5,slashWindowDays:3,isEnabled:true,features:[{label:"Join & create slashes",ok:true},{label:"Wallet funding",ok:true},{label:"Hub collection",ok:true},{label:"Up to 5 active slashes",ok:true},{label:"3-day slash window",ok:true},{label:"Priority hub slot",ok:false},{label:"Deal alerts",ok:false},{label:"Referral bonuses",ok:false}]},
  {id:"student",name:"Student",price:500,emoji:"🎓",slashLimit:15,slashWindowDays:7,badge:"MOST POPULAR",isEnabled:true,features:[{label:"Everything in Basic",ok:true},{label:"Up to 15 active slashes",ok:true},{label:"Priority hub slot",ok:true},{label:"7-day slash window",ok:true},{label:"Deal alerts (push)",ok:true},{label:"Slash history & analytics",ok:true},{label:"Referral bonuses (N500/referral)",ok:true},{label:"Dedicated student support",ok:true}]},
  {id:"premium",name:"Premium",price:1500,emoji:"⚡",slashLimit:999,slashWindowDays:7,isEnabled:true,features:[{label:"Everything in Student",ok:true},{label:"Unlimited active slashes",ok:true},{label:"Group slashing",ok:true},{label:"Early access to products",ok:true},{label:"Advanced analytics",ok:true},{label:"Priority dispute resolution",ok:true},{label:"Referral bonuses (N1000/referral)",ok:true},{label:"Exclusive deals",ok:true}]},
];

export const HOSTELS = ["Mellanby Hall","Tedder Hall","Sultan Bello Hall","Idia Hall","Kuti Hall","Awolowo Hall","Moremi Hall","Queen Elizabeth II Hall","Independence Hall","LAUTECH Block A","LAUTECH Block B","LAUTECH Block C","Nkrumah Hall","Off-campus","Other"];

export const CATEGORIES = ["All","Grains","Protein","Carbs","Condiments","Cleaning"];
