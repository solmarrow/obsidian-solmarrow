# SolMarrow for Obsidian

Send a note, or just the text you selected, from Obsidian to [SolMarrow](https://solmarrow.com) as a **draft**. Open SolMarrow afterwards to pick accounts, edit and schedule it. The plugin never publishes anything.

## Use it

1. In SolMarrow open **Settings → API keys** and create a key (it starts with `smk_`). Note the workspace ID of the workspace you want drafts to go to (36 characters).
2. In Obsidian open **Settings → SolMarrow** and paste the key and the workspace ID.
3. Open a note (select some text if you only want part of it), run the command **Send note or selection as a draft**.

With no selection the whole note is sent, without its properties (front matter).

## Network use and privacy

- The plugin talks to one service only: `https://app.solmarrow.com`, the SolMarrow API.
- It makes a request only when you run the command. The request carries the text you chose to send and your API key.
- Why: to save that text as a draft in your SolMarrow workspace.
- No telemetry, no ads, no other servers, no self-update.
- Your API key is saved in this vault, in the plugin's `data.json`, as plain text. Use a key for a workspace you are happy to use this way, and delete the key in SolMarrow if you stop using the plugin.

## Install (manual)

Copy `main.js` and `manifest.json` from a release into `<vault>/.obsidian/plugins/solmarrow/`, then enable the plugin.

## Build

```
npm ci
npm test
npm run build
```

## License

MIT
