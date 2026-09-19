<div align="center"><a name="readme-top"></a>

<img src="public/mascot.svg" width="140" height="140" alt="Mascotte de Ditto" />

# Ditto

[English](./README.md) · [Español](./README.es.md) · [Português (BR)](./README.pt-BR.md) · **Français** · [简体中文](./README.zh-CN.md)

**Capture n'importe quel flux dans ton navigateur et transforme-le en guide étape par étape. Pas de compte, pas de cloud, pas de tracking.**

Clique sur enregistrer, fais ce que tu as à faire, et récupère un guide soigné avec des captures annotées. Modifie, rejoue ou exporte.

<!-- SHIELD GROUP -->

[![License][license-shield]][license-link]
[![Manifest V3][mv3-shield]][mv3-link]
[![100% Local][local-shield]][local-link]
[![No Account][no-account-shield]][no-account-link]
<br/>
[![Stars][star-shield]][star-link]
[![Contributors][contributors-shield]][contributors-link]
![Last Commit][last-commit-shield]
[![Issues][issues-shield]][issues-link]

</div>

<details>
<summary><kbd>Sommaire</kbd></summary>

#### TOC

- [📺 Démo](#-démo)
- [👋 Pour commencer](#-pour-commencer)
- [✨ Fonctionnalités](#-fonctionnalités)
  - [🔒 Smart Blur](#-smart-blur)
  - [🧠 Descriptions par IA (optionnel)](#-descriptions-par-ia-optionnel)
  - [▶️ Lecture Guide Me](#️-lecture-guide-me)
  - [🎙️ Narration vocale (optionnel)](#️-narration-vocale-optionnel)
  - [✏️ Éditeur de guides](#️-éditeur-de-guides)
  - [📤 Export multi-format](#-export-multi-format)
- [🔐 Confidentialité et stockage](#-confidentialité-et-stockage)
- [🤝 Contribuer](#-contribuer)
- [📜 Licence](#-licence)

<br/>

</details>

## 📺 Démo

<div align="center">
<img src="https://github.com/user-attachments/assets/9de20b45-2256-4127-8242-141cf1802f39" alt="Démo de Ditto" width="800" />
</div>

## 👋 Pour commencer

Ditto transforme n'importe quelle tâche répétitive dans le navigateur en un guide documenté et partageable en quelques secondes. Tout tourne dans ton navigateur. Pas de backend, pas de compte, pas de télémétrie, et rien ne quitte ton appareil.

Que tu documentes des outils internes, que tu rédiges des tutoriels, ou que tu formes un collègue, Ditto capture chaque clic, frappe et navigation pour que tu puisses te concentrer sur le reste.

Chaque action utile devient une étape : clics sur les boutons et les liens, champs de formulaire, raccourcis clavier, actions du presse-papiers, glisser-déposer et navigations. Les clics rapprochés sur des éléments voisins sont fusionnés pour garder les guides propres, et le clic est intercepté avant que la page ne navigue, donc rien ne se perd sur les SPA ni sur les chargements complets.

Chaque étape reçoit une capture avec l'élément cliqué mis en évidence et zoomé. Pas de recadrage manuel, pas d'outil d'annotation à apprendre.

| Navigateur | Version | Installation |
| ---------- | ------- | ------------ |
| Chrome     | [![Chrome Version][chrome-version-shield]][chrome-link]   | [Chrome Web Store][chrome-link] |
| Firefox    | [![Firefox Version][firefox-version-shield]][firefox-link] | [Firefox Add-ons][firefox-link]  |
| Edge       | [![Edge Version][edge-version-shield]][edge-link]          | [Microsoft Edge Add-ons][edge-link] |

Disponible en anglais, espagnol, portugais brésilien, français, allemand et chinois simplifié. La langue des descriptions IA se règle séparément, donc tu peux lancer Ditto en anglais et générer les guides en français, ou n'importe quelle combinaison.

> \[!IMPORTANT]
>
> **⭐️ Mets une étoile au repo** si Ditto te fait gagner du temps. Ça aide les autres à le découvrir.

<a href="https://github.com/OWNER/ditto">
  <img width="100%" alt="Mets une étoile à Ditto sur GitHub" src="https://github.com/user-attachments/assets/80d304da-a765-4bde-bf49-b1bdcb4fe804" />
</a>

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## ✨ Fonctionnalités

### 🔒 Smart Blur

Ditto détecte et floute automatiquement les données sensibles dans tes captures : e-mails, numéros de téléphone, numéros de sécu, cartes bancaires, IPs, adresses MAC. Active ou désactive chaque catégorie indépendamment.

Besoin de cacher quelque chose de précis ? Le sélecteur manuel te laisse choisir n'importe quel élément du DOM et le masquer sur toutes les captures où il apparaît.

<img src="https://github.com/user-attachments/assets/968d2518-c561-4d68-92a6-3d5f569fe38a" alt="Smart Blur" width="800" />

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🧠 Descriptions par IA (optionnel)

Apporte ta propre clé API (OpenAI ou Anthropic) et Ditto génère des descriptions naturelles comme *« Clique sur le bouton **Envoyer** pour sauvegarder »* au lieu de `Click button "Submit"`.

Les descriptions sont générées à partir d'un contexte léger du DOM (~50-100 tokens), pas des captures. Environ 15-30x moins cher que les modèles vision. Choisis la langue des descriptions (anglais, espagnol, portugais, français, allemand, chinois).

<img src="https://github.com/user-attachments/assets/3540cbd5-133f-46fd-a9b6-ffce9b4d422a" alt="Descriptions par IA" width="800" />

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### ▶️ Lecture Guide Me

Rejoue n'importe quel guide en direct sur une vraie page. Ditto met en évidence l'élément suivant, suit ta progression étape par étape, et avance tout seul au fur et à mesure. Parfait pour former un collègue ou se guider soi-même dans un process.

<img src="https://github.com/user-attachments/assets/56ffca1d-5074-491f-8571-dd70782d4b05" alt="Lecture Guide Me" width="800" />

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 🎙️ Narration vocale (optionnel)

Parle à voix haute pendant que tu enregistres et Ditto transforme ce que tu as dit en descriptions
d'étapes. L'audio est transcrit avec ta propre clé (OpenAI ou Groq) puis rattaché à l'étape
correspondante, donc tu narres une fois au lieu d'écrire chaque étape à la main.

<img src="https://github.com/user-attachments/assets/061fddc7-da65-4641-8b39-d30b80c36531" alt="Narration vocale" width="800" />

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### ✏️ Éditeur de guides

Corrige un guide après coup sans réenregistrer. Recadre, annote et masque n'importe quelle capture,
réécris une étape avec l'IA sans quitter l'éditeur, ajoute des titres et des notes entre les étapes,
réordonne ou supprime en lot, et reviens en arrière via l'historique de versions.

<img src="https://github.com/user-attachments/assets/62d3a01e-b129-44c8-8ba3-e9b97ff08d7e" alt="Éditeur de guides" width="800" />

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

### 📤 Export multi-format

Partage tes guides dans le format qui colle à ton flux :

- **Vidéo** : parcours narré, mp4/H.264, avec le curseur qui se déplace vers chaque cible
- **PDF** : prêt à imprimer, A4 portrait avec sauts de page auto
- **DOCX** : ouvre-le et continue dans Word
- **HTML** : autonome, à partager partout, images intégrées en base64
- **Markdown** : à coller dans Notion, GitHub, docs internes, wikis

Tous les exports sont générés côté client. Rien ne passe par un serveur.

<img src="https://github.com/user-attachments/assets/e7584527-7d68-4f3f-9261-8380ee08dfb4" alt="Export multi-format" width="800" />

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🔐 Confidentialité et stockage

Tes guides, étapes et captures restent sur ton appareil. Pas de backend, pas de compte, pas de télémétrie. Tes clés API (si tu en utilises) ne quittent jamais le navigateur. Elles sont stockées localement et servent à appeler directement le fournisseur que tu as choisi.

Deux choses sortent bien du navigateur, toutes deux documentées dans la [politique de confidentialité](https://ditto.example.com/privacy/) : les icônes de sites sont récupérées via le service de favicons de Google, ce qui envoie le domaine du site, et les fonctions optionnelles d'IA et de voix envoient du texte ou de l'audio au fournisseur que tu as configuré.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 🤝 Contribuer

Toute contribution est la bienvenue : rapports de bugs, idées, PR et traductions.

Voir [CONTRIBUTING.md](./CONTRIBUTING.md) pour le setup dev, la structure du projet, et les règles pour contribuer.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

## 📜 Licence

MIT © [Skyforge AI](https://github.com/tryskyforge). Voir [LICENSE](./LICENSE) pour les détails.

<div align="right">

[![Back to top][back-to-top]](#readme-top)

</div>

<!-- LINK GROUP -->

[back-to-top]: https://img.shields.io/badge/-BACK_TO_TOP-1E1B4B?style=flat-square

[license-shield]: https://img.shields.io/badge/license-MIT-4F46E5?style=flat-square&labelColor=1E1B4B
[license-link]: ./LICENSE

[mv3-shield]: https://img.shields.io/badge/manifest-v3-3730A3?style=flat-square&labelColor=1E1B4B
[mv3-link]: https://developer.chrome.com/docs/extensions/mv3/intro/

[local-shield]: https://img.shields.io/badge/storage-100%25%20local-4F46E5?style=flat-square&labelColor=1E1B4B
[local-link]: #-stockage-100-local

[no-account-shield]: https://img.shields.io/badge/account-not%20required-4F46E5?style=flat-square&labelColor=1E1B4B
[no-account-link]: #-stockage-100-local

[star-shield]: https://img.shields.io/github/stars/OWNER/ditto?style=flat-square&label=stars&color=4F46E5&labelColor=1E1B4B
[star-link]: https://github.com/OWNER/ditto/stargazers

[contributors-shield]: https://img.shields.io/github/contributors/OWNER/ditto?style=flat-square&labelColor=1E1B4B
[contributors-link]: https://github.com/OWNER/ditto/graphs/contributors

[last-commit-shield]: https://img.shields.io/github/last-commit/OWNER/ditto?style=flat-square&label=commit&labelColor=1E1B4B

[issues-shield]: https://img.shields.io/github/issues/OWNER/ditto?style=flat-square&labelColor=1E1B4B
[issues-link]: https://github.com/OWNER/ditto/issues

[chrome-version-shield]: https://img.shields.io/chrome-web-store/v/jmfohdaflahliammccpiadmkcibohgha?label=Chrome%20Version&style=flat-square&logo=googlechrome&logoColor=C7D2FE&color=4F46E5&labelColor=1E1B4B
[chrome-link]: https://chromewebstore.google.com/detail/ditto/EXTENSION_ID
[firefox-version-shield]: https://img.shields.io/amo/v/ditto?label=Firefox%20Version&style=flat-square&logo=firefoxbrowser&logoColor=C7D2FE&color=4F46E5&labelColor=1E1B4B
[firefox-link]: https://addons.mozilla.org/en-US/firefox/addon/ditto/
[edge-version-shield]: https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fmicrosoftedge.microsoft.com%2Faddons%2Fgetproductdetailsbycrxid%2Fhgjemhfoffebbollleajkpefblppleai&query=%24.version&label=Edge%20Version&style=flat-square&logo=microsoftedge&logoColor=C7D2FE&color=4F46E5&labelColor=1E1B4B
[edge-link]: https://microsoftedge.microsoft.com/addons/detail/hgjemhfoffebbollleajkpefblppleai
