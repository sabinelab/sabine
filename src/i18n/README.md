# Contributing to Translations

Thanks for your interest in helping translate **Sabine** to more languages.

To make the translation process easier and consistent, we use **Crowdin**. This ensures that keys are not missing and the JSON structure remains intact across all languages.

## Important Note

**Please do not create Pull Requests modifying `pt.json`, `es.json` or other non-English files directly.**

These files are automatically generated and synchronized by Crowdin. Any manual changes made to them via Pull Requests will likely be **overwritten and lost** during the next synchronization cycle.

## How to Contribute

1. **Join the Project:** Go to our project page on Crowdin:  
    - **[https://crowdin.com/project/sabinelab](https://crowdin.com/project/sabinelab)**

2. **Select a Language:** Choose the language you want to translate into. If your language is not listed, feel free to request it on the Crowdin page.

3. **Start Translating:** You can vote on existing translations or suggest new ones. The interface provides context and screenshots to help you understand where the text is used.

## For Developers

If you are adding a new feature or changing existing text in the bot's code:

1. Update only the **`src/i18n/en.json`** file. This is the **source of truth**.
2. Once your changes are merged into the `main` branch, Crowdin will automatically fetch the new strings.
3. Translators will be notified to translate the new content.
4. Once translated, Crowdin will open a Pull Request updating the other language files automatically.

---

Thank you for helping make Sabine accessible to everyone!