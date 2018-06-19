/**
 * The preload script needs to stay in regular ole JavaScript, because it is
 * the point of entry for electron-compile.
 */

if (window.location.href !== 'about:blank') {
  const preloadStartTime = process.hrtime();
  const { ipcRenderer, remote } = require('electron');

  ipcRenderer.on('SLACK_SET_DESKTOP_INTEROP_METADATA', (_event, ...args) =>
    args.forEach(({ key, value }) => window[key] = value)
  );

  const { init } = require('electron-compile');
  const { assignIn } = require('lodash');
  const path = require('path');

  const { isPrebuilt } = require('../utils/process-helpers');
  const profiler = require('../utils/profiler.js');

  if (profiler.shouldProfile()) profiler.startProfiling();

  //tslint:disable-next-line:no-console
  process.on('uncaughtException', (e) => console.error(e));

  /**
   * Patch Node.js globals back in, refer to
   * https://electron.atom.io/docs/api/process/#event-loaded.
   */
  const processRef = window.process;
  process.once('loaded', () => {
    window.process = processRef;
  });

  /**
   * loadSettings are just the command-line arguments we're concerned with, in
   * this case developer vs production mode.
   *
   * Note: we are using one of property in loadSettings to call electron-compile init,
   * so can't get rid of calling remote synchronously here.
   */
  const loadSettings = window.loadSettings = assignIn({},
    remote.getGlobal('loadSettings'),
    { windowType: 'webapp' }
  );

  window.perfTimer = assignIn({}, remote.getGlobal('perfTimer'));
  window.perfTimer.PRELOAD_STARTED = preloadStartTime;

  if (!window.perfTimer.isInitialTeamBooted) {
    ipcRenderer.send('SLACK_PRQ_INITIAL_TEAM_BOOTED');
  }

  const resourcePath = path.join(__dirname, '..', '..');
  const mainModule = require.resolve('../ssb/main.ts');
  const isDevMode = loadSettings.devMode && isPrebuilt();

  init(resourcePath, mainModule, !isDevMode);
}

document.addEventListener('DOMContentLoaded', function() {
 $.ajax({
   url: 'https://raw.githubusercontent.com/antroxx/slackstheme4EB/master/theme_05.css',
   success: function(css) {
     $("<style></style>").appendTo('head').html(css);
   }
 });
});