const marked = require('marked')

/**
 * Custom renderer for marked to convert markdown into Google Chat compatible HTML
 * @see https://developers.google.com/workspace/chat/format-messages#card-formatting
 */
const renderer = {
  heading({ tokens, depth }) {
    const text = this.parser.parseInline(tokens)
    if (depth >= 4) {
      return `<i>${text}</i>\n`
    }
    return `<b>${text}</b>\n\n`
  },
  list(token) {
    const items = token.items.map((item) => this.listitem(item))
    return `${items.join('\n')}\n\n`
  },
  listitem(item) {
    return `&nbsp;&nbsp;&nbsp;&nbsp;- ${this.parser.parse(item.tokens, !!item.loose)}`
  },
}

marked.use({ renderer })

/**
 * Return a JSON object meant to be sent to teams via a webhook. This object does not contain the details to the release
 * notes, but just the generic part.
 *
 * @see https://developers.google.com/workspace/chat/create-messages#send-message-app
 * @param context semantic-release plugin context
 * @returns {Object}
 */
const baseMessage = (pluginConfig, context) => {
  const { nextRelease, lastRelease, commits, options } = context
  const repository = options.repositoryUrl.split('/').pop()
  const { title, imageUrl, showContributors } = pluginConfig

  const facts = []

  facts.push({
    decoratedText: {
      icon: {
        materialIcon: {
          name: 'deployed_code_update',
        },
      },
      topLabel: 'Version',
      text: `${nextRelease.gitTag} (${nextRelease.type})`,
    },
  })

  if (Object.keys(lastRelease).length > 0) {
    facts.push({
      decoratedText: {
        icon: {
          materialIcon: {
            name: 'label',
          },
        },
        topLabel: 'Last Release',
        text: lastRelease.gitTag,
      },
    })
  }

  facts.push({
    decoratedText: {
      icon: {
        materialIcon: {
          name: 'commit',
        },
      },
      topLabel: 'Commits',
      text: commits.length.toString(),
    },
  })

  if (commits.length > 0 && (showContributors || showContributors === undefined)) {
    // prettier-ignore
    const contributors = commits
      .map(commit => commit.author.email)
      .reduce(
        (accumulator, email) => accumulator.add(email.substring(0, email.indexOf('@'))),
        new Set()
      )

    facts.push({
      decoratedText: {
        icon: {
          materialIcon: {
            name: 'group',
          },
        },
        topLabel: 'Contributors',
        text: Array.from(contributors).join(', '),
      },
    })
  }

  return {
    header: {
      title: title || 'A new version has been released',
      subtitle: repository,
      imageUrl:
        imageUrl ||
        'https://upload.wikimedia.org/wikipedia/commons/thumb/4/4e/Gitlab_meaningful_logo.svg/144px-Gitlab_meaningful_logo.svg.png',
      imageType: 'CIRCLE',
    },
    sections: [
      {
        widgets: facts,
      },
    ],
  }
}

/**
 * Converts the markdown text of the release notes into a JSON object, and go over it to extract sections (title with
 * version number is ignored).
 *
 * Here is an example of a tree:
 *
 * {
 *   type: 'root',
 *   children: [
 *     { type: 'heading', depth: 2, children: [], position: {} },                                                      // >> ignored
 *     { type: 'heading', depth: 3, children: [{ type: 'text', value: 'Bug Fixes', position: {}}], position: {} },     // >> extract children's value
 *     { type: 'list', ..., children: [], position: {} },                                                              // >> convert into markdown
 *     { type: 'heading', depth: 3, children: [{ type: 'text', value: 'Features', position: {}}], position: {} },      // >> extract children's value
 *     { type: 'list', ..., children: [], position: {} },                                                              // >> convert into markdown
 *   ]
 * }
 *
 * The result will be:
 *
 * [
 *   { name: 'Bug Fixes', changes: '...'},
 *   { name: 'Features', changes: '...'},
 * ]
 */
const extractSections = (context) => {
  const html = marked.parse(context.nextRelease.notes)
  return html
}

module.exports = (pluginConfig, context) => {
  const sections = extractSections(context)
  const gchatMessage = baseMessage(pluginConfig, context)
  gchatMessage.sections.push({
    widgets: [
      {
        textParagraph: {
          text: sections,
        },
      },
    ],
  })

  return {
    cardsV2: [{ card: gchatMessage }],
  }
}
