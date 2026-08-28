# The mini-game slot

This folder is an **isolated module**. The rest of the app only imports `<Game />`
from `./game`. Right now `Game.tsx` just renders a "coming soon" card.

To add the real game, replace the contents of `Game.tsx` (and add whatever files
you need in this folder). Keep the public surface the same:

```ts
// packages/web/src/game/index.ts
export { Game } from './Game';
```

`Game` renders inside the party-info page (`routes/PartyInfo.tsx`) after the
"Add to calendar" controls. It gets no props. If you need party context later,
add props here and pass them from `PartyInfo`.
