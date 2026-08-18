# PREMIUM VISUAL OVERHAUL — REFERENCE IMAGE DIRECTION

## IMPORTANT

The existing Sequence+ game is already functional.

The existing prompt contains the authoritative requirements for:

- WebSocket multiplayer
- Server-authoritative game state
- Player hands
- Deck
- Board
- Turn system
- Timers
- Auto-play
- Host controls
- Spectators
- Jacks
- Sequence detection
- Room URLs
- Reconnect behavior
- Responsive mobile/desktop behavior
- Privacy/security

**DO NOT replace, simplify, remove, or rewrite those systems to accomplish this visual redesign.**

This section is an **art direction and UI/UX enhancement layer**.

The goal is:

> **Keep the exact same game underneath, but make the experience look and feel like the beautiful premium fantasy mobile game shown in the supplied reference image.**

The supplied reference image is the primary visual target for the visual redesign.

Do not reproduce the screenshot as a single image.
Do not use the screenshot as a background.
Do not create invisible buttons over a screenshot.
Do not fake the board.
Do not fake the cards.
Do not fake the tokens.
Every important visual element must remain a real interactive application component.

---

# 1. VISUAL TARGET

Evolve the game from **"premium fantasy tabletop website"** into **"premium fantasy/anime mobile board game that happens to run in a browser."**

Visual characteristics:
- Deep midnight-blue background
- Royal blue illumination
- Rich indigo/purple atmospheric lighting
- Glowing cyan interface elements
- Antique/rich gold ornamentation
- Warm ivory playing cards
- Glossy physical game tokens
- Anime/chibi character artwork
- Cute fantasy mascots
- Crowns
- Cherry blossoms
- Floating petals
- Magical particles
- Soft atmospheric lighting
- Strong depth
- Layered UI panels
- Beautiful shadows
- Subtle 3D effects
- Tactile buttons
- Premium game-table presentation

Reproduce the **design language**, not the literal screenshot dimensions.

---

# 2. DESIGN PHILOSOPHY

The interface should feel like a physical fantasy game table brought to life.

Every element should have a sense of:
- depth
- material
- lighting
- hierarchy
- tactility
- personality

The user should feel:

> "I am sitting at a magical royal game table."

NOT:

> "I am using a website with a board on it."

Avoid generic Bootstrap/Material panels, flat buttons, generic gradients, stock icons, generic emoji-only avatars, flat token circles, and basic playing-card rectangles.

---

# 3. VISUAL HIERARCHY

1. SEQUENCE logo / crown
2. Game status / room information
3. Player roster
4. Large central board
5. Current-turn HUD
6. Hand of cards
7. Finish Turn control
8. Decorative fantasy artwork

The board remains the visual centerpiece.

---

# 4. BACKGROUND

Use a layered fantasy environment:
- midnight navy
- royal blue
- indigo
- subtle violet

Layers:
1. Deep navy base
2. Soft blue/cyan illumination behind board
3. Subtle violet/indigo outer atmosphere
4. Faint fantasy ornament texture
5. Tiny magical particles
6. Cherry blossom framing
7. Slow floating petals

Keep the center dark and uncluttered so the board remains readable.

Decorative elements must use `pointer-events: none`.

---

# 5. CHERRY BLOSSOMS

Create actual assets for:
- blossom clusters
- individual blossoms
- petals
- decorative branches

Use around outer edges, never over cards, board spaces, controls, buttons, or text.

Petal animation must be slow, subtle, low CPU, and non-interactive.

---

# 6. SEQUENCE LOGO

Create a premium actual logo asset.

Text: **Sequence**

Design:
- elegant handwritten/script lettering
- gold-to-warm-orange appearance
- soft golden glow
- luminous edge
- small royal crown
- tiny sparkles
- decorative flourish

Do not use plain system text for the primary logo.

Responsive: scale down rather than crowding the board on small screens.

---

# 7. CROWN BRANDING

Use one consistent crown asset for:
- Host
- Sequence logo
- Finish Turn
- Victory
- Important state moments

Crown should be elegant, gold, dimensional, royal, and cohesive.

---

# 8. ROOM PANEL

Upgrade room presentation into a premium fantasy HUD:
- dark translucent navy
- royal-blue border
- subtle cyan glow
- rounded corners
- inner highlight
- depth
- soft shadow

Keep the existing room URL and copy/share functionality unchanged.

Copy button should glow briefly and provide "Copied!" feedback.

---

# 9. STATUS HUD

Use compact premium HUD modules for:
- Sequences to Win
- Players
- Deck
- Timer

Each module:
- dark navy
- subtle blue border
- cyan glow
- polished icon
- large readable number
- small label

Numbers should dominate visually.

---

# 10. GLASS-FANTASY PANELS

Panels should look like **dark enchanted glass + polished metal trim**.

Use:
- translucent navy
- subtle blue gradient
- thin cyan/blue border
- inner highlight
- outer shadow
- subtle glow
- rounded corners

Avoid generic glassmorphism.

---

# 11. DESKTOP PLAYER ROSTER

Preserve the desktop left-side player roster.

Transform it into a premium fantasy party screen.

Each player card:
- character/emoji portrait
- name
- team
- card count
- host crown
- connection state
- turn state
- sequence progress where appropriate

Current player receives strongest emphasis:
- cyan/blue glow
- brighter border
- subtle pulse
- YOUR TURN indicator

Do not make every player card glow equally.

---

# 12. AVATAR SYSTEM

Preserve the existing emoji identity system.

Present emoji inside polished fantasy avatar frames:
- circular portrait frame
- team-colored ring
- subtle glow
- gold crown if host

The emoji remains the player's chosen identity.

Optional cohesive fantasy character artwork can supplement the visual identity, but never remove emoji selection without explicit instruction.

Suggested character direction:
- DOLLY: elegant anime/chibi fantasy heroine, dark hair, royal blue, gold, crown
- KIKO: cute magical cat, white fur, blue accents
- MIMI: pink-haired fantasy heroine, playful, green accents
- BEAR: cute panda/bear mascot, green association
- REX: dark fantasy wolf/cat, red accents
- LUNA: magical white cat, lavender/pink, red association

All artwork must share one premium anime/chibi art direction.

---

# 13. MASCOT

Create a signature royal companion mascot:
- fluffy white cat/fox
- huge blue-violet eyes
- pink inner ears
- lavender/cyan shading
- tiny gold crown
- adorable royal expression

Desktop: upper-right decorative area.
Mobile: shrink, move, or hide as space requires.

Never consume gameplay space.

---

# 14. MAIN BOARD FRAME

The board should feel like a physical magical tabletop.

Layering:
- outer deep royal blue
- gold trim
- inner deep navy
- warm ivory board surface

Add beveling, shadows, highlights, subtle texture, and ornamental corners.

Never make it feel like a flat HTML grid.

---

# 15. BOARD CARDS

Make board spaces feel like premium physical playing cards:
- warm ivory
- subtle paper tone/texture
- rounded corners
- inner border
- gold/neutral trim
- realistic soft shadow
- slight depth

Red suits: rich ruby/crimson.
Black suits: deep navy/near-black.

Ranks and suits must remain highly readable on mobile.

---

# 16. FREE CORNERS

Preserve all existing corner rules.

Visually redesign FREE spaces as magical medallions:
- cream/gold
- ornate border
- subtle glow
- FREE label
- decorative center

Do not place a physical token on a corner.

---

# 17. TOKENS

Replace flat circles with polished physical chips:
- glossy enamel
- beveled edge
- raised center
- embossed emblem
- soft reflection
- contact shadow
- team-colored glow

Team colors remain:
- Blue: royal/cyan
- Green: emerald/mint
- Red: ruby/crimson

All use identical physical design with team-color changes.

---

# 18. TOKEN ANIMATION

On placement:
1. start slightly smaller
2. fade in
3. scale to ~105%
4. gentle bounce
5. short glow
6. settle

On removal of a staged token:
- highlight
- slight shrink
- fade
- return to normal

Do not replay token animations on ordinary WebSocket/timer refreshes.

---

# 19. CURRENT TURN HUD

Local player:

**👑 YOUR TURN**

Player Name

🔵 Team Blue

42s

Use avatar, crown, team glow, timer, and progress bar.

Another player:

**🐼 Kiko's Turn**

Team Red

Waiting...

Make active vs waiting immediately obvious.

---

# 20. TIMER

Keep the existing authoritative timer architecture.

Visual only:
- normal: cyan/blue/gold
- low: amber
- critical: red + subtle pulse

Never flash the entire UI.

---

# 21. PREMIUM HAND

Use a dark navy game tray behind the player's hand.

Tray:
- rounded upper edge
- blue glow
- subtle team-colored lighting
- shadow
- depth

Cards should feel physical and sit inside the tray.

Fan them subtly but keep each card individually tappable.

---

# 22. HAND CARD DESIGN

Use:
- ivory face
- rounded corners
- subtle border
- paper texture
- realistic shadow
- slight depth
- readable rank/suit
- polished face-card artwork where applicable

Selected card:
- raises
- scales slightly
- cyan/blue glow
- brighter border
- shine

Do NOT animate/redeal/rebuild the whole hand on each state update.

---

# 23. PRIVATE HAND + TEAM IDENTITY

Hand tray should softly glow by team:
- blue
- green
- red

Display a clear badge:
🔵 Team Blue
🟢 Team Green
🔴 Team Red

Team identity should also appear in player cards, turn HUD, tokens, and relevant selection states.

---

# 24. SPECIAL JACKS

ONE-EYED JACK:
- premium fantasy character art
- red/dark/gold palette
- REMOVE TOKEN label
- legal opponent tokens glow gold
- protected sequence tokens do not glow
- own tokens do not glow

TWO-EYED JACK:
- blue/violet/gold magical artwork
- WILD / ADD TOKEN label
- legal empty spaces glow blue/gold

Preserve existing rules.

---

# 25. FINISH TURN

Make Finish Turn the primary CTA.

Design:
- warm gold gradient
- orange lower edge
- dark gold outline
- inner highlight
- rounded pill
- soft shadow
- golden glow
- crown icon

States:
- Place Move First
- 👑 Finish Turn
- Finishing...

The existing functionality must remain exactly unchanged.

---

# 26. UNDO

Secondary dark navy fantasy button with blue outline and subtle cyan glow.

Use polished curved-arrow icon.

Never compete visually with Finish Turn.

---

# 27. HINT

Premium blue/cyan helper button with lightbulb and optional badge.

Hints remain PRIVATE to the current player.

Never reveal another player's legal spaces or hand-based opportunities.

---

# 28. DESKTOP COMPOSITION

Desktop should look like a complete fantasy tabletop:

LEFT: player roster
CENTER: large board
TOP: logo + room/status HUD
RIGHT: decorative mascot/context artwork
BOTTOM: hand + actions

Entire game should fit in one browser viewport whenever practical.

If space is limited:
1. preserve gameplay
2. preserve board
3. preserve hand
4. preserve turn controls
5. reduce decoration

Do not turn the game into a long scrolling webpage.

---

# 29. MOBILE COMPOSITION

Mobile portrait is a first-class experience.

Priority:
1. board
2. current turn
3. hand
4. Finish Turn
5. Undo / Hint
6. essential player information

Reduce/hide:
- large mascot
- decorative flowers
- particles
- large logo
- secondary HUD

The hand must not cover Finish Turn.

---

# 30. RESPONSIVE RULE

Do NOT implement the reference image as a fixed canvas.

Support:
- small phones
- large phones
- tablets
- desktop browsers
- landscape
- portrait
- varied browser viewport heights

Use responsive grid/flex, viewport-aware sizing, max dimensions, and breakpoints.

The reference is art direction, not a coordinate map.

---

# 31. DECORATIVE ART / ASSETS

Create actual assets where appropriate.

Suggested structure:

/assets
  /branding
    sequence-logo
    crown
  /background
    fantasy-background
  /characters
    character-art
  /mascot
    royal-cat
  /tokens
    blue-token
    green-token
    red-token
  /cards
    jack-one-eyed
    jack-two-eyed
    face-card-assets
  /decorations
    cherry-blossoms
    petals
    sparkles
    ornamental-corners
  /icons
    cohesive-game-icons

Prefer SVG for simple icons and optimized WebP/PNG for artwork/decorations.

---

# 32. ART PROMPT DIRECTION

Main background:
"Premium fantasy mobile board game environment, deep midnight navy and royal blue background, subtle indigo and violet atmospheric lighting, luxurious magical tabletop aesthetic, delicate pink cherry blossom branches around the outer edges, individual cherry blossom petals floating through the scene, tiny golden magical particles and stars, faint ornate fantasy patterns, soft cyan illumination surrounding the central game area, sophisticated Japanese-inspired fantasy atmosphere, rich cinematic depth, elegant royal game aesthetic, polished commercial mobile game artwork, clean dark central area for gameplay, no text, no cards, no UI, no buttons, no characters."

Mascot:
"Adorable premium anime chibi fantasy white cat-fox mascot, extremely fluffy white fur, huge expressive blue-violet eyes, pink inner ears, subtle lavender and cyan shading, wearing a tiny elegant ornate golden crown, magical royal companion, cute but sophisticated, premium commercial mobile game character art, polished soft cinematic lighting, highly detailed fur, luxurious fantasy aesthetic, clean silhouette, transparent background, full character visible, no text."

Character art:
"Premium anime chibi fantasy mobile game character portrait, large expressive eyes, polished soft rendering, elegant fantasy clothing, subtle magical details, rich royal blue and gold accents, sophisticated cute design, high-end commercial game artwork, soft cinematic lighting, clean silhouette, consistent character art direction, transparent background, no text."

Token art:
"Premium 3D fantasy board game token, circular physical game chip, glossy enamel surface, beveled edge, raised embossed magical emblem in center, realistic soft reflection, subtle directional highlight, soft contact shadow, luxurious high-end tabletop game piece, transparent background."

One-Eyed Jack:
"Premium fantasy anime playing-card character, charismatic royal jack character, dramatic elegant pose, dark blue and crimson fantasy clothing, ornate gold details, one-eye magical motif, confident expression, high-end collectible card game artwork, sophisticated chibi/anime rendering, polished lighting, designed for a special REMOVE TOKEN card, transparent background, no text."

Two-Eyed Jack:
"Premium fantasy anime playing-card character, charismatic magical jack character, elegant blue violet and gold fantasy clothing, two-eye magical motif, confident friendly expression, ornate royal details, magical energy, high-end collectible card game artwork, sophisticated chibi/anime rendering, polished lighting, designed for a special WILD ADD TOKEN card, transparent background, no text."

---

# 33. PARTICLES

Use a restrained particle system:
- tiny blue lights
- tiny gold sparkles
- occasional pink petals

Keep low opacity and keep particles away from board/text/controls.

Increase particles only during Sequence celebration.

---

# 34. LOADING + ERROR STATES

Loading should use:
- Sequence logo
- crown
- blue magical glow
- tiny sparkles
- short progress animation

Errors should use polished fantasy notifications rather than browser-default alerts.

Examples:
- Unable to place that move.
- Connection restored.
- Waiting for the server...

---

# 35. CRITICAL PERFORMANCE RULE

Timer/state updates must NOT:
- rebuild the hand
- replay card animations
- flicker the board
- redeal cards
- reset selected cards
- replay token animations
- rebuild player roster unnecessarily

Only actual state changes trigger corresponding visual changes.

Animations must be event-driven, not refresh-driven.

---

# 36. DO NOT OVERDESIGN

Do not:
- put glowing borders on everything
- animate everything
- cover board with flowers
- use too many accent colors
- use excessive particles
- make every panel transparent
- make every button gold
- make everything oversized

Aesthetic target:

**luxurious, magical, polished, restrained.**

---

# 37. VISUAL PRIORITY ORDER

If decoration conflicts with usability:

1. Gameplay
2. Board readability
3. Card readability
4. Touch interaction
5. Turn visibility
6. Hand readability
7. Player information
8. Decorative artwork

Never sacrifice the first seven for the eighth.

---

# 38. FINAL QUALITY BAR

The result should look like the existing Sequence+ game was professionally polished by:
- game UI designer
- fantasy illustrator
- mobile UX designer
- motion designer
- sound designer

The game should feel:
- premium
- magical
- tactile
- cute
- elegant
- competitive
- satisfying
- alive
- cohesive
- commercially shippable

---

# MOST IMPORTANT INSTRUCTION

**DO NOT CHANGE THE GAME'S CORE FUNCTIONALITY TO ACHIEVE THIS LOOK.**

Keep:
- WebSockets
- server authority
- persistent hands
- private cards
- authoritative timers
- auto-play
- host controls
- spectators
- Jacks
- sequence rules
- room system
- reconnect logic
- responsive behavior
- current interaction flow

Only make the game:

**MUCH MORE BEAUTIFUL.**

The ideal result is:

> **The exact same working Sequence+ game, but visually transformed into the gorgeous magical anime fantasy tabletop game represented by the supplied reference image.**

The finished product should look **intentional, cohesive, premium, and commercially shippable.**
