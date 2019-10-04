"use strict";

const {
  ANSI_SYNTAX,
  ANSI_REGEX,
  SYNTAX_ESCAPE,
  SYNTAX_UNESCAPE,
  ANSI_ESCAPE,
  XTERM_COLOR_REGEX,
  XTERM_GRAYSCALE_REGEX,
  BRIGHT_BG_SUBSTITUTIONS,
  BRIGHT_BG_XTERM_SUB_REGEX
} = require("./definitions");

const { XTERM_FALLBACKS } = require("./xtermFallbacks");

function parse(string, xterm = true) {
  const handleXterm = xterm ? parseXterm : parseXtermFallback;
  return string
    .split(SYNTAX_ESCAPE)
    .map(ss => handleXterm(parseAnsi(ss)))
    .join(SYNTAX_UNESCAPE);
}

function parseAnsi(string) {
  return string.replace(ANSI_REGEX, m => ANSI_SYNTAX[m]);
}

function parseXterm(string) {
  return string
    .replace(XTERM_COLOR_REGEX, (m, r, g, b) => {
      const background = m[1] === "[";
      return getRGBXterm(parseInt(r), parseInt(g), parseInt(b), background);
    })
    .replace(XTERM_GRAYSCALE_REGEX, (m, l) => {
      const background = m[1] == "[";
      return getGrayscaleXterm(l, background);
    })
    .replace(BRIGHT_BG_XTERM_SUB_REGEX, m => BRIGHT_BG_SUBSTITUTIONS[m]);
}

function parseXtermFallback(string) {
  return string
    .replace(XTERM_COLOR_REGEX, m => XTERM_FALLBACKS.get(m))
    .replace(XTERM_GRAYSCALE_REGEX, m => XTERM_FALLBACKS.get(m))
    .replace(BRIGHT_BG_XTERM_SUB_REGEX, m => XTERM_FALLBACKS.get(m));
}

function getRGBXterm(r, g, b, background = false) {
  // Ensure valid color.
  if (r < 0 || r > 5 || g < 0 || g > 5 || b < 0 || b > 5) {
    // Set to 7 (white) if the input is invalid.
    return ANSI_ESCAPE + `[${background ? 4 : 3}8;5;7m`;
  }
  return ANSI_ESCAPE + `[${background ? 4 : 3}8;5;${16 + 36 * r + 6 * g + b}m`;
}

function getGrayscaleXterm(letter, background = false) {
  if (!/^[a-z]$/.test(letter.trim())) {
    // Set to 7 (white) if the input is invalid.
    return ANSI_ESCAPE + `[${background ? 4 : 3}8;5;7m`;
  }
  if (letter === "a") {
    return ANSI_ESCAPE + `[${background ? 4 : 3}8;5;16m`;
  }
  if (letter === "z") {
    return ANSI_ESCAPE + `[${background ? 4 : 3}8;5;231m`;
  }
  return (
    ANSI_ESCAPE + `[${background ? 4 : 3}8;5;${134 + letter.charCodeAt(0)}m`
  );
}

module.exports = {
  parse,
  parseAnsi,
  parseXterm,
  parseXtermFallback,
  getRGBXterm,
  getGrayscaleXterm
};
