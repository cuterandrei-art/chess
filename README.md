# ♞ Chess Career

A single-file chess game where you live a career: start unrated, climb the Elo
ladder, earn real FIDE titles from norms and rating, and try to reach the World
Championship. Around the board there is a whole life — tournaments, prep,
rivalries, sponsors, coaches, a chess park where you play for cash, simuls,
story arcs, rent that has to be paid on Sunday.

Everything is saved privately in your browser. No account, no server, and once
it has loaded once it works with no internet at all.

---

## First run

Thirty-odd screens is a lot to be dropped into. The first time you open it,
three questions — how much chess you play, what you want out of it, and how the
board should look — set the engine strength, the time control, the puzzle
difficulty and the career pace, and land you on the screen that matches what
you said. Skip it and nothing at all is changed. It runs once, and *Settings →
Run the setup questions again* puts you back through it.

---

## Connecting your Chess.com account

The tracker can read your real games. Chess.com's public API has **no login** —
no OAuth, no token, no password — so connecting is not authentication: every
endpoint the app touches is readable by anyone who knows the username, and the
only thing stored is that username. What connecting buys you is that it is
remembered and kept current: open **Learn → Chess.com tracker**, type your name
once, and from then on the app syncs by itself whenever you are online and the
last sync is more than six hours old.

Syncs are incremental. The app remembers the finish time of the newest game it
holds, skips every archive month that closed before it, and inside the months it
does read ignores anything already seen — so a catch-up after a session costs
one request, not a crawl of your whole history. *Re-import all* forces a full
re-read and leaves games imported from Lichess untouched. Offline, the card
says so, the buttons go quiet, and every number below it still works from the
last sync.

## Installing it — the button in the app

The app carries its own **Install** button: in the top bar, in Settings, and in
the **More** menu on a phone. Where the browser allows it, one press is a real
install — Chrome and Edge on Windows, macOS and Linux, and Chrome on Android.
The app keeps the `beforeinstallprompt` event the browser fires and replays it
on that press.

Not every browser can do that, and a button that silently does nothing is worse
than no button, so the cases that cannot are told apart and given the real
steps instead: Safari on iPhone and iPad has no prompt at all (Share → Add to
Home Screen), desktop Safari uses File → Add to Dock, Firefox has no desktop
install, and a page opened straight from a `file://` path cannot install itself
under any browser — there it offers Chrome's *Create shortcut → Open as window*,
which still gives an icon and its own window.

For a one-press install you need the app served over https. Drop `netlify/`
(or the built `ChessCareer-netlify.zip`) on https://app.netlify.com/drop, or
switch GitHub Pages on — see below.

## Get it on your phone

**Android app (recommended).** Every push builds an installable APK and attaches
it to the auto-updated pre-release:

> **https://github.com/cuterandrei-art/chess/releases/tag/latest-android**

Open that link on your phone, download `ChessCareer.apk`, allow your browser to
"install unknown apps", and install it. It launches from your app drawer and
runs entirely offline.

**Web app (PWA).** Once GitHub Pages is switched on (see below) the app is live
at:

> **https://cuterandrei-art.github.io/chess/**

Open it on your phone and use *Add to Home Screen* (iOS: Share → Add to Home
Screen). It installs like an app and works offline.

**Just the file (fully offline).** `ChessCareer-standalone.html`, built by
`node build-standalone.mjs`, is the whole game in one file that fetches
*nothing* — the rules engine, all 25,000 puzzles and the piece graphics are
inlined, and the web-font links are removed. Put it on a phone, a USB stick or
a plane and open it. The only thing it will still reach for is Stockfish, and
only if you play the engine, open the eval bar or run Game Review; everything
else works with the radio off.

`work/openingtrainer.html` is the same app but still pulls the pieces and the
font from a CDN (pieces fall back to Unicode glyphs offline).

### One-time: switch Pages on

The deploy workflow cannot enable Pages by itself (GitHub does not give the
workflow token that permission). Once, by hand:

1. Go to **Settings → Pages**.
2. Set **Source** to **GitHub Actions**.

Re-run the *Deploy the app to GitHub Pages* workflow and every push after that
publishes automatically.

---

## Opponents that play like people

A rating only means something inside its own time control. The same person is
a different player at 3+2 and at 90+30, and the app now models that in two
places. First their **numbers**: a character's classical rating is their
anchor, and their rapid, blitz and bullet ratings sit below it — far below for
a club player, barely below for a super-GM, who is sharp at every speed.
Second their **moves**: a 1700 blitz rating is a fair rating among blitz
players, but the moves behind it are worse than 1700 moves played with two
hours on the clock, so the engine is given a lower quality target for the same
label. Pick a time control in *Play* and every character's headline rating,
and how they actually play, changes with it.

On top of that they **miss things**. That is the one thing an engine never
does and a person always does, and it was most of why the old bots felt two
hundred points stronger than their label: they made small errors at an even
rate and then never, ever hung anything. Every opponent now carries a slip
chance — rare and small for a 2700, routine for a 1200, worse for everyone in
time trouble.

### and use a clock like people

Real players do not spend an even slice of the clock on every move. They
rattle out the opening from memory, stop hard on the first move that is
genuinely theirs, snap off recaptures and forced moves, think longer when the
position is unclear or has just changed, keep a safety buffer, and then — short
of time — move almost on reflex and play worse for it. Each character also has
a **pace**: Blitz Bella moves fast, Grinder Grace does not.

What comes off their clock and how long you sit there are deliberately not the
same number. In blitz and bullet they are — that is the whole point of the
format. In a rapid or classical game the wait is compressed by a square root,
so the shape of the think survives: a quick move still feels quick, a hard one
still feels hard, and only the once-a-game monster think reaches the ceiling.
Their clock drains at the matching rate, so what you watch tick down is what a
person would really have burned. Over a 30+20 game that is about a minute a
move on their clock and two or three seconds of your life.

---

## Training by what a puzzle teaches

The bundled Lichess set carries six tags — mate, mate-in-1/2/3, endgame and
promotion — and 9,291 of its 25,000 puzzles carry none at all. The motifs
people actually want to drill were dropped when the set was built.

They did not need to be downloaded. A motif is a fact about the position and
the solution, so the app reads it off the board with the rules engine it
already bundles: **fork, pin, skewer, discovered attack, double check, hanging
piece, sacrifice, back-rank mate, smothered mate, quiet move, advanced pawn**.
No new data, no network, and it works in the fully offline build like
everything else. Pick one from the theme menu, or tap a motif under a puzzle
you have just solved to get more of the same.

Two rules keep the tagging honest. A motif is only reported when the key move
is what brings it about — a rook that already shared a file with two enemy
pieces before anyone moved is not what anybody means by a pin — and the set's
own tags always win where they exist. Detection costs about 0.8 ms per puzzle,
so filtering samples the set rather than scanning all 25,000, narrowing to the
mates first for the motifs that can only happen in one. Sampled over 1,500
puzzles, 948 carried a tag before and 1,397 do now.

---

## Exact endgames, and what people really play

Two optional lookups against Lichess's free, key-less public endpoints. Both
are strictly enhancements: nothing depends on either, every caller handles a
null answer, each has a switch in Settings, and with the radio off the app
behaves exactly as it did before. One request at a time, everything cached.

**Tablebase.** With seven men or fewer on the board, an engine gives you an
opinion and the Syzygy tables give you the answer. The play view and the
opening explorer show the verdict — *White wins — mate in 23* — and then every
legal move colour-coded by what it actually does: wins, draws, or throws it
away. For an endgame drill that is a different thing from an evaluation: not
"the engine likes Kf6" but "Kf6 is the only move that does not give away the
win". A cursed win is called what it really is — drawn by the fifty-move rule.

**Opening database.** The repertoire tree says what this app thinks you should
play; the database says what two million games actually did. Every position in
the explorer shows how often each move is played, how it scores as a
white/draw/black bar, the average rating of the players who chose it, and the
notable games it came from — switchable between **masters** (over-the-board,
2200+) and **online players**, which is where you find out that the move
nobody recommends scores well under 1800 because the refutation is hard to
find. Every move in the table is playable straight off it.

---

## Playing without a mouse

Every board in this app was sixty-four unlabelled `<div>`s. You could not reach
one with the Tab key, you could not move a piece with the keyboard, and a
screen reader had nothing to read out: one `aria-label` and no `role` anywhere
in the file. The whole game was silent to anyone not using their eyes and a
pointer.

There is one `renderBoard`, so it is fixed in one place and every board gets
it — the play screen, the puzzles, the analysis board, Game Review, the
opening explorer, the endgame lessons:

- The board is a `role="grid"` labelled *"Chess board, White at the bottom.
  White to move. Arrow keys move, Enter selects, Escape cancels."*
- Each square is a `role="gridcell"` that describes itself: **"e2, white
  pawn"**, **"e2, white pawn, selected"**, **"e4, empty, can move here"**,
  **"d5, black pawn, can be captured"**, **"e1, white king, in check"**.
- Exactly one square is in the tab order, so **Tab** reaches the board once
  and arrow keys walk a cursor from there, respecting which way the board is
  facing. **Enter** picks a piece up and puts it down, **Escape** lets go.
  The cursor ring only appears for keyboard use; a mouse click puts it away.
- A live region announces what happened — *"Nf6. Your move."*, *"Not the move.
  Try again, or view the solution."*, *"Checkmate — you won."* — and stays
  quiet when nothing changed, so the same sentence is never read twice.

Two bugs came out of this, and the browser found both:

- A deliberate announcement was talked over by the running status in the same
  render, so *"selection cleared"* was never heard.
- The live region was inside `#app`, which `render()` replaces wholesale — the
  redraw that follows an announcement **destroyed the region and the message
  with it**. It lives on `<body>` now, created once and written to directly. A
  unit test looking at the in-memory copy could not have caught that; only
  reading the actual DOM after a redraw did.

A board can opt out with `{a11y:false}` — a decorative thumbnail has nothing
to announce and no business in the tab order.

## Arrows on the board

Right-drag (or long-press and drag) draws an arrow; right-click circles a
square. Plain is green, **shift** red, **alt** blue, **ctrl** yellow, so a plan
and a threat can sit on the board at once. Drawing the same shape again rubs it
out; drawing it in another colour recolours it. A knight's arrow bends along
the move rather than cutting across the diagonal, the shape follows your
pointer as you drag it, and a left-click clears the board.

---

## Your backup really is a backup

Everything lives in your browser — no account, no server — so the exported
`.json` is the only way onto a new phone or back from a cleared cache. For a
long time it did not work: export wrote the whole store, and import read back
four fields of it and silently left the rest alone. On the machine you exported
from that looks fine, because those fields still hold their old values. Restore
the same file onto a new device and your career, your puzzle rating, your
studies, your brilliancies and your imported games were gone, under the word
*"Progress imported."*

Restore now goes through the same doors as the normal load path, including the
career migration, so an older file still works — and it tells you what it
actually brought back rather than claiming success:

> Restored:
> 🏆 Testa — 2350, CM/FM, week 87 · 📖 3 openings · 🧩 puzzle rating 1880 …

A file that is not one of ours is refused outright instead of being half
applied over what you already have.

The live save is a **copy** of the defaults, not the defaults themselves. It
was the object itself, which on a first run with nothing stored meant playing a
career quietly edited the defaults as it went: "Begin a new career" then handed
back a copy of the career you had just retired, and resetting your statistics
restored the numbers it was supposed to clear. `validate-smoke.mjs` guards it
now, since everything downstream reads a default at some point.

---

## Two people in the booth

Every game in this career used to happen in silence. Real chess does not:
there are two people upstairs with microphones, and half the pleasure of a big
game is listening to them argue about it.

There are six of them — an analyst who says what is happening and a host who
gets excited about it — paired off, with the pair drawn from the event's name
so a tournament keeps the same voices from round to round. They react to what
actually occurs: the opening you chose, the first piece off the board, queens
leaving, castling into opposite corners, material given up, a promotion, a
long think, the flag creeping up, move forty, and how it ended. Around 230
written lines across four voices, and a phrase is not reused while another is
free.

**The booth never reads the engine.** Everything it says comes from the move
list, the piece count and the clocks — things you can see by looking at the
board yourself. If the eval bar is off, nothing said up there can tell you how
you stand, because they do not know either. It is commentary, not a hint, and
the test asserts the whole section never touches `playEval`, the engine, or
anything that formats an evaluation.

That constraint has a nice consequence: a sacrifice cannot be seen on the move
that plays it, because a capture always wins material at that moment. It shows
up one move later, when the piece is taken back — and since telling a
sacrifice from a blunder is a judgement only an engine could make, the lines
are hedged to match what the booth can honestly know. *"Material for something
else. They will need to be right about this."*

Your opponent also says something before the game, and now knows the score
between you: *"We have played four times and you have never beaten me."*

## The rest of the hall

You played your game and the field's scores simply grew: every other player
rolled a result against the event's average, nobody played anybody, and a
round could hand out any number of points. The crosstable moved without ever
being a crosstable.

The field is paired the way a Swiss really is — sorted by score, nearest
opponent they have not already met, one sitting out when the number is odd —
every board is played, and the results come back as a **bulletin** under the
standings: board by board, plus who leads, whether the leader just lost, if
you are the only one left on a perfect score, and any result nobody expected.
One point per game, so the table adds up; three rounds of six players is nine
points, and the test checks exactly that after every round.

Fixing it turned up a modelling bug. The draw rate was flat, so it ate the
whole remainder of a mismatch: a 2700 against a 2050 came out 66% win, 34%
draw, **0% loss** — an upset was not unlikely but impossible — and the
favourite's expected score sat below what its rating said. Draws now thin out
as the gap widens, so a +400 favourite scores the 91% Elo predicts instead of
85%, and a 600-point favourite loses about 2% of the time. The club league's
board simulation had the identical flaw and the identical fix.

## How a chess career actually works

An audit of the career mode against the FIDE rules and against how events are
actually run, fixed in order of how much each one mattered. Every one of them
was wrong in a way a player could feel, and several were wrong in a way a
player could exploit.

**1. A simulated game scores what the ratings say.** The simulation set your
win chance to E−0.18 and laid a fixed draw band on top. That happens to be
right between equals and nowhere else: an underdog could never score below
18% however outclassed (a 500-point underdog is meant to score 5%), a favourite
above 82% could never lose a game, and playing style moved the expectation
itself — an attacker scored six points of percentage below their rating in
every game, a solid player two above. Simulating into a field 400 points above
you was a free climb of thirty to fifty points an event, depending on style. Style now changes only
how the points arrive (an attacker's games are decided more often, a solid
player's drawn more), draws thin out as the gap widens, and the expected score
is exactly Elo's for every style from 3% to 97%.

**2. Colours follow the pairing rules.** Every round tossed a coin for your
colour. Nearly one nine-round event in five came out seven–two or worse, and
three Blacks in a row was routine — both things FIDE's two absolute colour
rules forbid (never three of a colour running, never more than two ahead on
one). Colours are allocated the way pairing software does it, and White is
worth its real edge in the simulation: about 55% between equals, thirty-five
points either way. Each round shows your colour, and you know it when the
pairing goes up, so preparing a line for the colour you will actually have is
something you can do.

**3. A norm needs the right opposition, not just the score.** A norm used to be
a performance over a field average and nothing else — about half of the rule.
The rest is who you played: half of them title holders (FM or better; CM does
not count), a third of them, and never fewer than three, holding the title you
are after or a higher one, at least two federations other than yours, no more
than three-fifths from yours and two-thirds from any one; and the lowest-rated
opponent below the rating floor counted at the floor. National championships
are exempt from the federation rules, as they are in life. The norm tracker
shows every requirement as a checklist, a finished event that made the score
without the opposition says exactly what was missing, and a norm round-robin
is now invited so that the norm is on offer — left to chance, one IM-norm
event in five could not give an IM norm whatever you scored.

The norms you have made are on the Progress tab's **📜 Your norms** card (the
Titles card on the career page has a button to it). Each norm is listed on its
own — the event, the month and season it was made in, the score, the
performance against what it needed, the opposition's average and the title it
counts toward (a GM norm is an IM norm too) — and tapping one opens every
requirement it met, with the numbers. Above them, each title shows how many of
its three norms are done and whether the rating is there yet. A career with no
norms gets an explanation of what a norm is and what one takes instead.

**4. Ratings are worked out the way FIDE works them out.** Three things. A
junior is rated at K=40 until the end of the year they turn eighteen, as long
as they stay under 2300 — a career starts at sixteen, and its first two years
were moving half as fast as a real junior's. FIDE rates an event, not a game:
every game is measured against the rating and K you started the event with,
and the total is rounded once, so the order the results come in no longer
changes where you finish. And a first rating is worked out with two
hypothetical draws against 1800-rated opponents, as FIDE has done since 2024;
without them five straight wins in a 1350 club championship published you at
2150. It is now 1788.

**5. A round-robin is a schedule.** The Candidates — eight players, meeting
twice — came out as fourteen different people and a table with fifteen names
in it, and every closed event's crosstable was full of holes because the
players around you were being Swiss-paired. Round-robins now draw lots for
pairing numbers and lay out the whole event on the first day: everybody meets
everybody once (twice, once with each colour, in a double), nobody has three
of a colour running, and the finished crosstable is complete. Seven events use
it: the two norm round-robins, the Super-GM Invitational, Tata Steel, Superbet,
Norway Chess, and the Candidates.

**6. An open is paired on score.** An open handed you nine opponents on the
first day, and your results changed nothing about who they were. In a real
Swiss the hall is much larger than your nine games and each round pairs you
with somebody on your score — which is the whole reason an open produces norms,
because a player on a norm score is by then sitting opposite the titled players
on the top boards. Opens now have a hall of about twice the rounds, and your
next opponent is paired when the round before it finishes, top half of your
score group against the bottom half, with colour rules taking precedence as
they do in pairing software. In an International Open, a 2380 who wins every
game now meets opposition three hundred points stronger than one who loses
every game, and the IM-norm requirements are met about three times in four;
under the old draw they were met one time in four whatever you did. The
crosstable for an open is printed the way opens print it — one row per player,
one column per round, cells like `7w1`.

Building these turned up three more things worth fixing. A player-by-player
grid for a Swiss is more than half empty, which is why the round-by-round form
exists. Field ratings came from a bell curve with no top, so an International
Open drew a player rated 2850 — better than the world number one — about one
event in two; fields are now cut off a little above one spread over the
average, which keeps the advertised average and puts the top of that event
near 2650. And pairing the hall on score alone let two players who both *had*
to have Black sit down together; 88 of 800 player-rows broke the three-in-a-row
rule until the pairing learned to look past a colour clash and repair the last
boards, and now none do.

**7. The World Cup is a knockout.** It was seven games against a drawn field,
like any other open — and at seven games it could never give a norm. It is now
a bracket seeded by rating, with the top two in opposite halves and the top
four in different quarters (206 players since 25 — see there). Each round is a two-game match, colours
reversed; a level match goes to two rapid games, then two blitz, then
armageddon (White must win, a draw is Black's), and the tiebreak games are
rated in rapid and blitz, as they are in life. The rest of the bracket is
played out round by round, upsets and all. Lose and you are out, and the event
ends there — a first-round exit is two games and five days. Win four matches
and the quarter-final is your tenth classical game, enough for a norm. The two
finalists qualify for the Candidates.

**8. Prize money is on the real scale.** The fund grew so slowly with the level
of the event that a World Championship paid about seventeen times a club
championship; the real ratio is in the thousands. First prizes now run from
💰150 at the club to 💰1,500,000 for the title (the loser takes 💰1,000,000),
the World Cup pays by the round you went out in (💰6,000 in round one to
💰110,000 for the winner), an open pays its top fifth on a steep curve, a
round-robin pays every place, and players level on points share the money for
the places they cover, the way arbiters split it. Opens charge an entry fee,
which grandmasters and international masters do not pay (FMs pay half), and the
Olympiad has no prize fund at all — the federation pays a stipend and a medal
bonus.

**9. Time and money move together.** Everything the career did was an
"action", and a week passed only when you said so: a nine-round international
open took no time, a season could hold fifty events, and your wages, sponsor,
coach and injuries ticked per event rather than per week. An event now takes
the days it takes — five evenings at the club, a weekend for a city open,
thirteen days for an international open abroad, nineteen for the Candidates —
and the weeks it covers pay wages and sponsors and age you as weeks do. Getting
there costs money: a fare and a hotel, which an organiser covers for invited
players, and which a title makes cheaper — a grandmaster's room is paid, an
international master's half paid. The finish
banner shows the trip's books: days, entry, travel and hotel, and whether the
event paid for itself — an untitled player loses about 💰1,500 playing an
international open abroad; a grandmaster who does well comes home ahead. Two
bugs came out of this. Age went up by 1/52 a week but was rounded each time, so
a year made you 1.04 years older. And the end of a season never did its work:
Grand Circuit points carried over forever and nobody was ever crowned; the
season now closes the circuit, hands out the awards and clears the calendar.

**10. The championship cycle.** The road to the title was two permanent keys.
Qualifying for the Candidates once opened it for the rest of your life, as did
simply being rated 2680; winning it once opened the title match forever; and
the title match was always against the same man — so a World Champion could
enter it again, as the challenger, against the champion they had just beaten.
It now works the way FIDE runs it. A place in the Candidates is earned for one
cycle — by reaching the World Cup final, finishing in the top two of the Grand
Swiss, topping the Grand Circuit, or being in the world top three — lasts two
seasons, and is used up when you play; there is one Candidates a cycle. Winning
it earns one title match. The champion does not play the Candidates; they
defend every two seasons against the strongest player in the world who is not
them, and a champion who loses is a former champion, who goes back through the
Candidates to get it back — against whoever took it. A title match stops as
soon as it is decided (8–0 is eight games, not fourteen), and one that ends
7–7 goes to rapid, blitz and armageddon; it used to count as a defeat.

**11. The smaller things.** The World Cup was open to anyone rated 2450, and
its bracket was the top 127 of a rating list that runs down to club players, so
the bottom seeds were rated about 1950. Its lower half is now national
champions and continental qualifiers, between 2250 and 2560, and you get in the
same way: win your national championship, finish in the top four of a
continental championship — which always said it had World Cup places at stake
and gave none — or be in the world top forty. Named events (Wijk aan Zee,
Reykjavik, Gibraltar, the World Rapid and so on) are held once a season, where
you could play Tata Steel ten times in a year; the generic opens still run every
weekend. FIDE norms are made in standard chess, so rapid and blitz events no
longer wear a "norm" chip or track a norm they could never give — unless the
career was set up to count every format. And the Olympiad records where your
country finished, not where you finished among the nine board ones you played,
which had also been handing out an "Olympiad Board Medal" to anyone who topped
that list.

**12. The calendar is the real one.** Any event could be entered in any week.
A named event is now held in its week of the year — Hastings at New Year, Wijk
aan Zee in January, the Candidates in the spring, Norway Chess at the end of
May, the Olympiad in September, the title match in November, the World Rapid
and Blitz between Christmas and New Year — and you enter it that week or the
week before, not otherwise. With events taking real days, that makes clashes:
a thirteen-day open in the wrong fortnight costs you Reykjavik. The calendar
shows the season and its year, what is coming, and a "Go to week" button that
lives the weeks in between on your weekly plan. Opens, round-robins and club
events still run every week.

**13. Some events are every other year.** The Olympiad, the Candidates and the
title match are held in even years and the World Cup and the Grand Swiss in odd
ones, as they are. Season one is 2026. It is what makes the cycle a cycle: a
World Cup final in 2027 is a place in the Candidates of 2028.

**14. The world list is the size of the world.** The list of names is a couple
of hundred players, from the top down to club level, so there is always
somebody near you; counted by position in it, a 2480 was the 62nd best player
in the world. Places are now read off the depth of the real list of active
players: a 2480 is about 900th, a 2560 about 350th, a 2200 about 9,000th,
and above 2750 the list is the world. Invitations and the rating places for the
World Cup (now the world top 60, about 2680) and the Candidates use the real
place. Olympiad selection is your federation's top five — read off the strength
the country fields, since the named list holds only a few players from each.

**15. Titles are earned.** Everybody else's title was their rating that minute:
2500 and you were a grandmaster, 2499 and you were not. Anonymous players now
draw a title from how the real list is spread at their rating — at 2460 nearly
half are grandmasters and most of the rest IMs; at 2620 everybody is a
grandmaster; at 2150 most have none. Everyone on the world list keeps the title
they have, is promoted a season or two after the rating gets there, and never
loses one.

**16. The field lives.** The world list was the same people for ever, and the
rising stars rose only as far as a drift that pulled them back. Every player now
has an age and a talent, and a season moves their strength the way a career
does — quickly in the teens, flat in the late twenties, down from the late
thirties — and their rating follows as their results do (see 21).
Players retire from forty on; five teenagers rated 2250–2550 and three club
players join the list every season, and ten years later the teenagers are a
couple of hundred points better. The rest of the world plays its own title
cycle: if you are not in the Candidates, it is played without you when its
week ends, its winner plays the champion, and the title can change hands.
The champion when a career begins is Gukesh, who has held it since December
2024. A champion who does not defend the title in its year loses it. And the
elite round-robins are the elite: Wijk aan Zee, Norway Chess and the rest are
players off the world list around the event's level, and the Candidates is the
seven best players in the world who are not the champion.

**17. Ties are broken on the games.** Players level on points were put in order
of rating, so the higher-rated player took the trophy, the norm, the qualifying
place and the title. An open now uses Buchholz Cut-1, then Buchholz, then wins;
a round-robin uses Sonneborn-Berger, then wins; and the standings show the
tiebreak column once there is a tie. The Candidates, a national championship,
Wijk aan Zee and the World Rapid and Blitz play a tie for first off — rapid then
blitz then armageddon (blitz first where the event is), rated as they are — and
the finish banner says how your place was settled.

**18. The professional leagues pay.** For most professionals the money is in
the leagues, not the opens, and the club league here stopped at a Division 1
of 2350s. A strong player now gets offers from the 4NCL (from 2300), the French
Top 12 (2400), the Bundesliga (2450) and the China Chess League (2550): a fee
for every game — about 💰310 a game for a 2500 in the Bundesliga, 💰1,900 for a
2700 — a board on an eight-board team where your rating puts you, and seven
weekends through the season, flights on the club. A weekend you are somewhere
else — at a tournament, say — a reserve plays and you are not paid. Champions get a bonus, and the
contract renews each season unless your rating falls out of the league.

**19. The title match is an event of its own.** It was fourteen games against a
name. You now pick your seconds before game one — an opening specialist, a
computer second, an endgame expert, a sports psychologist — each paid for and
each worth a few points of rating in every game, and each one more person who
knows your preparation: it leaks two per cent of the time, plus two for every
second. After every two games there is a rest day to rest or prepare; after
every game a press conference, gracious, confident or needling, and needling
can get to your opponent or come back at you. The story of the match is kept
game by game ("You strike first", "Gukesh levels the match"), and when the
champion is you, losing it reads as losing your title.

**20. The people are people.** Every open was twenty strangers invented for
the week, a national championship twenty invented compatriots, and an Olympiad
team three random numbers with names attached. The world list now has depth in
every country — each federation's players from its best down to its club
players, some two thousand in all, named the way people in that country are
named (a German is a J. Becker, a Chinese player a Lin Lei) — and every field is
drawn from it. For each place in a hall the event's level gives a rating, and
the player on the list nearest to it takes the place, so a hall has the spread
it always had and the people in it are people you will see again: in a dozen
International Opens the same players came round two dozen times. A club
championship or a city open is mostly your compatriots, a national
championship is only them, and an international open is whoever came. The
norm round-robins invite people off the list, the World Cup's lower half is
every country's best who is not already in, and the scouting card before a
round says who your opponent is — their federation, age and world place, your
record against them — with a link to their profile. The pools come from a fixed
seed, so a career's world is the same every time it loads, and a club player's
form is read off the rating period rather than stored, so two thousand players
cost the save about a hundred kilobytes.

**21. Every result counts, and the world does not wait for you.** The world's
ratings were a random walk: every so often each player's number wobbled by a
few points whether or not they had played anybody, the games in the halls
around you were thrown away, and the Olympiad, the World Cup and the leagues
only existed when you were in them. Now every player has two numbers. Their
strength — how well they actually play — is hidden, and moves by season with
age and talent. Their rating is published, and moves one way only: by games,
under FIDE's formula (K 40 for a junior under 2300, 20, then 10 from 2400; 20
in rapid and blitz). Every simulated game anywhere is played from the two
strengths and each player's form that week, and rated from the two ratings:
the boards beside yours, every board of the Olympiad, every World Cup match and
its rapid and blitz tiebreaks, playoffs, the Candidates and the title match,
the pro and club league boards, and the engine games you watch. Your own games
count for the other side too — beat somebody and their rating drops by the
formula. A rising junior is underrated until their results catch up (a
prodigy's first rating is forty below their strength; sixty rated games close
about three-quarters of a forty-point gap), a declining star is overrated until
theirs do, and simulated games and the engine play people off the list at their true
strength.

The world keeps its own calendar. At the end of every week it plays that
week's events unless you are in them — Wijk aan Zee, Norway Chess, the opens,
every federation's championship in May, the Olympiad and the World Cup in their
years, the Candidates and the title match, the four pro leagues' weekends — and
a circuit of weekend opens for everybody not somewhere else, where club players
mostly meet their compatriots and juniors play twice as often. A season you sit
out is about 33,000 rated games, played in half a second, with more than half
the list playing ten classical games or more; the World Cup's finalists and the
Grand Swiss's top two take their places in the next Candidates. Because ratings
are relative, the strengths are kept on the rating scale — one offset a format,
reset each season — so the list neither inflates nor deflates (2024 → 2025
over a season in the test). The World tab shows the season around the world:
the champion and challenger, your country's champion, each event's winner and
the four leagues; a profile shows a player's games and points this season. A
save holding all of it is about a hundred kilobytes.

The hundred and fifty players the list always had — the fictional field from
2700 down — were the last people on it with stock names ("T. Baker", "K.
Vale") and a federation drawn at random. They are named from their own
federation's name bank now, the same way the national pools are, so a
Brazilian is called Vieira and an Indian Das. It changes who they are, so a
career from before this version still finds them by their ids, but the names
it remembers are gone; a new career starts with the new ones.

**22. The press prints what happened, the chat watches your game, and a post
gets answered.** The world's "news" was a feed that made itself up — somebody
winning a Reykjavík Masters nobody played, a transfer that never went through,
a book on the Najdorf by a player who does not exist — posted after every game
you played. The streaming was a button that paid out a number, and social media
five buttons that each added one.

*The news board.* A 📰 button floats over every screen, with a count of what you
have not read; drag it anywhere and it stays there, on every screen, through a
resize. It opens the board: stories filed by five made-up outlets, each on its
beat — *The Sixty-Four Gazette* for the big events, *Board Wire* for the rest
and for shocks, *The Rating Desk* for the list, *League Night* for the pro
leagues, *Zugzwang Daily* for social media and streams, and *The Home Courier*
following you. Every story is written from something the simulation did: each
event the world played that week, with the winner's score, margin, seed,
titles this season, world rank and a quote; the biggest upset inside it,
caught as the games are played (a 1,958 beating a 2,645 in the Dubai Open is
printed with both ratings); the monthly rating list, a snapshot of the live
ratings on the first of the month with the top ten, who moved and by how much,
and where you are; every league weekend's results and the champions; the
national championships' round-up and your country's champion; the Olympiad
table; new grandmasters, retirements and the juniors coming onto the list; and
your own events, games of the day, rivalry results, clips and quotes. Filters
split it into You, Results, Ratings, Leagues, People and Media; a list opens to
its table, a story to the player's profile, and one about you to a post about
it. A season with you doing nothing is about fifty stories. The ticker on the
World tab says only true things now — who is up this season, the youngest and
oldest near the top, each country's number one, who has played the most, what
comes next on the calendar.

*Going live.* Before or during any career game, go live (or tick "go live for
every career game"). The chat reads what the commentary booth reads — the
moves, what came off the board, the clocks — and never the engine, so it can
scream at a sacrifice but cannot warn you that a knight is hanging, and the
moves it begs you to play (and the ones a poll offers) are quiet moves picked at
random — never a capture or a check that could point at a tactic. It knows your career: your rating and the next hundred, the
standings of the event you are in, whether you beat this opponent last time,
their world rank, your rival (a rival game is the one the whole chat turns up
for), the next event. In rapid and classical it keeps talking while you think;
in blitz it only has time to react. You run it: a viewer's question gets pinned
and you answer it — call your rival overrated and the rivalry goes up and the
tabloid prints it — you can put your next move to a vote and chat is delighted
when you play its pick, trolls can be timed out (leave them and they tilt you),
and after a sacrifice, a queen or a mate there is a moment to clip. The viewers
follow the game: a sacrifice brings people in, a quiet endgame lets them drift,
a raid can arrive. When the game ends, so does the stream: peak and average
viewers, subscribers, tips and ad money, and a clip that may go viral.

*The timeline.* The Media tab's social panel is a timeline. What you can post
about is what just happened — the event you finished, your last win, the
stream, a story the paper wrote about you, the next event, your rival — and
you choose the voice: humble, confident, spicy, funny or with some chess in
it. The post is written from the facts ("My Gibraltar Masters in one line:
7½/10, a 2640 performance…"), and the voice decides who answers: fans, a
compatriot off the world list when you win, the player you beat, your rival
when you poke them, trolls, a journalist wanting a quote, your sponsor. Some
replies want an answer: clap back at a troll (followers, less respect), fire
back at your rival (the rivalry, and a story about it), challenge them to a
money match, give the press a quote (printed). The winners of the big events
post too, and your rival will ask whether you were watching.

**23. Nothing at the board but the board, and the rest of it where you can see
it.** Five things that did not hold up in play.

*No help while a game is on.* A career game showed the engine's evaluation if
you had hired the engine analyst, the tablebase's verdict once seven men were
left, a warning the moment your move dropped material ("that drops material —
Nxe5 wins the knight"), and allowed a game review and takebacks mid-game. None
of that is available at a real board. While a career game is being played there
is now no evaluation, no tablebase, no material warning, no game review and no
takeback; the evaluation and the review are there the moment it ends. The
streaming chat follows the same rule: the moves it begs for and the ones a poll
offers are quiet moves picked at random, never a capture or a check that could
point at a tactic. A free game against the engine keeps quiet too unless
**Training help in free games** is switched on in Settings. The engine analyst
now does their work before the event (+2 preparation), not during it. The
💡 tactic hints went too, in the next version (see 24).

*Media & drama works where you click it.* Every result of a button used to go
to a message at the top of the page, far above the Media tab, so the buttons
looked dead. What a button did now floats up above the bottom bar wherever you
are, and the Media & drama card says what happened on the card itself. The
actions are events, too: a hot take is a real post on your timeline that
people answer; calling out your rival posts it, turns up the rivalry, gets
their reply and a tabloid story; a feud picks a rival just above you on the
list (a famous name if there is one); making peace cools it; commentating puts
you in the booth for this week's real event; a money match takes you to the
Play tab where it is.

*Streaming shows are streamed games.* Stream a game, a rating speedrun, Guess
the Elo (the opponent's rating stays hidden while chat guesses, and is revealed
at the end), a charity stream (the tips go to charity: respect and fame, not
money) and a collab (you play a well-known streamer, both chats watching) are
all online games you play live with the chat, viewers, subscribers, tips and
clips of the stream system. They take the day and some energy, and being
online they touch neither your FIDE rating nor your head-to-head record.

*Sponsors have a card.* They were a line at the bottom of the team card on the
Life tab, and nothing at all when nobody was offering. The Media tab has a
🤝 Sponsors card: the deal you have, what it has paid and how long it runs; the
competing offers when there are some; what brings them when there are none (a
1500 rating or 8 fame). A sponsored post goes on the timeline and counts for
the sponsor, and a sponsor you posted about offers to renew on better terms.

*Rest days, not weeks off, during an event.* An event's days are counted when
it ends, rest days included, so "Rest 1 week" in the middle of one gave you the
energy of a week while the tournament waited. During an event nothing that
takes days can be done — a week off, a camp, a stream, a simul, a sabbatical,
commentating — and instead the event has its own rest days, between rounds and
one at a time: two in a nine-round classical event, one in the World Cup, none
in rapid or blitz, each worth about twenty energy and no extra days.

Not done yet at the time: pairings and the World tab used live ratings, the
World Cup was 128 players, and the chat did not see a game you watched. All
three are done in 25.

**24. The career on a phone, and the small things around it.** Measured on a
new career at phone size (390×844), every career tab opened under the same
block — the dashboard, three rating boxes and the titles card, 1.3 screens —
and the Play tab was twelve and a half screens long, seven of them a list of
forty tournaments of which a new player could enter two. That is why a sponsor
offer, a norm or the result of a button could sit unseen.

*One line, then the tabs.* Above the tabs is now one line: your avatar and
first name, your rating (or how many games you are off one), your money, your
energy, and 📥 with the number of things waiting on you. ▾ opens the detail —
every rating with its world rank, the money against the week's bills, energy,
health, mood, tilt and form. The tabs stay pinned under the top bar while a tab
scrolls, and a tab opened from far down a long one starts at its top. The
ratings in full and the titles card moved to the Progress tab. A new screen
opens at its top rather than wherever the last one was scrolled to, and Back
returns to where you were.

*The Play tab starts with now.* First a card for what is happening — the day
and the rent, or the round of the event you are in — with how you are and the
buttons that move the week along; then the inbox; then where to play. The
daily reward, the quests, the story arc and the road to GM come after.

*The inbox.* The manager's advice and the chips on the dashboard were two lists
of the same kind of thing, and neither said where the thing was. One list now,
each row a way to the card it names, on whichever tab, which scrolls into view
under the tabs and lights up: the press, a decision, a sponsor offer or a
renewal, a norm you have not looked at, an invitation (Tata Steel, Norway, the
Candidates — open now, or starting within four weeks), a rest day when your
energy is low between rounds, a league weekend, the daily reward and quests to
claim, skill points, an injury, a debt, burnout or tilt. The manager's advice
follows, without repeating any of it.

*Big cards are folded.* The avatar editor, automation, the cosmetic unlocks, the
simuls, the park, your home, the team you could hire and the lifestyle shop
are each a heading, one line of what is inside and the button used most (🎲
Randomise, ▶ Play today for me); ▾ opens the rest and a card stays the way you
left it. Achievements show what you have earned, the rest behind ▾. The
season's calendar shows the next four events. A card the inbox sends you to
opens itself; so does your home when you are in debt and the park when a
rematch is waiting.

*The tournament list shows what you can enter.* Each format lists the events
you can enter, then those you already qualify for that start within six weeks
(with the week, and a button to get there) — and a title event you have earned
a place in however far off it is — and folds the rest into one line that says
what they are waiting for: a published rating, a higher one, an invitation or
their week of the year. A filter narrows it to one format. The Play tab is now
four and a half screens, Life went from 6.8 to 2.7, You from 6.3 to 2.6.

*The Back button goes back.* On Android, Back closed the app from any screen,
the middle of a game included. It now closes whatever is open on top (a
dialog, the menu, the search, the news board), then goes back a screen, then
to the first career tab, and only on the career screen, pressed twice, lets the
app close. In a browser, the browser's Back does the same.

*The game screen names the game.* It said "Play vs Stockfish" for everything,
a round of the Candidates included. A career game is now called by its event
and round ("🏘️ Local Club Championship · round 1/5"), a match game by the game,
a World Cup game by its round, a club match by the two clubs and your board, a
stream by its show, the park by the park; the chip beside it says what you
bring — your prepared line, a novelty, the stake. ← goes back to the career.

*No hints in a career game.* The 💡 tactic hints are gone from career games;
free games and puzzles keep them. What bought hints now buys sharpness: your
puzzle rating makes opponents play weaker as before, Killer instinct takes 12
Elo a level off them from move ten, and the Tactician class 10.

*Opponents play what they are known for.* Openings were picked from a player's
name by a hash out of all twenty-nine in the Library, so Carlsen met 1.e4 with
Alekhine's Defence and Caruana opened with the Alien Gambit. The famous names
now play what they are known for — Fischer the Ruy Lopez and the Najdorf,
Karpov the Caro-Kann and the Queen's Indian, Botvinnik the French and the
Dutch, Kramnik the Catalan, Carlsen the Sveshnikov, Caruana the Petroff,
Vachier-Lagrave the Najdorf and the Grünfeld, Nakamura the King's Indian — and
what is not well known about a player is picked from what is played at their
level: main lines from 2500 up, anything at all in a club. A repertoire as
Black has an answer to 1.e4 and one to 1.d4, and your first move decides which
one they play. Scouting and profiles show all three, marked where it is what
they are known for, and a legend in an exhibition plays their own openings.

*Smaller things.* A save that fails — a phone whose storage for the app is
full, a browser that blocks it — used to throw out of whatever was tapped and
say nothing; it is caught now, and a bar says so and offers a backup file,
until a save works again. The commentary button no longer runs off the Media &
drama card on a phone (what it is for is written under it), and "Off the board"
no longer sends you "above" to sponsors that are below it. An exhibition
against a legend that was left unfinished no longer makes the next one-off
game count as beating that legend.

**25. Opponents who have read your games, the monthly list, the real World
Cup, and a chat when you watch.**

*Opponents prepare against you.* Opponents played their own openings whatever
you did. A strong player goes through your games before a round, so now your
games are a repertoire other people read: your White opening, your answer to
1.e4 and your answer to 1.d4, each the one you have played most in your last
thirty games. The stronger the opponent and the more predictable you are, the
likelier they have prepared — never a club player, about a quarter of the time
at 2250, over half at 2450, three times in four at 2800, and your rival always
(a line needs three games before anybody can prepare it). Prepared, they go
straight into the main line of your own opening, say so across the board ("I
have seen your Najdorf games"), and play about 60 points stronger while the
game stays in their preparation — or once it has gone six moves deep, until
move twelve. Leave it early and their homework is wasted: 20 points weaker for
the opening. Preparing a different line of your own sidesteps it. The scouting
card warns before the round, the chip beside the game's heading says so, the
news says afterwards whether you walked into it, and the prep card shows your
repertoire the way your opponents read it, marking what is predictable.

*The rating list, once a month.* Ratings move with every game — the live
rating — but FIDE pairs, seeds, invites and rates from the list it publishes
on the first of the month, and so does this now. On the first of each month
the live ratings are copied into the list. Fields are drawn from it, paired and
seeded by it, and every game — yours and the world's — is rated against the
list rating across the board; the World tab ranks by it and says which month
it is ("the March 2027 list"), the invitations and the rating places for the
World Cup and the Candidates go by it, and a profile shows the list rating with
the live one beside it. Your own live rating is on the top line as always; the
World tab tells you what the next list will show, and a first rating appears on
the list after the one it was earned in.

*The World Cup is 206 players.* The top fifty seeds sit out the first round;
the other 156 play it, 51 against 206, 52 against 205, down to 128 against 129,
and each winner takes the higher seed's place in the bracket of 128 from round
two on — so a round-one player has eight rounds to win it, a top-fifty seed
seven. Places and prizes follow: out in round one is joint 79th and $3,500,
round two joint 65th and $6,000, up to $80,000 for losing the final. The field
is the list down to 2560 and then every federation's best, and the World Cup
the world plays when you are not in it is the same 206. A World Cup begun in
an older version carries on, its first round counted as round two.

*A chat when you watch.* Watching two players from the list was silent. The
game has the broadcast's chat now, which reacts to every move by name — the
first capture, the sacrifice, the queen, the queens coming off, who is up
material, the mate — and talks about the players between moves: their ratings,
federations, what they are known to play, how you have done against them,
whether one of them is your rival. The audience follows the names on the
board and the drama. **📺 Stream it** takes it live on your own channel as a
watch-along — a day and five energy, your viewers in the chat, paid in
subscribers, fans and tips when the game ends (or when you leave).

**26. The tournament as a place you go to.**

*Walking into the hall.* **Play the round** used to drop you straight on the
board. Now it walks you in first: the city and the room (Harpa on the harbour
in Reykjavik, the village hall at Wijk aan Zee, a school sports hall for a
weekend open, a hotel ballroom for a big open, a glass box on a stage for a
title match); phones into a pouch at the door at the top level; your board
number, who is on board one and who is either side of you; your opponent
arriving the way their style would (an attacker with a minute to spare, a
positional player already seated with the pen lined up); somebody from your
life in the audience if they flew out; the arbiter starting the clocks. One
tap starts the game. **Skip these scenes** turns them off, as does *Round
scenes* in Settings, and a game that was interrupted goes straight back to the
board.

*The other boards finish around yours.* The whole round is drawn when you sit
down — every other board's result and the move of your game at which it ends —
and a card beside the board shows the top boards and your neighbours:
*playing*, then *1–0* after 38 moves, and who is leading as it stands. Late in
a long game yours is the last one still going and the hall gathers round (the
stream's chat notices too). The round is then played exactly as you watched
it: the same results go into the standings, the crosstable and the ratings.
Opens and round-robins; a knockout, a match and the Olympiad have their own
screens.

*The hall's sounds, and the arbiter.* During a round the hall murmurs — a low
room noise, clocks pressed on the other boards, the cough there always is —
made with the Web Audio API, no sound files. The arbiter starts each round
aloud in your device's own voice. Both have switches in Settings, and both go
quiet with *Move sounds* off.

*The post-mortem.* When a rated game ends — a round, a challenge, a league
match — the engine goes through it in the background while you read the
result (a quick pass, a few seconds, and never while the engine is wanted for
anything else), and your opponent sits down with you. They point at the moment
that decided it: "13.Nf1 — that was the moment. I was hoping for it, and I
couldn't believe it when you played it. d5 holds." Or "I had it… and then
14…g6 threw it all away", "You let me off", "We both had our chances", "A
correct game". What they add depends on who they are: an attacker talks about
the attack, a grinder about the sixth hour, a gambiteer about the pawn. **Show
me** opens that move on the analysis board.

*The coach's homework.* Then your coach has a word. Each of your mistakes is
sorted by kind — with the clock nearly gone, in the first ten moves, in an
endgame (six pieces or fewer), tactical (a blunder, or a capture or check that
was there) or strategic — and the biggest kind becomes homework: ten puzzles,
twenty moves of your openings (the one you went wrong in), two endgame drills
held or won, a Puzzle Rush, or one of the classic games. It sits on the Play
tab and in the inbox with its progress. Done within three weeks it is worth
form +10, preparation +1 (+2 when the specialist you hired for it set it — the
Endgame guru the endgames, the Opening theoretician the openings) and 25 XP;
forgotten, it lapses, and your coach notices. One piece of homework at a time.

*Travel.* A trip was a line on the bill. Now it is somewhere: every named event
has its city (and the travelling ones a host by the year), and getting there
takes something out of you — 12 energy for a long flight, 5 for a short hop, 3
for a train across the country. After a long flight the first two rounds are
played jet-lagged, 20 below yourself and a tenth off your clock, unless you fly
out a day early for a day and a night's hotel. You choose the bed: a hostel at
about half the price, a hotel, or the players' hotel at 1.7 times the price and
6 energy back every night (where the organisers put you when they are paying).
A rest day abroad can be spent seeing the city — +10 energy, −18 tilt, +8 mood
— instead of in bed. And then the first night home.

*The people in your life.* A career had rivals, sponsors and followers, and
nobody who knew you before any of that. Now there is a parent, a friend from
your first club and the coach who taught you — and perhaps, later, somebody
met at an event. They message after results ("We watched every round!"; after
a bad week Sunday lunch, or blitz at the club like old times — say yes and it
takes the tilt off), after an upset, a norm or a title. They have birthdays:
call, send a present, or not now — and an unanswered one is a forgotten one.
Somebody close flies out for a big event and is in the audience when you walk
in. A call is free and takes no day, once a week each. Bonds fade a little
every week; how close you are to them all nudges your mood each week, up or
down; and a partner forgotten long enough leaves. They are on the Life tab,
and a message waiting for an answer is in the inbox.

**27. A junior career, the women's circuit, your own mistakes as puzzles, a
result card and a biography.**

*A junior career.* Every career began at sixteen. **Junior** on the setup
screen begins one at eleven: unrated, living at home, in a school year. You
play your age group — the under-12s while you are under twelve on 1 January,
then the under-14s — at the national youth championship at Easter, the
continental one (European, Asian or Pan-American) in the summer holidays and
the World Cadets or World Youth at the autumn half-term, and the under-20s at
the continental junior and the World Junior. The halls are children of your
age from the world's list where it has them, and named the way their country
names them where it does not. Win your national youth championship (or finish
second) and the federation picks you for the continental and the world, and
pays; otherwise your parents pay, out of a chess budget for the season, and
your pocket money after that. There is school: a term-time week away costs
about seven points of your grades, a week at school gives one back, holidays
cost nothing, a day of homework helps, and exams in June say how the year
went — under 50, your parents stop the trips in term time. At eighteen you
finish school, move out and start paying rent. Until then a junior career
waits for a few things: the park's money games and a partner until eighteen,
streaming until thirteen, buying property until you are an adult. (A career
started at sixteen is not a junior one, and works as it always did.)

*FIDE's direct titles.* Some titles are handed out for a result, not earned
by rating and norms, and the career now uses FIDE's table for them (the one in
force from 1 January 2024): a medal at a World or continental age-group
championship (a World U10 medal is a CM, a World U16 gold an IM, a World
Junior gold a grandmaster, a share of first a norm), the girls' sections the
same with the women's titles, reaching the last sixteen of the World Cup (GM),
qualifying for it through play (IM), a continental championship medal, and
65% or 50% at an Olympiad. A title needs a minimum rating at some point (GM
2300 … WCM 1800); won before that, it is confirmed when the rating gets
there.

*The women's circuit.* The women's title track had no women's events because
the list had three women on it. It has the world's best women now, by name,
from the August 2026 list, and every federation's women below them — named
the way women in that country are named: Ivanova, Kowalska, Nováková — about
750 in all, with women's titles. They play the opens like everybody else. On
the women's track the calendar has its own season beside the open one: a
national women's championship, a continental women's championship (gold is a
WGM title, silver and bronze WIM, the top ten go to the World Cup), an elite
invitational for the top ten women, the Women's World Rapid and Blitz, and in
their years the Women's Grand Swiss, the Women's World Cup (107 players, the
top 21 seeds into round two; the last eight is a WGM title, the final an IM
title, winning it a GM title), the women's section of the Olympiad, the
Women's Candidates (eight women, a double round-robin) and the Women's World
Championship match (twelve games). The cycle runs as FIDE runs it — the World
Cup's top three and the Grand Swiss's top two go to the Candidates with the
highest-rated women left over, and its winner plays the champion, Ju Wenjun
when a career begins, the year after — and the world plays it when you are
not in it. The World tab has a women's list; the Progress tab the road to the
women's title. The open events stay open.

*Your own mistakes come back as puzzles.* The post-mortem found your mistakes
and a week later they were gone. Now every real mistake from a rated game —
and every position you could not find in a Learn-from-your-mistakes session —
goes into a deck of your own positions that comes back on a schedule: the next
day, then three days, a week, three weeks, two months. Find the move and it
moves up a box; miss it and it starts again from tomorrow; five in a row and
it is learnt. They are played through the same drill as a Game Review (the
engine judges any move you try) and say where they came from: the game, the
opponent, the move you played. They are on the Puzzles page, on the Play tab
and in the inbox when they are due, and in the backup.

*A result card and a biography.* A finished game, a finished event and the
career itself each make a card — an image drawn on a canvas: the final
position with the last move marked, both players and their ratings, the
result and what it did to your rating; or your place, score, performance,
titles and every game of the event; or your peak, rank, titles and honours.
**Share** hands it to the share sheet (inside the Android app a small native
bridge does it); anywhere else it saves as a PNG. And the Legacy tab has your
biography: an encyclopedia-style article written from what has happened — a
lead, an infobox, season by season, the championship cycle, the Olympiad,
your style and your openings, your rivals, the people in your life, your
honours and your record — about you, by your surname, without guessing at
pronouns.

## The Olympiad is a team event

Nine individual games with a sentence bolted on the end. Your "team" was three
anonymous random numbers — `simOlympiadTeam` rolled 0.40 to 0.75 three times,
averaged them with your percentage and read a medal off a threshold. You never
met your team-mates, never saw a board below your own, never knew which country
you were playing, and no other nation existed at all. The one event in chess
that people cry at was a coin flip in a trench coat.

It is a team event now. Your federation fields four boards; your team-mates are
your country's best players on the world list — play for the USA and they are
Caruana, Nakamura and So — and their games are simulated at their ratings. Your
nine opponents are drawn from twelve nations, and each one is the player on
**your** board for their country — so the person opposite you comes from the
side your side is playing. A match is four boards, two match points for winning
it and one for a draw, the way FIDE scores it. The other nations are paired on
match points and play each other, so the table moves while you play, and the
medals at the end come off that table rather than off a dice roll. Every board
of every match is simulated, which costs nothing and buys the thing the old
version could not have: a board medal that is an actual ranking of everybody
who played that board.

Two things came out of building it that made it better than planned.

**Your country is not as good or as bad as you are.** Building the squad off
your rating alone meant a 2200 on board one dragged three imaginary 2100s
behind them and lost every match 0–4, while a 2750 carried three 2600s nobody
had earned. The team is now your country's actual players, so a weak board is
the weak link in a real side — and can be carried to a medal, or be the reason
there isn't one. Every other nation fields its own best four by name, so
India's board one is Erigaisi and the person opposite you is somebody you can
look up.

**A captain orders the team by rating**, so which board you play is the one
your rating earns, and climbing to board one is its own progression across a
career. That also decides which board of the other nations you sit opposite and
which board medal is yours to win. Selection is a place in your federation's
top five on the world list; when you are the fifth, the fourth-best sits out
and you play board four. Most careers get there below board one, so most of a
career is spent down the order.

The suite also caught a modelling slip of mine. The step between boards is 38
points and the noise around it is wider than that, so `olySquad` was handing a
2800 a 2810 team-mate about one time in five and quietly demoting them to board
two. Nobody in a squad can now outrank the board one they are standing behind.

## The crosstable

The standings say who is on what score. A crosstable says *how*: the grid
every real tournament publishes, every player down the side and the same
players across the top, one symbol in each cell. Read a row and you have
somebody's whole week; read the column under your own number and you can see
who beat you.

Those games already existed — the hall has been playing paired rounds since
the bulletin went in — they were just being thrown away once the round note
was written. Every pairing is kept now, including your own game, which the
bulletin never stored, and the grid falls out of them. It is folded away
under the standings, because it is wide; it scrolls sideways on a phone with
the names pinned; and it is a real `<table>` with `scope="col"` and
`scope="row"`, so a screen reader can say whose row a cell is in.

It outlives the event. A compact snapshot goes on the history entry — three
numbers a cell, score, games and round — so a crosstable from four seasons
ago is still there to open, and only the last twelve events keep one so a
long career does not carry fifty grids around in local storage.

Writing it turned up an arithmetic bug of my own making. With nine in the
hall and eight rounds there is not always an unmet opponent left, so a small
Swiss occasionally has to pair two people twice — and the second game was
overwriting the first, which made the row disagree with the score printed
beside it. A cell now accumulates: two games show as a total with a small
superscript. The test plays forty events and checks every row adds up to the
point, byes added back; the browser test reads your own row out of the DOM
and adds the symbols up.

## The game, written up

A career game was a row in a list, and since the archive went in, a board you
could step through. What it still was not was a game anybody had written
about. A move list is a record. An annotated game is the form chess has used
to remember its own games for two hundred years.

No engine is involved and none is needed. Everything worth remarking on is
visible in the moves: the opening, the first piece off (and how long the two
of you circled before it), which way the kings went, a piece handed over and
not won back, the queens coming off, a pawn reaching the eighth, the move
where the material broke for good, the four minutes somebody spent on move
23, the point somebody dropped under a twelfth of their clock, and how it
finished. Up to nine notes, keyed to the ply, so the analysis board hands you
each one as you reach it.

A sacrifice is the hard one. The move that makes it usually *gains* material —
it is a capture — so a single ply says nothing; what matters is the balance
before the move against the balance after the reply, and then whether it came
back over the next few moves. An exchange nets zero and never appears. The
note names the piece the opponent actually took, because a queen given for a
pawn nets eight and "gave up a rook" would be a lie.

It is printed in two places: on the analysis board beside any career game,
and as **Game of the issue** in the magazine, with its own board to step
through — the brilliancy if the season had one, otherwise the best win,
otherwise the longest fight. The issue keeps its own copy of the game, so it
still prints once the 150-game archive has rolled past it.

Two things the tests caught. The first capture of Légal's mate *is* the queen
sacrifice, and the note that got to the move first was winning it — so a move
that two things happened on now goes to the bigger moment, not the earlier
one. And the grammar trap the commentary booth fell into is back: a player is
either "You" or a surname, and English does not conjugate those the same way,
so the notes are written in past tense (*castled*, *took*, *had*, *spent* —
the same for both) with a helper for the two places that need "was" or "has".

## Sixty-Four, the magazine

A season ended and you got a scoreboard: games, wins, rating, money. Useful,
and about as stirring as a receipt.

At every season rollover the game now writes an issue, and keeps the last ten.
Each one has a masthead, a front page that leads on whatever the season was
actually about — a title in full, silverware, a hundred points gained, a
hundred lost, a year with no chess in it, a forty-game slog — the season in
numbers, a four-part interview whose questions come from what happened to you
and whose answers know your head-to-head with your rival, a world report off
the same world the leaderboard uses with the real top five, a letters page
that turns on your reputation and fame, and a page on what is within reach
next. It is reachable from the season banner and from a shelf on the Legacy
tab.

Everything in it is real. Nothing is invented.

## The hall

Retiring already wrote a full record of the career — peak rating, titles,
honours, earnings, years, the protégé you made, your all-time rank and a
written verdict. Then *Begin a new career* deleted it, and all that crossed
over was one peak number used to size the New Game+ bonus. Five careers in,
the game could not tell you a single thing about the first four.

They are kept now: the last 24 finished careers, newest first, the best of
them marked, with totals across all of them — careers, best peak, games,
seasons, everything earned, titles, world championships, grandmasters
developed. It is on the Legacy tab and on the end-of-career screen, which is
where you actually want it.

Two pre-existing bugs came out of wiring it up, both on the same line. The
boot loader rebuilds the saved store from an explicit list of keys, and that
list was missing `legacy` — so the New Game+ bonus never survived a reload —
and `quests`, so the daily quests regenerated on every refresh and lost their
progress inside the same day. Both are carried now, both have defaults, and
the backup file carries the hall too, since a hall that vanishes on refresh is
not a hall.

## The puzzles you get wrong come back

This app is built on spaced repetition; its whole opening trainer is a
scheduler. And then there were 25,000 tactics, where a failed puzzle was
simply gone — a counter went up by one and the position was never shown to you
again.

A failed puzzle now goes into a box. Boxes come due after a day, three days, a
week, three weeks; solve it cleanly when it is due and it moves up, miss it
again and it drops to the bottom with the miss on its record. Clear the top
box and it has been learned, and it leaves for good.

It is offered, never forced. A card says how many mistakes are waiting and how
many are due, with a button that drills exactly those; in the ordinary
near-my-rating mode one due mistake is slipped in every fourth puzzle, always
labelled — *"a mistake from before, you got this one wrong yesterday, box 2 of
5"* — so a review is never mistaken for a new puzzle. An index the current
puzzle file does not contain is pruned rather than served as a broken
position.

## A game you can come back to

A classical career round is 30+20 — up to two hours in the chair. The board
used to live only in memory: reload the page, tap **Career** to check the
standings, or let a phone reclaim a backgrounded app, and the game was gone.
The tournament survived, so you could play round three again from move one,
which is not the same thing.

The position, the move list, both clocks and everything the career needs to
score it are now written down after every move, and again when the app is put
away — `pagehide` and the visibility change, because a phone killing a
background tab never fires `unload`. Come back and the game is offered where
you left it: *"move 14 · your move · ⏱ 21:36 left on your clock"*. It is
offered on the career screen, on the Play screen, and as the round's own button
— which reads **Resume ▸** instead of **Play ▸**, so no entry point can quietly
start the game again.

It lives under its own storage key, on purpose: a half-played game has no
business inside the backup file, and a corrupted one must never take the rest
of your save with it. A finished game clears itself the moment it ends, and a
game saved for a round that has since been simulated, withdrawn from or
finished is thrown away rather than offered for a slot that no longer exists.

## Your own games, on the same board as everybody else's

Career games used to be a twelve-row list with a Review button — less than the
games imported from Chess.com, which is the wrong way round. They now open on
the same analysis board as everything else: eval bar, engine arrows, the full
review one tap further, and, because the clock reading after every move is kept
now, **watched back at the pace they were played**. The list is searchable by
opponent, event, opening or result, sorts five ways including *best games* (the
brilliancy first, then your best win), and pages 20 at a time through an
archive of the last `CG_KEEP` games.

**⬇ PGN** writes the lot to a file with proper headers — event, date, both
names, both ratings, the result, the time control and the opening — that any
chess program will open. `validate-cgames.mjs` parses the app's own export back
with the app's own PGN reader and checks every move survives the round trip.

## The club league is a season

Team chess is what most players' weekends actually are, and it was the one
format here that wasn't simulated: one button, one anonymous opponent, eight
"boards", a points total.

A division is now **six clubs**, each with a name and a strength, playing
everybody once — five matches, four boards a match. You are board one. The
three players behind you have names, ratings and results you do not control,
which is the whole experience of team chess: you win your game and lose the
match anyway. The other two matches in each round are simulated the same way,
so the table above you moves while you play, with W–D–L, board points and match
points, the promotion place in green and the relegation place in red. Win the
division and you go up; finish last and you go down; the prize money is worth
more the higher you are.

Clubs recruit at their own level, so a master is not asked to play board one in
Division 4, and both line-ups are ordered by rating the way a captain fills a
team sheet. A round you cannot make can be missed — a reserve takes board one,
usually worse than you would have, and your club thinks slightly less of you
for it. League games are rated, and are filed in your archive under the match
they were rather than as a "one-off".

---

## The draw

Every event used to be the same escalator. The field was generated, sorted by
rating and handed to you weakest first, so round one was always a warm-up and
the last round was always the hardest game of the week. You knew the shape of a
tournament before you entered it.

It is drawn now, the way European football does it. The field is seeded into
**pots** — Pot 1 the ones who can beat you, Pot 4 the ones you are expected to
beat — and your fixture list is drawn one round at a time from a shuffled plan.
You still face a balanced spread, so an event is never a walkover or a
massacre; what you no longer know is the order. Round one might be the top
seed.

The draw is a small ceremony when you enter an event: the pots are laid out and
your fixtures come out one ball at a time, or all at once for anyone who would
rather just play. It never blocks anything — pressing **Play** finishes the
draw itself. Over 600 nine-round draws, the weakest-to-strongest order that
used to be guaranteed now turns up twice, your first opponent comes out of all
four pots about equally often, and no two events are drawn the same way.

The World Championship match is not drawn, for the obvious reason that there is
only one opponent.

---

## What the round is worth

The tournament screen has always shown the crosstable and the norm tracker, and
never said the thing a player in that chair would be thinking. Now it does, in
one line worked out from the standings and the rounds left:

> **⏳ Final round — Win and you win Hastings Masters.**
> Level at the top going into the last round. This is the game.

A point clear with one to play and a draw wins it outright; half a point clear
and only the full point settles it, because a draw gets caught. Two behind with
one round left and it says you are out of it, because you are. The same line
leads the dashboard while an event is running, so you can see what is at stake
before you even open the tournament.

---

## Games that went differently

A result used to be 1, ½ or 0, which makes a career out of identical points.
The engine is already evaluating the position while you play, so the shape of
the game costs nothing to keep: how bad it got, how good it got, how long it
lasted, how it ended. Afterwards the game is told properly — *you were dead
lost, and you won it anyway*; *you had that won, and let it slip*; *over in 19
moves, never a contest*; *you held a position you had no business holding* —
and it lands on your **mood** and your **tilt** accordingly. Stealing a win is
worth more than a routine one; throwing a win away stings more than being
outplayed. With no engine available it falls back to the length and the ending,
and still says something true.

---

## Moments

You do not tell people your rating graph. You tell them about the time you beat
a grandmaster. Those are all detectable from what already happens, so the career
keeps them by itself — your first win over a titled player, a giant-killing, the
event you won, a norm, a title, beating your rival, and the games that went
somewhere worth remembering. **Legacy → Moments** is the shelf they land on.
There is nothing to manage and nothing to click: it fills up as you play, the
big ones toast as they land, and a first is only a first once.

---

## Automation

A career has a lot of small obvious decisions in it — claim the daily reward,
claim a finished quest, rest when you are exhausted, see the physio when you
are injured, take a coaching shift when rent is due and the money is thin.
None of them are interesting choices and all of them have to be clicked, so
**Life → Automation** will do them for you.

A **day plan** decides how a day gets spent: *Balanced*, *Train hard*, *Earn*,
*Recover* or *Have a life*. Whatever the plan, an injury, exhaustion, tilt, ill
health and unpayable rent come first — it will never pick something you cannot
afford or have not the energy for. Then six **switches** cover the routine
jobs: claiming the daily reward and finished quests, finishing the week in one
click, signing the best sponsor offer, upgrading where you live and buying
lifestyle upgrades, each never spending below a **cash reserve** you set.

Everything starts **off**. Automation never takes a decision you did not ask
it to take, nothing runs on a timer behind your back, and every switch only
ever does bounded, repeatable things. What it has done is written down, so you
can see exactly where your week went.

---

## The dashboard

The career spreads across seven tabs and forty panels. One line above all of
them answers *what is going on*: who you are, your rating, your money, your
energy and how many things are waiting on you; ▾ opens every rating with its
world rank, the money against the bills that are coming, and your energy,
health, mood, tilt and form. The Play tab starts with what is actually
happening right now — round three of nine, or Wednesday with rent due Sunday —
with the button to get on with it, and then the inbox: everything quietly
waiting for you, each a row that takes you to the card it is on — an injury, a
debt, an unclaimed reward, a sponsor offer, a norm, an invitation, spare skill
points. When there is nothing, it says so rather than inventing a chore.

---

## What the tracker knows

Once your games are in, the tracker is nine tabs over one set of games, and a
**filter above all of them** — time control, colour, rated only, and the last
30 / 90 / 365 days — that every number on every tab reads through. Narrow it to
3+2 as Black in the last month and the performance rating, the opponents, the
calendar and the insights all narrow with it. A filter that keeps nothing says
so and offers to clear itself, rather than showing an empty page.

- **Overview** — score and record, White against Black, and *what the results
  were worth*: the performance rating your score would be normal for against
  the opposition you actually met, next to your own rating, broken down per
  time class. If the two disagree by 25 points or more it says which way. Where
  there are at least ten rated games it also prints what your ratings
  *predicted* you would score and what you actually took. Then the exact time
  controls (3+0 and 3+2 are not the same game), your records, and your streaks.
- **Games** — every game the filter keeps, searchable by opponent, opening,
  how it ended or the time control, sortable by newest, oldest, longest,
  accuracy or toughest opposition, 25 to a page. 🔬 opens one on the analysis
  board; ↗ opens it on Chess.com. **⬇ CSV** saves the filtered set as a
  spreadsheet — one row a game, with the date, ratings, ending, accuracy and
  opening — for anyone who wants to do their own sums.
- **Results** — how your games end, how you do against stronger and weaker
  opposition, the rating curve per time control, [the
  projection](#where-your-rating-is-heading), how you do past move 40, month by
  month, game length and accuracy.
- **Openings** — your first move as White, your answers to 1.e4 and 1.d4, the
  openings by Chess.com's own names, and **castling**: which way you go, on
  about which move, and whether the games where you never castle go worse.
- **Opponents** — everyone you have played, with a **nemesis** (three games or
  more, and you are under 50%) and a **customer** (three or more, and over)
  called out by name.
- **Clock & time** — seconds a move, longest think, the games you finished
  under 8% of your clock and how they went, the hours and days you play best
  and worst, session fatigue, and what a loss does to the very next game.
- **Activity** — a half-year calendar, one cell a day and one column a week,
  green where you scored well and red where you did not, with days played,
  games a day, your longest run and whether one is going now.
- **Insights** — the whole lot turned into sentences worth acting on, ranked by
  how much they look worth acting on.
- **Live** — [following a game as it is played](#following-a-game-live).

Every statistic that needs a minimum says so rather than guessing from three
games: a performance rating needs five rated games, a nemesis three, a month's
rating movement three games in one time class, a "best hour" five.

---

## Following a game live

The tracker's **Live** tab follows any Chess.com player. Chess.com's public API
publishes a player's **daily** (correspondence) games while they are in
progress — the position, whose move it is and the deadline — and does not
publish live blitz or rapid until they have finished. So the Live tab follows
daily games move by move, refreshing every 30 seconds while the tab is open,
and picks everything else up the moment it lands in the archive.

Open one and you get an analysis board: an **eval bar** and **engine
suggestions**, each on its own switch. Suggestions draw the top three moves as
arrows on the board — green, blue, violet — matching the lines listed beneath
it. Step back through the game and the engine re-analyses whatever position you
are looking at; return to the end and the board follows the game again. Your
own stored games open on the same board, so this works with the radio off too.
Variants (Chess960, bughouse) are listed but not analysed, because the engine
cannot read them.

The switches live in `settings.liveEval` and `settings.liveHints` and persist.
Polling only runs while a live screen is open, and a redraw never postpones the
next refresh.

---

## Repo layout

| Path | What it is |
|------|------------|
| `work/openingtrainer.html` | **The source of truth.** The entire app — markup, styles and logic — in one file. |
| `build/` | The PWA `<head>` block and service-worker snippet injected at build time. |
| `build-netlify.mjs` | Builds `netlify/` from the source file. `node build-netlify.mjs 51` also bumps the service-worker cache to `v51`. |
| `build-standalone.mjs` | Builds `ChessCareer-standalone.html` — inlines the piece set from `build/pieces/` and strips every network reference the page needs to render. |
| `build/pieces/` | The twelve cburnett piece SVGs, committed so the standalone build is reproducible without a network. |
| `netlify/` | The generated, installable web bundle (`index.html`, `sw.js`, manifest, icons). |
| `app_project/android/` | The Android WebView wrapper that bundles the same files into an APK. |
| `validate-*.mjs` | The test battery — one suite per system. |
| `visual-check.mjs` | Boots the real app in headless Chromium, screenshots key screens and reports page errors. |
| `engine-check.mjs` | Downloads the real Stockfish and checks the evaluation against positions whose answer is known. |
| `validate-strength.mjs` | The real-life strength model, the human clock, career automation, the dashboard, and that the board does not move. |
| `validate-motifs.mjs` | The motif detector against positions whose answer is known, the tablebase's reading of the API, the opening database, board annotations and the first-run setup. |
| `validate-moments.mjs` | The tournament draw, what a round is worth, the manner of a result, and the moments a career keeps. |

## Build it yourself

```bash
npm install

# run every test suite
for f in validate-*.mjs; do node "$f"; done

# rebuild the web bundle (optionally bumping the service-worker cache)
node build-netlify.mjs 51

# build the fully-offline single file
node build-standalone.mjs

# boot the app in a real browser and screenshot it
node visual-check.mjs

# check the real engine against known positions (needs a network once)
node engine-check.mjs

# build the APK
cd app_project/android && ./gradlew assembleDebug
```

## Learn from your mistakes

Game Review tells you where you went wrong. That is a report, not practice, so
a finished review offers **🎯 Learn from your mistakes**: it puts you back in
each position you got wrong, in the order you played them, with the move
hidden, and asks you to find something better.

It does not demand the engine's exact first choice. A move it did not name is
sent to the engine and measured — anything that keeps essentially as much as
the best move is accepted, because that is what finding the idea means. A move
that throws the position away too is refused with the damage named, and playing
your original mistake again is called out by name. After two wrong tries the
answer is offered. Either way the move is explained in words by the same coach
that narrates the opening trainer, and spoken aloud if the voice is on.

Only your own errors are practised, the session is capped so it can be
finished, and the end screen offers a second pass at just the ones you missed.
A lifetime tally lives in `stats.drill`. With no engine available only the
best move can be checked, and the drill says so rather than pretending.

## Where your rating is heading

The tracker's **Results** tab fits a straight line through your rated games,
per time control, and says what it implies: *"at this rate 1300 is about 11
days away — around October 2026"*. It names the time control carrying you and
the one pulling the other way, with its score alongside.

The honest part is the refusals. A line is only allowed to name a month when
there are at least `TREND_MIN_GAMES` rated games, spread over at least
`TREND_MIN_DAYS`, with an r² of at least `TREND_MIN_FIT` — otherwise it says
"too early to call" and why (*only 8 rated games*, *all within 3 days*, *the
results are too scattered to draw a line through*). A rating moving less than
`TREND_FLAT` a month is called flat rather than a slow climb, and a milestone
more than eighteen months out is reported as "over a year and a half away"
instead of being dressed up with a date. A slide reads as a slide: *"at this
rate you are down to 1400 in about 9 days"*, never as an arrival. The fit and
the window it was measured over are printed under every row.

## Watching a game back at its own speed

Chess.com's PGNs carry a clock reading after every move, so the importer keeps
them and the analysis board can replay a game at the pace it was played: you
sit through the forty seconds burnt before the blunder, and watch the three
moves rattled out afterwards. Both clocks tick, the side to move is
highlighted, the move just played is labelled with what it cost, and an
outlier — three times that player's median for the game, and at least eight
seconds — is flagged.

A think longer than `REPLAY_CAP` seconds is shortened, and the screen says so
rather than hiding it; the clocks still show the real time. Speeds run ×1 to
×8. Daily games have no pace worth watching and say so; games imported before
the clocks were kept say that too, and point at syncing again — neither offers
a button that would do nothing. Stepping or jumping by hand stops the replay,
as does leaving the board.

## The engine

One Stockfish worker serves six callers: the bot in a game, the hint button,
the spectator, Game Review, the explorer's eval bar and the live board. Each
search therefore carries a ticket. Exactly one runs at a time, it owns its own
callbacks, and its results are delivered only to it — so an evaluation can
never belong to a position you have already left, and an eval refresh can
never take a bot's move with it. A newcomer either waits (a move the player is
waiting for is never thrown away) or stops the running search and takes its
place; stopping is done properly, with `stop` and a wait for that search's own
`bestmove` before the next `position` is sent. A caller whose search was
abandoned is told so rather than handed somebody else's numbers, and a search
the engine never answers times out instead of hanging.

Evaluations are always shown from White's side, so the number and the bar
agree, and the search depth is displayed so a shallow evaluation is not
mistaken for a considered one. A position with no legal moves is not put to
the engine at all — it reports no principal variation, which is not an error.

Game Review searches one principal variation rather than three (more accurate
for the same time) and will not call a move an error unless it gave up at
least `REV_NOISE_CP` centipawns: two positions searched for the same time
reach different depths, and small swings between them are search noise, not
mistakes. Being theory excuses an inaccuracy but never a lost piece.

`validate-engine.mjs` covers all of this with a mock worker, so it runs
anywhere. `engine-check.mjs` downloads the real Stockfish and drives the real
app in a browser against positions whose answers are known independently
(mates both ways, a queen up each way, finished games, stepping faster than
the engine can answer, and a game with one known blunder).

## Search

Thirty-odd screens, 29 openings and their courses, puzzles by theme,
endgames, classic games, a master database, your studies and your own
imported games, and until now no way to look any of it up. The 🔍 in the top
bar, `/` or Ctrl+K opens one box over all of it. Matching ignores case,
accents and apostrophes, so "reti" finds the Réti and "queens gambit" finds
the Queen's Gambit. It ranks the start of a word first and understands what
people call things: "fen" finds the analysis board, "notifications" finds
Reminders, "backup" finds moving your progress. Results come grouped, and
↑ ↓ Enter and Esc work from the keyboard. An opening opens in the explorer, a
tactic opens its puzzles, a setting opens Settings at its card, and one of
your own games opens on the analysis board. Nothing is built or fetched to
answer: searching all 29 openings builds none of them.

## Reduced motion

The piece slide, the confetti and the interface's small transitions are
decoration, and for some people movement on screen brings on nausea or
dizziness. That is what the system's *reduce motion* setting is for, and
the app ignored it. **Settings → Motion** now defaults to *Follow my device*.
It changes the moment the device setting does, with no reload, and the
card says what the device is set to. *Full* and *Reduced* override it either
way. Reduced motion stops the piece slide and the confetti, and switches off
every CSS animation and transition. In Chromium with the device asking for
less, the piece landing on e4 is never touched, and a button's transition
reads `0s` instead of `0.15s`.

The phone header also fits on one row again, from 320 px up. It had been
wrapping onto two rows below 390 px. The menu button there is just ☰ (the
bottom bar already says "More"), and the narrowest phones keep only the logo.

`validate-search.mjs` covers the finding, the keyboard, where each kind of
result opens, and all three motion settings, including a device that changes
its mind.

---

## Play a friend on the same device

Every game used to go to the engine. **Play → Play a friend on this device**
takes two names and starts a game between the two of you, with no engine and
no hints. After each move the turn passes to the other player. On a phone the
board turns round for them too. That is the default on touch screens, and it
can be switched off for a laptop between two people. Blunder warnings and
hints stay off, because they would help one player and not the other.

It uses the time control chosen above it, so both players get a clock. A
take-back undoes one move and gives the turn back to the player who made it.
Resigning is confirmed by the player to move, and a draw is agreed by both.
Results name the winner: "Checkmate — Radu wins the game! 🏆". The PGN
carries both names and the right result. **Rematch** swaps colours. Game
Review and the analysis board work afterwards as for any game, and an
unfinished game waits in the resume slot like any other. Chess960 works too.

`validate-pass.mjs` plays whole games through it and checks that the engine
is never asked for anything.

---

## The analysis board

Everything else analyses the app's own positions: your games, your repertoire,
its puzzles. **Learn → Analysis board** (also in the **More** menu) takes any
position. Paste a FEN (four fields are enough, and so is just the board), a
PGN with its headers, comments and annotations, or a bare move list such as
`1. e4 e5 2. Nf3`. A FEN that describes an illegal position is refused with
the reason, and anything unreadable is refused with an example of each format.

On the board you play moves for either side. Playing from an earlier point
replaces what came after, and playing the move the line already has just steps
into it. ◀ ▶ Home End and F work from the keyboard, and pieces drag as
everywhere else. The engine shows its top three lines, and each line's first
move is a button that plays it. The engine can be switched off, and that is
remembered. The opening database and the Syzygy tablebase appear when the
position is one they cover. From there:

- **Copy FEN** copies the position on the board. **Copy PGN** copies the whole
  line, numbered from where it started and with a `[FEN]` header when that
  was not the normal start, so it pastes back in exactly.
- **Game Review** reviews the line move by move.
- **Play it out vs the engine** starts a game from the position on the board,
  as the side to move.

Game Review has **Analyse from here** (the board opens on the move you were
looking at, with the rest of the game after it), a finished game has
**Analyse**, and so does a solved puzzle.

A redraw from something in the background (the engine, a sync) no longer
throws you out of a text field you are typing in, anywhere in the app. The
engine also waits while the paste box is open.

`validate-analysis.mjs` covers the parsing, playing on, promotion, copying out
and reading back in, every way in, typing through a redraw, and the engine
switch.

---

## Reminders

Opening reviews come due on a schedule, and puzzles you got wrong come back
after 1, 3, 7 and 21 days, so the app knows when something is waiting. **Settings →
Reminders** turns on one notification a day, at an hour you choose, when there
is something to do. It covers due opening reviews, missed puzzles coming back,
and a day streak about to end. You can switch each one off. Nothing is sent
anywhere: your device works it out.

How it can reach you depends on where it runs, and the card says which:

- **The Android app**: an alarm at your hour posts the notification even with
  the app closed, and is set again after a reboot. It asks for Android's
  notification permission the first time.
- **An installed web app in Chrome or Edge**: Periodic Background Sync lets the
  service worker look while the app is closed. The browser decides how often,
  at most a few times a day.
- **Anywhere else**: a notification while the app is open in a background tab
  or a minimised window, and the count of what is due on the app icon where
  the browser supports badges. Safari only lets web apps notify once they are
  added to the Home Screen, and the card says so.

All three read one snapshot of *when* each item falls due, not a count, so
whichever wakes up counts what is due at that moment. They share one "already
reminded today" mark, so you are never told twice. Tapping a reminder opens
the app on the due reviews, or the missed puzzles if there are none. Moving
progress to another device carries the hour but not the switch, because
permission belongs to the device.

The decision exists three times: in the page, in the service worker (which
runs without the page) and in `RemindLogic.java` (which runs without either).
`validate-remind.mjs` runs all three on the same 3,000 random cases in a
timezone with daylight saving and requires identical answers. It also covers
every way of turning reminders on, including refusals and Safari, as well as
the once-a-day rule, the snapshot, the worker's background check and
notification tap, and the Android wiring.

---

## Moving your progress between PC and phone

There is no account and no server, so the PC and the phone each keep their own
save. The backup file is the bridge, and **Settings → Your progress on another
device** (also in the **More** menu) makes carrying it across a couple of taps:

- **Send to another device** hands the file to the device's own share sheet
  where the browser can share a file (Chrome and Edge on Android and Windows,
  Safari): WhatsApp, Drive, email, Nearby Share, AirDrop. In the Android app
  it opens Android's share sheet. Anywhere else it saves the file as a
  download and says how to get it across.
- **Receiving** works from the file picker (**Receive progress**), from a file
  dropped anywhere on the window on a computer, from the phone's share sheet
  once the app is installed (the manifest registers it as a share target, and
  the service worker keeps the file in an inbox until the page picks it up),
  and from "Open with Chess Career" in the Android app. A brand-new phone's
  setup screen offers **I already play on another device**.

Every route stops at the same preview: what is in the file (its career, week,
openings and puzzle rating, and which device saved it and when) next to what is
on this device. A file that would take you backwards is flagged before you
press anything. For example, "The career in the file is at week 12; the one on
this device is at week 40. Replacing it takes you back 28 weeks." A file that
is identical to what is already here is recognised as such. Nothing is
overwritten until you press the button.

A WebView cannot save a download, open a file picker or use Web Share, so the
Android app gained three small native pieces: a share sheet for the backup
(served by a tiny private `ContentProvider`), a file chooser, and intent
filters for `.json` shares. The page reaches them through `AndroidBridge`,
which answers only the bundled app.

`validate-xfer.mjs` covers every send path (share sheet, cancelled share,
failed share, download, Android), every receive path, the warnings, a new
phone during setup, and runs the real service worker against fake caches.

---

## It opens in about a second

The 29 opening courses are trees of every line they teach, around 8,500 moves
in all, and each move has to be played to know where it leads. That used to
happen for every course at every launch, before anything was drawn: about 78%
of the time to the first screen, spent even by someone going straight to their
career. Measured in Chromium with the CPU slowed four times, roughly a
mid-range phone, the first screen took **5.7 s**.

Now a course is built the first time something reads its tree or its cards.
Your repertoire is built for the dashboard's due count and nothing else is.
Everything left is built a course at a time while the browser is idle, once
the first screen is up, so the library and search find them ready. The build
itself plays its moves through chess.js's own internal steps instead of the
public `move()`, which also formats two FENs and a `Move` object for every
call, and is about three times faster. Same measurement: **0.9 s** for a first
visit, **1.3 s** for a returning player with three courses in their repertoire.

`validate-startup.mjs` builds every course both ways and compares all 8,564
nodes (move, squares, both FENs, ply and comment), and checks that a first
launch builds nothing.

---

## Tests

Sixty-one suites, about 5,800 checks, plus twenty-one browser suites that drive the real app with the real engine.

`validate-smoke.mjs` is the gate: it parses the app, renders every career tab,
checks the puzzle set, and guards against **duplicate top-level declarations** —
legal inside `new Function` but a `SyntaxError` in a real module, so a plain
parse test misses them and the app silently never boots. The other suites cover
one system each (career pace, story arcs and the world feed, brilliancies, the
park and simuls, the weekly life sim, avatars and backdrops, profiles, courses,
endgames, and the rest).

`validate-a11y.mjs` covers the board's labels, the cursor, the keys and the
live region, and `visual-a11y.mjs` plays 1.e4 in a real browser using nothing
but Tab, the arrow keys and Enter.

`validate-ux.mjs` covers the career screen on a phone: the one line and the
tabs, the inbox (every kind of item, each going to its card, norms that stop
being news once seen, invitations only when they are real), the folded cards,
the tournament list and its filter, the game screen's heading for every kind
of game, no hints in a career game, the openings the famous players are known
for (and Fischer answering 1.d4 with the King's Indian), the Back button, and
a save that fails out loud. `visual-ux.mjs` checks the same on a 390-pixel
page: how many screens each tab is, the pinned tabs, no button running off its
card on any tab, the inbox scrolling to the card it names, Back, and the bar
when the storage is full. `visual-check.mjs` and `visual-trackerx.mjs` used to
take screenshots without failing on anything — one of them never got past the
first-run questions — and now check what they look at.

`validate-prepare.mjs` covers what is new in 25: reading your repertoire off
your games, who prepares and how often, the opponent going into your line and
what it is worth to them move by move, dodging it, the warning and the news; the
monthly list (a player 40 up live and unchanged on the list until the next one,
fields and challenges at list ratings, rating expectation from list ratings,
your live and list rating on the World tab); and the spectator's chat, by name,
with a watch-along that costs a day and pays in subscribers. The World Cup's
206 — the byes, the first-round pairings, eight rounds from round one and seven
for a seed, the places and prizes — are in `validate-realism.mjs`, and
`visual-watch.mjs` watches a game with its chat, streams it, and enters a World
Cup in a real browser.

`validate-immersion.mjs` covers 26: the scene in the hall (the city, your board,
the scenes switched off), the round drawn as you sit down and every other board
finishing with the result you watched, the travel (a long flight, jet lag and
flying out early, the bill following the bed, a night in the players' hotel, a
day out in the city, home again), your people (birthdays answered and
forgotten, a call once a week, somebody flying out to watch, a partner who
leaves), what your opponent says after each kind of game and the move they
point at, the kinds of mistake, and the coach's homework (set, counted, done in
time or lapsed, one at a time, an opening to train with or without a
repertoire). `visual-immersion.mjs` makes the trip in a real browser: the beds,
flying out early, the hall and its sounds, the other boards beside yours, a
post-mortem with the real engine, **Show me**, the homework on the Play tab and
your people on the Life tab.

`validate-junior.mjs` covers the junior career (age groups on 1 January, the
events dressed for your group and continent, halls of children your age, the
federation's pick and who pays, school weeks, exams and the term-time lock,
leaving home at eighteen, what waits until you are older), FIDE's direct
titles (the table, the minimum rating, a share of first making a lower title
moot) and the women's circuit (the women on the list and their names, women's
fields, the Women's World Cup's bracket, the Candidates and the title match,
the world playing them, the women's list and road). `validate-cards.mjs`
covers the deck of your own mistakes (the boxes, learning one, the cap, the
post-mortem feeding it, the backup), the three cards' contents and the
biography. `visual-cards.mjs` draws the cards in a real browser and saves one,
brings a mistake back and plays it, and opens the biography;
`visual-junior.mjs` starts a junior career and a women's-track career from
the setup screen.

Career mode's newer systems have their own: `validate-booth.mjs` (what the
commentators can and cannot know, the grammar guard that fills every line with
the awkward name "You", and the constraint that the section never touches the
engine), `validate-bulletin.mjs` (the Swiss pairing, and that a round hands out
exactly one point per game), `validate-magazine.mjs` (every front-page branch
and where each section's facts come from), `validate-hall.mjs` (what survives a
new career, a reload and a backup) and `validate-pzmiss.mjs` (the box ladder,
what is due and in what order, and a queue that outlives the puzzle set).

`validate-realism.mjs` checks the career against the real rules rather than
against what the code does: that every playing style scores its Elo expectation
from 3% to 97% and that simulating far above or below you is worth nothing on
average; that five thousand planned colour sequences and twenty whole opens'
worth of pairings never break FIDE's two absolute colour rules; each norm
requirement on a field built to fail exactly that one (two GMs where three are
needed, nine Germans, six compatriots out of nine); that nine results in any
order rate the same; the 1788 debut; that every round-robin crosstable comes
out complete; that winning in an open brings stronger opposition than
losing in it; the World Cup bracket, its seeding, its tiebreaks and every way
out of it; that prize money sits on the real scale and is shared between
players level on points; that a year of weeks is a year and an event costs the
days and the fare it should; and the championship cycle end to end — a place
that lapses, a Candidates that uses it up, a title match that stops when it is
decided or goes to tiebreaks at 7–7, a defence against somebody other than
yourself, and a lost title; the calendar and its weeks, the even and odd years,
places on the real list, earned titles, a world that ages, retires and brings
up juniors, Buchholz and Sonneborn-Berger on hand-built crosstables, playoffs,
the pro leagues' fees and missed weekends, and the title match's seconds,
leaks, rest days and press conferences. Several of its checks are statistical,
and each was run ten times in a row before it was trusted. `visual-cycle.mjs`
walks the same cycle in a browser, from a locked Candidates through the
calendar's "Go to week" to the seconds, the press conference and the reign.

`validate-media.mjs` checks the press, the stream and the timeline against
the state they claim to report: that every event the world played in a season
is a story with its real winner in the headline, that a "shock" is a real game
with both ratings printed and 150 or more points between them, that the rating
list comes out once a month with the top ten as it stands, that the ticker's
ages match the list, that no outlet is a real one; that nothing the chat says is
read from the engine, that it reacts to Morphy's Opera game (the sacrifice and
the mate), talks about this game and this career while you think in a
classical game and stays quiet in blitz, that the moves it begs for are legal,
that a poll resolves on your move, that trolls left alone tilt you and that the
stream pays when it ends; that a post is written from the facts and answered by
the people it should be — your rival, a compatriot off the list, a journalist —
and that answering them has consequences. `visual-media.mjs` drags the news
button across the screen, opens a list, streams a game against your rival in
a browser, answers a viewer, resigns into the summary, and posts about it.

`visual-life.mjs` plays a five-man ending and a hanging knight in a career game
and finds no tablebase, no evaluation, no material warning, no review and no
takeback until it is over; signs a sponsor, posts a hot take, starts a feud and
calls the rival out; takes a rest day between rounds instead of a week off; and
streams Guess the Elo to the reveal without touching the FIDE rating.

`validate-olympiad.mjs` plays thirty Olympiads and checks the books balance —
every match hands out exactly two match points and four game points, no nation
is ever in two matches at once, and the nation on the most match points is
always first. `visual-olympiad.mjs` plays one in a browser and adds the match
points up out of the live state.

`validate-crosstable.mjs` plays forty simulated events and checks the grid
never contradicts the standings — every row adds up to the point, byes added
back, including the cells where a small Swiss had to pair somebody twice.
`validate-anno.mjs` puts each detector in front of a position built to contain
exactly the thing it looks for (Légal's mate for the sacrifice, an English
Attack for the opposite castling, a pawn on the seventh for the promotion, a
clock array for the long think), then plays out fifty games with a crude
policy and checks no column ever throws, leaks or points past the end of the
game. `visual-crosstable.mjs` plays a whole tournament in a browser and adds
your own row up out of the DOM; `visual-anno.mjs` reads the write-up on both
screens that print it.

Career mode has its own three on top of the rest: `validate-resume.mjs` (what
gets written down, what it refuses to trust, and that a round only ever holds
one game), `validate-cgames.mjs` (the archive, the board, and a PGN that
round-trips through the app's own reader) and `validate-league.mjs` (the
fixture list is a real round-robin, the board simulation scores what two
ratings say it should, and promotion, relegation and prize money all land where
they belong). Three browser checks drive the real app with the real engine:
`visual-resume.mjs` reloads mid-game and resumes, `visual-cgames.mjs` exports
the PGN and checks the file, `visual-league.mjs` plays a board and watches the
table move.

The tracker has two of its own. `validate-tracker.mjs` covers the import and
the profile; `validate-trackerx.mjs` covers the statistics, against values
worked out by hand rather than by running the code — the performance rating and
the expected score, the nemesis and customer thresholds, castling read off SAN
for both colours, the calendar window and its streaks, a month's rating
movement staying inside one time class, the records that exclude a three-move
walkover, the search, the sort, the paging, and the CSV's quoting.

Every push runs the whole battery in CI, and both the Pages deploy and the APK
build refuse to publish unless the smoke test passes first.
