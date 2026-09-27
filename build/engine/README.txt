Stockfish 19 (lite, single-threaded WebAssembly build) for the analysis engine.

Files: stockfish-19-lite-single.js and stockfish-19-lite-single.wasm, unchanged
from the npm package "stockfish" version 19.0.0 (Stockfish.js by Nathan Rugg,
(c) Chess.com, LLC; Stockfish by the Stockfish developers).

Source code: https://github.com/nmrugg/stockfish.js (tag v19.0.0) and
https://github.com/official-stockfish/Stockfish.

Licence: GNU General Public License version 3, in COPYING.txt next to this file.
The app talks to the engine as a separate program over the UCI protocol.

To update: npm pack stockfish@<version>, copy bin/stockfish-<v>-lite-single.js
and .wasm here, and change SF19_FILE / the CDN version in work/openingtrainer.html.
