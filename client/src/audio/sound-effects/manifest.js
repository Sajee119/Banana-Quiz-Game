/**
 * Sampled sound effects bundled with the game.
 *
 * Each file was downloaded from the Myinstants "Sound Effects" category and
 * renamed after the game event it plays for. See README.md in this folder for
 * the original Myinstants page and source URL of every clip.
 *
 * `?url` lets Vite fingerprint and copy the MP3s into the production build.
 * Events that are not listed here are synthesised by audioEngine.js.
 */
import clickUrl from './click.mp3?url';
import correctUrl from './correct.mp3?url';
import wrongUrl from './wrong.mp3?url';
import timeoutUrl from './timeout.mp3?url';
import gameOverUrl from './game-over.mp3?url';
import skipUrl from './skip.mp3?url';
import notifyUrl from './notify.mp3?url';
import countdownUrl from './countdown.mp3?url';
import gameStartUrl from './game-start.mp3?url';
import streakUrl from './streak.mp3?url';
import winUrl from './win.wav?url';

export const SAMPLED_SFX = {
    click: clickUrl,
    correct: correctUrl,
    coin: correctUrl,
    success: correctUrl,
    wrong: wrongUrl,
    expire: timeoutUrl,
    gameOver: gameOverUrl,
    skip: skipUrl,
    notify: notifyUrl,
    countdown: countdownUrl,
    gameStart: gameStartUrl,
    streak: streakUrl,
    win: winUrl,
    achievement: winUrl,
};
