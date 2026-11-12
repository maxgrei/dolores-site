---
name: add-build
description: Add or update a member's build essay on the Dolores site. Use when someone pastes or attaches an essay and says which member and which build number it is.
---
1. Confirm member name and build number (1–8). Builds 2 and 6 are team builds.
2. Save the essay text exactly as given (no rewriting, no "improving") to
   `content/build-N/<member>.md`, keeping italics for titles and the bibliography.
3. In `data/site.js`, set that build's status to "reached" for that member, add title,
   word count, and Plutarch page refs mentioned in the text (for Analysis Mode).
4. Make sure `essays/build-N/index.html` and `members/<member>.html` show it.
5. Run the site locally and check the page on desktop and phone width.
6. Tell Max what changed. Do not push unless asked.
