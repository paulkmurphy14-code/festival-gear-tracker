# Band Extraction Test Plan

## Test Files Created

### 1. `test-schedule-edge-cases.csv` - Edge Cases & Security Tests
Tests the system's ability to handle unusual but potentially valid band names.

#### What We're Testing:

**Normalization Tests:**
- `The Script`, `the script`, `THE SCRIPT`, `Script` - Should all normalize to "script" and group together
- `A Perfect Circle` - Should normalize to "perfect circle"
- `The Rolling Stones` - Should normalize to "rolling stones"
- `The The The` - Should normalize to "the the" (removes only first "The")
- `The The`, `A A`, `An An` - Edge cases with article words

**Special Characters:**
- `Band, With Comma` - Commas in band names (CSV delimiter)
- `Band"With"Quotes` - Quotes within name
- `Band & The Others` - Ampersands
- `Band@#$%^&*()` - Special characters
- `Band\\With\\Backslashes`, `Band/With/Slashes` - Path characters
- `Band:With:Colons`, `Band?With?Questions` - Other special chars

**Whitespace Handling:**
- `Band With   Multiple    Spaces` - Should normalize to single spaces
- `   Leading Spaces` - Should trim
- `Trailing Spaces   ` - Should trim
- `Band　With　Japanese　Space` - Non-breaking spaces

**Length Tests:**
- `VeryLongBandNameThatGoesOnAndOn...` - Very long names
- `A` - Single character name
- `The`, `An` - Just article words

**Unicode & Emoji:**
- `🎸Rock🎸Band🎸` - Emojis in name
- `🔥💀😈👻🎃` - Only emojis
- `Ťĥĕ Ûñįćőđĕ Ḃȧñđ` - Accented characters
- `ＡＢＣＤ Ｆｕｌｌｗｉｄｔｈ` - Full-width characters

**Security/Injection Tests:**
- `<script>alert('XSS')</script>` - XSS attempt
- `'; DROP TABLE bands; --` - SQL injection attempt
- `<img src=x onerror=alert(1)>` - HTML injection
- `javascript:alert('test')` - JavaScript protocol
- `../../../etc/passwd` - Path traversal
- `${injection}` - Template injection
- `Band || 1==1` - Logical operator injection

**Reserved Words/Values:**
- `null`, `undefined`, `true`, `false` - JavaScript keywords
- `0`, `NaN`, `Infinity` - Special numbers
- `\n\r\t` - Escape sequences

### 2. `test-schedule-invalid-data.csv` - Validation Tests
Tests the CSV validation and error handling.

#### What Should Fail:

1. **Empty/Missing Fields:**
   - Row with empty band name - ❌ Should reject
   - Band without stage - ❌ Should reject
   - Band without date - ❌ Should reject
   - Band without time - ❌ Should reject
   - Complete blank row - ❌ Should skip

2. **Invalid Stage Names:**
   - `Wrong Stage Name` - ❌ Should reject (stage doesn't exist)

3. **Invalid Date Formats:**
   - `99-99-9999` - ❌ Invalid date
   - `2025-11-08` - ❌ Wrong format (YYYY-MM-DD instead of DD-MM-YYYY)
   - `08/11/2025` - ❌ Wrong delimiter (slash instead of dash)
   - `08-11-25` - ❌ 2-digit year
   - `8-11-2025` - ❌ Single-digit day (should be 08)
   - `00-00-0000` - ❌ Invalid date values
   - `32-13-2025` - ❌ Invalid day/month

4. **Invalid Time Formats:**
   - `99:99` - ❌ Invalid hour/minute
   - `10:00 PM` - ❌ 12-hour format (expecting 24-hour)
   - `9:00` - ❌ Single-digit hour (should be 09)
   - `24:00` - ❌ Hour out of range (0-23)
   - `12:60` - ❌ Minute out of range (0-59)
   - `-01:00` - ❌ Negative time
   - `1:5` - ❌ Missing zero padding

5. **Malformed CSV:**
   - `Too,Few,Columns` - ❌ Only 3 columns (need 4)
   - `Too,Many,Columns,Here,Extra,Extra` - ❌ Too many columns
   - Unescaped quotes - ❌ Should handle or reject
   - Missing closing quotes - ❌ Should handle or reject

6. **Special Content:**
   - Multi-line band names - Should handle or reject gracefully
   - Tab characters - Should handle or reject

---

## Expected Behavior

### ✅ What Should Work:

1. **Normalization:**
   - All variations of "The Script" group together
   - Special characters removed during normalization
   - Leading/trailing spaces trimmed
   - Multiple spaces normalized to single space

2. **Band Registry:**
   - Creates one entry per unique normalized name
   - Stores original name for display
   - Marks `source: "schedule"`

3. **Autocomplete in RegisterGear:**
   - Shows schedule bands with 📅 icon
   - Fuzzy search works with normalized names
   - Can type "script" and find "The Script"

4. **GearList Grouping:**
   - All "The Script" variations group together
   - Can click 📅 to see schedule modal
   - Modal shows all performances for that band

### ❌ What Should Fail Gracefully:

1. **Validation Errors:**
   - Clear error messages indicating which rows failed
   - Shows row numbers
   - Lists all errors before failing
   - Shows available stages in error message

2. **No Crashes:**
   - XSS attempts sanitized/escaped
   - SQL injection attempts treated as strings
   - No JavaScript execution from CSV data
   - No file system access from path traversal attempts

3. **Data Integrity:**
   - Invalid rows don't corrupt database
   - Partial uploads don't occur (all or nothing)
   - Existing data preserved if upload fails

---

## How to Test

### Step 1: Upload Valid Edge Cases
1. Go to **Schedule** page
2. Click **Upload Schedule CSV**
3. Select `test-schedule-edge-cases.csv`
4. Click **Preview & Upload**
5. **Expected:** Preview shows ~52 rows parsed successfully
6. Click **Confirm Upload**
7. **Expected:** Success message showing bands extracted

### Step 2: Check Band Registry
1. Go to **Register** page
2. Click in **Band Name** field
3. Type "script"
4. **Expected:** Shows "The Script", "the script", "THE SCRIPT", "Script" with 📅 icons
5. Check they're treated as same band (normalized)

### Step 3: Check GearList Grouping
1. Register some gear for different variations ("The Script", "Script")
2. Go to **Gear List**
3. **Expected:** All gear grouped under one band name
4. Click 📅 icon
5. **Expected:** Modal shows all performances from schedule

### Step 4: Test Security
1. Check browser console for any errors
2. Inspect rendered band names in UI
3. **Expected:** No JavaScript execution, no XSS alerts
4. **Expected:** Special characters displayed safely

### Step 5: Upload Invalid Data
1. Go to **Schedule** page
2. Upload `test-schedule-invalid-data.csv`
3. **Expected:** Error message listing all validation failures
4. **Expected:** Shows row numbers and specific errors
5. **Expected:** Lists available stages
6. **Expected:** No data imported (all-or-nothing)

### Step 6: Test Normalization Edge Cases
1. Check how articles are handled:
   - "The The The" → should become "the the"
   - "A A" → should become "a"
   - "THE A AN BAND" → should become "a an band"

2. Check special character removal:
   - "Band@#$%^&*()" → should become "band"
   - "Band & The Others" → should become "band  others"

3. Check unicode handling:
   - Emojis removed or preserved?
   - Accented characters preserved?

---

## Success Criteria

### ✅ Pass Conditions:
1. No JavaScript execution from CSV data
2. No application crashes
3. Clear validation errors for invalid data
4. All valid edge cases processed
5. Proper normalization and grouping
6. Security attempts safely handled
7. Data integrity maintained

### ❌ Fail Conditions:
1. XSS alert boxes appear
2. Application crashes or freezes
3. Invalid data gets imported
4. Database corruption
5. Unclear/missing error messages
6. Partial imports (some rows succeed when validation fails)

---

## Notes for Testing

- **Before starting:** Backup your festival data
- **Test in order:** Edge cases first, then invalid data
- **Check console:** Monitor for unexpected errors
- **Inspect database:** Verify band registry entries
- **Test real-world:** After tests pass, try with real festival schedule

Good luck breaking the system! 🔨
