# Import Data to MongoDB Collections (No Seeding Script)

This guide shows you how to directly import the JSON data files into your MongoDB collections.

## 📁 Data Files Created

- `backend/data/abilities.json` - Contains 4 abilities (Lightning, Bomb, Freeze, Fire)
- `backend/data/shopitems.json` - Contains 10 shop items (4 bundles, 2 subscriptions, 4 individual abilities)

## 🔧 Method 1: Using mongoimport (Command Line)

### Step 1: Get your MongoDB connection details
From your `.env` file, you have:
```
MONGODB_URI=mongodb+srv://darshanjainndss:darshan123@bonkcluster.zxgbr.mongodb.net/bubbleshooter?retryWrites=true&w=majority&appName=BonkCluster
```

### Step 2: Import Abilities Collection
```bash
mongoimport --uri="mongodb+srv://darshanjainndss:darshan123@bonkcluster.zxgbr.mongodb.net/bubbleshooter?retryWrites=true&w=majority&appName=BonkCluster" --collection=abilities --file=backend/data/abilities.json --jsonArray --drop
```

### Step 3: Import ShopItems Collection
```bash
mongoimport --uri="mongodb+srv://darshanjainndss:darshan123@bonkcluster.zxgbr.mongodb.net/bubbleshooter?retryWrites=true&w=majority&appName=BonkCluster" --collection=shopitems --file=backend/data/shopitems.json --jsonArray --drop
```

**Flags explained:**
- `--uri` - Your MongoDB connection string
- `--collection` - Target collection name
- `--file` - Path to JSON file
- `--jsonArray` - Indicates the file contains a JSON array
- `--drop` - Drops existing collection before importing (removes old data)

---

## 🖥️ Method 2: Using MongoDB Compass (GUI)

### Step 1: Open MongoDB Compass
1. Launch MongoDB Compass
2. Connect using your connection string:
   ```
   mongodb+srv://darshanjainndss:darshan123@bonkcluster.zxgbr.mongodb.net/
   ```

### Step 2: Navigate to Database
1. Click on `bubbleshooter` database
2. You'll see collections like `users`, `gamesessions`, etc.

### Step 3: Import Abilities
1. Click on the `abilities` collection (create it if it doesn't exist)
2. Click **"ADD DATA"** → **"Import JSON or CSV file"**
3. Select `backend/data/abilities.json`
4. Click **"Import"**

### Step 4: Import Shop Items
1. Click on the `shopitems` collection (create it if it doesn't exist)
2. Click **"ADD DATA"** → **"Import JSON or CSV file"**
3. Select `backend/data/shopitems.json`
4. Click **"Import"**

---

## 🌐 Method 3: Using MongoDB Atlas Web Interface

### Step 1: Login to MongoDB Atlas
1. Go to https://cloud.mongodb.com
2. Login with your credentials
3. Navigate to your cluster: **BonkCluster**

### Step 2: Browse Collections
1. Click **"Browse Collections"**
2. Select `bubbleshooter` database

### Step 3: Import Data
1. Click on `abilities` collection
2. Click **"INSERT DOCUMENT"** → Switch to **"JSON VIEW"**
3. Copy and paste the entire contents of `backend/data/abilities.json`
4. Click **"Insert"**
5. Repeat for `shopitems` collection with `backend/data/shopitems.json`

---

## ✅ Verify Import

After importing, verify the data:

### Using MongoDB Compass:
- Check `abilities` collection shows 4 documents
- Check `shopitems` collection shows 10 documents

### Using API:
Make requests to:
```bash
GET http://localhost:3001/api/ability
GET http://localhost:3001/api/shop
```

---

## 📊 What's Imported

### Abilities Collection (4 items):
- Lightning (₹58 coins)
- Bomb (₹75 coins)
- Freeze (₹30 coins)
- Fire (₹40 coins)

### ShopItems Collection (10 items):

**Bundles (4):**
- Lightning Pack (10x) - 200 coins or ₹100
- Bomb Pack (10x) - 300 coins or ₹150
- Ultimate Combo (5 of each) - 500 coins or ₹250
- Starter Pack (3 Lightning + 3 Freeze) - 150 coins or ₹75

**Subscriptions (2):**
- Pro Week (7 days) - ₹150
- Elite Month (30 days) - ₹499

**Individual Abilities (4):**
- Lightning - 58 coins
- Bomb - 75 coins
- Freeze - 30 coins
- Fire - 40 coins

---

## 🚨 Troubleshooting

**Issue:** `mongoimport` command not found
- **Solution:** Install MongoDB Database Tools from https://www.mongodb.com/try/download/database-tools

**Issue:** Authentication failed
- **Solution:** Double-check your MongoDB URI in the `.env` file

**Issue:** Collections not showing in app
- **Solution:** Restart your backend server after importing data
