export const homePage = /* html */ `<!doctype html>
<html lang="ru">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="color-scheme" content="light dark">
  <title>График смен — Backend API</title>
  <style>
    :root { color-scheme: light dark; --bg: #f5f7fb; --surface: #fff; --text: #172033; --muted: #596579; --line: #e0e6ef; --accent: #315cdd; --code: #eef2fb; }
    * { box-sizing: border-box; }
    body { margin: 0; background: var(--bg); color: var(--text); font: 16px/1.65 system-ui, sans-serif; }
    main { max-width: 960px; margin: auto; padding: 48px 24px; }
    header { padding: 24px 0 32px; }
    .eyebrow { color: var(--accent); font-size: 13px; font-weight: 700; letter-spacing: .12em; text-transform: uppercase; }
    h1 { margin: 12px 0; font-size: clamp(32px, 6vw, 54px); line-height: 1.15; letter-spacing: -.04em; }
    h2 { margin: 0 0 16px; font-size: 22px; }
    p { margin: 10px 0; }
    .intro, .note, footer { color: var(--muted); }
    .intro { max-width: 640px; font-size: 18px; }
    section { margin: 20px 0; padding: 28px; background: var(--surface); border: 1px solid var(--line); border-radius: 20px; }
    code, pre { font-family: ui-monospace, Consolas, monospace; font-size: 13px; }
    code { overflow-wrap: anywhere; }
    pre { padding: 18px; background: var(--code); border-radius: 12px; overflow-x: auto; line-height: 1.8; }
    .routes { margin: 0; padding: 0; list-style: none; }
    .routes li { display: grid; grid-template-columns: 76px minmax(0, 1fr); gap: 12px; padding: 16px 0; border-top: 1px solid var(--line); }
    .routes p { margin: 4px 0 0; color: var(--muted); font-size: 14px; }
    .method { align-self: start; width: fit-content; padding: 3px 8px; border-radius: 6px; background: var(--code); color: var(--accent); font: 700 12px/1.8 ui-monospace, monospace; }
    footer { margin-top: 28px; font-size: 13px; }
    @media (max-width: 540px) { main { padding: 24px 16px; } section { padding: 20px; } .routes li { gap: 8px; grid-template-columns: 64px minmax(0, 1fr); } }
    @media (prefers-color-scheme: dark) { :root { --bg: #101624; --surface: #182132; --text: #edf2fa; --muted: #aab8cd; --line: #2b374d; --accent: #96b2ff; --code: #222f49; } }
  </style>
</head>
<body>
  <main>
    <header>
      <span class="eyebrow">Backend API · NestJS</span>
      <h1>График смен</h1>
      <p class="intro">API для управления рабочими сменами, обмена графиками с друзьями и обновлений в реальном времени.</p>
    </header>
    <section aria-labelledby="start">
      <h2 id="start">Начало работы</h2>
      <p>Зарегистрируйте устройство запросом <code>POST /devices</code>. В ответе вы получите токен устройства и код для обмена графиком.</p>
      <pre><code>curl -X POST /devices

# Заголовок для защищённых запросов
Authorization: Bearer &lt;токен устройства&gt;</code></pre>
      <p class="note">В примерах используются пути относительно адреса этого сервера. Для curl добавьте перед путём полный адрес сервера.</p>
    </section>
    <section aria-labelledby="routes">
      <h2 id="routes">Маршруты API</h2>
      <ul class="routes">
        <li><span class="method">POST</span><div><code>/devices</code><p>Регистрация устройства. Авторизация не требуется.</p></div></li>
        <li><span class="method">POST</span><div><code>/me/share-code/regenerate</code><p>Обновление кода для обмена графиком.</p></div></li>
        <li><span class="method">GET</span><div><code>/me/shifts?from=YYYY-MM-DD&amp;to=YYYY-MM-DD</code><p>Свои смены за выбранный период.</p></div></li>
        <li><span class="method">PUT</span><div><code>/me/shifts</code><p>Сохранение смен.</p></div></li>
        <li><span class="method">DELETE</span><div><code>/me/shifts/:id</code><p>Удаление смены.</p></div></li>
        <li><span class="method">GET</span><div><code>/subscriptions</code><p>Список подписок на графики друзей.</p></div></li>
        <li><span class="method">POST</span><div><code>/subscriptions</code><p>Подписка по коду друга. Тело запроса: <code>{ &quot;code&quot;: &quot;…&quot; }</code>.</p></div></li>
        <li><span class="method">DELETE</span><div><code>/subscriptions/:id</code><p>Удаление подписки.</p></div></li>
        <li><span class="method">GET</span><div><code>/friends/:ownerId/shifts?from=YYYY-MM-DD&amp;to=YYYY-MM-DD</code><p>Смены друга за выбранный период.</p></div></li>
        <li><span class="method">SSE</span><div><code>/events?token=&lt;токен устройства&gt;</code><p>Поток событий через EventSource. Токен можно передать в параметре запроса.</p></div></li>
      </ul>
      <p class="note">Все маршруты, кроме регистрации устройства, требуют токен. Обозначения <code>:id</code> и <code>:ownerId</code> замените соответствующими идентификаторами.</p>
    </section>
    <footer>График смен · Справочная страница API</footer>
  </main>
</body>
</html>`;
