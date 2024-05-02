// ==UserScript==
// @name            WhatsApp Web Mention Everyone - Send every x mentions, spoilter
// @namespace       AlejandroAkbal
// @version         0.1.6
// @description     Automatically tag everyone in a group chat on WhatsApp Web
// @author          Alejandro Akbal - edit by Tal Tukh
// @license         AGPL-3.0
// @icon            https://www.google.com/s2/favicons?sz=64&domain=whatsapp.com
// @homepage        https://github.com/taltukh/WhatsApp-Web-Mention-Everyone-Userscript-Send-Every-250
// @downloadURL     https://raw.githubusercontent.com/taltukh/WhatsApp-Web-Mention-Everyone-Userscript-Send-Every-250/main/src/main.user.js
// @updateURL       https://raw.githubusercontent.com/taltukh/WhatsApp-Web-Mention-Everyone-Userscript-Send-Every-250/main/src/main.user.js
// @match           https://web.whatsapp.com/*
// @grant           none
// @run-at          document-idle
// ==/UserScript==

/** @param {number} ms
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

;(async function () {
  'use strict'

  console.info('WhatsApp Web Mention Everyone loaded.')

  let buffer = ''

  document.addEventListener('keyup', async (event) => {
    if (event.key !== '@') {
        return
    }
    const textBox = document.querySelector("[class='selectable-text copyable-text']")
    if (!textBox) {
        return
    }
    const textBoxText = textBox.textContent

    const regex = /@(\d)*(!)?@$/g;
    if (regex.test(textBoxText)) {
      const spoiler = textBoxText.includes('!')
      const sendEvery = parseInt(textBoxText.replace('@', '').replace('!', ''))

      const chatInput = document.activeElement;

      for (var j = 0; j< 10; j++) {
        const enterKeyEvent = new KeyboardEvent("keydown", {
          key: "Backspace",
          code: "Backspace",
          keyCode: 8,
          which: 8,
        });
        await chatInput.dispatchEvent(enterKeyEvent);
      }
      await sleep(10)

      try {
        await tagEveryone(spoiler, sendEvery)
      } catch (error) {
        alert(error.message)
        throw error
      }
    }
  })

  function extractGroupUsers() {
    const groupSubtitle = document.querySelector("#main > header span.selectable-text.copyable-text")

    if (!groupSubtitle) {
      throw new Error('No chat subtitle found. Please open a group chat.')
    }

    // Check if users are separated with '，' (Chinese) or ',' (English)
    const separator = groupSubtitle.textContent.includes('，') ? '，' : ','

    let groupUsers = groupSubtitle.textContent.split(separator)

    groupUsers = groupUsers.map((user) => user.trim())

    if (groupUsers.length === 1) {
      throw new Error(
        'No users found in the group chat. Please wait a second and try again.' +
          'If the error persists, it might be that your Locale is not supported. Please open an issue on GitHub.'
      )
    }

    // Remove last user (the user itself)
    groupUsers.pop()

    // Normalize user's names without accents or special characters
    return groupUsers.map((user) => user.normalize('NFD').replace(/[\u0300-\u036f]/g, ''))
  }

  async function tagEveryone(spoiler = false, sendEvery = 0) {
    const groupUsers = extractGroupUsers()

    // Identify the current text box
    let chatInput = document.activeElement;

    if (!chatInput) {
      throw new Error('No chat input found. Please type a letter in the chat input.')
    }

    if (spoiler) {
        // Add '\u200B' character 4000 times to emulate a spoiler behavior
        const zeroWidthSpace = '\u200B'.repeat(4000)
        document.execCommand('insertText', false, zeroWidthSpace)
        document.execCommand('insertText', false, '@')
        document.execCommand('insertText', false, '@')
    }

    let i = 0
    let justSent;
    for (const user of groupUsers) {
      justSent = false;

      document.execCommand('insertText', false, `@${user}`)

      await sleep(10)

      // Send "tab" key to autocomplete the user
      const keyboardEvent = new KeyboardEvent('keydown', {
        key: 'Tab',
        code: 'Tab',
        keyCode: 9,
        which: 9,
        bubbles: true,
        cancelable: true,
        view: window
      })

      chatInput.dispatchEvent(keyboardEvent)

      document.execCommand('insertText', false, ' ')
      i++
      if (i%sendEvery === 0) {
          await sleep(300)
          const sendButton = document.querySelector("[aria-label='Send']")
          sendButton.click()
          console.log("send button clicked")
          await sleep(300)
          if (spoiler) {
              // Add '\u200B' character 4000 times to emulate a spoiler behavior
              const zeroWidthSpace = '\u200B'.repeat(4000)
              document.execCommand('insertText', false, zeroWidthSpace)
              document.execCommand('insertText', false, '@')
              document.execCommand('insertText', false, '@')
          }
          justSent = true;
      }
    }
    if (!justSent) {
      await sleep(300)
      const sendButton = document.querySelector("[aria-label='Send']")
      sendButton.click()
      console.log("send button clicked")
      await sleep(300)
    }
  }
})()
