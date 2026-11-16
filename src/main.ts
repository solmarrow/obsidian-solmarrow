import { App, Editor, MarkdownFileInfo, MarkdownView, Notice, Plugin, PluginSettingTab, Setting, requestUrl } from 'obsidian';
import { Requester, Settings, createDraft, noteToText, settingsProblem } from './lib';

const DEFAULTS: Settings = { apiKey: '', workspaceId: '' };

// Only called when the user runs a command. Sends the text to app.solmarrow.com and nowhere else.
const request: Requester = async (req) => {
  const r = await requestUrl({ url: req.url, method: req.method, headers: req.headers, body: req.body, throw: false });
  let json: any = null;
  try {
    json = r.json;
  } catch {
    json = null;
  }
  return { status: r.status, json };
};

export default class SolMarrowPlugin extends Plugin {
  settings: Settings = { ...DEFAULTS };

  async onload() {
    await this.loadSettings();

    this.addCommand({
      id: 'send-draft',
      name: 'Send note or selection as a draft',
      editorCallback: (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => this.send(editor, ctx),
    });

    this.addSettingTab(new SolMarrowSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULTS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  private async send(editor: Editor, ctx: MarkdownView | MarkdownFileInfo) {
    const problem = settingsProblem(this.settings);
    if (problem) {
      new Notice(problem);
      return;
    }
    const text = noteToText(editor.getValue(), editor.getSelection());
    if (!text) {
      new Notice('There is no text to send.');
      return;
    }
    const key = `obsidian:${ctx.file?.path ?? 'note'}:${Date.now()}`;
    try {
      await createDraft(request, this.settings, text, key);
      new Notice('Saved as a draft in SolMarrow. Open SolMarrow to check it and schedule it.');
    } catch (e) {
      new Notice(e instanceof Error ? e.message : 'Could not reach SolMarrow.');
    }
  }
}

class SolMarrowSettingTab extends PluginSettingTab {
  constructor(app: App, private plugin: SolMarrowPlugin) {
    super(app, plugin);
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('p', {
      text: 'The command "Send note or selection as a draft" sends the selected text (or the whole note, without its properties) to app.solmarrow.com. It only runs when you run it. Nothing else is sent anywhere, and the plugin has no telemetry.',
    });

    new Setting(containerEl)
      .setName('API key')
      .setDesc('Create one in SolMarrow under Settings, API keys. It starts with smk_ and is saved in this vault in the plugin data file.')
      .addText((t) => {
        t.inputEl.type = 'password';
        t.setPlaceholder('smk_...')
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (v) => {
            this.plugin.settings.apiKey = v.trim();
            await this.plugin.saveSettings();
          });
      });

    new Setting(containerEl)
      .setName('Workspace ID')
      .setDesc('The ID of the workspace the key belongs to (36 characters).')
      .addText((t) =>
        t
          .setPlaceholder('00000000-0000-0000-0000-000000000000')
          .setValue(this.plugin.settings.workspaceId)
          .onChange(async (v) => {
            this.plugin.settings.workspaceId = v.trim();
            await this.plugin.saveSettings();
          }),
      );
  }
}
