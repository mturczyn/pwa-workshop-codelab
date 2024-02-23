export class Install {
  /**
   * @param {DOMElement} trigger - Triggering element
   */
  constructor(trigger, prompt) {
    this._prompt = prompt;
    this._trigger = trigger;

    this.toggleInstallButton(!!prompt ? 'show' : 'hide');

    window.addEventListener('appinstalled', (e) => {
      console.log('>>>', 'PWA installation event', 'appinstalled');
      this._prompt = undefined;
      this.toggleInstallButton('hide');
    });

    trigger.addEventListener('click', async (event) => {
      if (!this._prompt) {
        console.log('>>>', 'User probably already handled the prompt. Refresh the page to reenable triggering beforeinstallprompt event.');
        return;
      }
      this._prompt.prompt();
      // Wait for the user to respond to the prompt
      const choiceResult = await this._prompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the A2HS prompt');
      } else {
        console.log('User dismissed the A2HS prompt');
      }
      this._prompt = null;
    });
  }

  /**
   * Toggle visibility of install button
   * @param {string} action
   */
  toggleInstallButton(action = 'hide') {
    if (action === 'hide') {
      this._trigger.style.display = 'none';
    } else {
      this._trigger.style.display = 'block';
    }
  }
}
