# semantic-release-google-chat

[semantic-release](https://github.com/semantic-release/semantic-release) plugin to send release notes to a Google Chat channel when the release succeeds.

| Step               | Description                                                   |
| ------------------ | ------------------------------------------------------------- |
| `verifyConditions` | Check the `webhookUrl` option or `GOOGLE_CHAT_WEBHOOK_URL` variable |
| `success`          | Send a Google Chat message to notify of a new release.              |

## Installation

```sh
npm install semantic-release-google-chat --save-dev
# or
yarn add semantic-release-google-chat --dev
```

This plugin is using an _incoming webhook_ to notify a Google Chat space. Here is
[some documentation](https://developers.google.com/chat/how-tos/webhooks#create_a_webhook) to create one.

## Usage

```json
// .releaserc.json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["semantic-release-google-chat", {
      "webhookUrl": "...",
      "title": "A new version has been released",
      "imageUrl": "http://...",
      "showContributors": false
    }]
  ]
}
```

| Variable | Details | Description | 
| --- | --- | --- |
| `webhookUrl` or `GOOGLE_CHAT_WEBHOOK_URL` | **required**, url | The incoming webhook url of the channel to publish release notes to. |
| `title` | _optional_, text | The title of the message. Default: _A new version has been released_ |
| `imageUrl` | _optional_, url | An image displayed in the message, next to the title. The image must be less than 200x200. |
| `showContributors` | _optional_, boolean | Whether or not the contributors should be displayed in the message. Default: `true` |

### Notes
- `webhookUrl` is a property of the config object in `.releaserc.json`, and,
  `GOOGLE_CHAT_WEBHOOK_URL` is an environment variable. The config object can be
  useful to try the plugin, but most of the time, production environments
  prefers environment variables. You can use both, but not in the same time as
  it does not make sense. If you do define both, the config object overrides
  the environment variable.
- **IMPORTANT**: The `webhookUrl` variable you can use within your plugin
configuration is meant to be used only for test purposes. Because you don't
want to publicly publish this url and do let the world know a way to send
messages to your Google Chat channel, you will want to use the `GOOGLE_CHAT_WEBHOOK_URL`
instead.

- The default value for `imageUrl` is <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Gitlab_meaningful_logo.svg/144px-Gitlab_meaningful_logo.svg.png" width="30" height="30" style="border-radius: 50%; vertical-align: middle" />
_https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Gitlab_meaningful_logo.svg/144px-Gitlab_meaningful_logo.svg.png_

- The list of Contributors is built using the email associated with the commits
(only the part before the "@" is kept). This list can be disable (mainly for
privacy reasons).

- The message is sent to Google Chat during the `success` step which is silenced in
`dryRun` mode.

- The official `@semantic-release/git` plugin may cause a second message to be
sent (because the plugin potentially adds a commit on the current branch, to
save changes in files like `package.json`, `package-lock.json`, `CHANGELOG.md`).
In order to prevent that, an environment variable (`HAS_PREVIOUS_SEM_REL_EXECUTION`)
is set to `true` after the first message, then this plugin won't send any other 
message, as long as the plugin is part of the config.

## Screenshots

![preview](docs/screenshot-success-1.png "preview")

## Development

Here are some steps to test the plugin locally:

- checkout the source code:
  ```sh
  git clone git@github.com:jontey/semantic-release-google-chat.git
  cd semantic-release-google-chat
  npm install
  ```
- add a `.releaserc.json` file at the project's root, copy the code from the
[Usage](#usage) section in this new file using the `webhookUrl` property, and
add the following properties in the object:
  ```
  "ci": false,
  "dryRun": true,
  ```
- open `index.js` and replace `module.exports = { verifyConditions, success };` by `module.exports = { verifyConditions, generateNotes: success };` to allow the publication within the `dryRun` mode
- run `semantic-release` locally safely:
  ```sh
  npm link
  npm link semantic-release-google-chat
  ./node_modules/.bin/semantic-release
  ```

## Dependencies

- [`node-fetch`](https://www.npmjs.com/package/node-fetch): Send the message to Google Chat
- [`remark`](https://www.npmjs.com/package/remark): Markdown to JSON
- [`mdast-util-to-markdown`](https://www.npmjs.com/package/mdast-util-to-markdown): JSON to Markdown

Greatly inspired by [semantic-release-slack-bot](https://github.com/juliuscc/semantic-release-slack-bot) and [semantic-release-ms-bot](https://github.com/yllieth/semantic-release-ms-teams)
