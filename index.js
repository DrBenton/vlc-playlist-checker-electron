'use strict';

var vlcOrchestrator = require('./vlc-orchestrator');

vlcOrchestrator.initVlcOrchestration()
    .then(onVlcOrchestrationInit)
;

function onVlcOrchestrationInit(playlistContent) {
    vlcOrchestrator.launchPlaylistChannels(null, playlistContent);
}
