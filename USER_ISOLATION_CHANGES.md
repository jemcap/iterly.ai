# User Isolation Changes for Comments

## Problem
Comments extracted from Figma files were stored universally, meaning if User A imports a file and then User B imports the same file, User B wouldn't get their own copy of the comments because they already existed in the database.

## Solution Implemented

### 1. Database Schema Changes
- **Added `figmaCommentId` field** to the Feedback model for better uniqueness tracking
- **Uses existing `userId` field** to make comments user-specific

### 2. Import Logic Changes (`/app/api/figma/import/route.ts`)
- **Updated uniqueness check**: Now checks for existing feedback using `figmaCommentId`, `designFileId`, AND `userId`
- **Added figmaCommentId storage**: Stores the original Figma comment ID for true uniqueness
- **User-specific comments**: Each user gets their own copy of comments even for the same Figma file

### 3. Query Updates
- **Tasks API**: Already filtered by user through feedback relationship ✅
- **Design Files API**: Updated to show files that have user's feedback (not just files uploaded by user)
- **Feedback counting**: Now counts only feedback from the current user

## How It Works Now

1. **User A imports Figma File X**:
   - Comments are stored with `userId = UserA.id`
   - Tasks are generated for User A

2. **User B imports the same Figma File X**:
   - Gets their own copy of all comments with `userId = UserB.id`
   - Tasks are generated for User B independently
   - User A's data is completely isolated from User B's data

3. **Dashboard Views**:
   - Each user only sees their own comments, tasks, and feedback counts
   - Design files appear in a user's dashboard only if they have imported comments from that file

## Database Migration Required

After updating the Prisma schema, run:
```bash
npx prisma migrate dev --name add-figma-comment-id
# or
npx prisma db push
```

Or manually run the SQL:
```sql
ALTER TABLE feedbacks ADD COLUMN figmaCommentId TEXT;
```

## Benefits

1. **Complete User Isolation**: Users can't see each other's data
2. **Same File, Multiple Users**: Multiple users can import the same Figma file independently
3. **Data Integrity**: Each user's workflow is completely separate
4. **Scalable**: Works for any number of users importing any number of files

## Files Modified

- `prisma/schema.prisma` - Added figmaCommentId field
- `app/api/figma/import/route.ts` - Updated import logic for user isolation
- `app/api/design-files/route.ts` - Updated to show user-specific files and counts
- Various debugging and real-time update files (already user-filtered)

## Testing Recommendations

1. Create two test users
2. Have both import the same Figma file
3. Verify each user sees their own separate comments and tasks
4. Verify comment counts are accurate per user
5. Test real-time updates work for each user independently