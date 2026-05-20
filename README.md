# Blackjack

A browser-based Blackjack card game built with vanilla HTML, CSS, and JavaScript.

## Features

- Classic Blackjack rules (dealer auto stands on 17)
- **Split**: split matching-value cards into two hands
- Animated card dealing
- Win/loss/tie stats tracked per session
- 2-deck shoe with automatic reshuffle
- Responsive layout

## Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/190Q/Blackjack.git
   ```
2. Open the project folder:
   ```sh
   cd Blackjack
   ```
3. Open `index.html` in your browser - no build tools or dependencies required.

## How to Play

1. Click **Deal** to start a round
2. **Hit** to draw a card, **Stand** to hold, or **Split** if your two cards have equal value
3. The dealer reveals their hole card and draws to 17+
4. Closest to 21 without busting wins

## Project Structure

```
index.html   - Game layout and UI
scripts.js   - Game logic (deck, hands, scoring, split)
style.css    - Card styling, felt table, animations
```
