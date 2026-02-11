# 🧹 Cleanup Guide: Remove Unused Files & Folders

## What to Delete

### 1. Remove /uploads Folder

**Why?** It's no longer used - PDFs are deleted after extraction.

```bash
# Navigate to backend
cd backend

# Delete uploads folder
rm -rf uploads/

# Verify it's gone
ls -la | grep uploads  # Should show nothing
```

### 2. Remove Upload Routes (Optional)

If you have upload/download routes, they're now unnecessary:

**Old route (delete if exists):**
```javascript
// NOT NEEDED ANYMORE
app.get('/api/uploads/:file', (req, res) => { ... });
app.post('/api/upload', (req, res) => { ... });
```

---

## What to Keep

### ✅ MongoDB Voters Collection
- Keep all voter data
- Indexed by center, name, voter number
- Used for searches

### ✅ Cloudinary Config (Optional)
- Can leave in .env
- Won't hurt if unused
- Useful if you add image support later

### ✅ Multer Configuration
- Keep for PDF upload processing
- Deletes temp files after extraction
- Currently working perfectly

---

## Git Cleanup

### Ignore /uploads in Future

Add to `.gitignore`:
```gitignore
# Temporary files
backend/uploads/
backend/uploads/**
/uploads
*.pdf
*.tmp
```

### Commit Cleanup

```bash
# Remove uploads folder from git tracking
git rm -r --cached backend/uploads/

# Add to .gitignore
echo "backend/uploads/" >> .gitignore

# Commit
git add .gitignore
git commit -m "chore: remove uploads folder and add to gitignore"

# Push
git push
```

---

## Database Cleanup (If Needed)

### Check Voters Collection

```javascript
// Connect to MongoDB and check

// Count voters
db.voters.countDocuments()

// Check sizes
db.voters.aggregate([
  { $group: { 
    _id: null, 
    count: { $sum: 1 },
    size: { $sum: { $bsonSize: "$$ROOT" } }
  }}
])

// Delete duplicate voters (optional)
// db.voters.deleteMany({ center: ObjectId("..."), createdAt: { $lt: ISODate("...") } })
```

---

## Environment Variables Cleanup

### Current .env (Keep)
```env
PORT=5056
MONGODB_URI=mongodb+srv://...
JWT_SECRET=voter_search_app_secret_key_2026_production
JWT_EXPIRES_IN=30d
NODE_ENV=production
```

### Optional (Harmless if left)
```env
# These can stay - they won't be used
CLOUDINARY_CLOUD_NAME=ahossain
CLOUDINARY_API_KEY=292168184133266
CLOUDINARY_API_SECRET=ZHYRLcEXlwrGa7jMuIRHIWvR1UU
```

### Remove (Never needed)
```env
# Delete these if present:
UPLOAD_FOLDER=
PDF_STORAGE=
FILE_PATH=
```

---

## Filesystem Cleanup Checklist

```bash
# In backend directory:

# Check for unused folders
ls -la
- [ ] Delete /uploads if exists
- [ ] Delete /temp if exists
- [ ] Delete /pdfs if exists

# Check node_modules (just verify)
# Don't delete - needed for dependencies

# Check if multer config is minimal
# File: src/middleware/multer.js or wherever it's defined
# Should only store to /tmp, not to disk permanently
```

---

## Old Files That Can Be Removed

If you find these, delete them:

```bash
# Remove old upload handlers
backend/src/routes/upload.js          # If exists
backend/src/controllers/file.js       # If exists
backend/src/middleware/fileUpload.js  # Might exist

# Remove old constants
backend/src/config/uploads.js         # If exists
backend/src/utils/fileManager.js      # If exists
```

---

## Memory Cleanup

### What Happens to Temp Files

```javascript
// Current implementation (already good):

// Multer stores to /tmp (system temp)
const upload = multer({ dest: '/tmp/voter-pdfs' });

// We process the file
await extractVotersFromPdf(req.file.path);

// Then delete it
fs.unlinkSync(req.file.path);

// /tmp is auto-cleaned by OS
```

✅ **Already optimal - nothing to change!**

---

## Storage Verification

### Before (Old Way)
```
backend/uploads/pdfs/
├── file1.pdf (10MB)
├── file2.pdf (12MB)
├── file3.pdf (9MB)
└── ... (accumulates forever)

Total: Could be 100GB+ on large scale
```

### After (New Way)
```
backend/uploads/
└── [EMPTY or DELETED]

All data in MongoDB:
db.voters collection
- Size: ~50MB for 100,000 voters
- Indexed and searchable
- No PDF files!
```

---

## Deployment Cleanup

### Before Pushing to Vercel

```bash
# 1. Remove uploads folder
rm -rf backend/uploads

# 2. Update .gitignore
echo "
# Build and deps
node_modules/
dist/
build/

# Environment
.env
.env.local

# Temp files
/tmp
.DS_Store

# Uploads (no longer used)
uploads/
" >> .gitignore

# 3. Commit
git add -A
git commit -m "chore: cleanup unused upload infrastructure"

# 4. Verify what's being pushed
git diff --cached --name-status

# 5. Push
git push origin main
```

---

## Free Tier Optimization

### Vercel
- ✅ No file storage needed
- ✅ Stateless functions only
- ✅ Perfect fit

### MongoDB Atlas
- ✅ 512MB free tier
- ✅ ~50MB for 100,000 voters
- ✅ Plenty of room

### No External Storage
- ✅ Cloudinary not needed
- ✅ AWS S3 not needed
- ✅ Google Cloud not needed

**Result: $0 hosting cost!** 🎉

---

## Summary

| Item | Action | Reason |
|------|--------|--------|
| /uploads folder | Delete | No longer used |
| .gitignore | Update | Prevent re-adding |
| Multer config | Keep | Still needed |
| .env upload vars | Optional | Won't hurt |
| Old file routes | Delete | Redundant |
| Database | Keep | All data here |
| Cloudinary | Optional | Only if images |

---

## Post-Cleanup Testing

After cleanup, test:

```bash
# 1. Backend starts normally
npm run dev

# 2. Upload a PDF
# Expected: Works, saves to DB, deletes PDF

# 3. Search voters
# Expected: Instant results from DB

# 4. No /uploads folder created
# Expected: Clean filesystem
```

---

## Questions?

**Q: Will upload still work?**
A: Yes! Multer stores to `/tmp`, we process it, then delete it. No permanent storage.

**Q: Do I need uploads folder?**
A: No! All data goes to MongoDB now.

**Q: What if I want to add file storage later?**
A: Just install S3 or Cloudinary SDK. DB-first approach doesn't conflict.

**You're all set!** ✨
