const geoip = require('geoip-lite');
geoip.updateLegacyData(); // 古い形式にも対応
console.log('✅ geoip-lite データ初期化完了');
