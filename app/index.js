(function () {

    var vlcOrchestrator = require('./vlc-orchestrator');

    var vlcPlaylistCheckStarted = false;
    var vlcPlaylistCheckStartForm;

    init();


    function init() {
        vlcPlaylistCheckStartForm = document.getElementById('vlc-playlist-check-start');

        initVlcPlaylistCheckStartForm();
    }

    function initVlcPlaylistCheckStartForm() {
        initInputsDefaultValues();

        vlcPlaylistCheckStartForm.addEventListener('submit', onFormSubmit);
    }

    function initInputsDefaultValues() {
        // VLC path
        var vlcPathInput = vlcPlaylistCheckStartForm.querySelector('#vlc-path');
        var vlcDefaultPath = vlcOrchestrator.getVlcDefaultPath();
        vlcPathInput.value = vlcDefaultPath;

        // Playlist URL
        var playlistUrlInput = vlcPlaylistCheckStartForm.querySelector('#playlist-url');
        playlistUrlInput.value = vlcOrchestrator.DEFAULT_PLAYLIST_URL;

        // Channel duration
        var channelDurationInput = vlcPlaylistCheckStartForm.querySelector('#channel-duration');
        channelDurationInput.value = vlcOrchestrator.DEFAULT_PLAYLIST_CHANNEL_DURATION;
    }

    function onFormSubmit(e) {
        e.preventDefault();
        e.stopImmediatePropagation();

        if (vlcPlaylistCheckStarted) {
            return;
        }

        vlcPlaylistCheckStartForm.querySelector('[type="submit"]').setAttribute('disabled', true);

        startPlaylistChannelsCheck();
    }

    function startPlaylistChannelsCheck() {
        var playListUrl = vlcPlaylistCheckStartForm.querySelector('#playlist-url').value;
        vlcOrchestrator.initVlcOrchestration(playListUrl)
            .then(onVlcOrchestrationInit)
        ;
    }

    function onVlcOrchestrationInit(playlistContent) {
        vlcPlaylistCheckStartForm.insertAdjacentHTML('afterend', playlistContent.length + ' channels found in playlist.');

        launchPlaylistChannels(playlistContent);
    }

    function launchPlaylistChannels(playlistContent) {
        vlcPlaylistCheckStarted = true;

        var vlcPath = vlcPlaylistCheckStartForm.querySelector('#vlc-path').value;
        var channelDuration = vlcPlaylistCheckStartForm.querySelector('#channel-duration').value;

        vlcOrchestrator.launchPlaylistChannels(vlcPath, channelDuration, playlistContent);
    }

})();
