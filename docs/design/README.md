# Design prototypes

These `*.dc.html` files are the screen designs, exported from a design canvas. Each is one phone screen at 390 × 844.

- Read them as the reference for layout, exact wording, sizes and colours. Styles are inline, so every value is visible on the element it applies to.
- They are not app code. They depend on a canvas runtime (`support.js`) that is not included, so opening them in a browser shows nothing useful.
- `{{ name }}` marks a value filled in by the script at the bottom of the file. `<sc-for>` repeats its contents for each item in a list; `<sc-if>` shows its contents when a value is true.
- `Main.dc.html` has a real script: state for selection, moving, swapping, cancelling, undo and expanding the calendar. It shows the intended interactions. Its ratings and messages are toy rules written for the mockup, not the engine.
- `Dark.dc.html` is the Plan screen in the dark theme. It is the same component as `Main` with `dark` switched on.
- `canvas.json` lists the screens and their titles.

See `../03-design-system.md` for the values as tables and `../05-known-gaps.md` for what is not drawn.
