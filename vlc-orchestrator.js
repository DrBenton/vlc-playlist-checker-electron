'use strict';

var Promise = require('bluebird');
var request = Promise.promisify(require('request'));
var m3uParser = require('playlist-parser').M3U;
var spawn = require('child_process').spawn;
var debug = require('debug')('vlc')

var DEFAULT_PLAYLIST_URL = 'http://mafreebox.freebox.fr/freeboxtv/playlist.m3u';
var DEFAULT_PLAYLIST_CHANNEL_DURATION = 10000;
var VLC_DEFAULT_PATHS_PAR_PLATFORM = {
    'win32': 'C:\\Program Files (x86)\\VideoLAN\\VLC\\vlc.exe',
    'darwin': '/Applications/VLC.app/Contents/MacOS/VLC',
    'linux': '/usr/bin/vlc',
};

var currentChannelIndex;


function initVlcOrchestration(vlcPlaylistUrl) {
    return getVlcPlaylistContent(vlcPlaylistUrl)
        .spread(onVlcPlaylistContentRetrieved)
        .then(parsePlaylistContent)
    ;
}

function getVlcPlaylistContent(vlcPlaylistUrl) {
    vlcPlaylistUrl = vlcPlaylistUrl || DEFAULT_PLAYLIST_URL;
    return request(vlcPlaylistUrl);
}

function onVlcPlaylistContentRetrieved(response, body) {
    debug('response.statusCode=', response.statusCode);
    if (response.statusCode == 200) {
        return body;
    }
    throw new Error('VLC playlist content could not be retrieved!');
}

function parsePlaylistContent(body) {
    var playlistContent = m3uParser.parse(body);
    playlistContent = playlistContent.filter(function (playlistItem) {
        return !!playlistItem;
    });

    debug(playlistContent.length + ' items found in playlist.');

    return playlistContent;
}

function launchPlaylistChannels(vlcPath, channelDuration, playlistContent) {
    vlcPath = vlcPath || getVlcDefaultPath();
    channelDuration = channelDuration || DEFAULT_PLAYLIST_CHANNEL_DURATION;
    debug('Launching %d channels.', playlistContent.length);

    return new Promise(function (resolve, reject) {
        currentChannelIndex = 0;
        launchNextChannelForEver(vlcPath, channelDuration, playlistContent);
    });
}

function launchNextChannelForEver(vlcPath, channelDuration, playlistContent) {
    function onChannelFinished() {
        debug('Channel %d finished. Let\'s launch the next one!', currentChannelIndex);
        process.nextTick(playItAgainSam);
    }

    function playItAgainSam() {
        launchNextChannelForEver(vlcPath, channelDuration, playlistContent);
    }

    return launchNextChannel(vlcPath, channelDuration, playlistContent).then(onChannelFinished);
}

function launchNextChannel(vlcPath, channelDuration, playlistContent) {
    var channelPromise = launchChannel(vlcPath, channelDuration, playlistContent, currentChannelIndex);
    currentChannelIndex++;
    if (playlistContent.length === currentChannelIndex) {
        currentChannelIndex = 0;//let's loop for ever!
    }

    return channelPromise;
}

function launchChannel(vlcPath, channelDuration, playlistContent, channelIndex) {
    debug('Launching channel %d of %d', channelIndex, playlistContent.length);
    var channelUrl = playlistContent[channelIndex].file;
    var channelTitle = playlistContent[channelIndex].title;
    debug('channelTitle=', channelTitle, ', channelUrl=', channelUrl);

    return launchVlcAndWait(vlcPath, channelDuration, channelUrl);
}

function launchVlcAndWait(vlcPath, channelDuration, channelUrl) {

    return new Promise(function (resolve, reject) {

        var vlcProcess = spawn(vlcPath, [channelUrl]);

        vlcProcess.on('close', function (code, signal) {
            debug('child process terminated due to receipt of signal ' + signal);
        });

        setTimeout(killVlcAndResolvePromise, channelDuration);

        function killVlcAndResolvePromise() {
            debug('Let\'s shut down VLC...')
            vlcProcess.kill('SIGHUP');
            process.nextTick(resolve);
        }

    });
}

function getVlcDefaultPath() {
    return VLC_DEFAULT_PATHS_PAR_PLATFORM[process.platform];
}

module.exports.initVlcOrchestration = initVlcOrchestration;
module.exports.launchPlaylistChannels = launchPlaylistChannels;
module.exports.getVlcDefaultPath = getVlcDefaultPath;
module.exports.DEFAULT_PLAYLIST_URL = DEFAULT_PLAYLIST_URL;
module.exports.DEFAULT_PLAYLIST_CHANNEL_DURATION = DEFAULT_PLAYLIST_CHANNEL_DURATION;
