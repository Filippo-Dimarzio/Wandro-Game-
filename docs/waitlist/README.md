# Beta waitlist (`/join`)

The `/join` page collects beta sign-ups for the market test. Share it as
<https://filippo-dimarzio.github.io/Wandro-Game-/join>, and tag each link with where it was shared, so
the scorecard can tell channels apart:

| Where                                          | Link ends with        |
| ---------------------------------------------- | --------------------- |
| Instagram bio                                  | `/join?src=instagram` |
| TikTok bio                                     | `/join?src=tiktok`    |
| Ad A ("Make this city yours")                  | `/join?src=ads-a`     |
| Ad B ("Find the places most people walk past") | `/join?src=ads-b`     |
| Erasmus and student groups                     | `/join?src=erasmus`   |
| Expat groups                                   | `/join?src=expats`    |
| Fog Walk posters                               | `/join?src=fogwalk`   |

## Where sign-ups go

- **With the backend** (Supabase configured): the `waitlist` table. Visitors can only add a row,
  never read the list; you see it in the Supabase dashboard.
- **On the demo site** (no backend yet): a Google Sheet you own, through a small Apps Script.
  Until it's connected, the page says sign-ups open soon instead of losing anyone's details.

## Connect the Google Sheet (about 10 minutes, once)

1. Create a Google Sheet called **Wandro waitlist**.
2. In the sheet, open **Extensions → Apps Script**, delete what's there, and paste in
   [`apps-script.gs`](apps-script.gs). Save.
3. Click **Deploy → New deployment**, choose the type **Web app**, set **Execute as: Me** and
   **Who has access: Anyone**, then **Deploy**. Approve the permissions Google asks for.
4. Copy the **Web app URL** (it ends in `/exec`).
5. In GitHub, open the repository's **Settings → Secrets and variables → Actions → Variables**,
   add a variable named `WAITLIST_URL` with that URL.
6. Re-run the **Deploy web app** workflow (Actions tab), or push any change. The page now sends
   sign-ups to the sheet's **Sign-ups** tab.
7. Test it: sign up with your own email, check the new row, then delete it.

The script checks every answer, ignores repeat emails, and stores text as plain text so nothing
typed in can run inside the sheet.

## Privacy

People tick a consent box before joining, and the page links to the privacy page. Only use the
list to email people about the Wandro beta and Fog Walks. If someone asks to be removed, delete
their row. Keep the sheet private to the two founders.
