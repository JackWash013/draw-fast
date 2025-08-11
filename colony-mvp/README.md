# Colony MVP

A minimal top-down, tile-based colony simulator capturing the core RimWorld loop.

How to run:
- Use any static server to serve this folder, e.g.:
  - Python: `python3 -m http.server -d /workspace/colony-mvp 8000`
  - Node: `npx serve -s /workspace/colony-mvp -l 8000`
- Open http://localhost:8000 in your browser.

Controls:
- Left-click to select colonists (drag to box-select)
- Choose an action (Select/Move/Gather/Hunt/Fight or Build* buttons)
- Right-click on the map to issue the command

Goal:
- Gather wood and food, build a Shelter, survive random events, and build the Radio Beacon to win.